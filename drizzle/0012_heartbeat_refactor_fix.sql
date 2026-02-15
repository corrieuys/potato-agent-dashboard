PRAGMA foreign_keys=OFF;--> statement-breakpoint
-- Migration: heartbeat_refactor_fix
-- Fixes the failed 0010 migration by properly converting heartbeats to one-row-per-agent

-- Step 1: Create new heartbeats table with agent_id as primary key
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
-- Step 2: Deduplicate and migrate existing heartbeats (keep most recent per agent)
INSERT INTO `__new_heartbeats`("agent_id", "stack_version", "agent_status", "services_status", "security_state", "system_info", "created_at")
SELECT "agent_id", "stack_version", "agent_status", "services_status", "security_state", "system_info", "created_at"
FROM `heartbeats` h1
WHERE h1.rowid = (
	SELECT h2.rowid
	FROM `heartbeats` h2
	WHERE h2.agent_id = h1.agent_id
	ORDER BY h2.created_at DESC
	LIMIT 1
);
--> statement-breakpoint
-- Step 3: Drop old table
DROP TABLE `heartbeats`;
--> statement-breakpoint
-- Step 4: Rename new table
ALTER TABLE `__new_heartbeats` RENAME TO `heartbeats`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
