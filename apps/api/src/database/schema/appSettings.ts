import { datetime, json, mysqlTable, varchar } from "drizzle-orm/mysql-core";

/**
 * Konfigurasi operasional key-value (lihat docs/03-database.md §3.3).
 * Bentuk tiap `value` divalidasi schema TypeScript di backend.
 */
export const appSettings = mysqlTable("app_settings", {
	key: varchar("key", { length: 100 }).primaryKey(),
	value: json("value").$type<unknown>().notNull(),
	updatedAt: datetime("updated_at", { fsp: 3 })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date()),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
