import {inject} from '@loopback/core';
import {post} from 'superagent';

export class JobsService {

    @inject('api.jobs')
    private jobsApi: string;

    async createJob(userId: string, taskId: string) {
        const res = await post(`${this.jobsApi}/jobs`).send({userId, taskId, isRunning: true});

        return res.body;
    }
}