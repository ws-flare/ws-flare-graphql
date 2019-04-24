import { inject } from '@loopback/core';
import { get } from 'superagent';
import { Logger } from 'winston';
import { uniqBy } from 'lodash';
import * as moment from 'moment';
import { UsageTick } from '../models/usage.model';

export class MonitorService {

    @inject('logger')
    private logger: Logger;

    @inject('api.monitor')
    private monitorApi: string;

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

    async getUsages(jobId: string) {
        let res = await get(`${this.monitorApi}/usages?filter=${JSON.stringify({where: {jobId}})}`);

        return res.body;
    }

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

    async getApps(jobId: string, gt: string, lt: string) {
        let res = await get(`${this.monitorApi}/usages?filter=${JSON.stringify({
            where: {jobId},
            fields: {id: true, appId: true, name: true}
        })}`);

        return uniqBy(res.body, 'appId').map(app => ({...app, gt, lt}));
    }

    async getInstances(jobId: string, appId: string, gt: string, lt: string) {
        let res = await get(`${this.monitorApi}/usages?filter=${JSON.stringify({
            where: {jobId, appId},
            fields: {instance: true}
        })}`);

        return uniqBy(res.body, 'instance').map(instance => ({...instance, appId, gt, lt}));
    }
}
