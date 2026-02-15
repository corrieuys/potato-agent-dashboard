CREATE TABLE `webhook_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`stack_id` text NOT NULL,
	`delivery_id` text NOT NULL,
	`event_type` text NOT NULL,
	`commit_sha` text,
	`processed_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`stack_id`) REFERENCES `stacks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_deliveries_stack_delivery_uniq` ON `webhook_deliveries` (`stack_id`,`delivery_id`);--> statement-breakpoint
CREATE INDEX `webhook_deliveries_stack_id_idx` ON `webhook_deliveries` (`stack_id`);