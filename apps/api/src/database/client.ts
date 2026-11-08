import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config } from "../core/config";
import * as schema from "./schema";

const pool = mysql.createPool({
	uri: config.databaseUrl,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	// Tanggal dibaca sebagai UTC; konversi tampil dilakukan eksplisit per timezone app.
	timezone: "Z",
	dateStrings: false,
});

export const db = drizzle(pool, { schema, mode: "default" });

export type Database = typeof db;

/** Ping cepat untuk /api/ready. Mengembalikan latency ms. */
export async function pingDatabase(): Promise<{
	ok: boolean;
	latencyMs: number;
}> {
	const started = Date.now();
	const connection = await pool.getConnection();
	try {
		await connection.query("SELECT 1");
		return { ok: true, latencyMs: Date.now() - started };
	} finally {
		connection.release();
	}
}
