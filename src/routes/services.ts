import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { createClient } from "../db/client";
import { stacks, services } from "../db/schema";
import * as templates from "../templates";
import { generateUUID, wantsHTML, parseBody } from "../lib/utils";

const servicesRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// List services for a stack
servicesRoutes.get("/", async (c) => {
	const stackId = c.req.param("stackId");
	const db = createClient(c.env.DB);

	const stackServices = await db
		.select()
		.from(services)
		.where(eq(services.stackId, stackId));

	return c.json({ services: stackServices });
});

// Create a service
servicesRoutes.post("/", async (c) => {
	const stackId = c.req.param("stackId");
	const body = await parseBody(c);
	const db = createClient(c.env.DB);
	const serviceType = (body.service_type === "docker" ? "docker" : "git") as "git" | "docker";

	if (!body.name || !body.port) {
		if (wantsHTML(c)) {
			return c.html(`<div class="text-red-600 p-4">Missing required fields: name, port</div>`, 400);
		}
		return c.json(
			{ error: "Missing required fields: name, port" },
			400
		);
	}
	if (serviceType === "git" && (!body.git_url || !body.build_command || !body.run_command)) {
		if (wantsHTML(c)) {
			return c.html(`<div class="text-red-600 p-4">Missing required fields: name, git_url, port, build_command, run_command</div>`, 400);
		}
		return c.json(
			{ error: "Missing required fields: name, git_url, port, build_command, run_command" },
			400
		);
	}
	if (serviceType === "docker" && !body.docker_image) {
		if (wantsHTML(c)) {
			return c.html(`<div class="text-red-600 p-4">Missing required fields for docker service: docker_image</div>`, 400);
		}
		return c.json(
			{ error: "Missing required fields for docker service: docker_image" },
			400
		);
	}

	let environmentVars: Record<string, string> | null = null;
	if (body.environment_vars) {
		if (typeof body.environment_vars === "string") {
			try {
				environmentVars = JSON.parse(body.environment_vars);
			} catch (error) {
				if (wantsHTML(c)) {
					return c.html(`<div class="text-red-600 p-4">Environment vars must be valid JSON</div>`, 400);
				}
				return c.json({ error: "Environment vars must be valid JSON" }, 400);
			}
		} else {
			environmentVars = body.environment_vars as Record<string, string>;
		}
	}

	const [stack] = await db.select().from(stacks).where(eq(stacks.id, stackId));
	if (!stack) {
		if (wantsHTML(c)) {
			return c.html(`<div class="text-red-600 p-4">Stack not found</div>`, 404);
		}
		return c.json({ error: "Stack not found" }, 404);
	}

	const [existing] = await db
		.select()
		.from(services)
		.where(and(eq(services.stackId, stackId), eq(services.name, body.name)));

	if (existing) {
		if (wantsHTML(c)) {
			return c.html(`<div class="text-red-600 p-4">Service with this name already exists</div>`, 409);
		}
		return c.json(
			{ error: "Service with this name already exists in stack" },
			409
		);
	}

	const id = generateUUID();

	await db.insert(services).values({
		id,
		stackId,
		name: body.name,
		serviceType,
		gitUrl: body.git_url || "",
		gitRef: body.git_ref || "main",
		gitCommit: body.git_commit || null,
		gitSshKey: body.git_ssh_key || null,
		dockerImage: body.docker_image || null,
		dockerRunArgs: body.docker_run_args || null,
		buildCommand: body.build_command || "",
		runCommand: body.run_command || "",
		runtime: body.runtime || null,
		dockerfilePath: body.dockerfile_path || null,
		dockerContext: body.docker_context || null,
		dockerContainerPort: body.docker_container_port ? parseInt(body.docker_container_port) : null,
		imageRetainCount: body.image_retain_count ? parseInt(body.image_retain_count) : null,
		baseImage: body.base_image || null,
		language: body.language || "auto",
		port: parseInt(body.port),
		externalPath: body.external_path || null,
		healthCheckPath: body.health_check_path || "/health",
		healthCheckInterval: body.health_check_interval ? parseInt(body.health_check_interval) : 30,
		environmentVars,
	});

	await db
		.update(stacks)
		.set({ version: sql`${stacks.version} + 1` })
		.where(eq(stacks.id, stackId));

	// Return updated services list for HTMX
	if (wantsHTML(c)) {
		const allServices = await db
			.select({
				id: services.id,
				stackId: services.stackId,
				name: services.name,
				serviceType: services.serviceType,
				gitUrl: services.gitUrl,
				dockerImage: services.dockerImage,
				port: services.port,
				externalPath: services.externalPath,
			})
			.from(services)
			.where(eq(services.stackId, stackId));
		return c.html(templates.servicesList(allServices as templates.Service[]));
	}

	const [created] = await db.select().from(services).where(eq(services.id, id));
	return c.json({ service: created }, 201);
});

