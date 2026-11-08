import { fail, ok } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { requireAdminAuth } from "../auth/guard";
import { AuthError } from "../auth/service";
import {
	createHadithBodySchema,
	getHadithsQuerySchema,
	hadithIdParamSchema,
	updateHadithBodySchema,
} from "./schema";
import {
	createHadith,
	deleteHadith,
	getHadiths,
	HadithNotFoundError,
	HadithValidationError,
	updateHadith,
} from "./service";

export const hadithsRoutes = new Elysia({ prefix: "/api/admin/hadiths" })
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
	.get(
		"/",
		async ({ query }) => {
			const active =
				query.active === undefined
					? undefined
					: query.active === true || String(query.active) === "true";
			const data = await getHadiths({
				active,
				search: query.search,
				page: query.page,
				limit: query.limit,
			});
			return ok(data);
		},
		{
			query: getHadithsQuerySchema,
		},
	)
	.post(
		"/",
		async ({ body, status }) => {
			try {
				const data = await createHadith(body);
				return status(201, ok(data));
			} catch (error) {
				if (error instanceof HadithValidationError) {
					return status(400, fail("VALIDATION_ERROR", error.message));
				}
				throw error;
			}
		},
		{
			body: createHadithBodySchema,
		},
	)
	.patch(
		"/:id",
		async ({ params, body, status }) => {
			try {
				const data = await updateHadith(params.id, body);
				return ok(data);
			} catch (error) {
				if (error instanceof HadithNotFoundError) {
					return status(404, fail("NOT_FOUND", error.message));
				}
				if (error instanceof HadithValidationError) {
					return status(400, fail("VALIDATION_ERROR", error.message));
				}
				throw error;
			}
		},
		{
			params: hadithIdParamSchema,
			body: updateHadithBodySchema,
		},
	)
	.delete(
		"/:id",
		async ({ params, status }) => {
			try {
				const data = await deleteHadith(params.id);
				return ok(data);
			} catch (error) {
				if (error instanceof HadithNotFoundError) {
					return status(404, fail("NOT_FOUND", error.message));
				}
				throw error;
			}
		},
		{
			params: hadithIdParamSchema,
		},
	);
