/**
 * Konfigurasi backend dari environment.
 * Hanya rahasia + koneksi service (lihat docs/10-devops-cicd.md §10.3).
 * Konfigurasi operasional (lokasi, target, reminder) hidup di MySQL.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";

// Muat root .env saat development lokal (bun memuat .env dari cwd saja).
// Di production (Docker), env disuplai container — file tak ada, lewati diam-diam.
const rootEnv = resolve(import.meta.dir, "../../../../.env");
if (existsSync(rootEnv)) {
	dotenv.config({ path: rootEnv });
}

function required(name: string): string {
	const value = process.env[name];
	if (!value || value.trim().length === 0) {
		throw new Error(
			`Environment ${name} belum diisi. Salin .env.example menjadi .env lalu isi nilainya.`,
		);
	}
	return value;
}

function optional(name: string, fallback: string): string {
	const value = process.env[name];
	return value && value.trim().length > 0 ? value : fallback;
}

function port(name: string, fallback: number): number {
	const raw = process.env[name];
	if (!raw) return fallback;
	const parsed = Number.parseInt(raw, 10);
	if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > 65535) {
		throw new Error(
			`Environment ${name} harus berupa port 1-65535, diterima: ${raw}`,
		);
	}
	return parsed;
}

export interface AppConfig {
	nodeEnv: string;
	port: number;
	appSecret: string;
	databaseUrl: string;
	wahaBaseUrl: string;
	wahaApiKey: string;
	wahaSession: string;
}

export const config: AppConfig = {
	nodeEnv: optional("NODE_ENV", "development"),
	port: port("API_PORT", 3001),
	appSecret: required("APP_SECRET"),
	databaseUrl: required("DATABASE_URL"),
	wahaBaseUrl: optional("WAHA_BASE_URL", "http://localhost:3000"),
	wahaApiKey: optional("WAHA_API_KEY", ""),
	wahaSession: optional("WAHA_SESSION", "unida-prayer"),
};
