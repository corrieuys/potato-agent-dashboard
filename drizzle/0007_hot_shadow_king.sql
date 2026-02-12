ALTER TABLE `services` ADD `service_type` text DEFAULT 'git' NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `docker_image` text;--> statement-breakpoint
ALTER TABLE `services` ADD `docker_run_args` text;