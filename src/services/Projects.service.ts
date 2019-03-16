import { inject } from '@loopback/core';
import { post, get } from 'superagent';

export class ProjectsService {

    @inject('api.projects')
    private projectsApi: string;

    async createProject(userId: string, name: string) {
        const res = await post(`${this.projectsApi}/projects`).send({userId, name});

        return res.body;
    }

    async getProjects() {
        const res = await get(`${this.projectsApi}/projects`);

        return res.body;
    }
}
