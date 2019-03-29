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
import { apis, Container, startMqContainer } from '../test-helpers';

describe('Tasks', () => {

    const graphqlPort = 8000;

    let app: GraphqlApplication;
    let client: any;
    let container: Container;
    let port: Number;

    beforeEach(async () => {
        ({container, port} = await startMqContainer());

        app = await main({port: graphqlPort, amqp: {port}});

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
        await container.stop();

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
                runTime: 1000,
                cfApi: 'http://cf.com',
                cfUser: 'user1',
                cfPass: 'pass1',
                cfOrg: 'org1',
                cfSpace: 'space1',
                cfApps: 'app1,app2,app3'
            });

        const mutation = gql`
                mutation createTask($projectId: String! $name: String! $uri: String! $totalSimulatedUsers: Int! $runTime: Int! $cfApi: String! $cfUser: String! $cfPass: String! $cfOrg: String! $cfSpace: String! $cfApps: String!) {
                  createTask(projectId: $projectId name: $name uri: $uri totalSimulatedUsers: $totalSimulatedUsers runTime: $runTime cfApi: $cfApi cfUser: $cfUser cfPass: $cfPass cfOrg: $cfOrg cfSpace: $cfSpace cfApps: $cfApps) {
                    id
                    userId
                    projectId
                    name
                    uri
                    totalSimulatedUsers
                    runTime
                    cfApi
                    cfUser
                    cfPass
                    cfOrg
                    cfSpace
                    cfApps
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
                runTime: 1000,
                cfApi: 'http://cf.com',
                cfUser: 'user1',
                cfPass: 'pass1',
                cfOrg: 'org1',
                cfSpace: 'space1',
                cfApps: 'app1,app2,app3'
            }
        });

        expect(response.data.createTask.id).to.eql('abc123');
        expect(response.data.createTask.userId).to.eql('user1');
        expect(response.data.createTask.projectId).to.eql('project1');
        expect(response.data.createTask.name).to.eql('task1');
        expect(response.data.createTask.uri).to.eql('ws://localhost');
        expect(response.data.createTask.totalSimulatedUsers).to.eql(20);
        expect(response.data.createTask.runTime).to.eql(1000);
        expect(response.data.createTask.cfApi).to.eql('http://cf.com');
        expect(response.data.createTask.cfUser).to.eql('user1');
        expect(response.data.createTask.cfPass).to.eql('pass1');
        expect(response.data.createTask.cfOrg).to.eql('org1');
        expect(response.data.createTask.cfSpace).to.eql('space1');
        expect(response.data.createTask.cfApps).to.eql('app1,app2,app3');
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
                    runTime: 1000,
                    cfApi: 'http://cf.com',
                    cfUser: 'user1',
                    cfPass: 'pass1',
                    cfOrg: 'org1',
                    cfSpace: 'space1',
                    cfApps: 'app1,app2,app3'
                },
                {
                    id: 'abc2',
                    userId: 'user2',
                    projectId: 'project2',
                    name: 'task2',
                    uri: 'ws://localhost',
                    totalSimulatedUsers: 40,
                    runTime: 5000,
                    cfApi: 'http://cf.com',
                    cfUser: 'user2',
                    cfPass: 'pass2',
                    cfOrg: 'org2',
                    cfSpace: 'space2',
                    cfApps: 'app1,app2,app3'
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
                    cfApi
                    cfUser
                    cfPass
                    cfOrg
                    cfSpace
                    cfApps
                  }
                }
            `;

        const response = await client.query({
            query,
            variables: {
                projectId: 'project1'
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
        expect(response.data.tasks[0].cfApi).to.eql('http://cf.com');
        expect(response.data.tasks[0].cfUser).to.eql('user1');
        expect(response.data.tasks[0].cfPass).to.eql('pass1');
        expect(response.data.tasks[0].cfOrg).to.eql('org1');
        expect(response.data.tasks[0].cfSpace).to.eql('space1');
        expect(response.data.tasks[0].cfApps).to.eql('app1,app2,app3');

        expect(response.data.tasks[1].id).to.eql('abc2');
        expect(response.data.tasks[1].userId).to.eql('user2');
        expect(response.data.tasks[1].projectId).to.eql('project2');
        expect(response.data.tasks[1].name).to.eql('task2');
        expect(response.data.tasks[1].uri).to.eql('ws://localhost');
        expect(response.data.tasks[1].totalSimulatedUsers).to.eql(40);
        expect(response.data.tasks[1].runTime).to.eql(5000);
        expect(response.data.tasks[1].cfApi).to.eql('http://cf.com');
        expect(response.data.tasks[1].cfUser).to.eql('user2');
        expect(response.data.tasks[1].cfPass).to.eql('pass2');
        expect(response.data.tasks[1].cfOrg).to.eql('org2');
        expect(response.data.tasks[1].cfSpace).to.eql('space2');
        expect(response.data.tasks[1].cfApps).to.eql('app1,app2,app3');
    });

});
