import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const stacks = sqliteTable("stacks", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	version: integer("version").notNull().default(1),
	pollInterval: integer("poll_interval").notNull().default(30),
	securityMode: text("security_mode").notNull().default("none"),
	externalProxyPort: integer("external_proxy_port").notNull().default(8080),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export const services = sqliteTable("services", {
	id: text("id").primaryKey(),
	stackId: text("stack_id")
		.notNull()
		.references(() => stacks.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	gitUrl: text("git_url").notNull(),
	gitRef: text("git_ref").notNull().default("main"),
	gitCommit: text("git_commit"),
	gitSshKey: text("git_ssh_key"),
	buildCommand: text("build_command"),
	runCommand: text("run_command").notNull(),
	runtime: text("runtime").notNull().default("process"),
	dockerfilePath: text("dockerfile_path").notNull().default("Dockerfile"),
	dockerContext: text("docker_context").notNull().default("."),
	dockerContainerPort: integer("docker_container_port"),
	imageRetainCount: integer("image_retain_count").notNull().default(5),
	port: integer("port").notNull(),
	externalPath: text("external_path"),
	healthCheckPath: text("health_check_path").notNull().default("/health"),
	healthCheckInterval: integer("health_check_interval").notNull().default(30),
	environmentVars: text("environment_vars", { mode: "json" }),
	blueGreenMode: integer("blue_green_mode", { mode: "boolean" })
		.notNull()
		.default(false),
	activeVersionSlot: text("active_version_slot").default("blue"),
	blueVersionId: text("blue_version_id"),
	greenVersionId: text("green_version_id"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

// Table to track service versions for blue-green deployment
export const serviceVersions = sqliteTable("service_versions", {
	id: text("id").primaryKey(),
	serviceId: text("service_id")
		.notNull()
		.references(() => services.id, { onDelete: "cascade" }),
	stackId: text("stack_id")
		.notNull()
		.references(() => stacks.id, { onDelete: "cascade" }),
	commitRef: text("commit_ref").notNull(),
	versionNumber: integer("version_number").notNull(),
	status: text("status").notNull().default("building"),
	buildLogs: text("build_logs"),
	builtAt: integer("built_at", { mode: "timestamp" }),
	healthy: integer("healthy", { mode: "boolean" }).default(false),
	isActive: integer("is_active", { mode: "boolean" }).default(false),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export const agents = sqliteTable("agents", {
	id: text("id").primaryKey(),
	stackId: text("stack_id")
		.notNull()
		.references(() => stacks.id, { onDelete: "cascade" }),
	name: text("name"),
	installToken: text("install_token").unique(),
	apiKey: text("api_key"),
	hostname: text("hostname"),
	ipAddress: text("ip_address"),
	agentEndpoint: text("agent_endpoint"),
	securityMode: text("security_mode").notNull().default("none"),
	externalExposure: text("external_exposure").notNull().default("none"),
	tunnelConnected: integer("tunnel_connected", { mode: "boolean" })
		.notNull()
		.default(false),
	status: text("status").notNull().default("pending"),
	lastHeartbeatAt: integer("last_heartbeat_at", { mode: "timestamp" }),
	lastSeenVersion: integer("last_seen_version"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export const heartbeats = sqliteTable("heartbeats", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	agentId: text("agent_id")
		.notNull()
		.references(() => agents.id, { onDelete: "cascade" }),
	stackVersion: integer("stack_version"),
	agentStatus: text("agent_status"),
	servicesStatus: text("services_status", { mode: "json" }),
	securityState: text("security_state", { mode: "json" }),
	systemInfo: text("system_info", { mode: "json" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

// New table for webhook JWT tokens
export const stackJwts = sqliteTable("stack_jwts", {
	id: text("id").primaryKey(),
	stackId: text("stack_id")
		.notNull()
		.references(() => stacks.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	description: text("description"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	expiresAt: integer("expires_at", { mode: "timestamp" }),
	lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
	active: integer("active", { mode: "boolean" })
		.notNull()
		.default(true),
});

export type Stack = typeof stacks.$inferSelect;
export type NewStack = typeof stacks.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type Heartbeat = typeof heartbeats.$inferSelect;
export type NewHeartbeat = typeof heartbeats.$inferInsert;

export type StackJwt = typeof stackJwts.$inferSelect;
export type NewStackJwt = typeof stackJwts.$inferInsert;

export type ServiceVersion = typeof serviceVersions.$inferSelect;
export type NewServiceVersion = typeof serviceVersions.$inferInsert;