import {
	bigint,
	char,
	date,
	datetime,
	index,
	int,
	mysqlTable,
	text,
	unique,
	uniqueIndex,
	varchar,
} from "drizzle-orm/mysql-core";
import { messageTargets } from "./targets";

/**
 * Antrean + riwayat pengiriman (lihat docs/03-database.md §3.5, docs/06).
 * Sumber kebenaran scheduler — bukan timer in-memory.
 */
export const scheduledMessages = mysqlTable(
	"scheduled_messages",
	{
		id: bigint("id", { mode: "number", unsigned: true })
			.autoincrement()
			.primaryKey(),
		idempotencyKey: char("idempotency_key", { length: 64 }).notNull().unique(),
		prayerDate: date("prayer_date").notNull(),
		prayerName: varchar("prayer_name", { length: 20 }).notNull(),
		messageType: varchar("message_type", { length: 30 }).notNull(),
		targetId: bigint("target_id", { mode: "number", unsigned: true })
			.notNull()
			.references(() => messageTargets.id, {
				onUpdate: "cascade",
				onDelete: "restrict",
			}),
		prayerTimeUtc: datetime("prayer_time_utc", { fsp: 3 }).notNull(),
		scheduledAtUtc: datetime("scheduled_at_utc", { fsp: 3 }).notNull(),
		messageBody: text("message_body").notNull(),
		contentRef: varchar("content_ref", { length: 100 }),
		status: varchar("status", { length: 20 }).notNull().default("PENDING"),
		attemptCount: int("attempt_count", { unsigned: true }).notNull().default(0),
		nextAttemptAtUtc: datetime("next_attempt_at_utc", { fsp: 3 }),
		claimedAtUtc: datetime("claimed_at_utc", { fsp: 3 }),
		sentAtUtc: datetime("sent_at_utc", { fsp: 3 }),
		wahaMessageId: varchar("waha_message_id", { length: 255 }),
		lastError: text("last_error"),
		createdAt: datetime("created_at", { fsp: 3 })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: datetime("updated_at", { fsp: 3 })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(table) => [
		uniqueIndex("scheduled_messages_idempotency_key_uidx").on(
			table.idempotencyKey,
		),
		unique("scheduled_messages_no_duplicate_uq").on(
			table.prayerDate,
			table.prayerName,
			table.messageType,
			table.targetId,
		),
		index("scheduled_messages_status_scheduled_idx").on(
			table.status,
			table.scheduledAtUtc,
		),
		index("scheduled_messages_status_next_attempt_idx").on(
			table.status,
			table.nextAttemptAtUtc,
		),
	],
);

export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type NewScheduledMessage = typeof scheduledMessages.$inferInsert;
