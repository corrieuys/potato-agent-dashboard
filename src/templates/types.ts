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
    serviceType?: "git" | "docker";
    gitUrl: string;
    dockerImage?: string | null;
    dockerRunArgs?: string | null;
    gitRef?: string;
    gitCommit?: string | null;
    gitSshKey?: string | null;
    buildCommand: string;
    runCommand: string;
    runtime?: string | null;
    dockerfilePath?: string | null;
    dockerContext?: string | null;
    dockerContainerPort?: number | null;
    imageRetainCount?: number | null;
    baseImage?: string | null;
    language?: string | null;
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
    heartbeatStackVersion?: number | null;
    heartbeatAgentStatus?: string | null;
    serviceStatuses?: AgentServiceStatus[];
}

export interface AgentServiceStatus {
    serviceId: string;
    name: string;
    status: string;
    healthStatus: string;
    restartCount: number;
    lastError: string | null;
}
