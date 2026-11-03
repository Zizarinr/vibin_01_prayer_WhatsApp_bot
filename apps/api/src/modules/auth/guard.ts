import { AuthError, getSessionAdmin } from "./service";

export const SESSION_COOKIE_NAME = "unida_prayer_session";

function tokenFromCookie(cookie: Record<string, unknown>): string | undefined {
	const entry = cookie[SESSION_COOKIE_NAME] as { value?: unknown } | undefined;
	const raw = entry?.value;
	return typeof raw === "string" ? raw : undefined;
}

export async function requireAdminAuth(cookie: Record<string, unknown>) {
	const token = tokenFromCookie(cookie);
	try {
		return await getSessionAdmin(token);
	} catch (error) {
		if (error instanceof AuthError) {
			throw error;
		}
		throw new AuthError("Sesi login tidak valid atau telah berakhir.", 401, "UNAUTHENTICATED");
	}
}

