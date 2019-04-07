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

describe('Sockets', () => {

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

    it('should get a list of sockets by job id', async () => {
        nock(`${apis.jobsApi}`)
            .filteringPath(() => '/sockets')
            .get('/sockets')
            .reply(200, [
                {
                    id: 'abc1',
                    jobId: 'job1',
                    connected: true,
                    disconnected: false,
                    hasError: false,
                    connectionTime: 'connectionTime Today1',
                    disconnectTime: 'disconnectTime Today1',
                    errorTime: 'errorTime Today1',
                    timeToConnection: 1000
                },
                {
                    id: 'abc2',
                    jobId: 'job1',
                    connected: false,
                    disconnected: true,
                    hasError: true,
                    connectionTime: 'connectionTime Today2',
                    disconnectTime: 'disconnectTime Today2',
                    errorTime: 'errorTime Today2',
                    timeToConnection: 5000
                }
            ]);

        const query = gql`
                query sockets($jobId: String!) {
                  sockets(jobId: $jobId) {
                    id
                    jobId
                    connected
                    disconnected
                    hasError
                    connectionTime
                    disconnectTime
                    errorTime
                    timeToConnection
                  }
                }
            `;

        const response = await client.query({
            query,
            variables: {jobId: 'job1'}
        });

        expect(response.data.sockets.length).to.equal(2);

        expect(response.data.sockets[0].id).to.equal('abc1');
        expect(response.data.sockets[0].jobId).to.equal('job1');
        expect(response.data.sockets[0].connected).to.equal(true);
        expect(response.data.sockets[0].disconnected).to.equal(false);
        expect(response.data.sockets[0].hasError).to.equal(false);
        expect(response.data.sockets[0].connectionTime).to.equal('connectionTime Today1');
        expect(response.data.sockets[0].disconnectTime).to.equal('disconnectTime Today1');
        expect(response.data.sockets[0].errorTime).to.equal('errorTime Today1');
        expect(response.data.sockets[0].timeToConnection).to.equal(1000);

        expect(response.data.sockets[1].id).to.equal('abc2');
        expect(response.data.sockets[1].jobId).to.equal('job1');
        expect(response.data.sockets[1].connected).to.equal(false);
        expect(response.data.sockets[1].disconnected).to.equal(true);
        expect(response.data.sockets[1].hasError).to.equal(true);
        expect(response.data.sockets[1].connectionTime).to.equal('connectionTime Today2');
        expect(response.data.sockets[1].disconnectTime).to.equal('disconnectTime Today2');
        expect(response.data.sockets[1].errorTime).to.equal('errorTime Today2');
        expect(response.data.sockets[1].timeToConnection).to.equal(5000);
    });

    it('should get socket ticks between time frames', async () => {
        nock(`${apis.jobsApi}`)
            .filteringPath(() => '/sockets')
            .get('/sockets')
            .once()
            .reply(200, [{connectionTime: '2019-04-07T11:52:22.000Z'}]);

        nock(`${apis.jobsApi}`)
            .filteringPath(() => '/sockets')
            .get('/sockets')
            .once()
            .reply(200, [{connectionTime: '2019-04-07T11:51:22.000Z'}]);

        nock(`${apis.jobsApi}`)
            .filteringPath(() => '/sockets/count')
            .get('/sockets/count')
            .times(6)
            .reply(200, {count: 10});

        const query = gql`
                query connectedSocketTimeFrame($jobId: String! $tickSeconds: Int!) {
                  connectedSocketTimeFrame(jobId: $jobId tickSeconds: $tickSeconds) {
                    gt
                    lt
                    tick
                    connectedSocketCount {
                        count
                    }
                  }
                }
            `;

        const response = await client.query({
            query,
            variables: {jobId: 'job1', tickSeconds: 10}
        });

        expect(response.data.connectedSocketTimeFrame).to.eql([
            {
                __typename: "ConnectedSocketTick",
                gt: '2019-04-07T11:51:22.000Z',
                lt: '2019-04-07T11:51:32.000Z',
                tick: 0,
                connectedSocketCount: {
                    __typename: 'ConnectedSocketCount',
                    count: 10
                }
            },
            {
                __typename: "ConnectedSocketTick",
                gt: '2019-04-07T11:51:32.000Z',
                lt: '2019-04-07T11:51:42.000Z',
                tick: 10,
                connectedSocketCount: {
                    __typename: 'ConnectedSocketCount',
                    count: 10
                }
            },
            {
                __typename: "ConnectedSocketTick",
                gt: '2019-04-07T11:51:42.000Z',
                lt: '2019-04-07T11:51:52.000Z',
                tick: 20,
                connectedSocketCount: {
                    __typename: 'ConnectedSocketCount',
                    count: 10
                }
            },
            {
                __typename: "ConnectedSocketTick",
                gt: '2019-04-07T11:51:52.000Z',
                lt: '2019-04-07T11:52:02.000Z',
                tick: 30,
                connectedSocketCount: {
                    __typename: 'ConnectedSocketCount',
                    count: 10
                }
            },
            {
                __typename: "ConnectedSocketTick",
                gt: '2019-04-07T11:52:02.000Z',
                lt: '2019-04-07T11:52:12.000Z',
                tick: 40,
                connectedSocketCount: {
                    __typename: 'ConnectedSocketCount',
                    count: 10
                }
            },
            {
                __typename: "ConnectedSocketTick",
                gt: '2019-04-07T11:52:12.000Z',
                lt: '2019-04-07T11:52:22.000Z',
                tick: 50,
                connectedSocketCount: {
                    __typename: 'ConnectedSocketCount',
                    count: 10
                }
            }
        ]);

    });

});
