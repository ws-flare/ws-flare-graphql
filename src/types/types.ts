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
    }
    
    type Task {
        id: String!
        userId: String!
        projectId: String!
        name: String!
        uri: String
        totalSimulatedUsers: Int
        runTime: Int
    }
    
    type Job {
        id: String!
        createdAt: String!
        userId: String!
        taskId: String!
        isRunning: Boolean
        passed: Boolean
    }
    
    type Query {
        users: [User]
        
        projects: [Project]
        
        tasks(projectId: String!): [Task]
    }
    
    type Mutation {
        signup(username: String! email: String! password: String!): User
    
        login(username: String! password: String!): User
        
        # Projects
        createProject(name: String!): Project
        
        # Tasks
        createTask(projectId: String! name: String! uri: String! totalSimulatedUsers: Int! runTime: Int!): Task
        
        # Jobs
        createJob(taskId: String!): Job
    }
`;
