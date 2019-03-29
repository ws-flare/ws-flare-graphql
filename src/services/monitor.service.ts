import { inject } from '@loopback/core';
import { get } from 'superagent';

export class MonitorService {

    @inject('api.monitor')
    private monitorApi: string;

    async getUsages(jobId: string) {
        let res = await get(`${this.monitorApi}/usages?filter=${JSON.stringify({where: {jobId}})}`);

        return res.body;
    }
}
