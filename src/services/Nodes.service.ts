import { inject } from '@loopback/core';
import { post } from 'superagent';

export class NodesService {

    @inject('api.jobs')
    private jobsApi: string;

    async createNode(jobId: string, name: string) {
        const res = await post(`${this.jobsApi}/nodes`).send({jobId, name});

        return res.body;
    }
}
