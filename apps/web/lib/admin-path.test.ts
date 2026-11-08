import { describe, expect, it } from "bun:test";
import { adminRoute, ADMIN_BASE_PATH, LOGIN_ROUTE } from "./admin-path";

describe("admin-path helper", () => {
	it("menyediakan ADMIN_BASE_PATH dengan fallback /admin", () => {
		expect(ADMIN_BASE_PATH).toBeDefined();
		expect(ADMIN_BASE_PATH.startsWith("/")).toBe(true);
	});

	it("LOGIN_ROUTE selalu berakhiran /login dengan prefix base path", () => {
		expect(LOGIN_ROUTE).toBe(`${ADMIN_BASE_PATH}/login`);
	});

	it("adminRoute() mengembalikan base path bila tanpa argumen atau '/'", () => {
		expect(adminRoute()).toBe(ADMIN_BASE_PATH);
		expect(adminRoute("")).toBe(ADMIN_BASE_PATH);
		expect(adminRoute("/")).toBe(ADMIN_BASE_PATH);
	});

	it("adminRoute('/prayer') menghasilkan prefix yang benar", () => {
		expect(adminRoute("/prayer")).toBe(`${ADMIN_BASE_PATH}/prayer`);
		expect(adminRoute("prayer")).toBe(`${ADMIN_BASE_PATH}/prayer`);
	});

	it("adminRoute('/messages?status=FAILED') mempertahankan query string", () => {
		expect(adminRoute("/messages?status=FAILED")).toBe(
			`${ADMIN_BASE_PATH}/messages?status=FAILED`,
		);
	});
});
