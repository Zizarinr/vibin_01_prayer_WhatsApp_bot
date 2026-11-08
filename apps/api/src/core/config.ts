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
	/** True bila NODE_ENV bukan production (dev/test): bypass login admin + CORS longgar. */
	isDev: boolean;
	port: number;
	appSecret: string;
	databaseUrl: string;
	wahaBaseUrl: string;
	wahaApiKey: string;
	wahaSession: string;
	webUrl: string;
	corsOrigins: string[];
}

function csvList(name: string): string[] {
	const raw = process.env[name];
	if (!raw || raw.trim().length === 0) return [];
	return raw
		.split(",")
		.map((s) => s.trim().replace(/\/+$/, ""))
		.filter((s) => s.length > 0);
}

const nodeEnv = optional("NODE_ENV", "development").trim().toLowerCase();

export const config: AppConfig = {
	nodeEnv,
	// Bypass auth + CORS longgar HANYA bila NODE_ENV bukan production.
	// Image Docker memaksa NODE_ENV=production sehingga bypass mati otomatis di server.
	isDev: nodeEnv !== "production",
	port: port("API_PORT", 3001),
	appSecret: required("APP_SECRET"),
	databaseUrl: required("DATABASE_URL"),
	wahaBaseUrl: optional("WAHA_BASE_URL", "http://localhost:3000"),
	wahaApiKey: optional("WAHA_API_KEY", ""),
	wahaSession: optional("WAHA_SESSION", "unida-prayer"),
	webUrl: optional("WEB_URL", "http://localhost:3000"),
	corsOrigins: (() => {
		const fromEnv = csvList("CORS_ORIGINS");
		if (fromEnv.length > 0) return fromEnv;
		const webUrl = optional("WEB_URL", "http://localhost:3000").replace(/\/+$/, "");
		const defaults = [webUrl, "http://localhost:3000", "http://127.0.0.1:3000"];
		return [...new Set(defaults)];
	})(),
};
