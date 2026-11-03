CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`record` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`scheduled_at` text,
	`approved_at` text,
	`created_at` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `course_awards` (
	`id` text PRIMARY KEY NOT NULL,
	`entitlement` text NOT NULL,
	`user_id` text NOT NULL,
	`course` text NOT NULL,
	`title` text NOT NULL,
	`revision` integer NOT NULL,
	`lesson_count` integer NOT NULL,
	`name` text NOT NULL,
	`issued_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_awards_entitlement_unique` ON `course_awards` (`entitlement`);--> statement-breakpoint
CREATE TABLE `course_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course` text NOT NULL,
	`revision` integer NOT NULL,
	`lesson` integer NOT NULL,
	`completed_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`provider_id` text,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`first_attempt` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`error` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`draft` text NOT NULL,
	`published` text,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscription_requests` (
	`email` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`expires` integer NOT NULL,
	`requested_at` text NOT NULL,
	`confirmed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_requests_token_hash_unique` ON `subscription_requests` (`token_hash`);