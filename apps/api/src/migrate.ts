import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { config } from "./core/config";
import { createLogger } from "./core/logger";

const logger = createLogger("migrate");

const connection = await mysql.createConnection({
	uri: config.databaseUrl,
	timezone: "Z",
});
try {
	const db = drizzle(connection);
	await migrate(db, { migrationsFolder: "./drizzle" });
	logger.info("Migration selesai.", {});
} finally {
	await connection.end();
}
