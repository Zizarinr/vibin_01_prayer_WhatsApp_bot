/**
 * Konfigurasi rute path admin dari environment variable.
 * Default fallback adalah "/admin" bila NEXT_PUBLIC_ADMIN_PATH tidak disetel.
 */
export const ADMIN_BASE_PATH = (
	process.env.NEXT_PUBLIC_ADMIN_PATH || "/admin"
).replace(/\/+$/, "") || "/admin";

export const LOGIN_ROUTE = `${ADMIN_BASE_PATH}/login`;

export function adminRoute(path = ""): string {
	if (!path || path === "/" || path === "") {
		return ADMIN_BASE_PATH;
	}
	const clean = path.startsWith("/") ? path : `/${path}`;
	return `${ADMIN_BASE_PATH}${clean}`;
}
