import cors from "@elysiajs/cors";
import { type ErrorCode, fail } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { config } from "./core/config";
import { createLogger } from "./core/logger";
import { WahaError } from "./integrations/waha";
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
	// Mode development (localhost): CORS dibuka (origin apa pun) agar frontend
	// dev tidak terhambat. Production: hanya allowlist config.corsOrigins.
	.use(
		cors({
			origin: config.isDev ? true : config.corsOrigins.length > 0 ? config.corsOrigins : false,
			credentials: true,
		}),
	)
	.onError(({ code, error, status }) => {
		// Jangan bocorkan stack trace / detail internal ke klien.
		if (error instanceof WahaError) {
			return status(error.statusCode, fail(error.code as ErrorCode, error.message));
		}
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
	devBypass: config.isDev,
	wahaSession: config.wahaSession,
});

if (config.isDev) {
	logger.warn(
		"MODE DEVELOPMENT AKTIF: login admin di-bypass + CORS longgar. Jangan pakai .env ini di server produksi (wajib NODE_ENV=production).",
		{},
	);
}

export type App = typeof app;
