import {inject} from '@loopback/core';
import {post, get, put} from 'superagent';
import {Task} from '../models/Task.model';

/**
 * Service for tasks related functionality
 */
export class TasksService {

    @inject('api.projects')
    private projectApi: string;

    /**
     * Create a new task
     *
     * @param task - The task to create
     */
    async createTask(task: Task) {
        let res = await post(`${this.projectApi}/tasks`).send(task);

        return res.body;
    }

    /**
     * Get a list of tasks within a project
     *
     * @param projectId - The project id to filter by
     */
    async getTasks(projectId: string) {
        let res = await get(`${this.projectApi}/tasks?filter=${JSON.stringify({where: {projectId}})}`);

        return res.body;
    }

    /**
     * Get a single task by id
     *
     * @param taskId - The task id
     */
    async getTask(taskId: string) {
        let res = await get(`${this.projectApi}/tasks/${taskId}`);

        return res.body;
    }

    /**
     * Update a task by id
     *
     * @param task - The task to update
     */
    async updateTask(task: Task) {
        let res = await put(`${this.projectApi}/tasks/${task.id}`).send(task);

        return res.body;
    }
}
