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

});
