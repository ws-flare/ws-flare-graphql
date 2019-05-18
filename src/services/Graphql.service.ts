import {IResolvers} from "graphql-tools";
import {inject} from "@loopback/core";
import {UserService} from './User.service';
import {User} from '../models/User.model';
import {ProjectsService} from './Projects.service';
import {Project} from '../models/Project.model';
import {Context} from '../models/Context.model';
import {Task} from '../models/Task.model';
import {TasksService} from './Tasks.service';
import {JobsService} from './Jobs.service';
import {NodesService} from './Nodes.service';
import {MonitorService} from './monitor.service';
import {Job} from '../models/Job.model';
import {SocketsService} from './sockets.service';
import {ConnectedSocketTick} from '../models/socket.model';
import {CfApp, Instance, UsageTick} from '../models/usage.model';
import {TokenService} from './token.service';

/**
 * Service for setting up GraphQL resolvers
 */
export class GraphqlService {

    @inject('services.user')
    private userService: UserService;

    @inject('services.projects')
    private projectsService: ProjectsService;

    @inject('services.tasks')
    private tasksService: TasksService;

    @inject('services.jobs')
    private jobsService: JobsService;

    @inject('services.nodes')
    private nodesService: NodesService;

    @inject('services.monitor')
    private monitorService: MonitorService;

    @inject('services.sockets')
    private socketsService: SocketsService;

    @inject('services.token')
    private tokenService: TokenService;

    /**
     * Get the resolvers for GraphQL
     */
    getResolvers(): IResolvers {
        return {
            Query: {
                // Get projects
                projects: (_: null, args: null, ctx: Context) => {
                    return ctx.authenticated ? this.projectsService.getProjects() : [];
                },

                // Get tasks
                tasks: (_: null, args: { projectId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.tasksService.getTasks(args.projectId) : [];
                },

                // Get a single task
                task: (_: null, args: { taskId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.tasksService.getTask(args.taskId) : [];
                },

                // Get jobs
                jobs: (_: null, args: { taskId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.jobsService.getJobs(args.taskId) : [];
                },

                // Get a single job
                job: (_: null, args: { jobId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.jobsService.getJob(args.jobId) : [];
                },

                // Get nodes
                nodes: (_: null, args: { jobId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.nodesService.getNodes(args.jobId) : [];
                },

                // Get usages
                usages: (_: null, args: { jobId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.monitorService.getUsages(args.jobId) : [];
                },

                // Get sockets
                sockets: (_: null, args: { jobId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.socketsService.getSockets(args.jobId) : [];
                },

                // Get connections in a certain time frame
                connectedSocketTimeFrame: (_: null, args: { jobId: string, tickSeconds: number }, ctx: Context) => {
                    return ctx.authenticated ? this.socketsService.getTicksWithinTimeFrame(args.jobId, args.tickSeconds) : [];
                },

                // Get total ticks in seconds
                appUsageTicks: (_: null, args: { jobId: string, tickSeconds: number }, ctx: Context) => {
                    return ctx.authenticated ? this.monitorService.getTicksWithinTimeFrame(args.jobId, args.tickSeconds) : [];
                },

                // Generate a CI token for use in continuous integration environments
                generateCiToken: (_: null, args: { taskId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.tokenService.generateCiToken(ctx.user.userId, args.taskId) : [];
                }
            },

            /**
             * Resolvers for a project
             */
            Project: {
                // Get tasks in a project
                tasks: (project: Project) => this.tasksService.getTasks(project.id)
            },

            /**
             * Resolvers for a task
             */
            Task: {
                // Get jobs in a task
                jobs: (task: Task) => this.jobsService.getJobs(task.id)
            },

            /**
             * Resolvers for a job
             */
            Job: {
                // Get nodes in a job
                nodes: (job: Job) => this.nodesService.getNodes(job.id),

                // Get usages in a job
                usages: (job: Job) => this.monitorService.getUsages(job.id),

                // Get connections within a time frame
                connectedSocketTimeFrame: (job: Job) => this.socketsService.getTicksWithinTimeFrame(job.id, 10),

                // Get usage ticks with a time frame
                appUsageTicks: (job: Job) => this.monitorService.getTicksWithinTimeFrame(job.id, 10)
            },

            /**
             * Resolvers for connected socket ticks
             */
            ConnectedSocketTick: {

                // Get total connected sockets within a time frame
                connectedSocketCount: (tick: ConnectedSocketTick) => {
                    return this.socketsService.getTotalConnectedSocketsWithinTick(tick.jobId, tick.gt, tick.lt)
                }
            },

            /**
             * Resolvers for usage ticks
             */
            UsageTick: {

                // Get apps withing a usage tick
                cfApps: ({jobId, gt, lt}: UsageTick) => {
                    return this.monitorService.getApps(jobId, gt, lt)
                }
            },

            /**
             * Resolvers for CF Applications
             */
            CfApp: {

                // Get instances of an application within an app
                instances: ({id, jobId, gt, lt}: CfApp) => {
                    return this.monitorService.getInstances(jobId, id, gt, lt)
                }
            },

            /**
             * Resolvers for instances of an application on Cloud Foundry
             */
            Instance: {

                // Get usage statistics for an instance
                usage: ({jobId, appId, instance, gt, lt}: Instance) => {
                    return this.monitorService.getMaxUsageWithinTick(jobId, appId, instance, gt, lt)
                }
            },

            /**
             * GraphQL mutations for performing creates and updates as well as logging in and signing up
             */
            Mutation: {
                // Users
                signup: (_: null, user: User) => this.userService.signup(user.username, user.email, user.password),

                login: (_: null, user: User) => this.userService.login(user.username, user.password),

                // Projects
                createProject: (_: null, project: Project, ctx: Context) => {
                    return ctx.authenticated ? this.projectsService.createProject(ctx.user.userId, project.name) : null;
                },

                // Tasks
                createTask: (_: null, task: Task, ctx: Context) => {
                    return ctx.authenticated ? this.tasksService.createTask({...task, userId: ctx.user.userId}) : null;
                },

                updateTask: (_: null, task: Task, ctx: Context) => {
                    return ctx.authenticated ? this.tasksService.updateTask({...task, userId: ctx.user.userId}) : null;
                },

                // Jobs
                createJob: (_: null, args: { taskId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.jobsService.createJob(ctx.user.userId, args.taskId) : null;
                },

                createCiJob: (_: null, {}, ctx: Context) => {
                    return ctx.authenticated && ctx.taskId ? this.jobsService.createJob(ctx.user.userId, ctx.taskId) : null;
                },

                // Nodes
                createNode: (_: null, args: { jobId: string, name: string, running: boolean }, ctx: Context) => {
                    return ctx.authenticated ? this.nodesService.createNode(args.jobId, args.name, args.running) : null;
                }
            },
        }
    }
}
