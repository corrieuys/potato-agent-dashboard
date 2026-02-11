PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_services` (
	`id` text PRIMARY KEY NOT NULL,
	`stack_id` text NOT NULL,
	`name` text NOT NULL,
	`git_url` text NOT NULL,
	`git_ref` text DEFAULT 'main' NOT NULL,
	`git_commit` text,
	`git_ssh_key` text,
	`build_command` text NOT NULL,
	`run_command` text NOT NULL,
	`runtime` text,
	`dockerfile_path` text,
	`docker_context` text,
	`docker_container_port` integer,
	`image_retain_count` integer,
	`base_image` text,
	`language` text DEFAULT 'auto' NOT NULL,
	`port` integer NOT NULL,
	`external_path` text,
	`health_check_path` text DEFAULT '/health' NOT NULL,
	`health_check_interval` integer DEFAULT 30 NOT NULL,
	`environment_vars` text,
	`blue_green_mode` integer DEFAULT false NOT NULL,
	`active_version_slot` text DEFAULT 'blue',
	`blue_version_id` text,
	`green_version_id` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`stack_id`) REFERENCES `stacks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_services`("id", "stack_id", "name", "git_url", "git_ref", "git_commit", "git_ssh_key", "build_command", "run_command", "runtime", "dockerfile_path", "docker_context", "docker_container_port", "image_retain_count", "base_image", "language", "port", "external_path", "health_check_path", "health_check_interval", "environment_vars", "blue_green_mode", "active_version_slot", "blue_version_id", "green_version_id", "created_at", "updated_at") SELECT "id", "stack_id", "name", "git_url", "git_ref", "git_commit", "git_ssh_key", "build_command", "run_command", "runtime", "dockerfile_path", "docker_context", "docker_container_port", "image_retain_count", "base_image", "language", "port", "external_path", "health_check_path", "health_check_interval", "environment_vars", "blue_green_mode", "active_version_slot", "blue_version_id", "green_version_id", "created_at", "updated_at" FROM `services`;--> statement-breakpoint
DROP TABLE `services`;--> statement-breakpoint
ALTER TABLE `__new_services` RENAME TO `services`;--> statement-breakpoint
PRAGMA foreign_keys=ON;