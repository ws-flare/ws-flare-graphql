import { inject } from '@loopback/core';
import { get } from 'superagent';

export class SocketsService {

    @inject('api.jobs')
    private jobsApi: string;

    async getSockets(jobId: string) {
        let res = await get(`${this.jobsApi}/sockets?filter=${JSON.stringify({where: {jobId}})}`);

        return res.body;
    }
}
