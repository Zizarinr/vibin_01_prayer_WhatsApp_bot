import {
	bigint,
	boolean,
	datetime,
	index,
	mysqlTable,
	varchar,
} from "drizzle-orm/mysql-core";

/** Grup/target WhatsApp pilihan admin. Baru dari sync default nonaktif. */
export const messageTargets = mysqlTable(
	"message_targets",
	{
		id: bigint("id", { mode: "number", unsigned: true })
			.autoincrement()
			.primaryKey(),
		targetType: varchar("target_type", { length: 16 })
			.notNull()
			.default("GROUP"),
		targetId: varchar("target_id", { length: 255 }).notNull().unique(),
		name: varchar("name", { length: 190 }).notNull(),
		isActive: boolean("is_active").notNull().default(false),
		createdAt: datetime("created_at", { fsp: 3 })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: datetime("updated_at", { fsp: 3 })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(table) => [index("message_targets_is_active_idx").on(table.isActive)],
);

export type MessageTarget = typeof messageTargets.$inferSelect;
export type NewMessageTarget = typeof messageTargets.$inferInsert;
