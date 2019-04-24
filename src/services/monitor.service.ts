import { inject } from '@loopback/core';
import { get } from 'superagent';
import { Logger } from 'winston';
import * as moment from 'moment';
import { ConnectedSocketTick } from '../models/socket.model';
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

        let res = await get(`${this.monitorApi}/sockets?filter=${JSON.stringify(filter)}`);

        return res.body.length === 1 ? res.body[0].createdAt : null;
    }

    async getUsages(jobId: string) {
        let res = await get(`${this.monitorApi}/usages?filter=${JSON.stringify({where: {jobId}})}`);

        return res.body;
    }

    async getMaxUsageWithinTick(jobId: string, gte: string, lte: string) {
        const filter = {
            where: {
                jobId,
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
}
