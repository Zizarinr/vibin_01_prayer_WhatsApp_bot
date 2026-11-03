import { fail, ok } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { requireAdmin } from "../auth/guard";
import { patchSettingsBodySchema } from "./schema";
import { getAdminSettings, updateAdminSettings } from "./service";

export const settingsRoutes = new Elysia({ prefix: "/api/admin/settings" })
	.use(requireAdmin)
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
