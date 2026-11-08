import { type ErrorCode, fail, ok } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { WahaError } from "../../integrations/waha";
import { requireAdminAuth } from "../auth/guard";
import { AuthError } from "../auth/service";
import { testMessageSchema } from "./schema";
import {
	fetchQrCode,
	fetchSessionStatus,
	logoutWahaSession,
	restartWahaSession,
	sendTestMessage,
	startWahaSession,
	stopWahaSession,
	syncGroups,
} from "./service";

export const whatsappRoutes = new Elysia({ prefix: "/api/admin/whatsapp" })
	.onBeforeHandle(async ({ cookie, status }) => {
		try {
			await requireAdminAuth(cookie as Record<string, unknown>);
		} catch (error) {
			if (error instanceof AuthError) {
				return status(error.statusCode, { data: null, error: { code: error.code, message: error.message } });
			}
			return status(401, { data: null, error: { code: "UNAUTHENTICATED", message: "Sesi login tidak valid atau telah berakhir." } });
		}
	})
	.onError(({ error, status }) => {
		if (error instanceof WahaError) {
			return status(error.statusCode, fail(error.code as ErrorCode, error.message));
		}
	})
	.get("/session", async () => {
		const data = await fetchSessionStatus();
		return ok(data);
	})
	.post("/session/start", async () => {
		const data = await startWahaSession();
		return ok(data);
	})
	.post("/session/stop", async () => {
		const data = await stopWahaSession();
		return ok(data);
	})
	.post("/session/restart", async () => {
		const data = await restartWahaSession();
		return ok(data);
	})
	.post("/session/logout", async () => {
		const data = await logoutWahaSession();
		return ok(data);
	})
	.get("/session/qr", async () => {
		const data = await fetchQrCode();
		return ok(data);
	})
	.post(
		"/test-message",
		async ({ body }) => {
			const data = await sendTestMessage(
			{ targetId: body.targetId, phone: body.phone },
			body.text,
		);
			return ok(data);
		},
		{
			body: testMessageSchema,
		},
	)
	.post("/groups/sync", async () => {
		const data = await syncGroups();
		return ok(data);
	});
