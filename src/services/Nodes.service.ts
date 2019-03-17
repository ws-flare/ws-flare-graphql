import { inject } from '@loopback/core';
import { post, get } from 'superagent';

export class NodesService {

    @inject('api.jobs')
    private jobsApi: string;

    async createNode(jobId: string, name: string) {
        const res = await post(`${this.jobsApi}/nodes`).send({jobId, name});

        return res.body;
    }

    async getNodes(jobId: string) {
        const res = await get(`${this.jobsApi}/nodes?filter=${JSON.stringify({where: {jobId}})}`);

        return res.body;
    }
}
