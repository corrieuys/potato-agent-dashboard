PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_heartbeats` (
	`agent_id` text PRIMARY KEY NOT NULL,
	`stack_version` integer,
	`agent_status` text,
	`services_status` text,
	`security_state` text,
	`system_info` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_heartbeats`("agent_id", "stack_version", "agent_status", "services_status", "security_state", "system_info", "created_at") SELECT "agent_id", "stack_version", "agent_status", "services_status", "security_state", "system_info", "created_at" FROM `heartbeats`;--> statement-breakpoint
DROP TABLE `heartbeats`;--> statement-breakpoint
ALTER TABLE `__new_heartbeats` RENAME TO `heartbeats`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `stacks` ADD `heartbeat_interval` integer DEFAULT 30 NOT NULL;