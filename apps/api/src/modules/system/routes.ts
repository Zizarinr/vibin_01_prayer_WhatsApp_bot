import { fail, ok, type ErrorCode } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { AuthError } from "../auth/service";
import { requireAdminAuth } from "../auth/guard";
import {
	DatabaseUnavailableError,
	getHealth,
	getReadiness,
	getSystemStatus,
} from "./service";

/**
 * GET /api/health       — liveness proses (tanpa cek DB).
 * GET /api/ready        — kesiapan (cek DB; 503 bila belum siap).
 * GET /api/admin/system/status — status sistem lengkap untuk dashboard admin.
 */
export const systemRoutes = new Elysia({ prefix: "/api" })
	.get("/health", () => ok(getHealth()))
	.get("/ready", async ({ status }) => {
		try {
			return ok(await getReadiness());
		} catch (error) {
			if (error instanceof DatabaseUnavailableError) {
				return status(503, fail("DB_UNAVAILABLE", error.message));
			}
			throw error;
		}
	})
	.get("/admin/system/status", async ({ cookie, status }) => {
		try {
			await requireAdminAuth(cookie as Record<string, unknown>);
		} catch (error) {
			if (error instanceof AuthError) {
				return status(error.statusCode, fail(error.code as ErrorCode, error.message));
			}
			return status(401, fail("UNAUTHENTICATED", "Sesi login tidak valid atau telah berakhir."));
		}
		const data = await getSystemStatus();
		return ok(data);
	});
