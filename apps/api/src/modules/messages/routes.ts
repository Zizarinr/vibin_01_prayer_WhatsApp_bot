import { fail, ok } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { requireAdminAuth } from "../auth/guard";
import { AuthError } from "../auth/service";
import { recalculateFuturePending } from "./generator";
import { getMessagesQuerySchema, messageIdParamSchema } from "./schema";
import {
	cancelMessage,
	getMessageById,
	getMessages,
	MessageActionInvalidError,
	MessageNotFoundError,
	retryMessage,
} from "./service";

export const messagesRoutes = new Elysia({ prefix: "/api/admin" })
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
	// Recalculate (sync)
	.post("/prayer/recalculate", async () => {
		const result = await recalculateFuturePending();
		return ok(result);
	})
	// List messages dengan filter & pagination
	.get(
		"/messages",
		async ({ query }) => {
			const data = await getMessages(query);
			return ok(data);
		},
		{
			query: getMessagesQuerySchema,
		},
	)
	// Detail pesan
	.get(
		"/messages/:id",
		async ({ params, status }) => {
			try {
				const data = await getMessageById(params.id);
				return ok(data);
			} catch (error) {
				if (error instanceof MessageNotFoundError) {
					return status(404, fail("NOT_FOUND", error.message));
				}
				throw error;
			}
		},
		{
			params: messageIdParamSchema,
		},
	)
	// Retry pesan manual
	.post(
		"/messages/:id/retry",
		async ({ params, status }) => {
			try {
				const data = await retryMessage(params.id);
				return ok(data);
			} catch (error) {
				if (error instanceof MessageNotFoundError) {
					return status(404, fail("NOT_FOUND", error.message));
				}
				if (error instanceof MessageActionInvalidError) {
					return status(422, fail("BUSINESS_RULE_VIOLATION", error.message));
				}
				throw error;
			}
		},
		{
			params: messageIdParamSchema,
		},
	)
	// Cancel pesan manual
	.post(
		"/messages/:id/cancel",
		async ({ params, status }) => {
			try {
				const data = await cancelMessage(params.id);
				return ok(data);
			} catch (error) {
				if (error instanceof MessageNotFoundError) {
					return status(404, fail("NOT_FOUND", error.message));
				}
				if (error instanceof MessageActionInvalidError) {
					return status(422, fail("BUSINESS_RULE_VIOLATION", error.message));
				}
				throw error;
			}
		},
		{
			params: messageIdParamSchema,
		},
	);
