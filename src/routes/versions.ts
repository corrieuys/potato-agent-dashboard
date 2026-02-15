import { Hono } from "hono";
import { eq, desc, and, sql } from "drizzle-orm";
import { createClient } from "../db/client";
import { stacks, services, serviceVersions } from "../db/schema";
import { generateUUID, parseBody } from "../lib/utils";
import { notifyStackAgents } from "../lib/agent-notifier";

const versionsRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// Get version history for a service
versionsRoutes.get("/", async (c) => {
	const stackId = c.req.param("stackId");
	const serviceId = c.req.param("serviceId");
	const db = createClient(c.env.DB);

	// Verify service exists and belongs to stack
	const [service] = await db
		.select()
		.from(services)
		.where(and(eq(services.id, serviceId), eq(services.stackId, stackId)));

	if (!service) {
		return c.json({ error: "Service not found" }, 404);
	}

	// Get last 10 versions
	const versions = await db
		.select({
			id: serviceVersions.id,
			versionNumber: serviceVersions.versionNumber,
			commitRef: serviceVersions.commitRef,
			status: serviceVersions.status,
			healthy: serviceVersions.healthy,
			isActive: serviceVersions.isActive,
			builtAt: serviceVersions.builtAt,
			createdAt: serviceVersions.createdAt,
		})
		.from(serviceVersions)
		.where(eq(serviceVersions.serviceId, serviceId))
		.orderBy(desc(serviceVersions.versionNumber))
		.limit(10);

	return c.json({
		service: {
			id: service.id,
			name: service.name,
			blueGreenMode: service.blueGreenMode,
			activeVersionSlot: service.activeVersionSlot,
			blueVersionId: service.blueVersionId,
			greenVersionId: service.greenVersionId,
			currentCommit: service.gitCommit,
		},
		versions,
	});
});

// Toggle blue-green mode for a service
versionsRoutes.post("/toggle-blue-green", async (c) => {
	const stackId = c.req.param("stackId");
	const serviceId = c.req.param("serviceId");
	const db = createClient(c.env.DB);

	const [service] = await db
		.select()
		.from(services)
		.where(and(eq(services.id, serviceId), eq(services.stackId, stackId)));

	if (!service) {
		return c.json({ error: "Service not found" }, 404);
	}

	const newMode = !service.blueGreenMode;

	await db
		.update(services)
		.set({
			blueGreenMode: newMode,
			updatedAt: sql`CURRENT_TIMESTAMP`,
		})
		.where(eq(services.id, serviceId));

	// Update stack version and notify agents
	await db
		.update(stacks)
		.set({ version: sql`${stacks.version} + 1` })
		.where(eq(stacks.id, stackId));

	const [stack] = await db.select().from(stacks).where(eq(stacks.id, stackId));

	// Notify agents about config change
	await notifyStackAgents(
		db,
		stackId,
		{
			stack_version: stack?.version || 0,
			changed_at: new Date().toISOString(),
			change_type: "config_change",
			service_id: serviceId,
		},
		{
			accessClientId: c.env.CF_ACCESS_CLIENT_ID,
			accessClientSecret: c.env.CF_ACCESS_CLIENT_SECRET,
		}
	);

	return c.json({
		success: true,
		blue_green_mode: newMode,
		message: `Blue-green mode ${newMode ? "enabled" : "disabled"} for service`,
	});
});

