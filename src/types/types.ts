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
    
    type Query {
        users: [User]
        
        projects: [Project]
        
        tasks: [Task]
    }
    
    type Mutation {
        signup(username: String! email: String! password: String!): User
    
        login(username: String! password: String!): User
        
        # Projects
        createProject(name: String!): Project
        
        # Tasks
        createTask(projectId: String! name: String! uri: String! totalSimulatedUsers: Int! runTime: Int!): Task
    }
`;
