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

describe('Projects', () => {

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

    it('should create a new project', async () => {
        nock(`${apis.projectsApi}`)
            .post('/projects')
            .reply(200, {id: 'abc123', userId: 'user1', name: 'test-name'});

        const mutation = gql`
                mutation createProject($name: String!) {
                  createProject(name: $name) {
                    id
                    userId
                    name
                  }
                }
            `;

        const response = await client.mutate({
            mutation,
            variables: {name: 'test-name'}
        });

        expect(response.data.createProject.id).to.eql('abc123');
        expect(response.data.createProject.name).to.eql('test-name');
        expect(response.data.createProject.userId).to.eql('user1');
    });

});
