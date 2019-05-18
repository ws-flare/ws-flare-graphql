import {inject} from '@loopback/core';
import {get} from 'superagent';
import * as moment from 'moment';
import {ConnectedSocketTick} from '../models/socket.model';
import {Logger} from 'winston';

/**
 * Service for socket related functionality
 */
export class SocketsService {

    @inject('logger')
    private logger: Logger;

    @inject('api.jobs')
    private jobsApi: string;

    /**
     * Gets a list of recorded socket data within a job
     *
     * @param jobId - The job id
     */
    async getSockets(jobId: string) {
        let res = await get(`${this.jobsApi}/sockets?filter=${JSON.stringify({where: {jobId}})}`);

        return res.body;
    }

    /**
     * Gets the minimum time of when a web socket connection was stored in the database
     * @param jobId - The job id to filter by
     */
    async getMinConnectedSocketsDate(jobId: string) {
        const filter = {
            where: {
                jobId,
                connectionTime: {neq: null}
            },
            order: 'connectionTime ASC',
            limit: 1,
            fields: {connectionTime: true}
        };

        let res = await get(`${this.jobsApi}/sockets?filter=${JSON.stringify(filter)}`);

        return res.body.length === 1 ? res.body[0].connectionTime : null;
    }

    /**
     * Gets the maximum time of when a web socket connection was stored in the database
     * @param jobId - The job id to filter by
     */
    async getMaxConnectedSocketsDate(jobId: string) {
        const filter = {
            where: {
                jobId,
                connectionTime: {neq: null}
            },
            order: 'connectionTime DESC',
            limit: 1,
            fields: {connectionTime: true}
        };

        let res = await get(`${this.jobsApi}/sockets?filter=${JSON.stringify(filter)}`);

        return res.body.length === 1 ? res.body[0].connectionTime : null;
    }

    /**
     * Gets the total recorded connection statistics within one single tick time frame
     *
     * @param jobId - The job id to filter by
     * @param gte - Greater than this timestamp
     * @param lte - Less than this timestamp
     */
    async getTotalConnectedSocketsWithinTick(jobId: string, gte: string, lte: string) {
        const filter = {
            jobId,
            connected: true,
            connectionTime: {neq: null},
            or: [
                {
                    and: [
                        {connectionTime: {gte}},
                        {connectionTime: {lte}},
                        {disconnectTime: {gt: lte}}
                    ]
                },
                {
                    and: [
                        {connectionTime: {gte}},
                        {connectionTime: {lte}},
                        {disconnectTime: {eq: null}}
                    ]
                },
            ]
        };

        let res = await get(`${this.jobsApi}/sockets/count?where=${JSON.stringify(filter)}`);

        return res.body;
    }

    /**
     * Gets the number of ticks between the minimum and maximum recorded connection statistics.
     * This data is used for displaying the graph on the user interface
     *
     * @param jobId - The job id
     * @param tickSeconds - The distance between each tick in seconds
     */
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
