ALTER TABLE `services` ADD `hostname` text;--> statement-breakpoint
CREATE INDEX `services_hostname_idx` ON `services` (`hostname`);--> statement-breakpoint
ALTER TABLE `services` DROP COLUMN `external_path`;