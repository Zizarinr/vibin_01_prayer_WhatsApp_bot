import { fail, ok } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { requireAdmin } from "../auth/guard";
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
	.use(requireAdmin)
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
