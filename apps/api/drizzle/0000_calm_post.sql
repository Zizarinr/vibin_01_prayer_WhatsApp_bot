CREATE TABLE `admins` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(190) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_login_at` datetime(3),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `admins_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` varchar(100) NOT NULL,
	`value` json NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `app_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `message_targets` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`target_type` varchar(16) NOT NULL DEFAULT 'GROUP',
	`target_id` varchar(255) NOT NULL,
	`name` varchar(190) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `message_targets_id` PRIMARY KEY(`id`),
	CONSTRAINT `message_targets_target_id_unique` UNIQUE(`target_id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_messages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`idempotency_key` char(64) NOT NULL,
	`prayer_date` date NOT NULL,
	`prayer_name` varchar(20) NOT NULL,
	`message_type` varchar(30) NOT NULL,
	`target_id` bigint unsigned NOT NULL,
	`prayer_time_utc` datetime(3) NOT NULL,
	`scheduled_at_utc` datetime(3) NOT NULL,
	`message_body` text NOT NULL,
	`content_ref` varchar(100),
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`attempt_count` int unsigned NOT NULL DEFAULT 0,
	`next_attempt_at_utc` datetime(3),
	`claimed_at_utc` datetime(3),
	`sent_at_utc` datetime(3),
	`waha_message_id` varchar(255),
	`last_error` text,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `scheduled_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `scheduled_messages_idempotency_key_unique` UNIQUE(`idempotency_key`),
	CONSTRAINT `scheduled_messages_no_duplicate_uq` UNIQUE(`prayer_date`,`prayer_name`,`message_type`,`target_id`),
	CONSTRAINT `scheduled_messages_idempotency_key_uidx` UNIQUE(`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `hadiths` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`seed_key` varchar(100),
	`text` text NOT NULL,
	`source` varchar(255) NOT NULL,
	`topic` varchar(100) NOT NULL DEFAULT 'sholat_tepat_waktu',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `hadiths_id` PRIMARY KEY(`id`),
	CONSTRAINT `hadiths_seed_key_unique` UNIQUE(`seed_key`)
);
--> statement-breakpoint
ALTER TABLE `scheduled_messages` ADD CONSTRAINT `scheduled_messages_target_id_message_targets_id_fk` FOREIGN KEY (`target_id`) REFERENCES `message_targets`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `message_targets_is_active_idx` ON `message_targets` (`is_active`);--> statement-breakpoint
CREATE INDEX `scheduled_messages_status_scheduled_idx` ON `scheduled_messages` (`status`,`scheduled_at_utc`);--> statement-breakpoint
CREATE INDEX `scheduled_messages_status_next_attempt_idx` ON `scheduled_messages` (`status`,`next_attempt_at_utc`);--> statement-breakpoint
CREATE INDEX `hadiths_is_active_idx` ON `hadiths` (`is_active`);