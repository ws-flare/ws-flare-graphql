import "isomorphic-fetch";
import {gql} from 'apollo-server-express';
import {ApolloClient} from 'apollo-client';
import {createHttpLink} from 'apollo-link-http';
import {InMemoryCache} from 'apollo-cache-inmemory';
import * as nock from 'nock';
import {expect} from 'chai';
import {setContext} from 'apollo-link-context';
import {main} from '../..';
import {GraphqlApplication} from '../../application';
import {apis} from '../test-helpers';

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
                mutation createTask($projectId: String! $name: String! $uri: String! $totalSimulatedUsers: Int! $runTime: Int!) {
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
                projectId: 'project1',
                name: 'task1',
                uri: 'ws://localhost',
                totalSimulatedUsers: 20,
                runTime: 1000
            }
        });

        expect(response.data.createTask.id).to.eql('abc123');
        expect(response.data.createTask.userId).to.eql('user1');
        expect(response.data.createTask.projectId).to.eql('project1');
        expect(response.data.createTask.name).to.eql('task1');
        expect(response.data.createTask.uri).to.eql('ws://localhost');
        expect(response.data.createTask.totalSimulatedUsers).to.eql(20);
        expect(response.data.createTask.runTime).to.eql(1000);
    });

    it('should get a list of tasks in a project', async () => {
        nock(`${apis.projectsApi}`)
            .filteringPath(() => '/tasks')
            .get('/tasks')
            .reply(200, [
                {
                    id: 'abc1',
                    userId: 'user1',
                    projectId: 'project1',
                    name: 'task1',
                    uri: 'ws://localhost',
                    totalSimulatedUsers: 20,
                    runTime: 1000
                },
                {
                    id: 'abc2',
                    userId: 'user2',
                    projectId: 'project2',
                    name: 'task2',
                    uri: 'ws://localhost',
                    totalSimulatedUsers: 40,
                    runTime: 5000
                }
            ]);

        const query = gql`
                query tasks($projectId: String!) {
                  tasks(projectId: $projectId) {
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

        const response = await client.query({
            query,
            variables: {
                projectId: 'project1',
                name: 'task1',
                uri: 'ws://localhost',
                totalSimulatedUsers: 20,
                runTime: 1000
            }
        });

        expect(response.data.tasks.length).to.equal(2);

        expect(response.data.tasks[0].id).to.eql('abc1');
        expect(response.data.tasks[0].userId).to.eql('user1');
        expect(response.data.tasks[0].projectId).to.eql('project1');
        expect(response.data.tasks[0].name).to.eql('task1');
        expect(response.data.tasks[0].uri).to.eql('ws://localhost');
        expect(response.data.tasks[0].totalSimulatedUsers).to.eql(20);
        expect(response.data.tasks[0].runTime).to.eql(1000);

        expect(response.data.tasks[1].id).to.eql('abc2');
        expect(response.data.tasks[1].userId).to.eql('user2');
        expect(response.data.tasks[1].projectId).to.eql('project2');
        expect(response.data.tasks[1].name).to.eql('task2');
        expect(response.data.tasks[1].uri).to.eql('ws://localhost');
        expect(response.data.tasks[1].totalSimulatedUsers).to.eql(40);
        expect(response.data.tasks[1].runTime).to.eql(5000);
    });

});
