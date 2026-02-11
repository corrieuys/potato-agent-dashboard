import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { createClient } from "../db/client";
import { stacks, services, agents, heartbeats } from "../db/schema";
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
		.select({
			id: agents.id,
			stackId: agents.stackId,
			name: agents.name,
			status: agents.status,
			lastHeartbeatAt: agents.lastHeartbeatAt,
		})
		.from(agents)
		.where(eq(agents.stackId, id));

	// Get latest heartbeats to determine service statuses
	const serviceStatuses: Record<string, { status: string; agentName: string; healthStatus?: string }> = {};

	for (const agent of stackAgents) {
		const [latestHeartbeat] = await db
			.select({
				servicesStatus: heartbeats.servicesStatus,
			})
			.from(heartbeats)
			.where(eq(heartbeats.agentId, agent.id))
			.orderBy(desc(heartbeats.createdAt))
			.limit(1);

		if (latestHeartbeat?.servicesStatus) {
			try {
				const statuses = JSON.parse(latestHeartbeat.servicesStatus as string);
				if (Array.isArray(statuses)) {
					for (const svcStatus of statuses) {
						const service = stackServices.find(s => s.id === svcStatus.service_id)
							|| stackServices.find(s => s.name === svcStatus.name);
						if (service) {
							// Only update if we don't have a status yet, or if this is more recent
							if (!serviceStatuses[service.id]) {
								serviceStatuses[service.id] = {
									status: svcStatus.status,
									agentName: agent.name || 'Unnamed',
									healthStatus: svcStatus.health_status,
								};
							}
						}
					}
				}
			} catch (e) {
				console.error('Failed to parse servicesStatus:', e);
			}
		}
	}

	// Merge status into services
	const servicesWithStatus = stackServices.map(s => ({
		...s,
		runtimeStatus: serviceStatuses[s.id]?.status || 'unknown',
		healthStatus: serviceStatuses[s.id]?.healthStatus || 'unknown',
		agentName: serviceStatuses[s.id]?.agentName,
	}));

	return c.html(templates.stackDetail(
		stack as templates.Stack,
		servicesWithStatus as templates.Service[],
		stackAgents as templates.Agent[]
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
		.select({
			id: agents.id,
			stackId: agents.stackId,
			name: agents.name,
			status: agents.status,
			lastHeartbeatAt: agents.lastHeartbeatAt,
		})
		.from(agents)
		.where(eq(agents.stackId, stackId));

	return c.html(templates.agentsList(stackAgents as templates.Agent[]));
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
