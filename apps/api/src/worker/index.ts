import { createLogger } from "../core/logger";
import { utcNow } from "../core/time";
import { db } from "../database/client";
import { appSettings } from "../database/schema/appSettings";
import { runDispatcherTick, runStartupRecovery } from "../modules/messages/dispatcher";
import { generateHorizonMessages } from "../modules/messages/generator";

const logger = createLogger("worker");

const WORKER_ID = `worker-${crypto.randomUUID().slice(0, 8)}`;
const HEARTBEAT_INTERVAL_MS = 30_000;
const DISPATCHER_INTERVAL_MS = 20_000;
const GENERATOR_INTERVAL_MS = 15 * 60_000;

let isRunning = true;
let isDispatching = false;

async function writeHeartbeat(): Promise<void> {
	try {
		const now = utcNow();
		await db
			.insert(appSettings)
			.values({
				key: "worker_heartbeat",
				value: {
					atUtc: now.toISOString(),
					workerId: WORKER_ID,
					version: "2.0.0",
				},
				updatedAt: now,
			})
			.onDuplicateKeyUpdate({
				set: {
					value: {
						atUtc: now.toISOString(),
						workerId: WORKER_ID,
						version: "2.0.0",
					},
					updatedAt: now,
				},
			});
	} catch (error) {
		logger.error("Gagal menulis heartbeat worker.", {
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

async function startWorker() {
	logger.info("Memulai worker UNIDA Prayer...", { workerId: WORKER_ID });

	await writeHeartbeat();

	try {
		const rec = await runStartupRecovery();
		logger.info("Startup recovery berhasil.", rec);
	} catch (error) {
		logger.error("Startup recovery mengalami kendala.", {
			error: error instanceof Error ? error.message : String(error),
		});
	}

	try {
		const gen = await generateHorizonMessages();
		logger.info("Pemeriksaan awal horizon pesan berhasil.", {
			totalJobsGenerated: gen.totalJobsGenerated,
			activeTargetsCount: gen.activeTargetsCount,
		});
	} catch (error) {
		logger.error("Pemeriksaan awal generator mengalami kendala.", {
			error: error instanceof Error ? error.message : String(error),
		});
	}

	const heartbeatTimer = setInterval(() => {
		if (!isRunning) return;
		writeHeartbeat();
	}, HEARTBEAT_INTERVAL_MS);

	const dispatcherTimer = setInterval(async () => {
		if (!isRunning || isDispatching) return;
		isDispatching = true;
		try {
			await runDispatcherTick(10);
		} catch (error) {
			logger.error("Tick dispatcher gagal.", {
				error: error instanceof Error ? error.message : String(error),
			});
		} finally {
			isDispatching = false;
		}
	}, DISPATCHER_INTERVAL_MS);

	const generatorTimer = setInterval(async () => {
		if (!isRunning) return;
		try {
			await generateHorizonMessages();
		} catch (error) {
			logger.error("Tick generator gagal.", {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}, GENERATOR_INTERVAL_MS);

	const shutdown = () => {
		logger.info("Menerima sinyal terminasi, mematikan worker...", { workerId: WORKER_ID });
		isRunning = false;
		clearInterval(heartbeatTimer);
		clearInterval(dispatcherTimer);
		clearInterval(generatorTimer);
		setTimeout(() => process.exit(0), 1000);
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}

await startWorker();
