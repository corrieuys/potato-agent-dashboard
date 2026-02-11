import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { createClient } from "../db/client";
import { agents, heartbeats } from "../db/schema";

const heartbeatRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// Submit heartbeat (from agent)
heartbeatRoutes.post("/", async (c) => {
	const agentId = c.req.header("X-Agent-Id");

	if (!agentId) {
		return c.json({ error: "Agent ID required" }, 401);
	}

	const body = await c.req.json();
	const db = createClient(c.env.DB);
	const [agent] = await db
		.select()
		.from(agents)
		.where(eq(agents.id, agentId));

	if (!agent) {
		return c.json({ error: "Invalid agent" }, 401);
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
