import { fail, ok, type ErrorCode } from "@unida-prayer/shared";
import { Elysia } from "elysia";
import { config } from "../../core/config";
import { SESSION_COOKIE_NAME } from "./guard";
import { changePasswordBodySchema, loginBodySchema } from "./schema";
import {
	AuthError,
	changeAdminPassword,
	getSessionAdmin,
	loginAdmin,
	logoutAdmin,
} from "./service";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
	// POST /api/auth/login
	.post(
		"/login",
		async ({ body, cookie, status }) => {
			try {
				const { admin, token } = await loginAdmin(body.email, body.password);

				const sessionCookie = cookie[SESSION_COOKIE_NAME];
				sessionCookie?.set({
					value: token,
					httpOnly: true,
					path: "/",
					sameSite: "lax",
					secure: config.nodeEnv === "production",
					maxAge: 7 * 24 * 60 * 60, // 7 hari
				});

				return ok(admin);
			} catch (error) {
				if (error instanceof AuthError) {
					return status(error.statusCode, fail(error.code as ErrorCode, error.message));
				}
				throw error;
			}
		},
		{
			body: loginBodySchema,
		},
	)
	// POST /api/auth/logout
	.post("/logout", ({ cookie }) => {
		const rawToken = cookie[SESSION_COOKIE_NAME]?.value;
		const token = typeof rawToken === "string" ? rawToken : undefined;
		logoutAdmin(token);
		cookie[SESSION_COOKIE_NAME]?.remove();
		return ok({ success: true });
	})
	// GET /api/auth/me
	.get("/me", async ({ cookie, status }) => {
		try {
			const rawToken = cookie[SESSION_COOKIE_NAME]?.value;
			const token = typeof rawToken === "string" ? rawToken : undefined;
			const admin = await getSessionAdmin(token);
			return ok(admin);
		} catch (error) {
			if (error instanceof AuthError) {
				return status(error.statusCode, fail(error.code as ErrorCode, error.message));
			}
			throw error;
		}
	})
	// POST /api/auth/change-password
	.post(
		"/change-password",
		async ({ body, cookie, status }) => {
			try {
				const rawToken = cookie[SESSION_COOKIE_NAME]?.value;
				const token = typeof rawToken === "string" ? rawToken : undefined;
				const admin = await getSessionAdmin(token);
				if (admin.id === 0) {
					return status(400, fail("VALIDATION_ERROR", "Ganti kata sandi nonaktif dalam mode development (bypass login)."));
				}
				await changeAdminPassword(admin.id, body.oldPassword, body.newPassword);
				cookie[SESSION_COOKIE_NAME]?.remove();
				return ok({ success: true, message: "Kata sandi berhasil diperbarui. Silakan login kembali." });
			} catch (error) {
				if (error instanceof AuthError) {
					return status(error.statusCode, fail(error.code as ErrorCode, error.message));
				}
				throw error;
			}
		},
		{
			body: changePasswordBodySchema,
		},
	);
