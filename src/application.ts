import { Application, ApplicationConfig } from '@loopback/core';
import { createLogger, transports } from 'winston';
import { connect } from 'amqplib';
import { GraphqlServer } from './graphql.server';
import { GraphqlService } from './services/Graphql.service';
import { UserService } from './services/User.service';
import { ProjectsService } from './services/Projects.service';
import { TasksService } from './services/Tasks.service';
import { JobsService } from './services/Jobs.service';
import { NodesService } from './services/Nodes.service';
import { MonitorService } from './services/monitor.service';
import { SocketsService } from './services/sockets.service';

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
        this.bind('services.monitor').toClass(MonitorService);
        this.bind('services.sockets').toClass(SocketsService);

        // Remote APIS
        this.bind('api.user').to(options.apis.userApi);
        this.bind('api.projects').to(options.apis.projectsApi);
        this.bind('api.jobs').to(options.apis.jobsApi);
        this.bind('api.monitor').to(options.apis.monitorApi);

        // AMQP
        this.bind('amqp.url').to(options.amqp.url);
        this.bind('amqp.port').to(options.amqp.port);
        this.bind('amqp.user').to(options.amqp.user);
        this.bind('amqp.pwd').to(options.amqp.pwd);
        this.bind('amqp.conn').toDynamicValue(async () => await connect({
            hostname: options.amqp.url,
            port: options.amqp.port,
            username: options.amqp.user,
            password: options.amqp.pwd
        }));

        // Channels
        this.bind('channel.job.create').to('job.create');

    }

}
