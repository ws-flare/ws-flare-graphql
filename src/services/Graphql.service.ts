import {IResolvers} from "graphql-tools";
import {inject} from "@loopback/core";
import {UserService} from './User.service';
import {User} from '../models/User.model';
import {ProjectsService} from './Projects.service';
import {Project} from '../models/Project.model';
import {Context} from '../models/Context.model';
import {Task} from '../models/Task.model';
import {TasksService} from './Tasks.service';

export class GraphqlService {

    @inject('services.user')
    private userService: UserService;

    @inject('services.projects')
    private projectsService: ProjectsService;

    @inject('services.tasks')
    private tasksService: TasksService;

    getResolvers(): IResolvers {
        return {
            Query: {
                projects: (_: null, args: null, ctx: Context) => {
                    return ctx.authenticated ? this.projectsService.getProjects() : [];
                },

                tasks: (_: null, args: { projectId: string }, ctx: Context) => {
                    return ctx.authenticated ? this.tasksService.getTasks(args.projectId) : [];
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
            },
        }
    }
}
