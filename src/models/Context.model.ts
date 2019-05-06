export interface Context {
    user: {
        userId: string;
    }
    authenticated: boolean;
    taskId?: string;
}
