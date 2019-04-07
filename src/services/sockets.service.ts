import {inject} from '@loopback/core';
import {get} from 'superagent';
import * as moment from 'moment';
import {ConnectedSocketTick} from '../models/socket.model';
import {Logger} from 'winston';

export class SocketsService {

    @inject('logger')
    private logger: Logger;

    @inject('api.jobs')
    private jobsApi: string;

    async getSockets(jobId: string) {
        let res = await get(`${this.jobsApi}/sockets?filter=${JSON.stringify({where: {jobId}})}`);

        return res.body;
    }

    async getMinConnectedSocketsDate(jobId: string) {
        const filter = {
            where: {
                jobId
            },
            order: 'connectionTime ASC',
            limit: 1,
            fields: {connectionTime: true}
        };

        let res = await get(`${this.jobsApi}/sockets?filter=${JSON.stringify(filter)}`);

        return res.body.length === 1 ? res.body[0].connectionTime : null;
    }

    async getMaxConnectedSocketsDate(jobId: string) {
        const filter = {
            where: {
                jobId
            },
            order: 'connectionTime DESC',
            limit: 1,
            fields: {connectionTime: true}
        };

        let res = await get(`${this.jobsApi}/sockets?filter=${JSON.stringify(filter)}`);

        return res.body.length === 1 ? res.body[0].connectionTime : null;
    }

    async getTotalConnectedSocketsWithinTick(jobId: string, gt: string, lt: string) {
        const filter = {
            jobId,
            connected: true,
            and: [
                {connectionTime: {gt}},
                {connectionTime: {lt}}
            ]
        };

        let res = await get(`${this.jobsApi}/sockets/count?where=${JSON.stringify(filter)}`);

        return res.body;
    }

    async getTicksWithinTimeFrame(jobId: string, tickSeconds: number): Promise<ConnectedSocketTick[]> {
        this.logger.info('in getTicksWithinTimeFrame');
        let max = await this.getMaxConnectedSocketsDate(jobId);
        let min = await this.getMinConnectedSocketsDate(jobId);

        this.logger.info(`Max: ${max}`);
        this.logger.info(`Min: ${min}`);

        let socketTicks: ConnectedSocketTick[] = [];
        let tickCount = 0;
        let slider = min;

        while (moment(slider).isBefore(max)) {
            const tick = moment(slider).add(tickSeconds, 's').toISOString();

            socketTicks.push({jobId, gt: min, lt: tick, tick: tickCount});

            tickCount += tickSeconds;
            slider = tick;
        }

        this.logger.info(socketTicks);

        return socketTicks;
    }
}
