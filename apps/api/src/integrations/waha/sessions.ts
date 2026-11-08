import { config } from "../../core/config";
import { createLogger } from "../../core/logger";
import { wahaFetch } from "./client";
import {
	WahaError,
	type WahaQrResponse,
	type WahaSessionInfo,
	type WahaSessionStatus,
} from "./types";

const logger = createLogger("waha-sessions");

interface RawWahaSession {
	name: string;
	status?: string;
	me?: {
		id: string;
		pushName?: string;
	};
	config?: {
		engine?: string;
	};
}

export async function getSessionStatus(
	sessionName = config.wahaSession,
): Promise<WahaSessionInfo> {
	try {
		const raw = await wahaFetch<RawWahaSession>(`/api/sessions/${sessionName}`);
		const statusNormalized = (raw.status?.toUpperCase() ||
			"STOPPED") as WahaSessionStatus;

		return {
			name: raw.name || sessionName,
			status: statusNormalized,
			me: raw.me,
			engine: raw.config?.engine,
		};
	} catch (error) {
		if (error instanceof WahaError && error.statusCode === 404) {
			return {
				name: sessionName,
				status: "STOPPED",
			};
		}
		throw error;
	}
}

export async function startSession(
	sessionName = config.wahaSession,
): Promise<WahaSessionInfo> {
	logger.info("Memulai sesi WAHA...", { sessionName });

	try {
		await wahaFetch("/api/sessions/start", {
			method: "POST",
			body: JSON.stringify({ name: sessionName }),
		});
	} catch (err) {
		// Beberapa versi WAHA memakai POST /api/sessions bila sesi belum ada
		if (err instanceof WahaError && err.statusCode === 404) {
			await wahaFetch("/api/sessions", {
				method: "POST",
				body: JSON.stringify({
					name: sessionName,
					config: { engine: "GOWS" },
				}),
			});
		} else {
			throw err;
		}
	}

	return await getSessionStatus(sessionName);
}

export async function stopSession(
	sessionName = config.wahaSession,
): Promise<void> {
	logger.info("Menghentikan sesi WAHA...", { sessionName });
	await wahaFetch("/api/sessions/stop", {
		method: "POST",
		body: JSON.stringify({ name: sessionName }),
	});
}

export async function restartSession(
	sessionName = config.wahaSession,
): Promise<void> {
	logger.info("Merestart sesi WAHA...", { sessionName });
	await wahaFetch("/api/sessions/restart", {
		method: "POST",
		body: JSON.stringify({ name: sessionName }),
	});
}

export async function logoutSession(
	sessionName = config.wahaSession,
): Promise<void> {
	logger.info("Logout sesi WAHA (menghapus pairing)...", { sessionName });
	await wahaFetch("/api/sessions/logout", {
		method: "POST",
		body: JSON.stringify({ name: sessionName }),
	});
}

export async function getSessionQr(
	sessionName = config.wahaSession,
): Promise<WahaQrResponse> {
	const baseUrl = config.wahaBaseUrl.replace(/\/+$/, "");
	const url = `${baseUrl}/api/${sessionName}/auth/qr?format=image`;

	const headers: Record<string, string> = {
		Accept: "image/png, image/*, */*",
	};
	if (config.wahaApiKey) {
		headers["X-Api-Key"] = config.wahaApiKey;
	}

	try {
		const res = await fetch(url, {
			headers,
			signal: AbortSignal.timeout(10000),
		});

		if (!res.ok) {
			if (res.status === 404) {
				throw new WahaError(
					"QR Code tidak tersedia. Pastikan sesi dalam status SCAN_QR.",
					404,
					"NOT_FOUND",
				);
			}
			throw new WahaError(
				`Gagal mengambil QR code dari WAHA (HTTP ${res.status}).`,
				502,
				"WAHA_UPSTREAM_ERROR",
			);
		}

		const contentType = res.headers.get("content-type") || "";

		if (contentType.includes("image")) {
			const arrayBuffer = await res.arrayBuffer();
			const base64 = Buffer.from(arrayBuffer).toString("base64");
			const mime = contentType.includes("png") ? "image/png" : "image/jpeg";
			return {
				format: "image",
				data: `data:${mime};base64,${base64}`,
			};
		}

		const rawText = await res.text();
		return {
			format: "raw",
			data: rawText,
		};
	} catch (error) {
		if (error instanceof WahaError) throw error;
		throw new WahaError(
			"Gagal mengambil QR pairing dari WAHA.",
			502,
			"WAHA_UPSTREAM_ERROR",
		);
	}
}
