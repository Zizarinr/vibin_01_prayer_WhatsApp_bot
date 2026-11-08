import {
	bigint,
	boolean,
	datetime,
	index,
	mysqlTable,
	text,
	varchar,
} from "drizzle-orm/mysql-core";

/**
 * Hadits terverifikasi, dikelola admin (lihat docs/03-database.md §3.6).
 * `data/hadiths.json` hanya seed awal berversi; runtime baca dari tabel ini.
 */
export const hadiths = mysqlTable(
	"hadiths",
	{
		id: bigint("id", { mode: "number", unsigned: true })
			.autoincrement()
			.primaryKey(),
		seedKey: varchar("seed_key", { length: 100 }).unique(),
		text: text("text").notNull(),
		source: varchar("source", { length: 255 }).notNull(),
		topic: varchar("topic", { length: 100 })
			.notNull()
			.default("sholat_tepat_waktu"),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: datetime("created_at", { fsp: 3 })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: datetime("updated_at", { fsp: 3 })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(table) => [index("hadiths_is_active_idx").on(table.isActive)],
);

export type Hadith = typeof hadiths.$inferSelect;
export type NewHadith = typeof hadiths.$inferInsert;
