CREATE TABLE `service_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`stack_id` text NOT NULL,
	`commit_ref` text NOT NULL,
	`version_number` integer NOT NULL,
	`status` text DEFAULT 'building' NOT NULL,
	`build_logs` text,
	`built_at` integer,
	`healthy` integer DEFAULT false,
	`is_active` integer DEFAULT false,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stack_id`) REFERENCES `stacks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `services` ADD `blue_green_mode` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `active_version_slot` text DEFAULT 'blue';--> statement-breakpoint
ALTER TABLE `services` ADD `blue_version_id` text;--> statement-breakpoint
ALTER TABLE `services` ADD `green_version_id` text;