import { config } from "../../core/config";
import { createLogger } from "../../core/logger";
import { WahaError } from "./types";

const logger = createLogger("waha-client");

export interface RequestOptions extends RequestInit {
	timeoutMs?: number;
}

export async function wahaFetch<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const baseUrl = config.wahaBaseUrl.replace(/\/+$/, "");
	const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

	const headers: Record<string, string> = {
		Accept: "application/json",
		...(options.headers as Record<string, string>),
	};

	if (config.wahaApiKey) {
		headers["X-Api-Key"] = config.wahaApiKey;
	}

	if (options.body && !headers["Content-Type"]) {
		headers["Content-Type"] = "application/json";
	}

	const timeoutMs = options.timeoutMs ?? 12000;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch(url, {
			...options,
			headers,
			signal: controller.signal,
		});

		clearTimeout(timeout);

		if (!res.ok) {
			let errorBody = "";
			try {
				errorBody = await res.text();
			} catch {
			}

			logger.warn("WAHA mengembalikan respons HTTP gagal.", {
				status: res.status,
				url,
				errorBody: errorBody.slice(0, 300),
			});

			if (res.status === 401 || res.status === 403) {
				throw new WahaError(
					"Kredensial WAHA salah / API key tidak valid. Periksa konfigurasi WAHA_API_KEY.",
					502,
					"WAHA_UPSTREAM_ERROR",
				);
			}
			if (res.status === 404) {
				throw new WahaError(
					`Resource WAHA tidak ditemukan: ${path}`,
					404,
					"NOT_FOUND",
				);
			}
			if (res.status === 429) {
				throw new WahaError(
					"Permintaan dibatasi oleh layanan WAHA (rate limited).",
					429,
					"RATE_LIMITED",
				);
			}

			throw new WahaError(
				`Layanan WAHA gagal (HTTP ${res.status}): ${errorBody.slice(0, 150) || res.statusText}`,
				res.status >= 500 ? 502 : res.status,
				"WAHA_UPSTREAM_ERROR",
			);
		}

		const contentType = res.headers.get("content-type") || "";
		if (contentType.includes("application/json")) {
			return (await res.json()) as T;
		}

		return (await res.text()) as unknown as T;
	} catch (error) {
		clearTimeout(timeout);
		if (error instanceof WahaError) {
			throw error;
		}

		if (error instanceof Error && error.name === "AbortError") {
			logger.error("Permintaan ke WAHA mengalami timeout.", { url, timeoutMs });
			throw new WahaError(
				`Koneksi ke WAHA timeout setelah ${timeoutMs}ms. Periksa performa container WAHA.`,
				504,
				"WAHA_UPSTREAM_ERROR",
			);
		}

		logger.error("Gagal menghubungi layanan WAHA.", {
			url,
			error: error instanceof Error ? error.message : String(error),
		});

		throw new WahaError(
			"Tidak dapat terhubung ke server WAHA. Pastikan container WAHA aktif dan WAHA_BASE_URL benar.",
			503,
			"WAHA_UPSTREAM_ERROR",
		);
	}
}
