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

    it('should get list of projects', async () => {
        nock(`${apis.projectsApi}`)
            .get('/projects')
            .reply(200, [
                {id: 'abc1', userId: 'user1', name: 'test-name1'},
                {id: 'abc2', userId: 'user2', name: 'test-name2'},
                {id: 'abc3', userId: 'user3', name: 'test-name3'}
            ]);

        const query = gql`
                query projects {
                  projects {
                    id
                    userId
                    name
                  }
                }
            `;

        const response = await client.query({
            query,
            variables: {name: 'test-name'}
        });

        expect(response.data.projects.length).to.equal(3);

        expect(response.data.projects[0].id).to.equal('abc1');
        expect(response.data.projects[1].id).to.equal('abc2');
        expect(response.data.projects[2].id).to.equal('abc3');
        expect(response.data.projects[0].userId).to.equal('user1');
        expect(response.data.projects[1].userId).to.equal('user2');
        expect(response.data.projects[2].userId).to.equal('user3');
        expect(response.data.projects[0].name).to.equal('test-name1');
        expect(response.data.projects[1].name).to.equal('test-name2');
        expect(response.data.projects[2].name).to.equal('test-name3');
    });

});
