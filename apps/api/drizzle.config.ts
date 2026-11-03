import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "mysql",
	schema: "./src/database/schema/index.ts",
	out: "./drizzle",
	dbCredentials: {
		// Hanya dipakai saat perintah yang butuh koneksi; `generate` tidak konek.
		url: process.env.DATABASE_URL ?? "mysql://root@localhost:3306/unida_prayer",
	},
});
