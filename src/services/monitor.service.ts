import { inject } from '@loopback/core';
import { get } from 'superagent';
import { Logger } from 'winston';
import { uniqBy } from 'lodash';
import * as moment from 'moment';
import { UsageTick } from '../models/usage.model';

/**
 * Service for handling monitor related functionality
 */
export class MonitorService {

    @inject('logger')
    private logger: Logger;

    @inject('api.monitor')
    private monitorApi: string;

    /**
     * Gets the minimum time of when a connection usage monitoring event has occurred on Cloud Foundry
     * @param jobId - The job id to filter by
     */
    async getMinUsageDate(jobId: string) {
        const filter = {
            where: {
                jobId,
                createdAt: {neq: null}
            },
            order: 'createdAt ASC',
            limit: 1,
            fields: {createdAt: true}
        };

        let res = await get(`${this.monitorApi}/usages?filter=${JSON.stringify(filter)}`);

        return res.body.length === 1 ? res.body[0].createdAt : null;
    }

    /**
     * Gets the last recorded usage monitoring event has occurred on Cloud Foundry
     * @param jobId - The job id to filter by
     */
    async getMaxUsageDate(jobId: string) {
        const filter = {
            where: {
                jobId,
                createdAt: {neq: null}
            },
            order: 'createdAt DESC',
            limit: 1,
            fields: {createdAt: true}
        };

        let res = await get(`${this.monitorApi}/usages?filter=${JSON.stringify(filter)}`);

        return res.body.length === 1 ? res.body[0].createdAt : null;
    }

    /**
     * Returns a list of usages for a job
     *
     * @param jobId - The job id to filter by
     */
    async getUsages(jobId: string) {
        let res = await get(`${this.monitorApi}/usages?filter=${JSON.stringify({where: {jobId}})}`);

        return res.body;
    }

    /**
     * Gets the total recorded application statistics within one single tick time frame
     *
     * @param jobId - The job id
     * @param appId - The app id
     * @param instance - The instance number
     * @param gte - Greater than this timestamp
     * @param lte - Less than this timestamp
     */
    async getMaxUsageWithinTick(jobId: string, appId: string, instance: number, gte: string, lte: string) {
        const filter = {
            where: {
                jobId,
                appId,
                instance,
                connected: true,
                createdAt: {neq: null},
                or: [
                    {
                        and: [
                            {createdAt: {gte}},
                            {createdAt: {lte}}
                        ]
                    },
                    {
                        and: [
                            {createdAt: {gte}},
                            {createdAt: {lte}}
                        ]
                    },
                ]
            },
            order: 'createdAt DESC'
        };

        let res = await get(`${this.monitorApi}/usages/?filter=${JSON.stringify(filter)}`);

        return res.body[0];
    }

    /**
     * Gets the number of ticks between the minimum and maximum recorded usage statistics on cloud foundry.
     * This data is used for displaying the graph on the user interface
     *
     * @param jobId - The job id
     * @param tickSeconds - The distance between each tick in seconds
     */
    async getTicksWithinTimeFrame(jobId: string, tickSeconds: number): Promise<UsageTick[]> {
        this.logger.info('in getTicksWithinTimeFrame');
        let max = await this.getMaxUsageDate(jobId);
        let min = await this.getMinUsageDate(jobId);

        this.logger.info(`Max: ${max}`);
        this.logger.info(`Min: ${min}`);

        let usageTicks: UsageTick[] = [];
        let tickCount = 0;
        let slider = min;

        while (moment(slider).isBefore(max)) {
            const tick = moment(slider).add(tickSeconds, 's').toISOString();

            usageTicks.push({jobId, gt: min, lt: tick, tick: tickCount});

            tickCount += tickSeconds;
            slider = tick;
        }

        this.logger.info(usageTicks);

        return usageTicks;
    }

    /**
     * Gets a list of usage statistics for applications within a job
     *
     * @param jobId - The job Id
     * @param gt - Greater than this timestamp
     * @param lt - Less than this timestamp
     */
    async getApps(jobId: string, gt: string, lt: string) {
        let res = await get(`${this.monitorApi}/usages?filter=${JSON.stringify({
            where: {jobId},
            fields: {id: true, appId: true, name: true}
        })}`);

        return uniqBy(res.body, 'appId').map(app => ({...app, jobId, gt, lt}));
    }

    /**
     * Gets a list of instances within a time frame
     * @param jobId - The job Id
     * @param appId - The app Id
     * @param gt - Greater than this timestamp
     * @param lt - Less than this timestamp
     */
    async getInstances(jobId: string, appId: string, gt: string, lt: string) {
        let res = await get(`${this.monitorApi}/usages?filter=${JSON.stringify({
            where: {jobId, appId},
            fields: {instance: true}
        })}`);

        return uniqBy(res.body, 'instance').map(instance => ({...instance, jobId, appId, gt, lt}));
    }
}
