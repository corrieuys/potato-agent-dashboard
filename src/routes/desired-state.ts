import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { createClient } from "../db/client";
import { stacks, agents, services, serviceVersions } from "../db/schema";
import { computeHash } from "../lib/utils";

const desiredStateRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// Get desired state for a stack (authenticated by agent ID)
desiredStateRoutes.get("/", async (c) => {
	const stackId = c.req.param("stackId");
	const agentId = c.req.header("X-Agent-Id");

	if (!agentId) {
		return c.json({ error: "Agent ID required" }, 401);
	}

	const db = createClient(c.env.DB);
	const [agent] = await db
		.select()
		.from(agents)
		.where(and(eq(agents.stackId, stackId), eq(agents.id, agentId)));

	if (!agent) {
		return c.json({ error: "Invalid agent" }, 401);
	}

	const [stack] = await db
		.select()
		.from(stacks)
		.where(eq(stacks.id, stackId));

	if (!stack) {
		return c.json({ error: "Stack not found" }, 404);
	}

	const stackServices = await db
		.select()
		.from(services)
		.where(eq(services.stackId, stackId))
		.orderBy(asc(services.name));

	// Get version info for services in blue-green mode
	const serviceIds = stackServices.filter(s => s.blueGreenMode).map(s => s.id);
	let versionsMap: Record<string, any[]> = {};

	if (serviceIds.length > 0) {
		const versions = await db
			.select()
			.from(serviceVersions)
			.where(eq(serviceVersions.stackId, stackId));

		// Group versions by service_id
		versions.forEach(v => {
			if (!versionsMap[v.serviceId]) {
				versionsMap[v.serviceId] = [];
			}
			versionsMap[v.serviceId].push(v);
		});
	}

	const desiredState = {
		stack_id: stack.id,
		version: stack.version,
		hash: computeHash(JSON.stringify({ stack, services: stackServices })),
		poll_interval: stack.pollInterval,
		security_mode: stack.securityMode,
		external_proxy_port: stack.externalProxyPort,
		services: stackServices.map((s) => {
			let environmentVars: Record<string, string> = {};
			if (s.environmentVars) {
				if (typeof s.environmentVars === "string") {
					try {
						environmentVars = JSON.parse(s.environmentVars);
					} catch (error) {
						environmentVars = {};
					}
				} else {
					environmentVars = s.environmentVars as Record<string, string>;
				}
			}

			const serviceData: any = {
				id: s.id,
				name: s.name,
				service_type: s.serviceType || "git",
				git_url: s.gitUrl,
				git_ref: s.gitRef,
				git_commit: s.gitCommit || "",
				git_ssh_key: s.gitSshKey || "",
				docker_image: s.dockerImage || "",
				docker_run_args: s.dockerRunArgs || "",
				build_command: s.buildCommand,
				run_command: s.runCommand,
				runtime: s.runtime || "",
				dockerfile_path: s.dockerfilePath || "",
				docker_context: s.dockerContext || "",
				docker_container_port: s.dockerContainerPort || 0,
				image_retain_count: s.imageRetainCount || 0,
				base_image: s.baseImage || "",
				language: s.language || "auto",
				port: s.port,
				external_path: s.externalPath,
				health_check_path: s.healthCheckPath,
				health_check_interval: s.healthCheckInterval,
				environment_vars: environmentVars,
			};

			// Add blue-green deployment info if enabled
			if (s.blueGreenMode) {
				serviceData.blue_green = {
					enabled: true,
					active_slot: s.activeVersionSlot || "blue",
					blue_version_id: s.blueVersionId,
					green_version_id: s.greenVersionId,
					versions: (versionsMap[s.id] || [])
						.slice(0, 10)
						.map(v => ({
							id: v.id,
							version_number: v.versionNumber,
							commit_ref: v.commitRef,
							status: v.status,
							healthy: v.healthy,
							is_active: v.isActive,
							built_at: v.builtAt,
						})),
				};
			}

			return serviceData;
		}),
	};

	return c.json(desiredState);
});

export default desiredStateRoutes;
