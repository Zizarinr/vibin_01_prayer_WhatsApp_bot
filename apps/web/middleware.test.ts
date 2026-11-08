import { describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

describe("middleware secret admin routing", () => {
	const originalAdminPath = process.env.NEXT_PUBLIC_ADMIN_PATH;

	it("memblokir /admin dan /login langsung (404) bila kustom path diatur", () => {
		process.env.NEXT_PUBLIC_ADMIN_PATH = "/pengurus-siman";

		const reqAdmin = new NextRequest("http://localhost:3000/admin");
		const resAdmin = middleware(reqAdmin);
		expect(resAdmin.status).toBe(404);

		const reqLogin = new NextRequest("http://localhost:3000/login");
		const resLogin = middleware(reqLogin);
		expect(resLogin.status).toBe(404);
	});

	it("me-rewrite kustom path /login ke form /login", () => {
		process.env.NEXT_PUBLIC_ADMIN_PATH = "/pengurus-siman";

		const req = new NextRequest("http://localhost:3000/pengurus-siman/login");
		const res = middleware(req);
		expect(res.headers.get("x-middleware-rewrite")).toContain("/login");
	});

	it("me-redirect kustom path ke login jika belum ada session cookie", () => {
		process.env.NEXT_PUBLIC_ADMIN_PATH = "/pengurus-siman";

		const req = new NextRequest("http://localhost:3000/pengurus-siman");
		const res = middleware(req);
		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toContain("/pengurus-siman/login");
	});

	it("me-rewrite kustom path ke /admin jika sudah ada session cookie", () => {
		process.env.NEXT_PUBLIC_ADMIN_PATH = "/pengurus-siman";

		const req = new NextRequest("http://localhost:3000/pengurus-siman", {
			headers: {
				cookie: "unida_prayer_session=valid-session-token",
			},
		});
		const res = middleware(req);
		expect(res.headers.get("x-middleware-rewrite")).toContain("/admin");
	});

	it("me-rewrite subpath kustom (mis. /prayer) ke /admin/prayer", () => {
		process.env.NEXT_PUBLIC_ADMIN_PATH = "/pengurus-siman";

		const req = new NextRequest("http://localhost:3000/pengurus-siman/prayer", {
			headers: {
				cookie: "unida_prayer_session=valid-session-token",
			},
		});
		const res = middleware(req);
		expect(res.headers.get("x-middleware-rewrite")).toContain("/admin/prayer");
	});

	it("membiarkan rute landing / tanpa intervensi", () => {
		process.env.NEXT_PUBLIC_ADMIN_PATH = "/pengurus-siman";

		const req = new NextRequest("http://localhost:3000/");
		const res = middleware(req);
		expect(res.headers.get("x-middleware-rewrite")).toBeNull();
		expect(res.status).toBe(200);

		// Restore env
		process.env.NEXT_PUBLIC_ADMIN_PATH = originalAdminPath;
	});
});
