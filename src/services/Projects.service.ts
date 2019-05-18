import { inject } from '@loopback/core';
import { post, get } from 'superagent';

/**
 * Service for projects related functionality
 */
export class ProjectsService {

    @inject('api.projects')
    private projectsApi: string;

    /**
     * Create a new project
     *
     * @param userId - The user id of the user creating the project
     * @param name - The name of the new project
     */
    async createProject(userId: string, name: string) {
        const res = await post(`${this.projectsApi}/projects`).send({userId, name});

        return res.body;
    }

    /**
     * Get a list of projects
     */
    async getProjects() {
        const res = await get(`${this.projectsApi}/projects`);

        return res.body;
    }
}
