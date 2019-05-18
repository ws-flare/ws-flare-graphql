/**
 * Model defining the attributes of a UsageTick
 */
export interface UsageTick {
    jobId: string;
    gt: string;
    lt: string;
    tick: number;
    cfApps?: CfApp[];
}

/**
 * Model defining the attributes of an application on Cloud Foundry
 */
export interface CfApp {
    id: string;
    jobId: string;
    name: string;
    gt: string;
    lt: string;
    instances: Instance[]
}

/**
 * Model defining the attributes of an instance of an application on Cloud Foundry
 */
export interface Instance {
    jobId: string;
    appId: string;
    instance: number;
    gt: string;
    lt: string;
    usage: Usage
}


/**
 * Model defining the usage attributes of an application on Cloud Foundry
 */
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
