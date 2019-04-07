import {gql} from 'apollo-server-express';

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
        connectedSocketTimeFrame: ConnectedSocketTick
        sockets: [Socket]
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
    
    type Usage {
        id: String!
        jobId: String!
        appId: String!
        mem: Float!
        cpu: Float!
        disk: Float!
        mem_quota: Int!
        disk_quota: Int!
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
        jobId: String
        gt: String!
        lt: String!
        tick: Int!
        connectedSocketCount: ConnectedSocketCount
    }
    
    type ConnectedSocketCount {
        count: Int!
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
    }
    
    type Mutation {
        signup(username: String! email: String! password: String!): User
    
        login(username: String! password: String!): User
        
        # Projects
        createProject(name: String!): Project
        
        # Tasks
        createTask(projectId: String! name: String! cfApi: String! cfUser: String! cfPass: String! cfOrg: String! cfSpace: String! cfApps: String! scripts: String!): Task
        
        updateTask(id: String! projectId: String! name: String! cfApi: String! cfUser: String! cfPass: String! cfOrg: String! cfSpace: String! cfApps: String! scripts: String!): Task
        
        # Jobs
        createJob(taskId: String!): Job
        
        # Nodes
        createNode(jobId: String! name: String! running: Boolean!): Node
    }
`;
