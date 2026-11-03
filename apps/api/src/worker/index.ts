import { createLogger } from "../core/logger";
import { utcNow } from "../core/time";
import { db } from "../database/client";
import { appSettings } from "../database/schema/appSettings";

const logger = createLogger("worker");

const WORKER_ID = `worker-${crypto.randomUUID().slice(0, 8)}`;
const HEARTBEAT_MS = 30_000;

/**
 * STUB Fase 1 — hanya heartbeat agar /api/admin/system/status bisa membaca worker.
 * Generator/dispatcher/recovery diimplementasikan di Fase 4 (docs/06).
 */
async function writeHeartbeat(): Promise<void> {
	await db
		.insert(appSettings)
		.values({
			key: "worker_heartbeat",
			value: {
				atUtc: utcNow().toISOString(),
				workerId: WORKER_ID,
				version: "2.0.0-fase1",
			},
		})
		.onDuplicateKeyUpdate({
			set: {
				value: {
					atUtc: utcNow().toISOString(),
					workerId: WORKER_ID,
					version: "2.0.0-fase1",
				},
			},
		});
	logger.info("Heartbeat ditulis.", { workerId: WORKER_ID });
}

logger.info("Worker stub berjalan (Fase 1).", { workerId: WORKER_ID });
await writeHeartbeat();
setInterval(() => {
	writeHeartbeat().catch((error: unknown) => {
		logger.error("Heartbeat gagal.", {
			error: error instanceof Error ? error.message : String(error),
		});
	});
}, HEARTBEAT_MS);
