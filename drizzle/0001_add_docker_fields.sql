ALTER TABLE `services` ADD COLUMN `runtime` text DEFAULT 'process' NOT NULL;
ALTER TABLE `services` ADD COLUMN `dockerfile_path` text DEFAULT 'Dockerfile' NOT NULL;
ALTER TABLE `services` ADD COLUMN `docker_context` text DEFAULT '.' NOT NULL;
ALTER TABLE `services` ADD COLUMN `docker_container_port` integer;
ALTER TABLE `services` ADD COLUMN `image_retain_count` integer DEFAULT 5 NOT NULL;
