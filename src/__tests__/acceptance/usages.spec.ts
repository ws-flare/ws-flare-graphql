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

describe('Usages', () => {

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

    it('should get a list of cf usages in a job', async () => {
        nock(`${apis.monitorApi}`)
            .filteringPath(() => '/usages')
            .get('/usages')
            .reply(200, [
                {
                    id: 'usage1',
                    jobId: 'job1-id',
                    appId: 'app1-id',
                    mem: 10.56,
                    cpu: 0.23,
                    disk: 70.55,
                    mem_quota: 2056,
                    disk_quota: 50077,
                    instance: 0,
                    time: '2014-06-19 22:37:58 +0000',
                    state: 'RUNNING',
                    uptime: 9002,
                    name: 'app1'
                },
                {
                    id: 'usage2',
                    jobId: 'job1-id',
                    appId: 'app1-id',
                    mem: 1024,
                    cpu: 2056,
                    disk: 6008,
                    mem_quota: 2056,
                    disk_quota: 50077,
                    instance: 0,
                    time: '2014-06-19 22:37:58 +0000',
                    state: 'RUNNING',
                    uptime: 9002,
                    name: 'app1'
                },
                {
                    id: 'usage3',
                    jobId: 'job1-id',
                    appId: 'app1-id',
                    mem: 1024,
                    cpu: 2056,
                    disk: 6008,
                    mem_quota: 2056,
                    disk_quota: 50077,
                    instance: 0,
                    time: '2014-06-19 22:37:58 +0000',
                    state: 'RUNNING',
                    uptime: 9002,
                    name: 'app1'
                }
            ]);

        const query = gql`
                query usages($jobId: String!) {
                  usages(jobId: $jobId) {
                    id
                    jobId
                    appId
                    mem
                    cpu
                    disk
                    mem_quota
                    disk_quota
                    instance
                    time
                    state
                    uptime
                    name
                  }
                }
            `;

        const response = await client.query({
            query,
            variables: {jobId: 'job1'}
        });

        expect(response.data.usages.length).to.equal(3);

        expect(response.data.usages[0].id).to.equal('usage1');
        expect(response.data.usages[0].jobId).to.equal('job1-id');
        expect(response.data.usages[0].appId).to.equal('app1-id');
        expect(response.data.usages[0].mem).to.equal(10.56);
        expect(response.data.usages[0].cpu).to.equal(0.23);
        expect(response.data.usages[0].disk).to.equal(70.55);
        expect(response.data.usages[0].mem_quota).to.equal(2056);
        expect(response.data.usages[0].disk_quota).to.equal(50077);
        expect(response.data.usages[0].instance).to.equal(0);
        expect(response.data.usages[0].time).to.equal('2014-06-19 22:37:58 +0000');
        expect(response.data.usages[0].state).to.equal('RUNNING');
        expect(response.data.usages[0].uptime).to.equal(9002);
        expect(response.data.usages[0].name).to.equal('app1');

        expect(response.data.usages[1].id).to.equal('usage2');
        expect(response.data.usages[1].jobId).to.equal('job1-id');
        expect(response.data.usages[1].appId).to.equal('app1-id');
        expect(response.data.usages[1].mem).to.equal(1024);
        expect(response.data.usages[1].cpu).to.equal(2056);
        expect(response.data.usages[1].disk).to.equal(6008);
        expect(response.data.usages[1].mem_quota).to.equal(2056);
        expect(response.data.usages[1].disk_quota).to.equal(50077);
        expect(response.data.usages[1].instance).to.equal(0);
        expect(response.data.usages[1].time).to.equal('2014-06-19 22:37:58 +0000');
        expect(response.data.usages[1].state).to.equal('RUNNING');
        expect(response.data.usages[1].uptime).to.equal(9002);
        expect(response.data.usages[1].name).to.equal('app1');

        expect(response.data.usages[2].id).to.equal('usage3');
        expect(response.data.usages[2].jobId).to.equal('job1-id');
        expect(response.data.usages[2].appId).to.equal('app1-id');
        expect(response.data.usages[2].mem).to.equal(1024);
        expect(response.data.usages[2].cpu).to.equal(2056);
        expect(response.data.usages[2].disk).to.equal(6008);
        expect(response.data.usages[2].mem_quota).to.equal(2056);
        expect(response.data.usages[2].disk_quota).to.equal(50077);
        expect(response.data.usages[2].instance).to.equal(0);
        expect(response.data.usages[2].time).to.equal('2014-06-19 22:37:58 +0000');
        expect(response.data.usages[2].state).to.equal('RUNNING');
        expect(response.data.usages[2].uptime).to.equal(9002);
        expect(response.data.usages[2].name).to.equal('app1');
    });

    it('should get usages within time frame', async () => {
        nock(`${apis.monitorApi}`)
            .filteringPath(() => '/usages')
            .get('/usages')
            .once()
            .reply(200, [{createdAt: '2019-04-07T11:52:22.000Z'}]);

        nock(`${apis.monitorApi}`)
            .filteringPath(() => '/usages')
            .get('/usages')
            .once()
            .reply(200, [{createdAt: '2019-04-07T11:51:22.000Z'}]);

        nock(`${apis.monitorApi}`)
            .filteringPath(() => '/usages')
            .get('/usages')
            .times(6)
            .reply(200, [{
                id: 'usage1',
                jobId: 'job1-id',
                appId: 'app1-id',
                mem: 1024,
                cpu: 2056,
                disk: 6008,
                mem_quota: 2056,
                disk_quota: 50077,
                instance: 0,
                time: '2014-06-19 22:37:58 +0000',
                state: 'RUNNING',
                uptime: 9002,
                name: 'app1'
            }]);

        const query = gql`
                query usageTicks($jobId: String! $tickSeconds: Int!) {
                  usageTicks(jobId: $jobId tickSeconds: $tickSeconds) {
                    gt
                    lt
                    tick
                    usage {
                        id
                        jobId
                        appId
                        mem
                        cpu
                        disk
                        mem_quota
                        disk_quota
                        instance
                        time
                        state
                        uptime
                        name
                    }
                  }
                }
            `;

        const response = await client.query({
            query,
            variables: {jobId: 'job1', tickSeconds: 10}
        });

        expect(response.data.usageTicks).to.eql([
            {
                __typename: "UsageTick",
                gt: '2019-04-07T11:51:22.000Z',
                lt: '2019-04-07T11:51:32.000Z',
                tick: 0,
                usage: {
                    __typename: 'Usage',
                    id: 'usage1',
                    jobId: 'job1-id',
                    appId: 'app1-id',
                    mem: 1024,
                    cpu: 2056,
                    disk: 6008,
                    mem_quota: 2056,
                    disk_quota: 50077,
                    instance: 0,
                    time: '2014-06-19 22:37:58 +0000',
                    state: 'RUNNING',
                    uptime: 9002,
                    name: 'app1'
                }
            },
            {
                __typename: "UsageTick",
                gt: '2019-04-07T11:51:22.000Z',
                lt: '2019-04-07T11:51:42.000Z',
                tick: 10,
                usage: {
                    __typename: 'Usage',
                    id: 'usage1',
                    jobId: 'job1-id',
                    appId: 'app1-id',
                    mem: 1024,
                    cpu: 2056,
                    disk: 6008,
                    mem_quota: 2056,
                    disk_quota: 50077,
                    instance: 0,
                    time: '2014-06-19 22:37:58 +0000',
                    state: 'RUNNING',
                    uptime: 9002,
                    name: 'app1'
                }
            },
            {
                __typename: "UsageTick",
                gt: '2019-04-07T11:51:22.000Z',
                lt: '2019-04-07T11:51:52.000Z',
                tick: 20,
                usage: {
                    __typename: 'Usage',
                    id: 'usage1',
                    jobId: 'job1-id',
                    appId: 'app1-id',
                    mem: 1024,
                    cpu: 2056,
                    disk: 6008,
                    mem_quota: 2056,
                    disk_quota: 50077,
                    instance: 0,
                    time: '2014-06-19 22:37:58 +0000',
                    state: 'RUNNING',
                    uptime: 9002,
                    name: 'app1'
                }
            },
            {
                __typename: "UsageTick",
                gt: '2019-04-07T11:51:22.000Z',
                lt: '2019-04-07T11:52:02.000Z',
                tick: 30,
                usage: {
                    __typename: 'Usage',
                    id: 'usage1',
                    jobId: 'job1-id',
                    appId: 'app1-id',
                    mem: 1024,
                    cpu: 2056,
                    disk: 6008,
                    mem_quota: 2056,
                    disk_quota: 50077,
                    instance: 0,
                    time: '2014-06-19 22:37:58 +0000',
                    state: 'RUNNING',
                    uptime: 9002,
                    name: 'app1'
                }
            },
            {
                __typename: "UsageTick",
                gt: '2019-04-07T11:51:22.000Z',
                lt: '2019-04-07T11:52:12.000Z',
                tick: 40,
                usage: {
                    __typename: 'Usage',
                    id: 'usage1',
                    jobId: 'job1-id',
                    appId: 'app1-id',
                    mem: 1024,
                    cpu: 2056,
                    disk: 6008,
                    mem_quota: 2056,
                    disk_quota: 50077,
                    instance: 0,
                    time: '2014-06-19 22:37:58 +0000',
                    state: 'RUNNING',
                    uptime: 9002,
                    name: 'app1'
                }
            },
            {
                __typename: "UsageTick",
                gt: '2019-04-07T11:51:22.000Z',
                lt: '2019-04-07T11:52:22.000Z',
                tick: 50,
                usage: {
                    __typename: 'Usage',
                    id: 'usage1',
                    jobId: 'job1-id',
                    appId: 'app1-id',
                    mem: 1024,
                    cpu: 2056,
                    disk: 6008,
                    mem_quota: 2056,
                    disk_quota: 50077,
                    instance: 0,
                    time: '2014-06-19 22:37:58 +0000',
                    state: 'RUNNING',
                    uptime: 9002,
                    name: 'app1'
                }
            }
        ]);
    });

});
