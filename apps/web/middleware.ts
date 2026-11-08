import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	// Mode development lokal (NODE_ENV=development): tanpa login, akses path
	// admin langsung masuk. Tidak aktif di production (NODE_ENV=production).
	if (process.env.NODE_ENV === "development") {
		return NextResponse.next();
	}

	const rawAdminPath =
		process.env.NEXT_PUBLIC_ADMIN_PATH ||
		process.env.ADMIN_PATH ||
		"/admin";
	const adminBasePath = rawAdminPath.replace(/\/+$/, "") || "/admin";
	const pathname = request.nextUrl.pathname;

	// 1. Jika rute kustom diaktifkan (bukan "/admin"), blokir akses langsung ke "/admin" atau "/login" default
	if (adminBasePath !== "/admin") {
		if (pathname === "/admin" || pathname.startsWith("/admin/")) {
			return NextResponse.rewrite(new URL("/not-found", request.url), { status: 404 });
		}
		if (pathname === "/login" || pathname.startsWith("/login/")) {
			return NextResponse.rewrite(new URL("/not-found", request.url), { status: 404 });
		}
	}

	// 2. Tangani rute rahasia yang cocok dengan adminBasePath
	if (pathname === adminBasePath || pathname.startsWith(`${adminBasePath}/`)) {
		const subpath = pathname.slice(adminBasePath.length);

		// Akses ke form login khusus
		if (subpath === "/login") {
			return NextResponse.rewrite(new URL("/login", request.url));
		}

		// Cek session cookie untuk strict login requirement
		const sessionCookie = request.cookies.get("unida_prayer_session")?.value;
		if (!sessionCookie) {
			const loginTarget = adminBasePath === "/admin" ? "/login" : `${adminBasePath}/login`;
			const loginUrl = new URL(loginTarget, request.url);
			return NextResponse.redirect(loginUrl);
		}

		// Terautentikasi -> rewrite ke rute internal /admin
		const targetInternalPath = subpath ? `/admin${subpath}` : "/admin";
		return NextResponse.rewrite(new URL(targetInternalPath, request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - api (API endpoints)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - backgrounds (background images)
		 * - Static public files (favicon.ico, manifest.json, png icons, etc.)
		 */
		"/((?!api|_next/static|_next/image|backgrounds|favicon.ico|manifest.json|apple-touch-icon.png|app-icon-.*\\.png|favicon-.*\\.png|og-image.png).*)",
	],
};
