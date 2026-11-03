import { describe, expect, it } from "bun:test";
import { WahaError } from "./types";

describe("apps/api/integrations/waha", () => {
	it("membuat WahaError dengan kode status dan error code yang benar", () => {
		const err = new WahaError("Sesi WAHA gagal", 502, "WAHA_UPSTREAM_ERROR");
		expect(err.message).toBe("Sesi WAHA gagal");
		expect(err.statusCode).toBe(502);
		expect(err.code).toBe("WAHA_UPSTREAM_ERROR");
	});

	it("memetakan error status 401 dan 403 dengan pesan yang jelas", () => {
		const authErr = new WahaError(
			"Kredensial WAHA salah / API key tidak valid.",
			502,
			"WAHA_UPSTREAM_ERROR",
		);
		expect(authErr.statusCode).toBe(502);
		expect(authErr.message).toContain("API key");
	});

	it("memetakan error status 429 untuk rate limit WAHA", () => {
		const rateErr = new WahaError(
			"Permintaan dibatasi oleh layanan WAHA (rate limited).",
			429,
			"RATE_LIMITED",
		);
		expect(rateErr.statusCode).toBe(429);
		expect(rateErr.code).toBe("RATE_LIMITED");
	});
});
