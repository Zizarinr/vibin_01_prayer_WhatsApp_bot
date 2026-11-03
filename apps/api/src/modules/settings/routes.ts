import { ok } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { patchSettingsBodySchema } from "./schema";
import { getAdminSettings, updateAdminSettings } from "./service";

export const settingsRoutes = new Elysia({ prefix: "/api/admin/settings" })
	.get("/", async () => {
		const data = await getAdminSettings();
		return ok(data);
	})
	.patch(
		"/",
		async ({ body }) => {
			const data = await updateAdminSettings(body);
			return ok(data);
		},
		{
			body: patchSettingsBodySchema,
		},
	);
