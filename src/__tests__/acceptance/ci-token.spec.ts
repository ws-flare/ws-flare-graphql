import "isomorphic-fetch";
import {gql} from 'apollo-server-express';
import {ApolloClient} from 'apollo-client';
import {createHttpLink} from 'apollo-link-http';
import {InMemoryCache} from 'apollo-cache-inmemory';
import * as nock from 'nock';
import {expect} from 'chai';
import {verify} from 'jsonwebtoken';
import {setContext} from 'apollo-link-context';
import {main} from '../..';
import {GraphqlApplication} from '../../application';
import {apis, Container, startMqContainer} from '../test-helpers';

/**
 * Tests for CI token functionality
 */
describe('CI Token', () => {

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

    it('should generate a new token to be used in a ci environment', async () => {
        const query = gql`
                query generateCiToken($taskId: String!) {
                  generateCiToken(taskId: $taskId) {
                    token
                  }
                }
            `;

        const response = await client.query({query, variables: {taskId: 'task1'}});

        const token: any = verify(response.data.generateCiToken.token, 'test');

        expect(token.userId).to.equal('abc123');
        expect(token.taskId).to.equal('task1');
    });

    it('should be able to start a task from a CI environment using a generated token', async () => {
        const authLink = setContext((_, {headers}) => {
            return {
                headers: {
                    ...headers,
                    authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYmMxMjMiLCJ0YXNrSWQiOiJ0YXNrMSIsImlhdCI6MTU1NzEzODE2NiwiZXhwIjoxNTg4Njc0MTY2fQ.fsqEQUSxopPfMno__lta_V69jnKmXoMvLsBdSKZhkVI`,
                }
            }
        });

        client = new ApolloClient({
            link: authLink.concat(createHttpLink({uri: `http://localhost:${graphqlPort}/graphql`})),
            cache: new InMemoryCache()
        });

        nock(`${apis.jobsApi}`)
            .post('/jobs')
            .reply(200, {id: 'job1', userId: 'user1', taskId: 'task1', isRunning: true, passed: false});

        nock(`${apis.projectsApi}`)
            .get('/tasks/task1')
            .reply(200, {
                id: 'abc1',
                userId: 'user1',
                projectId: 'project1',
                name: 'task1',
                scripts: JSON.stringify([{start: 30}])
            });

        const mutation = gql`
                mutation createCiJob {
                  createCiJob {
                    id
                    userId
                    taskId
                    isRunning
                    passed
                  }
                }
            `;

        const response = await client.mutate({mutation});

        expect(response.data.createCiJob.id).to.eql('job1');
        expect(response.data.createCiJob.userId).to.eql('user1');
        expect(response.data.createCiJob.taskId).to.eql('task1');
        expect(response.data.createCiJob.isRunning).to.eql(true);
        expect(response.data.createCiJob.passed).to.eql(false);
    });
});
