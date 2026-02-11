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

	const body = await c.req.json<Record<string, unknown>>();
	const db = createClient(c.env.DB);
	const [agent] = await db
		.select()
		.from(agents)
		.where(eq(agents.id, agentId));

	if (!agent) {
		return c.json({ error: "Invalid agent" }, 401);
	}

	const stackVersion = typeof body.stack_version === "number" ? body.stack_version : null;
	const agentStatus = typeof body.agent_status === "string" ? body.agent_status : "healthy";
	const servicesStatus = Array.isArray(body.services_status) ? body.services_status : null;
	const securityState =
		body.security_state && typeof body.security_state === "object"
			? body.security_state
			: null;
	const systemInfo =
		body.system_info && typeof body.system_info === "object"
			? body.system_info
			: null;

	await db.insert(heartbeats).values({
		agentId: agent.id,
		stackVersion,
		agentStatus,
		servicesStatus,
		securityState,
		systemInfo,
	});

	await db
		.update(agents)
		.set({
			lastHeartbeatAt: sql`CURRENT_TIMESTAMP`,
			lastSeenVersion: stackVersion ?? agent.lastSeenVersion,
			status: "online",
			securityMode:
				(securityState as Record<string, unknown> | null)?.mode as string
				?? agent.securityMode,
			externalExposure:
				(securityState as Record<string, unknown> | null)?.external_exposure as string
				?? agent.externalExposure,
			tunnelConnected:
				(typeof (securityState as Record<string, unknown> | null)?.tunnel_connected ===
					"boolean"
					? (securityState as Record<string, unknown>).tunnel_connected
					: false) as boolean,
			updatedAt: sql`CURRENT_TIMESTAMP`,
		})
		.where(eq(agents.id, agent.id));

	console.log(
		`Heartbeat accepted agent=${agent.id} stack=${agent.stackId} version=${stackVersion ?? "n/a"} services=${servicesStatus?.length ?? 0}`
	);

	return c.json({ success: true });
});

export default heartbeatRoutes;
