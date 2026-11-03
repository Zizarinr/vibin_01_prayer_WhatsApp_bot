import { config } from "../../core/config";
import { createLogger } from "../../core/logger";
import { wahaFetch } from "./client";
import type { WahaGroup } from "./types";

const logger = createLogger("waha-groups");

interface RawGroupItem {
	id: string | { _serialized: string; user?: string };
	name?: string;
	subject?: string;
}

export async function listGroups(
	sessionName = config.wahaSession,
): Promise<WahaGroup[]> {
	logger.info("Mengambil daftar grup dari WAHA...", { sessionName });

	const rawGroups = await wahaFetch<RawGroupItem[]>(
		`/api/${sessionName}/groups`,
	);

	if (!Array.isArray(rawGroups)) {
		logger.warn("WAHA mengembalikan respons grup non-array.", { rawGroups });
		return [];
	}

	return rawGroups.map((item) => {
		const id =
			typeof item.id === "string"
				? item.id
				: (item.id?._serialized || String(item.id));
		const name = item.name || item.subject || id;
		return { id, name };
	});
}
