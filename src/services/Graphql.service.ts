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

    getResolvers(): IResolvers {
        return {
            Query: {
                projects: (_: null, args: null, ctx: Context) => {
                    return ctx.authenticated ? this.projectsService.getProjects() : [];
                },

                tasks: (_: null, args: { projectId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.tasksService.getTasks(args.projectId) : [];
                },

                task: (_: null, args: { taskId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.tasksService.getTask(args.taskId) : [];
                },

                jobs: (_: null, args: { taskId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.jobsService.getJobs(args.taskId) : [];
                },

                job: (_: null, args: { jobId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.jobsService.getJob(args.jobId) : [];
                },

                nodes: (_: null, args: { jobId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.nodesService.getNodes(args.jobId) : [];
                },

                usages: (_: null, args: { jobId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.monitorService.getUsages(args.jobId) : [];
                },

                sockets: (_: null, args: { jobId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.socketsService.getSockets(args.jobId) : [];
                },

                connectedSocketTimeFrame: (_: null, args: { jobId: string, tickSeconds: number }, ctx: Context) => {
                    return ctx.authenticated ? this.socketsService.getTicksWithinTimeFrame(args.jobId, args.tickSeconds) : [];
                },

                appUsageTicks: (_: null, args: { jobId: string, tickSeconds: number }, ctx: Context) => {
                    return ctx.authenticated ? this.monitorService.getTicksWithinTimeFrame(args.jobId, args.tickSeconds) : [];
                },

                generateCiToken: (_: null, args: { taskId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.tokenService.generateCiToken(ctx.user.userId, args.taskId) : [];
                }
            },

            Project: {
                tasks: (project: Project) => this.tasksService.getTasks(project.id)
            },

            Task: {
                jobs: (task: Task) => this.jobsService.getJobs(task.id)
            },

            Job: {
                nodes: (job: Job) => this.nodesService.getNodes(job.id),

                usages: (job: Job) => this.monitorService.getUsages(job.id),

                connectedSocketTimeFrame: (job: Job) => this.socketsService.getTicksWithinTimeFrame(job.id, 10),

                appUsageTicks: (job: Job) => this.monitorService.getTicksWithinTimeFrame(job.id, 10)
            },

            ConnectedSocketTick: {
                connectedSocketCount: (tick: ConnectedSocketTick) => {
                    return this.socketsService.getTotalConnectedSocketsWithinTick(tick.jobId, tick.gt, tick.lt)
                }
            },

            UsageTick: {
                cfApps: ({jobId, gt, lt}: UsageTick) => {
                    return this.monitorService.getApps(jobId, gt, lt)
                }
            },

            CfApp: {
                instances: ({id, jobId, gt, lt}: CfApp) => {
                    return this.monitorService.getInstances(jobId, id, gt, lt)
                }
            },

            Instance: {
                usage: ({jobId, appId, instance, gt, lt}: Instance) => {
                    return this.monitorService.getMaxUsageWithinTick(jobId, appId, instance, gt, lt)
                }
            },

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
