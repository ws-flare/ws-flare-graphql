import "isomorphic-fetch";
import { gql } from 'apollo-server-express';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import * as nock from 'nock';
import { expect } from 'chai';
import { setContext } from 'apollo-link-context';
import { main } from '../..';
import { GraphqlApplication } from '../../application';
import { apis } from '../test-helpers';

describe('Tasks', () => {

    const graphqlPort = 8000;

    let app: GraphqlApplication;
    let client: any;

    beforeEach(async () => {
        app = await main({port: graphqlPort});

        const authLink = setContext((_, {headers}) => {
            return {
                headers: {
                    ...headers,
                    authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYmMxMjMiLCJ1c2VybmFtZSI6InRlc3RVc2VyIiwiaWF0IjoxNTQyMjIwNTg5fQ.JzdxdrGbVy7Nju5aymKXT2XWQyoVftyB9ZtBxO9UbvE`,
                }
            }
        });

        client = new ApolloClient({
            link: authLink.concat(createHttpLink({uri: `http://localhost:${graphqlPort}/graphql`})),
            cache: new InMemoryCache()
        });
    });

    afterEach(async () => {
        await app.stop();

        nock.cleanAll();
        nock.restore();
        nock.activate();
    });

    it('should create a new task', async () => {
        nock(`${apis.projectsApi}`)
            .post('/tasks')
            .reply(200, {
                id: 'abc123',
                userId: 'user1',
                projectId: 'project1',
                name: 'task1',
                uri: 'ws://localhost',
                totalSimulatedUsers: 20,
                runTime: 1000
            });

        const mutation = gql`
                mutation createTask($projectId: String! $name: String! $uri: String! $totalSimulatedUsers: Number $runTime: 1000) {
                  createTask(projectId: $projectId name: $name uri: $uri totalSimulatedUsers: $totalSimulatedUsers runTime: $runTime) {
                    id
                    userId
                    projectId
                    name
                    uri
                    totalSimulatedUsers
                    runTime
                  }
                }
            `;

        const response = await client.mutate({
            mutation,
            variables: {
                userId: 'user1',
                projectId: 'project1',
                name: 'task1',
                uri: 'ws://localhost',
                totalSimulatedUsers: 20,
                runTime: 1000
            }
        });

        expect(response.data.createProject.id).to.eql('abc123');
        expect(response.data.createProject.userId).to.eql('user1');
        expect(response.data.createProject.projectId).to.eql('project1');
        expect(response.data.createProject.name).to.eql('task1');
        expect(response.data.createProject.uri).to.eql('ws://localhost');
        expect(response.data.createProject.totalSimulatedUsers).to.eql(20);
        expect(response.data.createProject.runTime).to.eql(1000);
    });

});
