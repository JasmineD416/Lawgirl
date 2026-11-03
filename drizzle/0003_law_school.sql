ALTER TABLE `subscribers` ADD `first_name` text;--> statement-breakpoint
ALTER TABLE `subscribers` ADD `last_name` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `kind` text DEFAULT 'book' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_intent` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `revoked_at` text;--> statement-breakpoint
CREATE INDEX `orders_user_product_idx` ON `orders` (`user_id`,`product`);--> statement-breakpoint
CREATE INDEX `orders_payment_intent_idx` ON `orders` (`payment_intent`);
