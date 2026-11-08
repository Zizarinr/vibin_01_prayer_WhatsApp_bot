import { fail, ok, type ErrorCode } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { requireAdminAuth } from "../auth/guard";
import { AuthError } from "../auth/service";
import { previewBodySchema, todayQuerySchema } from "./schema";
import {
	getNextPrayerOnly,
	getPublicSettings,
	getTodayPrayer,
	previewPrayerTimes,
} from "./service";

export const prayerRoutes = new Elysia({ prefix: "/api" })
	.get(
		"/public/prayer/today",
		async ({ query }) => {
			const data = await getTodayPrayer(query.date);
			return ok(data);
		},
		{
			query: todayQuerySchema,
		},
	)
	.get("/public/prayer/next", async () => {
		const data = await getNextPrayerOnly();
		return ok(data);
	})
	.get("/public/settings", async () => {
		const data = await getPublicSettings();
		return ok(data);
	})
	.post(
		"/admin/prayer/preview",
		async ({ body, cookie, status }) => {
			try {
				await requireAdminAuth(cookie as Record<string, unknown>);
			} catch (error) {
				if (error instanceof AuthError) {
					return status(error.statusCode, fail(error.code as ErrorCode, error.message));
				}
				return status(401, fail("UNAUTHENTICATED", "Sesi login tidak valid atau telah berakhir."));
			}
			const data = await previewPrayerTimes(body);
			return ok(data);
		},
		{
			body: previewBodySchema,
		},
	);
