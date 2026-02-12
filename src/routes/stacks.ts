import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";
import { createClient } from "../db/client";
import { stacks, services, agents } from "../db/schema";
import * as templates from "../templates";
import { generateUUID, wantsHTML, parseBody } from "../lib/utils";

const stacksRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// List all stacks
stacksRoutes.get("/", async (c) => {
	const db = createClient(c.env.DB);
	const allStacks = await db.select().from(stacks).orderBy(desc(stacks.createdAt));

	if (wantsHTML(c)) {
		return c.html(templates.stackList(allStacks as templates.Stack[]));
	}

	return c.json({ stacks: allStacks });
});

// Create a new stack
stacksRoutes.post("/", async (c) => {
	const body = await parseBody(c);

	if (!body.name) {
		if (wantsHTML(c)) {
			return c.html(`<div class="text-red-600 p-4">Name is required</div>`, 400);
		}
		return c.json({ error: "Name is required" }, 400);
	}

	const id = generateUUID();
	const db = createClient(c.env.DB);

	await db.insert(stacks).values({
		id,
		name: body.name,
		description: body.description || null,
		version: 1,
		pollInterval: body.poll_interval ? parseInt(body.poll_interval) : 30,
		securityMode: body.security_mode || "none",
		externalProxyPort: body.external_proxy_port ? parseInt(body.external_proxy_port) : 8080,
	});

	const [stack] = await db.select().from(stacks).where(eq(stacks.id, id));

	if (wantsHTML(c)) {
		const allStacks = await db.select().from(stacks).orderBy(desc(stacks.createdAt));
		return c.html(templates.stackList(allStacks as templates.Stack[]));
	}

	return c.json({ stack }, 201);
});

// Get a specific stack
stacksRoutes.get("/:id", async (c) => {
	const id = c.req.param("id");
	const db = createClient(c.env.DB);

	const [stack] = await db.select().from(stacks).where(eq(stacks.id, id));

	if (!stack) {
		return c.json({ error: "Stack not found" }, 404);
	}

	const stackServices = await db
		.select()
		.from(services)
		.where(eq(services.stackId, id));

	const stackAgents = await db
		.select({
			id: agents.id,
			name: agents.name,
			status: agents.status,
			lastHeartbeatAt: agents.lastHeartbeatAt,
			createdAt: agents.createdAt,
		})
		.from(agents)
		.where(eq(agents.stackId, id));

	return c.json({ stack, services: stackServices, agents: stackAgents });
});

// Update a stack
stacksRoutes.patch("/:id", async (c) => {
	const id = c.req.param("id");
	const body = await parseBody(c);
	const db = createClient(c.env.DB);

	const [existing] = await db.select().from(stacks).where(eq(stacks.id, id));
	if (!existing) {
		return c.json({ error: "Stack not found" }, 404);
	}

	const updates: Record<string, any> = {
		updatedAt: sql`CURRENT_TIMESTAMP`,
	};

	if (body.name !== undefined) updates.name = body.name;
	if (body.description !== undefined) updates.description = body.description;
	if (body.poll_interval !== undefined)
		updates.pollInterval = parseInt(body.poll_interval);
	if (body.heartbeat_interval !== undefined)
		updates.heartbeatInterval = parseInt(body.heartbeat_interval);
	if (body.security_mode !== undefined)
		updates.securityMode = body.security_mode;
	if (body.external_proxy_port !== undefined)
		updates.externalProxyPort = parseInt(body.external_proxy_port);

	await db
		.update(stacks)
		.set({ ...updates, version: sql`${stacks.version} + 1` })
		.where(eq(stacks.id, id));

	const [updated] = await db.select().from(stacks).where(eq(stacks.id, id));
	if (wantsHTML(c)) {
		return c.html(`<div class="text-green-700 text-sm">Stack updated successfully.</div>`);
	}
	return c.json({ stack: updated });
});

// Delete a stack
stacksRoutes.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const db = createClient(c.env.DB);

	await db.delete(stacks).where(eq(stacks.id, id));

	if (wantsHTML(c)) {
		const allStacks = await db.select().from(stacks).orderBy(desc(stacks.createdAt));
		return c.html(templates.stackList(allStacks as templates.Stack[]));
	}

	return c.json({ success: true });
});

export default stacksRoutes;
