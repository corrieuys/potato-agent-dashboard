CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`stack_id` text NOT NULL,
	`name` text,
	`install_token` text,
	`api_key` text,
	`hostname` text,
	`ip_address` text,
	`security_mode` text DEFAULT 'none' NOT NULL,
	`external_exposure` text DEFAULT 'none' NOT NULL,
	`tunnel_connected` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`last_heartbeat_at` integer,
	`last_seen_version` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`stack_id`) REFERENCES `stacks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agents_install_token_unique` ON `agents` (`install_token`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` text NOT NULL,
	`stack_id` text,
	`service_id` text,
	`event_type` text NOT NULL,
	`event_level` text DEFAULT 'info' NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stack_id`) REFERENCES `stacks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `heartbeats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` text NOT NULL,
	`stack_version` integer,
	`agent_status` text,
	`services_status` text,
	`security_state` text,
	`system_info` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`stack_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`git_url` text NOT NULL,
	`git_ref` text DEFAULT 'main' NOT NULL,
	`git_commit` text,
	`build_command` text,
	`run_command` text NOT NULL,
	`port` integer NOT NULL,
	`external_path` text,
	`health_check_path` text DEFAULT '/health' NOT NULL,
	`health_check_interval` integer DEFAULT 30 NOT NULL,
	`environment_vars` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`stack_id`) REFERENCES `stacks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stacks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`version` integer DEFAULT 1 NOT NULL,
	`poll_interval` integer DEFAULT 30 NOT NULL,
	`security_mode` text DEFAULT 'none' NOT NULL,
	`external_proxy_port` integer DEFAULT 8080 NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
