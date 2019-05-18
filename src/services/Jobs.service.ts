import {inject} from '@loopback/core';
import {post, get} from 'superagent';
import {Connection} from 'amqplib';
import {TasksService} from './Tasks.service';
import {Logger} from 'winston';

/**
 * Service for handling job related functionality
 */
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

    /**
     * Creates a new job
     *
     * @param userId - The user who created the job
     * @param taskId - The task id the job is in
     */
    async createJob(userId: string, taskId: string) {
        const res = await post(`${this.jobsApi}/jobs`).send({userId, taskId, isRunning: true});

        const task = await this.tasksService.getTask(taskId);

        this.logger.info(task);
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

    /**
     * Get a list of jobs
     *
     * @param taskId - Task id to filter by
     */
    async getJobs(taskId: string) {
        const res = await get(`${this.jobsApi}/jobs?filter=${JSON.stringify({where: {taskId}})}`);

        return res.body;
    }

    /**
     * Gets a single job
     *
     * @param jobId - The id of the job to search for
     */
    async getJob(jobId: string) {
        const job = await get(`${this.jobsApi}/jobs/${jobId}`);

        const task = await this.tasksService.getTask(job.body.taskId);

        this.logger.info(task);

        // Parse the script as it is stored as an encoded JSON string in the database
        const scripts = JSON.parse(task.scripts);

        this.logger.info(scripts);

        let totalSimulators = 0;

        scripts.forEach((script: any) => totalSimulators += script.totalSimulators);

        return {...job.body, totalSimulators};
    }
}
