CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`object_key` text NOT NULL,
	`relative_path` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`sha256` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_assets_object_key` ON `assets` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_assets_version_id` ON `assets` (`version_id`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`actor_email` text NOT NULL,
	`deliverable_id` text NOT NULL,
	`version_id` text NOT NULL,
	`metadata_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_created_at` ON `audit_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `deliverables` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_deliverables_slug` ON `deliverables` (`slug`);--> statement-breakpoint
CREATE TABLE `publish_requests` (
	`idempotency_key` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `versions` (
	`id` text PRIMARY KEY NOT NULL,
	`deliverable_id` text NOT NULL,
	`version` text NOT NULL,
	`published_date` text NOT NULL,
	`authors_json` text NOT NULL,
	`change_summary` text NOT NULL,
	`commit_url` text,
	`deployment_url` text,
	`publisher_email` text NOT NULL,
	`published_at` text NOT NULL,
	FOREIGN KEY (`deliverable_id`) REFERENCES `deliverables`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_versions_deliverable_version` ON `versions` (`deliverable_id`,`version`);--> statement-breakpoint
CREATE INDEX `idx_versions_published_at` ON `versions` (`published_at`);