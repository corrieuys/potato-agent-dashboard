// HTML Template types

export interface Stack {
    id: string;
    name: string;
    description: string | null;
    version: number;
    pollInterval: number;
    securityMode: string;
    externalProxyPort: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Service {
    id: string;
    stackId: string;
    name: string;
    description: string | null;
    gitUrl: string;
    gitRef?: string;
    gitCommit?: string | null;
    gitSshKey?: string | null;
    buildCommand?: string | null;
    runCommand?: string;
    runtime: string;
    dockerfilePath?: string | null;
    dockerContext?: string | null;
    dockerContainerPort?: number | null;
    imageRetainCount?: number | null;
    port: number;
    externalPath: string | null;
    healthCheckPath?: string;
    healthCheckInterval?: number;
    environmentVars?: any;
    // Runtime status from agent heartbeats
    runtimeStatus?: string;
    healthStatus?: string;
    agentName?: string;
}

export interface Agent {
    id: string;
    stackId: string;
    name: string | null;
    status: string;
    lastHeartbeatAt: Date | null;
}
