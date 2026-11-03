import {
	bigint,
	boolean,
	datetime,
	mysqlTable,
	varchar,
} from "drizzle-orm/mysql-core";

/** Login dashboard. Beda dengan user koneksi MySQL. */
export const admins = mysqlTable("admins", {
	id: bigint("id", { mode: "number", unsigned: true })
		.autoincrement()
		.primaryKey(),
	name: varchar("name", { length: 120 }).notNull(),
	email: varchar("email", { length: 190 }).notNull().unique(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	isActive: boolean("is_active").notNull().default(true),
	lastLoginAt: datetime("last_login_at", { fsp: 3 }),
	createdAt: datetime("created_at", { fsp: 3 })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: datetime("updated_at", { fsp: 3 })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date()),
});

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
