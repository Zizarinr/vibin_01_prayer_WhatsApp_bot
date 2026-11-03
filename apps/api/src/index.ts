import cors from "@elysiajs/cors";
import { fail } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { config } from "./core/config";
import { createLogger } from "./core/logger";
import { authRoutes } from "./modules/auth/routes";
import { hadithsRoutes } from "./modules/hadiths/routes";
import { messagesRoutes } from "./modules/messages/routes";
import { prayerRoutes } from "./modules/prayer/routes";
import { settingsRoutes } from "./modules/settings/routes";
import { systemRoutes } from "./modules/system/routes";
import { targetsRoutes } from "./modules/targets/routes";
import { whatsappRoutes } from "./modules/whatsapp/routes";

const logger = createLogger("api");

const app = new Elysia()
	.use(
		cors({
			origin: true,
			credentials: true,
		}),
	)
	.onError(({ code, error, status }) => {
		// Jangan bocorkan stack trace / detail internal ke klien.
		if (code === "NOT_FOUND") {
			return status(404, fail("NOT_FOUND", "Endpoint tidak ditemukan."));
		}
		if (code === "VALIDATION") {
			return status(400, fail("VALIDATION_ERROR", "Request tidak valid."));
		}
		logger.error("Request gagal.", {
			error: error instanceof Error ? error.message : String(error),
		});
		return status(500, fail("INTERNAL_ERROR", "Terjadi kesalahan internal."));
	})
	.use(systemRoutes)
	.use(authRoutes)
	.use(prayerRoutes)
	.use(whatsappRoutes)
	.use(targetsRoutes)
	.use(messagesRoutes)
	.use(hadithsRoutes)
	.use(settingsRoutes)
	.listen(config.port);

logger.info("API berjalan.", {
	port: config.port,
	nodeEnv: config.nodeEnv,
	wahaSession: config.wahaSession,
});

export type App = typeof app;
