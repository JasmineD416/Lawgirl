CREATE TABLE `checkout_intents` (
	`session_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product` text NOT NULL,
	`file_key` text NOT NULL,
	`price_id` text NOT NULL,
	`title` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `file_key` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `price_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `title` text;