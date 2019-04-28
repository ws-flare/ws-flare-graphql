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
import {apis, Container, startMqContainer} from '../test-helpers';

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
            .post('/tasks', {
                userId: 'abc123',
                projectId: 'project1',
                name: 'task1',
                cfApi: 'http://cf.com',
                cfUser: 'user1',
                cfPass: 'pass1',
                cfOrg: 'org1',
                cfSpace: 'space1',
                cfApps: 'app1,app2,app3',
                successThreshold: 80,
                scripts: JSON.stringify([{start: 0}, {start: 30}])
            })
            .reply(200, {
                id: 'abc123',
                userId: 'user1',
                projectId: 'project1',
                name: 'task1',
                cfApi: 'http://cf.com',
                cfUser: 'user1',
                cfPass: 'pass1',
                cfOrg: 'org1',
                cfSpace: 'space1',
                cfApps: 'app1,app2,app3',
                successThreshold: 80,
                scripts: JSON.stringify([{start: 0}, {start: 30}])
            });

        const mutation = gql`
                mutation createTask($projectId: String! $name: String! $cfApi: String! $cfUser: String! $cfPass: String! $cfOrg: String! $cfSpace: String! $cfApps: String! $successThreshold: Int! $scripts: String!) {
                  createTask(projectId: $projectId name: $name cfApi: $cfApi cfUser: $cfUser cfPass: $cfPass cfOrg: $cfOrg cfSpace: $cfSpace cfApps: $cfApps successThreshold: $successThreshold scripts: $scripts) {
                    id
                    userId
                    projectId
                    name
                    cfApi
                    cfUser
                    cfPass
                    cfOrg
                    cfSpace
                    cfApps
                    successThreshold
                    scripts
                  }
                }
            `;

        const response = await client.mutate({
            mutation,
            variables: {
                projectId: 'project1',
                name: 'task1',
                cfApi: 'http://cf.com',
                cfUser: 'user1',
                cfPass: 'pass1',
                cfOrg: 'org1',
                cfSpace: 'space1',
                cfApps: 'app1,app2,app3',
                successThreshold: 80,
                scripts: JSON.stringify([{start: 0}, {start: 30}])
            }
        });

        expect(response.data.createTask.id).to.eql('abc123');
        expect(response.data.createTask.userId).to.eql('user1');
        expect(response.data.createTask.projectId).to.eql('project1');
        expect(response.data.createTask.name).to.eql('task1');
        expect(response.data.createTask.cfApi).to.eql('http://cf.com');
        expect(response.data.createTask.cfUser).to.eql('user1');
        expect(response.data.createTask.cfPass).to.eql('pass1');
        expect(response.data.createTask.cfOrg).to.eql('org1');
        expect(response.data.createTask.cfSpace).to.eql('space1');
        expect(response.data.createTask.cfApps).to.eql('app1,app2,app3');
        expect(response.data.createTask.successThreshold).to.eql(80);
        expect(JSON.parse(response.data.createTask.scripts)).to.eql([{start: 0}, {start: 30}]);
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
                    cfApi: 'http://cf.com',
                    cfUser: 'user1',
                    cfPass: 'pass1',
                    cfOrg: 'org1',
                    cfSpace: 'space1',
                    cfApps: 'app1,app2,app3',
                    successThreshold: 70,
                    scripts: JSON.stringify([{start: 0}])
                },
                {
                    id: 'abc2',
                    userId: 'user2',
                    projectId: 'project2',
                    name: 'task2',
                    cfApi: 'http://cf.com',
                    cfUser: 'user2',
                    cfPass: 'pass2',
                    cfOrg: 'org2',
                    cfSpace: 'space2',
                    cfApps: 'app1,app2,app3',
                    successThreshold: 80,
                    scripts: JSON.stringify([{start: 30}])
                }
            ]);

        const query = gql`
                query tasks($projectId: String!) {
                  tasks(projectId: $projectId) {
                    id
                    userId
                    projectId
                    name
                    cfApi
                    cfUser
                    cfPass
                    cfOrg
                    cfSpace
                    cfApps
                    successThreshold
                    scripts
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
        expect(response.data.tasks[0].cfApi).to.eql('http://cf.com');
        expect(response.data.tasks[0].cfUser).to.eql('user1');
        expect(response.data.tasks[0].cfPass).to.eql('pass1');
        expect(response.data.tasks[0].cfOrg).to.eql('org1');
        expect(response.data.tasks[0].cfSpace).to.eql('space1');
        expect(response.data.tasks[0].cfApps).to.eql('app1,app2,app3');
        expect(response.data.tasks[0].successThreshold).to.eql(70);
        expect(JSON.parse(response.data.tasks[0].scripts)).to.eql([{start: 0}]);

        expect(response.data.tasks[1].id).to.eql('abc2');
        expect(response.data.tasks[1].userId).to.eql('user2');
        expect(response.data.tasks[1].projectId).to.eql('project2');
        expect(response.data.tasks[1].name).to.eql('task2');
        expect(response.data.tasks[1].cfApi).to.eql('http://cf.com');
        expect(response.data.tasks[1].cfUser).to.eql('user2');
        expect(response.data.tasks[1].cfPass).to.eql('pass2');
        expect(response.data.tasks[1].cfOrg).to.eql('org2');
        expect(response.data.tasks[1].cfSpace).to.eql('space2');
        expect(response.data.tasks[1].cfApps).to.eql('app1,app2,app3');
        expect(response.data.tasks[1].successThreshold).to.eql(80);
        expect(JSON.parse(response.data.tasks[1].scripts)).to.eql([{start: 30}]);
    });

    it('should be able to get a single task', async () => {
        nock(`${apis.projectsApi}`)
            .get('/tasks/abc123')
            .reply(200,
                {
                    id: 'abc1',
                    userId: 'user1',
                    projectId: 'project1',
                    name: 'task1',
                    cfApi: 'http://cf.com',
                    cfUser: 'user1',
                    cfPass: 'pass1',
                    cfOrg: 'org1',
                    cfSpace: 'space1',
                    cfApps: 'app1,app2,app3',
                    scripts: JSON.stringify([{start: 0}])
                });

        const query = gql`
                query task($taskId: String!) {
                  task(taskId: $taskId) {
                    id
                    userId
                    projectId
                    name
                    cfApi
                    cfUser
                    cfPass
                    cfOrg
                    cfSpace
                    cfApps
                    scripts
                  }
                }
            `;

        const response = await client.query({
            query,
            variables: {
                taskId: 'abc123'
            }
        });

        expect(response.data.task.id).to.eql('abc1');
        expect(response.data.task.userId).to.eql('user1');
        expect(response.data.task.projectId).to.eql('project1');
        expect(response.data.task.name).to.eql('task1');
        expect(response.data.task.cfApi).to.eql('http://cf.com');
        expect(response.data.task.cfUser).to.eql('user1');
        expect(response.data.task.cfPass).to.eql('pass1');
        expect(response.data.task.cfOrg).to.eql('org1');
        expect(response.data.task.cfSpace).to.eql('space1');
        expect(response.data.task.cfApps).to.eql('app1,app2,app3');
        expect(JSON.parse(response.data.task.scripts)).to.eql([{start: 0}]);
    });

    it('should be able to update a task', async () => {
        nock(`${apis.projectsApi}`)
            .put('/tasks/abc123')
            .reply(201,
                {
                    id: 'abc123',
                    userId: 'user1',
                    projectId: 'project1',
                    name: 'task1',
                    cfApi: 'http://cf.com',
                    cfUser: 'user1',
                    cfPass: 'pass1',
                    cfOrg: 'org1',
                    cfSpace: 'space1',
                    cfApps: 'app1,app2,app3',
                    scripts: JSON.stringify([{start: 0}, {start: 30}])
                });

        const mutation = gql`
                mutation updateTask($id: String! $projectId: String! $name: String! $cfApi: String! $cfUser: String! $cfPass: String! $cfOrg: String! $cfSpace: String! $cfApps: String! $scripts: String!) {
                  updateTask(id: $id projectId: $projectId name: $name cfApi: $cfApi cfUser: $cfUser cfPass: $cfPass cfOrg: $cfOrg cfSpace: $cfSpace cfApps: $cfApps scripts: $scripts) {
                    id
                    userId
                    projectId
                    name
                    cfApi
                    cfUser
                    cfPass
                    cfOrg
                    cfSpace
                    cfApps
                    scripts
                  }
                }
            `;

        const response = await client.mutate({
            mutation,
            variables: {
                id: 'abc123',
                projectId: 'project1',
                name: 'task1',
                cfApi: 'http://cf.com',
                cfUser: 'user1',
                cfPass: 'pass1',
                cfOrg: 'org1',
                cfSpace: 'space1',
                cfApps: 'app1,app2,app3',
                scripts: JSON.stringify([{start: 0}, {start: 30}])
            }
        });

        expect(response.data.updateTask.id).to.eql('abc123');
        expect(response.data.updateTask.userId).to.eql('user1');
        expect(response.data.updateTask.projectId).to.eql('project1');
        expect(response.data.updateTask.name).to.eql('task1');
        expect(response.data.updateTask.cfApi).to.eql('http://cf.com');
        expect(response.data.updateTask.cfUser).to.eql('user1');
        expect(response.data.updateTask.cfPass).to.eql('pass1');
        expect(response.data.updateTask.cfOrg).to.eql('org1');
        expect(response.data.updateTask.cfSpace).to.eql('space1');
        expect(response.data.updateTask.cfApps).to.eql('app1,app2,app3');
        expect(JSON.parse(response.data.updateTask.scripts)).to.eql([{start: 0}, {start: 30}]);
    });

});
