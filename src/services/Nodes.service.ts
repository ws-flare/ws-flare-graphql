import {inject} from '@loopback/core';
import {post, get} from 'superagent';

/**
 * Service for nodes related functionality
 */
export class NodesService {

    @inject('api.jobs')
    private jobsApi: string;

    /**
     * Create a new node
     *
     * @param jobId - The job id this node belongs to
     * @param name - The name of the new node
     * @param running - Whether or not the node is running a job
     */
    async createNode(jobId: string, name: string, running: boolean) {
        const res = await post(`${this.jobsApi}/nodes`).send({jobId, name, running});

        return res.body;
    }

    /**
     * Get all nodes within a job
     *
     * @param jobId - The job id to filter by
     */
    async getNodes(jobId: string) {
        const res = await get(`${this.jobsApi}/nodes?filter=${JSON.stringify({where: {jobId}})}`);

        return res.body;
    }
}
