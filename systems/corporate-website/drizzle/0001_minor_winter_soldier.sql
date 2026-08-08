DROP INDEX `idx_content_type_slug`;--> statement-breakpoint
DROP INDEX `idx_content_type_status_order`;--> statement-breakpoint
ALTER TABLE `content_items` ADD `locale` text DEFAULT 'vi' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_items` ADD `translation_key` text;--> statement-breakpoint
UPDATE `content_items` SET `translation_key` = `id` WHERE `translation_key` IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_content_type_locale_slug` ON `content_items` (`type`,`locale`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_content_translation_locale` ON `content_items` (`translation_key`,`locale`);--> statement-breakpoint
CREATE INDEX `idx_content_type_locale_status_order` ON `content_items` (`type`,`locale`,`status`,`sort_order`);--> statement-breakpoint
ALTER TABLE `leads` ADD `locale` text DEFAULT 'vi' NOT NULL;
