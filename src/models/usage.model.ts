export interface UsageTick {
    jobId: string;
    gt: string;
    lt: string;
    tick: number;
    cfApps?: CfApp[];
}

export interface CfApp {
    id: string;
    name: string;
    gt: string;
    lt: string;
    instances: Instance[]
}

export interface Instance {
    appId: string;
    instance: number;
    gt: string;
    lt: string;
    usage: Usage
}

export interface Usage {
    id: string;
    jobId: string;
    appId: string;
    mem: number;
    cpu: number;
    disk: number;
    mem_quota: number;
    disk_quota: number;
    instance: number;
    time: string;
    state: string;
    uptime: number;
    name: string;
}
