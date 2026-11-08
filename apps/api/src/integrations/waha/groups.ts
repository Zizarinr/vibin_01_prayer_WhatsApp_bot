import { config } from "../../core/config";
import { createLogger } from "../../core/logger";
import { wahaFetch } from "./client";
import type { WahaGroup } from "./types";

const logger = createLogger("waha-groups");

interface RawGroupItem {
	id?: string | { _serialized?: string; user?: string };
	name?: string;
	subject?: string;
	// Bentuk respons engine GOWS (huruf kapital, lihat image pin gows-2026.10.1).
	JID?: string;
	Name?: string;
}

/**
 * Normalisasi daftar grup mentah WAHA ke {id, name}.
 * Mendukung dua bentuk respons:
 * - Klasik: {id, name|subject} (huruf kecil).
 * - Engine GOWS: {JID, Name} (huruf kapital).
 * Entri tanpa id valid dibuang (bukan "undefined" string).
 */
export function normalizeGroups(raw: unknown): WahaGroup[] {
	if (!Array.isArray(raw)) {
		logger.warn("WAHA mengembalikan respons grup non-array.", { rawGroups: raw });
		return [];
	}

	const groups: WahaGroup[] = [];
	for (const item of raw as RawGroupItem[]) {
		const rawId = item?.id;
		const id =
			typeof rawId === "string"
				? rawId
				: (rawId?._serialized ?? item?.JID ?? "");
		const name = item?.name || item?.subject || item?.Name || id;
		if (!id || id === "undefined") continue;
		groups.push({ id, name });
	}
	return groups;
}

export async function listGroups(
	sessionName = config.wahaSession,
): Promise<WahaGroup[]> {
	logger.info("Mengambil daftar grup dari WAHA...", { sessionName });

	const rawGroups = await wahaFetch<RawGroupItem[]>(
		`/api/${sessionName}/groups`,
	);

	return normalizeGroups(rawGroups);
}
