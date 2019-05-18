/**
 * Model defining the attributes of a GraphQL Context
 */
export interface Context {
    user: {
        userId: string;
    }
    authenticated: boolean;
    taskId?: string;
}
