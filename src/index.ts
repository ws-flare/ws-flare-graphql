import {ApplicationConfig} from '@loopback/core';
import {GraphqlApplication} from './application';

const {PORT, JWT_SECRET, USER_API, PROJECT_API, JOBS_API} = process.env;

export async function main(options: ApplicationConfig = {}): Promise<GraphqlApplication> {
    options.port = options.port || PORT;
    options.jwt = {secret: JWT_SECRET};
    options.apis = {
        userApi: USER_API,
        projectsApi: PROJECT_API,
        jobsApi: JOBS_API
    };

    const app = new GraphqlApplication(options);

    await app.start();

    console.log(`Server is running on port ${app.options.port}`);
    return app;
}
