/**
 * Konfigurasi rute path admin dari environment variable.
 * Default fallback adalah "/admin" bila NEXT_PUBLIC_ADMIN_PATH tidak disetel.
 */
function normalizeAdminPath(raw: string | undefined): string {
	const trimmed = (raw ?? "").trim();
	if (!trimmed || trimmed === "undefined" || trimmed === "null") return "/admin";
	const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
	return withSlash.replace(/\/+$/, "") || "/admin";
}

export const ADMIN_BASE_PATH = normalizeAdminPath(process.env.NEXT_PUBLIC_ADMIN_PATH);

export const LOGIN_ROUTE = `${ADMIN_BASE_PATH}/login`;

export function adminRoute(path = ""): string {
	if (!path || path === "/" || path === "") {
		return ADMIN_BASE_PATH;
	}
	const clean = path.startsWith("/") ? path : `/${path}`;
	return `${ADMIN_BASE_PATH}${clean}`;
}
