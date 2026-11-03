import { fail, ok } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { requireAdmin } from "../auth/guard";
import { patchTargetSchema, targetsQuerySchema } from "./schema";
import {
	getTargetsList,
	TargetNotFoundError,
	updateTargetById,
} from "./service";

export const targetsRoutes = new Elysia({ prefix: "/api/admin/targets" })
	.use(requireAdmin)
	.onError(({ error, status }) => {
		if (error instanceof TargetNotFoundError) {
			return status(404, fail("TARGET_NOT_FOUND", error.message));
		}
	})
	.get(
		"/",
		async ({ query }) => {
			const list = await getTargetsList(query);
			return ok(list);
		},
		{
			query: targetsQuerySchema,
		},
	)
	.patch(
		"/:id",
		async ({ params, body, status }) => {
			const id = Number.parseInt(params.id, 10);
			if (Number.isNaN(id) || id <= 0) {
				return status(400, fail("VALIDATION_ERROR", "ID target tidak valid."));
			}
			const updated = await updateTargetById(id, body);
			return ok(updated);
		},
		{
			body: patchTargetSchema,
		},
	);
