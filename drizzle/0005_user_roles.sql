ALTER TABLE `users` ADD `role` text DEFAULT 'student' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `added_by` text;
