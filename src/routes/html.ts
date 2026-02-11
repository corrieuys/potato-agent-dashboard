import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { createClient } from "../db/client";
import { stacks, services, agents, heartbeats } from "../db/schema";
import type { Agent as AgentRow } from "../db/schema";
import * as templates from "../templates";

const htmlRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// Stacks dashboard - list all stacks
htmlRoutes.get("/", async (c) => {
	const db = createClient(c.env.DB);
	const allStacks = await db.select().from(stacks).orderBy(desc(stacks.createdAt));

	return c.html(templates.dashboard(allStacks as templates.Stack[]));
});

// Stack detail page
htmlRoutes.get("/stacks/:id", async (c) => {
	const id = c.req.param("id");
	const db = createClient(c.env.DB);

	const [stack] = await db.select().from(stacks).where(eq(stacks.id, id));
	if (!stack) {
		return c.html(templates.errorPage("Stack not found", 404), 404);
	}

	const stackServices = await db
		.select({
			id: services.id,
			stackId: services.stackId,
			name: services.name,
			gitUrl: services.gitUrl,
			port: services.port,
			externalPath: services.externalPath,
		})
		.from(services)
		.where(eq(services.stackId, id));

	const stackAgents = await db
		.select()
		.from(agents)
		.where(eq(agents.stackId, id));

	const stackAgentsWithHeartbeat = await withLatestHeartbeat(db, stackAgents);

	// Get latest heartbeats to determine service statuses
	const serviceStatuses: Record<string, { status: string; agentName: string; healthStatus?: string; createdAt: number }> = {};

	for (const agent of stackAgentsWithHeartbeat) {
		const statuses = agent.serviceStatuses || [];
		for (const svcStatus of statuses) {
			const service = stackServices.find((s) => s.id === svcStatus.serviceId)
				|| stackServices.find((s) => s.name === svcStatus.name);
			if (!service) {
				continue;
			}
			const current = serviceStatuses[service.id];
			if (!current || agent.latestHeartbeatCreatedAt > current.createdAt) {
				serviceStatuses[service.id] = {
					status: svcStatus.status,
					agentName: agent.name || "Unnamed",
					healthStatus: svcStatus.healthStatus,
					createdAt: agent.latestHeartbeatCreatedAt,
				};
			}
		}
	}

	// Merge status into services
	const servicesWithStatus = stackServices.map(s => ({
		...s,
		runtimeStatus: serviceStatuses[s.id]?.status || "unknown",
		healthStatus: serviceStatuses[s.id]?.healthStatus || "unknown",
		agentName: serviceStatuses[s.id]?.agentName,
	}));

	return c.html(templates.stackDetail(
		stack as templates.Stack,
		servicesWithStatus as templates.Service[],
		stackAgentsWithHeartbeat as templates.Agent[]
	));
});

// HTML Partials for HTMX

// Stack list partial
htmlRoutes.get("/partials/stacks", async (c) => {
	const db = createClient(c.env.DB);
	const allStacks = await db.select().from(stacks).orderBy(desc(stacks.createdAt));
	return c.html(templates.stackList(allStacks as templates.Stack[]));
});

// Create stack form partial
htmlRoutes.get("/partials/stack-form", (c) => {
	return c.html(templates.createStackForm());
});

// Create service page
htmlRoutes.get("/stacks/:id/services/new", async (c) => {
	const stackId = c.req.param("id");
	const db = createClient(c.env.DB);

	const [stack] = await db.select().from(stacks).where(eq(stacks.id, stackId));
	if (!stack) {
		return c.html(templates.errorPage("Stack not found", 404), 404);
	}

	return c.html(templates.createServicePage(stack as templates.Stack));
});

// Create agent form partial
htmlRoutes.get("/partials/agent-form", (c) => {
	const stackId = c.req.query("stackId");
	if (!stackId) {
		return c.html(templates.errorPage("Stack ID required", 400), 400);
	}
	return c.html(templates.agentNameForm(stackId));
});

// Agents list partial
htmlRoutes.get("/partials/agents", async (c) => {
	const stackId = c.req.query("stackId");
	if (!stackId) {
		return c.html(templates.errorPage("Stack ID required", 400), 400);
	}

	const db = createClient(c.env.DB);
	const stackAgents = await db
		.select()
		.from(agents)
		.where(eq(agents.stackId, stackId));

	const stackAgentsWithHeartbeat = await withLatestHeartbeat(db, stackAgents);
	return c.html(templates.agentsList(stackAgentsWithHeartbeat as templates.Agent[]));
});

