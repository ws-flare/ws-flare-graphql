import { inject } from '@loopback/core';
import { post, get } from 'superagent';
import { Connection } from 'amqplib';
import { TasksService } from './Tasks.service';

export class JobsService {

    @inject('api.jobs')
    private jobsApi: string;

    @inject('amqp.conn')
    private amqp: Connection;

    @inject('channel.job.create')
    private createJobChannel: string;

    @inject('services.tasks')
    private tasksService: TasksService;

    async createJob(userId: string, taskId: string) {
        const res = await post(`${this.jobsApi}/jobs`).send({userId, taskId, isRunning: true});

        const task = await this.tasksService.getTask(taskId);

        task.scripts = JSON.parse(task.scripts);

        const channel = await this.amqp.createChannel();
        await channel.assertQueue(this.createJobChannel);
        await channel.sendToQueue(this.createJobChannel, new Buffer((JSON.stringify({taskId, job: res.body, task}))));

        return res.body;
    }

    async getJobs(taskId: string) {
        const res = await get(`${this.jobsApi}/jobs?filter=${JSON.stringify({where: {taskId}})}`);

        return res.body;
    }

    async getJob(jobId: string) {
        const res = await get(`${this.jobsApi}/jobs/${jobId}`);

        return res.body;
    }
}
