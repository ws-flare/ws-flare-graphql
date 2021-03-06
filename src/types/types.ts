import {gql} from 'apollo-server-express';

/**
 * Type definitions used by GraphQL
 */
export const typeDefs = gql`
    type User {
        userId: String!
        token: String
        username: String
    }
    
    type Project {
        id: String!
        userId: String!
        name: String!
        user: User!
        tasks: [Task]
    }
    
    type Task {
        id: String!
        userId: String!
        projectId: String!
        name: String!
        cfApi: String!
        cfUser: String!
        cfPass: String!
        cfOrg: String!
        cfSpace: String!
        cfApps: String!
        successThreshold: Int!
        scripts: String!
        jobs: [Job]
    }
    
    type Job {
        id: String!
        createdAt: String!
        userId: String!
        taskId: String!
        isRunning: Boolean
        passed: Boolean
        usages: [Usage]
        nodes: [Node]
        connectedSocketTimeFrame: [ConnectedSocketTick]
        appUsageTicks: [UsageTick]
        sockets: [Socket]
        totalSimulators: Int!
    }
    
    type Node {
        id: String!
        createdAt: String!
        jobId: String!
        name: String!
        running: Boolean!
        totalSuccessfulConnections: Int
        totalFailedConnections: Int
        totalDroppedConnections: Int
    }
    
    type UsageTick {
        jobId: String!
        gt: String!
        lt: String!
        tick: Int!
        cfApps: [CfApp]
    }
    
    type CfApp {
        jobId: String!
        appId: String!
        name: String!
        gt: String!
        lt: String!
        instances: [Instance]
    }
    
    type Instance {
        jobId: String!
        appId: String!
        instance: Int!
        gt: String!
        lt: String!
        usage: Usage
    }
    
    type Usage {
        id: String!
        jobId: String!
        appId: String!
        mem: Float!
        cpu: Float!
        disk: Float!
        mem_quota: Float!
        disk_quota: Float!
        instance: Int!
        time: String!
        state: String!
        uptime: Int!
        name: String!
    }
    
    type Socket {
        id: String!
        jobId: String!
        connected: Boolean
        disconnected: Boolean
        hasError: Boolean
        connectionTime: String
        disconnectTime: String
        errorTime: String
        timeToConnection: Int
    }
    
    type ConnectedSocketTick {
        jobId: String!
        gt: String!
        lt: String!
        tick: Int!
        connectedSocketCount: ConnectedSocketCount
    }
    
    type ConnectedSocketCount {
        count: Int!
    }
    
    type CiToken {
        token: String!
    }
    
    type Query {
        users: [User]
        
        projects: [Project]
        
        tasks(projectId: String!): [Task]
        
        task(taskId: String!): Task
        
        jobs(taskId: String!): [Job]
        
        job(jobId: String!): Job
        
        nodes(jobId: String!): [Node]
        
        usages(jobId: String!): [Usage]
        
        sockets(jobId: String!): [Socket]
        
        # Connected Sockets
        connectedSocketTimeFrame(jobId: String! tickSeconds: Int!): [ConnectedSocketTick]
        
        # App Usage Ticks
        appUsageTicks(jobId: String! tickSeconds: Int!): [UsageTick]
        
        # CI Token
        generateCiToken(taskId: String!): CiToken
    }
    
    type Mutation {
        signup(username: String! email: String! password: String!): User
    
        login(username: String! password: String!): User
        
        # Projects
        createProject(name: String!): Project
        
        # Tasks
        createTask(projectId: String! name: String! cfApi: String! cfUser: String! cfPass: String! cfOrg: String! cfSpace: String! cfApps: String! successThreshold: Int! scripts: String!): Task
        
        updateTask(id: String! projectId: String! name: String! cfApi: String! cfUser: String! cfPass: String! cfOrg: String! cfSpace: String! cfApps: String! scripts: String!): Task
        
        # Jobs
        createJob(taskId: String!): Job
        
        createCiJob: Job
        
        # Nodes
        createNode(jobId: String! name: String! running: Boolean!): Node
    }
`;
