import { createLogger } from "../core/logger";
import { utcNow } from "../core/time";
import { db } from "../database/client";
import { appSettings } from "../database/schema/appSettings";
import { runDispatcherTick, runStartupRecovery } from "../modules/messages/dispatcher";
import { generateHorizonMessages } from "../modules/messages/generator";

const logger = createLogger("worker");

const WORKER_ID = `worker-${crypto.randomUUID().slice(0, 8)}`;
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 dtk
const DISPATCHER_INTERVAL_MS = 20_000; // 20 dtk
const GENERATOR_INTERVAL_MS = 15 * 60_000; // 15 menit

let isRunning = true;
let isDispatching = false;

async function writeHeartbeat(): Promise<void> {
	try {
		await db
			.insert(appSettings)
			.values({
				key: "worker_heartbeat",
				value: {
					atUtc: utcNow().toISOString(),
					workerId: WORKER_ID,
					version: "2.0.0",
				},
			})
			.onDuplicateKeyUpdate({
				set: {
					value: {
						atUtc: utcNow().toISOString(),
						workerId: WORKER_ID,
						version: "2.0.0",
					},
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

	// 1. Tulis heartbeat awal
	await writeHeartbeat();

	// 2. Jalankan startup recovery (stale PROCESSING & expired PENDING)
	try {
		const rec = await runStartupRecovery();
		logger.info("Startup recovery berhasil.", rec);
	} catch (error) {
		logger.error("Startup recovery mengalami kendala.", {
			error: error instanceof Error ? error.message : String(error),
		});
	}

	// 3. Fulfill 7-hari horizon messages
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

	// 4. Timer Heartbeat
	const heartbeatTimer = setInterval(() => {
		if (!isRunning) return;
		writeHeartbeat();
	}, HEARTBEAT_INTERVAL_MS);

	// 5. Timer Dispatcher
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

	// 6. Timer Generator Horizon
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

	// Graceful shutdown
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