// Switch active version (blue <-> green)
versionsRoutes.post("/switch", async (c) => {
	const stackId = c.req.param("stackId");
	const serviceId = c.req.param("serviceId");
	const body = await parseBody(c);
	const targetSlot = body.target_slot; // 'blue' or 'green'
	const db = createClient(c.env.DB);

	if (!targetSlot || (targetSlot !== "blue" && targetSlot !== "green")) {
		return c.json({ error: "Invalid target_slot. Must be 'blue' or 'green'" }, 400);
	}

	const [service] = await db
		.select()
		.from(services)
		.where(and(eq(services.id, serviceId), eq(services.stackId, stackId)));

	if (!service) {
		return c.json({ error: "Service not found" }, 404);
	}

	if (!service.blueGreenMode) {
		return c.json({ error: "Blue-green mode not enabled for this service" }, 400);
	}

	// Check if target version exists and is healthy
	const targetVersionId =
		targetSlot === "blue" ? service.blueVersionId : service.greenVersionId;

	if (!targetVersionId) {
		return c.json(
			{ error: `No version configured for ${targetSlot} slot` },
			400
		);
	}

	const [targetVersion] = await db
		.select()
		.from(serviceVersions)
		.where(eq(serviceVersions.id, targetVersionId));

	if (!targetVersion) {
		return c.json({ error: "Target version not found" }, 404);
	}

	if (!targetVersion.healthy) {
		return c.json(
			{ error: "Cannot switch to unhealthy version" },
			400
		);
	}

	// Use D1 batch to perform all updates atomically
	// This prevents race conditions where health status changes between check and update
	const rawDb = (db as any).session?.client as D1Database | undefined;
	if (rawDb) {
		await rawDb.batch([
			rawDb.prepare(
				"UPDATE services SET active_version_slot = ?, git_commit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND EXISTS (SELECT 1 FROM service_versions WHERE id = ? AND healthy = 1)"
			).bind(targetSlot, targetVersion.commitRef, serviceId, targetVersionId),
			rawDb.prepare(
				"UPDATE service_versions SET is_active = 0 WHERE service_id = ?"
			).bind(serviceId),
			rawDb.prepare(
				"UPDATE service_versions SET is_active = 1 WHERE id = ?"
			).bind(targetVersionId),
			rawDb.prepare(
				"UPDATE stacks SET version = version + 1 WHERE id = ?"
			).bind(stackId),
		]);
	} else {
		// Fallback for environments where raw DB is not accessible
		await db
			.update(services)
			.set({
				activeVersionSlot: targetSlot,
				gitCommit: targetVersion.commitRef,
				updatedAt: sql`CURRENT_TIMESTAMP`,
			})
			.where(eq(services.id, serviceId));

		await db
			.update(serviceVersions)
			.set({ isActive: false })
			.where(eq(serviceVersions.serviceId, serviceId));

		await db
			.update(serviceVersions)
			.set({ isActive: true })
			.where(eq(serviceVersions.id, targetVersionId));

		await db
			.update(stacks)
			.set({ version: sql`${stacks.version} + 1` })
			.where(eq(stacks.id, stackId));
	}

	const [stack] = await db.select().from(stacks).where(eq(stacks.id, stackId));

	// Notify agents
	await notifyStackAgents(
		db,
		stackId,
		{
			stack_version: stack?.version || 0,
			changed_at: new Date().toISOString(),
			change_type: "config_change",
			service_id: serviceId,
		},
		{
			accessClientId: c.env.CF_ACCESS_CLIENT_ID,
			accessClientSecret: c.env.CF_ACCESS_CLIENT_SECRET,
		}
	);

	return c.json({
		success: true,
		active_slot: targetSlot,
		version_id: targetVersionId,
		commit_ref: targetVersion.commitRef,
		message: `Switched to ${targetSlot} version`,
	});
});

// Rollback to a specific version
versionsRoutes.post("/rollback", async (c) => {
	const stackId = c.req.param("stackId");
	const serviceId = c.req.param("serviceId");
	const body = await parseBody(c);
	const versionId = body.version_id;
	const db = createClient(c.env.DB);

	if (!versionId) {
		return c.json({ error: "version_id is required" }, 400);
	}

	const [service] = await db
		.select()
		.from(services)
		.where(and(eq(services.id, serviceId), eq(services.stackId, stackId)));

	if (!service) {
		return c.json({ error: "Service not found" }, 404);
	}

	// Get the version to rollback to
	const [targetVersion] = await db
		.select()
		.from(serviceVersions)
		.where(
			and(
				eq(serviceVersions.id, versionId),
				eq(serviceVersions.serviceId, serviceId)
			)
		);

	if (!targetVersion) {
		return c.json({ error: "Version not found" }, 404);
	}

	if (!targetVersion.healthy) {
		return c.json(
			{ error: "Cannot rollback to unhealthy version" },
			400
		);
	}

	// Update service commit ref
	await db
		.update(services)
		.set({
			gitCommit: targetVersion.commitRef,
			updatedAt: sql`CURRENT_TIMESTAMP`,
		})
		.where(eq(services.id, serviceId));

	// Set this version as active
	await db
		.update(serviceVersions)
		.set({ isActive: false })
		.where(eq(serviceVersions.serviceId, serviceId));

	await db
		.update(serviceVersions)
		.set({ isActive: true })
		.where(eq(serviceVersions.id, versionId));

	// Update stack version and notify agents
	await db
		.update(stacks)
		.set({ version: sql`${stacks.version} + 1` })
		.where(eq(stacks.id, stackId));

	const [stack] = await db.select().from(stacks).where(eq(stacks.id, stackId));

	// Notify agents
	await notifyStackAgents(
		db,
		stackId,
		{
			stack_version: stack?.version || 0,
			changed_at: new Date().toISOString(),
			change_type: "config_change",
			service_id: serviceId,
		},
		{
			accessClientId: c.env.CF_ACCESS_CLIENT_ID,
			accessClientSecret: c.env.CF_ACCESS_CLIENT_SECRET,
		}
	);

	return c.json({
		success: true,
		version_id: versionId,
		commit_ref: targetVersion.commitRef,
		message: `Rolled back to version ${targetVersion.versionNumber}`,
	});
});

export default versionsRoutes;
