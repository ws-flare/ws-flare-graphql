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

describe('Jobs', () => {

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

    it('should create a new job', async () => {
        nock(`${apis.jobsApi}`)
            .post('/jobs')
            .reply(200, {id: 'job1', userId: 'user1', taskId: 'task1', isRunning: true, passed: false});

        const mutation = gql`
                mutation createJob($taskId: String!) {
                  createJob(taskId: $taskId) {
                    id
                    userId
                    taskId
                    isRunning
                    passed
                  }
                }
            `;

        const response = await client.mutate({
            mutation,
            variables: {taskId: 'task1'}
        });

        expect(response.data.createJob.id).to.eql('job1');
        expect(response.data.createJob.userId).to.eql('user1');
        expect(response.data.createJob.taskId).to.eql('task1');
        expect(response.data.createJob.isRunning).to.eql(true);
        expect(response.data.createJob.passed).to.eql(false);
    });

});
