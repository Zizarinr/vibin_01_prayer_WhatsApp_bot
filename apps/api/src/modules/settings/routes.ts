import { fail, ok } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { requireAdminAuth } from "../auth/guard";
import { AuthError } from "../auth/service";
import { patchSettingsBodySchema } from "./schema";
import { getAdminSettings, updateAdminSettings } from "./service";

export const settingsRoutes = new Elysia({ prefix: "/api/admin/settings" })
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
	.get("/", async () => {
		const data = await getAdminSettings();
		return ok(data);
	})
	.patch(
		"/",
		async ({ body, status }) => {
			try {
				const data = await updateAdminSettings(body);
				return ok(data);
			} catch (error) {
				if (error instanceof Error && error.message.startsWith("Timezone tidak valid")) {
					return status(400, fail("VALIDATION_ERROR", error.message));
				}
				throw error;
			}
		},
		{
			body: patchSettingsBodySchema,
		},
	);
