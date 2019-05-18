/**
 * Model defining the attributes of a socket
 */
export interface ConnectedSocketTick {
    jobId: string;
    gt: string;
    lt: string;
    tick: number;
    socketCount?: ConnectedSocketCount;
}

export interface ConnectedSocketCount {
    count: number;
}