// Update a service
servicesRoutes.patch("/:serviceId", async (c) => {
	const stackId = c.req.param("stackId");
	const serviceId = c.req.param("serviceId");
	const body = await parseBody(c);
	const db = createClient(c.env.DB);

	const [existing] = await db
		.select()
		.from(services)
		.where(and(eq(services.id, serviceId), eq(services.stackId, stackId)));

	if (!existing) {
		if (wantsHTML(c)) {
			return c.html(`<div class="text-red-600 p-4">Service not found</div>`, 404);
		}
		return c.json({ error: "Service not found" }, 404);
	}

	const updates: Record<string, any> = {
		updatedAt: sql`CURRENT_TIMESTAMP`,
	};

	if (body.name !== undefined) updates.name = body.name;
	if (body.service_type !== undefined) {
		updates.serviceType = body.service_type === "docker" ? "docker" : "git";
	}
	if (body.git_url !== undefined) updates.gitUrl = body.git_url;
	if (body.git_ref !== undefined) updates.gitRef = body.git_ref;
	if (body.git_commit !== undefined) updates.gitCommit = body.git_commit;
	if (body.git_ssh_key !== undefined) updates.gitSshKey = body.git_ssh_key;
	if (body.docker_image !== undefined) updates.dockerImage = body.docker_image || null;
	if (body.docker_run_args !== undefined) updates.dockerRunArgs = body.docker_run_args || null;
	if (body.build_command !== undefined) updates.buildCommand = body.build_command;
	if (body.run_command !== undefined) updates.runCommand = body.run_command;
	if (body.runtime !== undefined) updates.runtime = body.runtime || null;
	if (body.dockerfile_path !== undefined)
		updates.dockerfilePath = body.dockerfile_path || null;
	if (body.docker_context !== undefined)
		updates.dockerContext = body.docker_context || null;
	if (body.docker_container_port !== undefined)
		updates.dockerContainerPort = body.docker_container_port ? parseInt(body.docker_container_port) : null;
	if (body.image_retain_count !== undefined)
		updates.imageRetainCount = body.image_retain_count ? parseInt(body.image_retain_count) : null;
	if (body.base_image !== undefined) updates.baseImage = body.base_image || null;
	if (body.language !== undefined) updates.language = body.language || "auto";
	if (body.port !== undefined) updates.port = parseInt(body.port);
	if (body.external_path !== undefined)
		updates.externalPath = body.external_path;
	if (body.health_check_path !== undefined)
		updates.healthCheckPath = body.health_check_path;
	if (body.health_check_interval !== undefined)
		updates.healthCheckInterval = parseInt(body.health_check_interval);
	if (body.environment_vars !== undefined) {
		if (!body.environment_vars) {
			updates.environmentVars = null;
		} else if (typeof body.environment_vars === "string") {
			try {
				updates.environmentVars = JSON.parse(body.environment_vars);
			} catch (error) {
				if (wantsHTML(c)) {
					return c.html(`<div class="text-red-600 p-4">Environment vars must be valid JSON</div>`, 400);
				}
				return c.json({ error: "Environment vars must be valid JSON" }, 400);
			}
		} else {
			updates.environmentVars = body.environment_vars as Record<string, string>;
		}
	}

	const effectiveServiceType = (updates.serviceType || existing.serviceType || "git") as "git" | "docker";
	const effectiveDockerImage = updates.dockerImage !== undefined ? updates.dockerImage : existing.dockerImage;
	const effectiveGitURL = updates.gitUrl !== undefined ? updates.gitUrl : existing.gitUrl;
	const effectiveBuildCommand = updates.buildCommand !== undefined ? updates.buildCommand : existing.buildCommand;
	const effectiveRunCommand = updates.runCommand !== undefined ? updates.runCommand : existing.runCommand;

	if (effectiveServiceType === "docker" && !effectiveDockerImage) {
		if (wantsHTML(c)) {
			return c.html(`<div class="text-red-600 p-4">Docker services require docker_image</div>`, 400);
		}
		return c.json({ error: "Docker services require docker_image" }, 400);
	}
	if (effectiveServiceType === "git" && (!effectiveGitURL || !effectiveBuildCommand || !effectiveRunCommand)) {
		if (wantsHTML(c)) {
			return c.html(`<div class="text-red-600 p-4">Git services require git_url, build_command, and run_command</div>`, 400);
		}
		return c.json({ error: "Git services require git_url, build_command, and run_command" }, 400);
	}

	await db.update(services).set(updates).where(eq(services.id, serviceId));

	await db
		.update(stacks)
		.set({ version: sql`${stacks.version} + 1` })
		.where(eq(stacks.id, stackId));

	// Return updated services list for HTMX
	if (wantsHTML(c)) {
		const allServices = await db
			.select({
				id: services.id,
				stackId: services.stackId,
				name: services.name,
				serviceType: services.serviceType,
				gitUrl: services.gitUrl,
				dockerImage: services.dockerImage,
				port: services.port,
				externalPath: services.externalPath,
			})
			.from(services)
			.where(eq(services.stackId, stackId));
		return c.html(templates.servicesList(allServices as templates.Service[]));
	}

	const [updated] = await db
		.select()
		.from(services)
		.where(eq(services.id, serviceId));
	return c.json({ service: updated });
});

// Delete a service
servicesRoutes.delete("/:serviceId", async (c) => {
	const stackId = c.req.param("stackId");
	const serviceId = c.req.param("serviceId");
	const db = createClient(c.env.DB);

	await db
		.delete(services)
		.where(and(eq(services.id, serviceId), eq(services.stackId, stackId)));

	await db
		.update(stacks)
		.set({ version: sql`${stacks.version} + 1` })
		.where(eq(stacks.id, stackId));

	if (wantsHTML(c)) {
		const allServices = await db
			.select({
				id: services.id,
				stackId: services.stackId,
				name: services.name,
				serviceType: services.serviceType,
				gitUrl: services.gitUrl,
				dockerImage: services.dockerImage,
				port: services.port,
				externalPath: services.externalPath,
			})
			.from(services)
			.where(eq(services.stackId, stackId));
		return c.html(templates.servicesList(allServices as templates.Service[]));
	}

	return c.json({ success: true });
});

export default servicesRoutes;
