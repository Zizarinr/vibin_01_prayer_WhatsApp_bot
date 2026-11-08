import { ok } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { requireAdminAuth } from "../auth/guard";
import { AuthError } from "../auth/service";
import { geocodingReverseQuerySchema, geocodingSearchQuerySchema } from "./schema";
import { reverseGeocodeLocation, searchLocations } from "./service";

export const geocodingRoutes = new Elysia({ prefix: "/api/admin/geocoding" })
	.onBeforeHandle(async ({ cookie, status }) => {
		try {
			await requireAdminAuth(cookie as Record<string, unknown>);
		} catch (error) {
			if (error instanceof AuthError) {
				return status(error.statusCode, { data: null, error: { code: error.code, message: error.message } });
			}
			return status(401, {
				data: null,
				error: { code: "UNAUTHENTICATED", message: "Sesi login tidak valid atau telah berakhir." },
			});
		}
	})
	.get(
		"/search",
		async ({ query }) => {
			const results = await searchLocations(query.q);
			return ok(results);
		},
		{
			query: geocodingSearchQuerySchema,
		},
	)
	.get(
		"/reverse",
		async ({ query }) => {
			const result = await reverseGeocodeLocation(Number(query.lat), Number(query.lon));
			return ok(result);
		},
		{
			query: geocodingReverseQuerySchema,
		},
	);
