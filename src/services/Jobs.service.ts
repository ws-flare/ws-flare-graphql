import { inject } from '@loopback/core';
import { post, get } from 'superagent';
import { Connection } from 'amqplib';
import { TasksService } from './Tasks.service';
import { Logger } from 'winston';
import { Task } from '../models/Task.model';

export class JobsService {

    @inject('logger')
    private logger: Logger;

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

        this.logger.info(task);
        this.logger.info('===================================');
        this.logger.info({
            taskId, job: res.body, task: {
                ...task, scripts: JSON.parse(task.scripts)
            }
        });

        const channel = await this.amqp.createChannel();
        await channel.assertQueue(this.createJobChannel);
        await channel.sendToQueue(this.createJobChannel, new Buffer((JSON.stringify({
            taskId, job: res.body, task: {
                ...task, scripts: JSON.parse(task.scripts)
            }
        }))));

        return res.body;
    }

    async getJobs(taskId: string) {
        const res = await get(`${this.jobsApi}/jobs?filter=${JSON.stringify({where: {taskId}})}`);

        return res.body;
    }

    async getJob(jobId: string) {
        const job = await get(`${this.jobsApi}/jobs/${jobId}`);

        const task = await this.tasksService.getTask(job.body.taskId);

        this.logger.info(task);

        const scripts = JSON.parse(task.scripts);

        this.logger.info(scripts);

        const totalSimulators = scripts.reduce((a: any, b: any) => a.totalSimulators + b.totalSimulators)

        return {...job.body, totalSimulators};
    }
}
