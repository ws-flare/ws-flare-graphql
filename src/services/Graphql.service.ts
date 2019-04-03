import { IResolvers } from "graphql-tools";
import { inject } from "@loopback/core";
import { UserService } from './User.service';
import { User } from '../models/User.model';
import { ProjectsService } from './Projects.service';
import { Project } from '../models/Project.model';
import { Context } from '../models/Context.model';
import { Task } from '../models/Task.model';
import { TasksService } from './Tasks.service';
import { JobsService } from './Jobs.service';
import { NodesService } from './Nodes.service';
import { MonitorService } from './monitor.service';
import { Job } from '../models/Job.model';

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

                // Nodes
                createNode: (_: null, args: { jobId: string, name: string, running: boolean }, ctx: Context) => {
                    return ctx.authenticated ? this.nodesService.createNode(args.jobId, args.name, args.running) : null;
                }
            },
        }
    }
}
