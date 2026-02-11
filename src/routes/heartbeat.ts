import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { createClient } from "../db/client";
import { agents, heartbeats } from "../db/schema";
import { hashSecret } from "../lib/utils";

const heartbeatRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// Submit heartbeat (from agent)
heartbeatRoutes.post("/", async (c) => {
	const apiKey = c.req.header("X-API-Key");

	if (!apiKey) {
		return c.json({ error: "API key required" }, 401);
	}

	const body = await c.req.json();
	const db = createClient(c.env.DB);
	const apiKeyHash = await hashSecret(apiKey);

	const [agent] = await db
		.select()
		.from(agents)
		.where(eq(agents.apiKey, apiKeyHash));

	if (!agent) {
		return c.json({ error: "Invalid API key" }, 401);
	}

	await db.insert(heartbeats).values({
		agentId: agent.id,
		stackVersion: body.stack_version || null,
		agentStatus: body.agent_status || "unknown",
		servicesStatus: body.services_status || null,
		securityState: body.security_state || null,
		systemInfo: body.system_info || null,
	});

	await db
		.update(agents)
		.set({
			lastHeartbeatAt: sql`CURRENT_TIMESTAMP`,
			lastSeenVersion: body.stack_version || agent.lastSeenVersion,
			status: "online",
			securityMode: body.security_state?.mode || agent.securityMode,
			externalExposure:
				body.security_state?.external_exposure || agent.externalExposure,
			tunnelConnected:
				body.security_state?.tunnel_connected || agent.tunnelConnected,
			updatedAt: sql`CURRENT_TIMESTAMP`,
		})
		.where(eq(agents.id, agent.id));

	return c.json({ success: true });
});

export default heartbeatRoutes;
