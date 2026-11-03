CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`issued_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_user_id_unique` ON `certificates` (`user_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`session_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson` integer NOT NULL,
	`completed_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`consent` text NOT NULL,
	`created_at` text NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'subscribed' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_token_unique` ON `subscribers` (`token`);