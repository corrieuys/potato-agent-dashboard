CREATE INDEX `agents_stack_id_idx` ON `agents` (`stack_id`);--> statement-breakpoint
CREATE INDEX `heartbeats_agent_id_created_at_idx` ON `heartbeats` (`agent_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `service_versions_service_id_idx` ON `service_versions` (`service_id`);--> statement-breakpoint
CREATE INDEX `service_versions_stack_id_idx` ON `service_versions` (`stack_id`);--> statement-breakpoint
CREATE INDEX `services_stack_id_idx` ON `services` (`stack_id`);--> statement-breakpoint
CREATE INDEX `stack_jwts_stack_id_idx` ON `stack_jwts` (`stack_id`);