// Edit service page
htmlRoutes.get("/stacks/:id/services/:serviceId/edit", async (c) => {
	const stackId = c.req.param("id");
	const serviceId = c.req.param("serviceId");
	const db = createClient(c.env.DB);

	const [stack] = await db.select().from(stacks).where(eq(stacks.id, stackId));
	if (!stack) {
		return c.html(templates.errorPage("Stack not found", 404), 404);
	}

	const [service] = await db
		.select({
			id: services.id,
			stackId: services.stackId,
			name: services.name,
			gitUrl: services.gitUrl,
			gitRef: services.gitRef,
			gitCommit: services.gitCommit,
			gitSshKey: services.gitSshKey,
			buildCommand: services.buildCommand,
			runCommand: services.runCommand,
			runtime: services.runtime,
			dockerfilePath: services.dockerfilePath,
			dockerContext: services.dockerContext,
			dockerContainerPort: services.dockerContainerPort,
			imageRetainCount: services.imageRetainCount,
			baseImage: services.baseImage,
			language: services.language,
			port: services.port,
			externalPath: services.externalPath,
			healthCheckPath: services.healthCheckPath,
			healthCheckInterval: services.healthCheckInterval,
			environmentVars: services.environmentVars,
		})
		.from(services)
		.where(eq(services.id, serviceId));

	if (!service) {
		return c.html(templates.errorPage("Service not found", 404), 404);
	}

	return c.html(templates.editServicePage(stack as templates.Stack, service as templates.Service));
});

// Documentation page
htmlRoutes.get("/docs", async (c) => {
	return c.html(templates.docsPage());
});

// Documentation page (trailing slash and index)
htmlRoutes.get("/docs/", async (c) => {
	return c.html(templates.docsPage());
});

htmlRoutes.get("/docs/index.html", async (c) => {
	return c.html(templates.docsPage());
});

// Edit agent form partial
htmlRoutes.get("/partials/agent-edit-form", async (c) => {
	const stackId = c.req.query("stackId");
	const agentId = c.req.query("agentId");
	if (!stackId || !agentId) {
		return c.html(templates.errorPage("Stack ID and Agent ID required", 400), 400);
	}

	const db = createClient(c.env.DB);
	const [agent] = await db
		.select({
			id: agents.id,
			stackId: agents.stackId,
			name: agents.name,
			status: agents.status,
			lastHeartbeatAt: agents.lastHeartbeatAt,
		})
		.from(agents)
		.where(eq(agents.id, agentId));

	if (!agent) {
		return c.html(templates.errorPage("Agent not found", 404), 404);
	}

	return c.html(templates.editAgentForm(stackId, agent as templates.Agent));
});

export default htmlRoutes;

type AgentHeartbeatServiceStatus = {
	serviceId: string;
	name: string;
	status: string;
	healthStatus: string;
	restartCount: number;
	lastError: string | null;
};

type AgentWithHeartbeat = {
	id: string;
	stackId: string;
	name: string | null;
	status: string;
	lastHeartbeatAt: Date | null;
	heartbeatStackVersion: number | null;
	heartbeatAgentStatus: string | null;
	serviceStatuses: AgentHeartbeatServiceStatus[];
	latestHeartbeatCreatedAt: number;
};

function parseServicesStatus(raw: unknown): AgentHeartbeatServiceStatus[] {
	if (!raw) {
		return [];
	}

	let input: unknown = raw;
	if (typeof raw === "string") {
		try {
			input = JSON.parse(raw);
		} catch {
			return [];
		}
	}

	if (!Array.isArray(input)) {
		return [];
	}

	return input.map((entry) => {
		const obj = entry as Record<string, unknown>;
		return {
			serviceId: String(obj.service_id || ""),
			name: String(obj.name || ""),
			status: String(obj.status || "unknown"),
			healthStatus: String(obj.health_status || "unknown"),
			restartCount: Number(obj.restart_count || 0),
			lastError: obj.last_error ? String(obj.last_error) : null,
		};
	});
}

async function withLatestHeartbeat(
	db: ReturnType<typeof createClient>,
	stackAgents: AgentRow[]
): Promise<AgentWithHeartbeat[]> {
	const enriched: AgentWithHeartbeat[] = [];
	for (const agent of stackAgents) {
		const [latestHeartbeat] = await db
			.select({
				stackVersion: heartbeats.stackVersion,
				agentStatus: heartbeats.agentStatus,
				servicesStatus: heartbeats.servicesStatus,
				createdAt: heartbeats.createdAt,
			})
			.from(heartbeats)
			.where(eq(heartbeats.agentId, agent.id))
			.orderBy(desc(heartbeats.createdAt))
			.limit(1);

		enriched.push({
			id: agent.id,
			stackId: agent.stackId,
			name: agent.name,
			status: agent.status,
			lastHeartbeatAt: agent.lastHeartbeatAt,
			heartbeatStackVersion: latestHeartbeat?.stackVersion ?? null,
			heartbeatAgentStatus: latestHeartbeat?.agentStatus ?? null,
			serviceStatuses: parseServicesStatus(latestHeartbeat?.servicesStatus),
			latestHeartbeatCreatedAt: latestHeartbeat?.createdAt
				? new Date(latestHeartbeat.createdAt).getTime()
				: 0,
		});
	}
	return enriched;
}
