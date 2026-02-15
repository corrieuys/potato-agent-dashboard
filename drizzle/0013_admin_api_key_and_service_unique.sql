ALTER TABLE `stacks` ADD `admin_api_key_hash` text;--> statement-breakpoint
CREATE UNIQUE INDEX `services_stack_id_name_uniq` ON `services` (`stack_id`,`name`);