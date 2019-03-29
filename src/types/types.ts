import { gql } from 'apollo-server-express';

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
        uri: String!
        totalSimulatedUsers: Int!
        runTime: Int!
        cfApi: String!
        cfUser: String!
        cfPass: String!
        cfOrg: String!
        cfSpace: String!
        cfApps: String!
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
        mem: Int!
        cpu: Int!
        disk: Int!
        mem_quota: Int!
        disk_quota: Int!
        instance: Int!
        time: String!
        state: String!
        uptime: Int!
        name: String!
    }
    
    type Query {
        users: [User]
        
        projects: [Project]
        
        tasks(projectId: String!): [Task]
        
        jobs(taskId: String!): [Job]
        
        job(jobId: String!): Job
        
        nodes(jobId: String!): [Node]
        
        usages(jobId: String!): [Usage]
    }
    
    type Mutation {
        signup(username: String! email: String! password: String!): User
    
        login(username: String! password: String!): User
        
        # Projects
        createProject(name: String!): Project
        
        # Tasks
        createTask(projectId: String! name: String! uri: String! totalSimulatedUsers: Int! runTime: Int! cfApi: String! cfUser: String! cfPass: String! cfOrg: String! cfSpace: String! cfApps: String!): Task
        
        # Jobs
        createJob(taskId: String!): Job
        
        # Nodes
        createNode(jobId: String! name: String! running: Boolean!): Node
    }
`;
