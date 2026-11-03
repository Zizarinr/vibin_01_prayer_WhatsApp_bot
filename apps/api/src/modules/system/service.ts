import { desc, eq, sql } from "drizzle-orm";
import { config } from "../../core/config";
import { createLogger } from "../../core/logger";
import { utcNow } from "../../core/time";
import { db, pingDatabase } from "../../database/client";
import { appSettings } from "../../database/schema/appSettings";
import { scheduledMessages } from "../../database/schema/messages";
import { messageTargets } from "../../database/schema/targets";
import { waha } from "../../integrations/waha";

const logger = createLogger("api");

export interface HealthStatus {
	status: "ok";
	uptimeSeconds: number;
	timestampUtc: string;
}

export interface ReadinessStatus {
	api: "ok";
	database: { ok: boolean; latencyMs: number };
	timestampUtc: string;
}

export interface WorkerHeartbeatInfo {
	atUtc: string;
	workerId: string;
	version?: string;
}

export interface SystemStatusData {
	api: "ok";
	database: { ok: boolean; latencyMs: number };
	worker: {
		state: "HEALTHY" | "WARNING" | "OFFLINE";
		lastHeartbeatAt: string | null;
		workerId: string | null;
	};
	waha: {
		status: string;
		session: string;
	};
	counts: {
		todaySent: number;
		pending: number;
		failed: number;
		unknown: number;
		totalTargets: number;
		activeTargets: number;
	};
	recent: Array<{
		id: number;
		prayerName: string;
		messageType: string;
		targetName: string;
		status: string;
		scheduledAtUtc: Date;
		sentAtUtc: Date | null;
		lastError: string | null;
	}>;
	timestampUtc: string;
}

const bootTime = Date.now();

export function getHealth(): HealthStatus {
	return {
		status: "ok",
		uptimeSeconds: Math.floor((Date.now() - bootTime) / 1000),
		timestampUtc: new Date().toISOString(),
	};
}

export class DatabaseUnavailableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DatabaseUnavailableError";
	}
}

export async function getReadiness(): Promise<ReadinessStatus> {
	try {
		const database = await pingDatabase();
		return { api: "ok", database, timestampUtc: new Date().toISOString() };
	} catch (error) {
		logger.error("Readiness database ping gagal.", {
			error: error instanceof Error ? error.message : String(error),
		});
		throw new DatabaseUnavailableError("Database tidak dapat dijangkau.");
	}
}

export async function getSystemStatus(): Promise<SystemStatusData> {
	const now = utcNow();

	// 1. Database
	let dbStatus = { ok: false, latencyMs: 0 };
	try {
		dbStatus = await pingDatabase();
	} catch {
		dbStatus = { ok: false, latencyMs: 0 };
	}

	// 2. Worker heartbeat
	let workerState: "HEALTHY" | "WARNING" | "OFFLINE" = "OFFLINE";
	let lastHeartbeatAt: string | null = null;
	let workerId: string | null = null;

	const hbRow = await db
		.select()
		.from(appSettings)
		.where(eq(appSettings.key, "worker_heartbeat"))
		.limit(1);

	if (hbRow[0]?.value) {
		const hb = hbRow[0].value as WorkerHeartbeatInfo;
		if (hb && hb.atUtc) {
			lastHeartbeatAt = hb.atUtc;
			workerId = hb.workerId ?? null;
			const hbTime = new Date(hb.atUtc).getTime();
			const diffSeconds = (now.getTime() - hbTime) / 1000;
			if (diffSeconds < 90) {
				workerState = "HEALTHY";
			} else if (diffSeconds < 300) {
				workerState = "WARNING";
			} else {
				workerState = "OFFLINE";
			}
		}
	}

	// 3. WAHA status
	let wahaStatusStr = "UNKNOWN";
	try {
		const wRes = await waha.sessions.getStatus(config.wahaSession);
		wahaStatusStr = wRes.status;
	} catch {
		wahaStatusStr = "OFFLINE";
	}

	// 4. Message counts
	const todayDateStr = now.toISOString().slice(0, 10);
	const countsRes = await db
		.select({
			todaySent: sql<number>`SUM(CASE WHEN ${scheduledMessages.status} = 'SENT' AND ${scheduledMessages.prayerDate} = ${todayDateStr} THEN 1 ELSE 0 END)`,
			pending: sql<number>`SUM(CASE WHEN ${scheduledMessages.status} = 'PENDING' THEN 1 ELSE 0 END)`,
			failed: sql<number>`SUM(CASE WHEN ${scheduledMessages.status} = 'FAILED' THEN 1 ELSE 0 END)`,
			unknown: sql<number>`SUM(CASE WHEN ${scheduledMessages.status} = 'UNKNOWN' THEN 1 ELSE 0 END)`,
		})
		.from(scheduledMessages);

	const counts = {
		todaySent: Number(countsRes[0]?.todaySent ?? 0),
		pending: Number(countsRes[0]?.pending ?? 0),
		failed: Number(countsRes[0]?.failed ?? 0),
		unknown: Number(countsRes[0]?.unknown ?? 0),
		totalTargets: 0,
		activeTargets: 0,
	};

	// Target counts
	const targetCountsRes = await db
		.select({
			total: sql<number>`count(*)`,
			active: sql<number>`SUM(CASE WHEN ${messageTargets.isActive} = 1 THEN 1 ELSE 0 END)`,
		})
		.from(messageTargets);

	counts.totalTargets = Number(targetCountsRes[0]?.total ?? 0);
	counts.activeTargets = Number(targetCountsRes[0]?.active ?? 0);

	// 5. Recent 5 messages
	const recentRows = await db
		.select({
			id: scheduledMessages.id,
			prayerName: scheduledMessages.prayerName,
			messageType: scheduledMessages.messageType,
			status: scheduledMessages.status,
			scheduledAtUtc: scheduledMessages.scheduledAtUtc,
			sentAtUtc: scheduledMessages.sentAtUtc,
			lastError: scheduledMessages.lastError,
			targetName: messageTargets.name,
		})
		.from(scheduledMessages)
		.leftJoin(messageTargets, eq(scheduledMessages.targetId, messageTargets.id))
		.orderBy(desc(scheduledMessages.updatedAt))
		.limit(5);

	const recent = recentRows.map((r) => ({
		id: r.id,
		prayerName: r.prayerName,
		messageType: r.messageType,
		targetName: r.targetName ?? "(Target Tidak Diketahui)",
		status: r.status,
		scheduledAtUtc: r.scheduledAtUtc,
		sentAtUtc: r.sentAtUtc,
		lastError: r.lastError,
	}));

	return {
		api: "ok",
		database: dbStatus,
		worker: {
			state: workerState,
			lastHeartbeatAt,
			workerId,
		},
		waha: {
			status: wahaStatusStr,
			session: config.wahaSession,
		},
		counts,
		recent,
		timestampUtc: now.toISOString(),
	};
}
