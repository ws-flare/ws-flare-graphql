import { ApplicationConfig } from '@loopback/core';
import { GraphqlApplication } from './application';

const {PORT, AMQP_URL, AMQP_PORT, AMQP_USER, AMQP_PWD, JWT_SECRET, USER_API, PROJECTS_API, JOBS_API, MONITOR_API} = process.env;

export async function main(options: ApplicationConfig = {}): Promise<GraphqlApplication> {
    options.port = options.port || PORT;
    options.jwt = {secret: JWT_SECRET};
    options.apis = {
        userApi: USER_API,
        projectsApi: PROJECTS_API,
        jobsApi: JOBS_API,
        monitorApi: MONITOR_API
    };
    options.amqp = {
        url: AMQP_URL,
        port: (options.amqp || {}).port || AMQP_PORT,
        user: AMQP_USER,
        pwd: AMQP_PWD
    };

    const app = new GraphqlApplication(options);

    await app.start();

    console.log(`Server is running on port ${app.options.port}`);
    return app;
}
