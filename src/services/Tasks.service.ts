import {inject} from '@loopback/core';
import {post, get} from 'superagent';
import {Task} from '../models/Task.model';

export class TasksService {

    @inject('api.projects')
    private projectApi: string;

    async createTask(task: Task) {
        let res = await post(`${this.projectApi}/tasks`).send(task);

        return res.body;
    }

    async getTasks(projectId: string) {
        let res = await get(`${this.projectApi}/tasks?filter=${JSON.stringify({where: {projectId}})}`);

        return res.body;
    }
}
