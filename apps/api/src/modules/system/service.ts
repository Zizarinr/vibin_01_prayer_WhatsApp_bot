import { createLogger } from "../../core/logger";
import { pingDatabase } from "../../database/client";

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
