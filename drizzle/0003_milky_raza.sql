CREATE TABLE `stack_jwts` (
	`id` text PRIMARY KEY NOT NULL,
	`stack_id` text NOT NULL,
	`token` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` integer,
	`last_used_at` integer,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`stack_id`) REFERENCES `stacks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stack_jwts_token_unique` ON `stack_jwts` (`token`);--> statement-breakpoint
ALTER TABLE `agents` ADD `agent_endpoint` text;