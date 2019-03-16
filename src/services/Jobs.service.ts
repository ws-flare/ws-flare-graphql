import {inject} from '@loopback/core';
import {post, get} from 'superagent';

export class JobsService {

    @inject('api.jobs')
    private jobsApi: string;

    async createJob(userId: string, taskId: string) {
        const res = await post(`${this.jobsApi}/jobs`).send({userId, taskId, isRunning: true});

        return res.body;
    }

    async getJobs(taskId: string) {
        const res = await get(`${this.jobsApi}/jobs?filter=${JSON.stringify({where: {taskId}})}`);

        return res.body;
    }
}