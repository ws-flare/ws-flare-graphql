import { inject } from '@loopback/core';
import { post } from 'superagent';

export class ProjectsService {

    @inject('api.projects')
    private projectsApi: string;

    async createProject(userId: string, name: string) {
        const res = await post(`${this.projectsApi}/projects`).send({userId, name});

        return res.body;
    }
}
