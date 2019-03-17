import { Application, ApplicationConfig } from '@loopback/core';
import { createLogger, transports } from 'winston';
import { GraphqlServer } from './graphql.server';
import { GraphqlService } from './services/Graphql.service';
import { UserService } from './services/User.service';
import { ProjectsService } from './services/Projects.service';
import { TasksService } from './services/Tasks.service';
import { JobsService } from './services/Jobs.service';
import { NodesService } from './services/Nodes.service';

export class GraphqlApplication extends Application {

    constructor(options: ApplicationConfig = {}) {
        super(options);

        this.options.port = this.options.port || 3000;

        const logger = createLogger({
            transports: [
                new transports.Console(),
            ],
        });

        this.server(GraphqlServer);

        // Logger
        this.bind('logger').to(logger);

        // Jwt
        this.bind('jwt.secret').to(options.jwt.secret);

        // Server Options
        this.bind('server.port').to(this.options.port);

        // Services
        this.bind('services.graphql').toClass(GraphqlService);
        this.bind('services.user').toClass(UserService);
        this.bind('services.projects').toClass(ProjectsService);
        this.bind('services.tasks').toClass(TasksService);
        this.bind('services.jobs').toClass(JobsService);
        this.bind('services.nodes').toClass(NodesService);

        // Remote APIS
        this.bind('api.user').to(options.apis.userApi);
        this.bind('api.projects').to(options.apis.projectsApi);
        this.bind('api.jobs').to(options.apis.jobsApi);

    }

}
