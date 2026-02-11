import { Hono } from "hono";
import { eq, and, desc, sql } from "drizzle-orm";
import { createClient } from "../db/client";
import { stacks, agents } from "../db/schema";
import * as templates from "../templates";
import { generateUUID, generateToken, wantsHTML, parseBody, hashSecret } from "../lib/utils";

const agentsRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// List agents for a stack
agentsRoutes.get("/", async (c) => {
	const stackId = c.req.param("stackId");
	const db = createClient(c.env.DB);

	const stackAgents = await db
		.select({
			id: agents.id,
			name: agents.name,
			status: agents.status,
			lastHeartbeatAt: agents.lastHeartbeatAt,
			createdAt: agents.createdAt,
		})
		.from(agents)
		.where(eq(agents.stackId, stackId));

	return c.json({ agents: stackAgents });
});

// Generate install token for a new agent
agentsRoutes.post("/tokens", async (c) => {
	const stackId = c.req.param("stackId");
	const body = await parseBody(c);
	const db = createClient(c.env.DB);

	const [stack] = await db.select().from(stacks).where(eq(stacks.id, stackId));
	if (!stack) {
		if (wantsHTML(c)) {
			return c.html(`<div class="text-red-600 p-4">Stack not found</div>`, 404);
		}
		return c.json({ error: "Stack not found" }, 404);
	}

	const id = generateUUID();
	const installToken = generateToken(32);
	const installCommand = `curl -fsSL https://potatocloud.space/install.sh | sudo bash -s -- --token ${installToken} --stack-id ${stackId} --control-plane https://your-control-plane.workers.dev`;

	await db.insert(agents).values({
		id,
		stackId,
		name: body.name || null,
		installToken,
		status: "pending",
	});

	if (wantsHTML(c)) {
		return c.html(templates.createAgentForm(stackId, installToken, installCommand));
	}

	return c.json({
		agent_id: id,
		install_token: installToken,
		install_command: installCommand,
	}, 201);
});

// Update an agent
agentsRoutes.patch("/:agentId", async (c) => {
	const stackId = c.req.param("stackId");
	const agentId = c.req.param("agentId");
	const body = await parseBody(c);
	const db = createClient(c.env.DB);

	const [existing] = await db
		.select()
		.from(agents)
		.where(and(eq(agents.id, agentId), eq(agents.stackId, stackId)));

	if (!existing) {
		if (wantsHTML(c)) {
			return c.html(`<div class="text-red-600 p-4">Agent not found</div>`, 404);
		}
		return c.json({ error: "Agent not found" }, 404);
	}

	const updates: Record<string, any> = {
		updatedAt: sql`CURRENT_TIMESTAMP`,
	};

	if (body.name !== undefined) updates.name = body.name;
	if (body.agent_endpoint !== undefined) updates.agentEndpoint = body.agent_endpoint;

	await db.update(agents).set(updates).where(eq(agents.id, agentId));

	// Return updated agents list for HTMX
	if (wantsHTML(c)) {
		const allAgents = await db
			.select({
				id: agents.id,
				stackId: agents.stackId,
				name: agents.name,
				status: agents.status,
				lastHeartbeatAt: agents.lastHeartbeatAt,
			})
			.from(agents)
			.where(eq(agents.stackId, stackId));
		return c.html(templates.agentsList(allAgents as templates.Agent[]));
	}

	const [updated] = await db.select().from(agents).where(eq(agents.id, agentId));
	return c.json({ agent: updated });
});

// Delete an agent
agentsRoutes.delete("/:agentId", async (c) => {
	const stackId = c.req.param("stackId");
	const agentId = c.req.param("agentId");
	const db = createClient(c.env.DB);

	await db
		.delete(agents)
		.where(and(eq(agents.id, agentId), eq(agents.stackId, stackId)));

	if (wantsHTML(c)) {
		const allAgents = await db
			.select({
				id: agents.id,
				stackId: agents.stackId,
				name: agents.name,
				status: agents.status,
				lastHeartbeatAt: agents.lastHeartbeatAt,
			})
			.from(agents)
			.where(eq(agents.stackId, stackId));
		return c.html(templates.agentsList(allAgents as templates.Agent[]));
	}

	return c.json({ success: true });
});

// Trigger agent config refresh (manual)
agentsRoutes.post("/:agentId/trigger-refresh", async (c) => {
	const stackId = c.req.param("stackId");
	const agentId = c.req.param("agentId");
	const db = createClient(c.env.DB);

	const [agent] = await db
		.select()
		.from(agents)
		.where(and(eq(agents.id, agentId), eq(agents.stackId, stackId)));

	if (!agent) {
		return c.json({ error: "Agent not found" }, 404);
	}

	if (!agent.agentEndpoint) {
		return c.json({ error: "Agent endpoint not configured" }, 400);
	}

	// Import here to avoid circular dependency
	const { notifyAgent } = await import("../lib/agent-notifier");
	const [stack] = await db.select().from(stacks).where(eq(stacks.id, stackId));

	const result = await notifyAgent(
		agent.agentEndpoint,
		{
			stack_id: stackId,
			stack_version: stack?.version || 0,
			changed_at: new Date().toISOString(),
			change_type: "manual_trigger",
		},
		undefined
	);

	if (!result.success) {
		return c.json({ error: "Failed to notify agent", details: result.error }, 502);
	}

	return c.json({ success: true, message: "Agent notified successfully" });
});

// Agent registration (exchange install token for API key)
agentsRoutes.post("/register", async (c) => {
	const body = await c.req.json();
	const { install_token, hostname, ip_address } = body;

	if (!install_token) {
		return c.json({ error: "Install token required" }, 400);
	}

	const db = createClient(c.env.DB);

	const [agent] = await db
		.select()
		.from(agents)
		.where(eq(agents.installToken, install_token));

	if (!agent) {
		return c.json({ error: "Invalid install token" }, 401);
	}

	const apiKey = generateToken(48);
	const apiKeyHash = await hashSecret(apiKey);

	await db
		.update(agents)
		.set({
			apiKey: apiKeyHash,
			installToken: null,
			hostname: hostname || null,
			ipAddress: ip_address || null,
			status: "online",
			updatedAt: sql`CURRENT_TIMESTAMP`,
		})
		.where(eq(agents.id, agent.id));

	const [stack] = await db
		.select()
		.from(stacks)
		.where(eq(stacks.id, agent.stackId));

	return c.json({
		agent_id: agent.id,
		api_key: apiKey,
		stack_id: agent.stackId,
		poll_interval: stack?.pollInterval || 30,
	});
});

export default agentsRoutes;
