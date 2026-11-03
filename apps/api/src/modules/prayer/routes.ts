import { ok } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { previewBodySchema, todayQuerySchema } from "./schema";
import {
	getNextPrayerOnly,
	getPublicSettings,
	getTodayPrayer,
	previewPrayerTimes,
} from "./service";

export const prayerRoutes = new Elysia({ prefix: "/api" })
	// Endpoint publik (tanpa autentikasi)
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
	// Endpoint admin (preview hisab tanpa simpan)
	.post(
		"/admin/prayer/preview",
		async ({ body }) => {
			const data = await previewPrayerTimes(body);
			return ok(data);
		},
		{
			body: previewBodySchema,
		},
	);
