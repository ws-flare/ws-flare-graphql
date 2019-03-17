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

describe('Nodes', () => {

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

    it('should create a new node', async () => {
        nock(`${apis.jobsApi}`)
            .post('/nodes')
            .reply(200, {id: 'node1', createdAt: 'today', jobId: 'job1', name: 'test-name'});

        const mutation = gql`
                mutation createNode($jobId: String! $name: String!) {
                  createNode(jobId: $jobId name: $name) {
                    id
                    createdAt
                    jobId
                    name
                  }
                }
            `;

        const response = await client.mutate({
            mutation,
            variables: {jobId: 'job1', name: 'test-name'}
        });

        expect(response.data.createNode.id).to.eql('node1');
        expect(response.data.createNode.createdAt).to.eql('today');
        expect(response.data.createNode.jobId).to.eql('job1');
        expect(response.data.createNode.name).to.eql('test-name');
    });

    it('should get a list of nodes in a job', async () => {
        nock(`${apis.jobsApi}`)
            .filteringPath(() => '/nodes')
            .get('/nodes')
            .reply(200, [
                {id: 'node1', createdAt: 'today1', jobId: 'job1', name: 'test-name1'},
                {id: 'node2', createdAt: 'today2', jobId: 'job2', name: 'test-name2'},
                {id: 'node3', createdAt: 'today3', jobId: 'job3', name: 'test-name3'}
            ]);

        const query = gql`
                query nodes($jobId: String!) {
                  nodes(jobId: $jobId) {
                    id
                    createdAt
                    jobId
                    name
                  }
                }
            `;

        const response = await client.query({
            query,
            variables: {jobId: 'job1'}
        });

        expect(response.data.nodes.length).to.equal(3);

        expect(response.data.nodes[0].id).to.equal('node1');
        expect(response.data.nodes[0].createdAt).to.equal('today1');
        expect(response.data.nodes[0].jobId).to.equal('job1');
        expect(response.data.nodes[0].name).to.equal('test-name1');

        expect(response.data.nodes[1].id).to.equal('node2');
        expect(response.data.nodes[1].createdAt).to.equal('today2');
        expect(response.data.nodes[1].jobId).to.equal('job2');
        expect(response.data.nodes[1].name).to.equal('test-name2');

        expect(response.data.nodes[2].id).to.equal('node3');
        expect(response.data.nodes[2].createdAt).to.equal('today3');
        expect(response.data.nodes[2].jobId).to.equal('job3');
        expect(response.data.nodes[2].name).to.equal('test-name3');
    });

});
