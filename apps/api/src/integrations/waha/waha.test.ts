import { describe, expect, it } from "bun:test";
import { sendTextMessage } from "./messages";
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

	it("mengirim payload dengan linkPreview: true secara default", async () => {
		const originalFetch = globalThis.fetch;
		let capturedBody: { linkPreview?: boolean; chatId?: string } | undefined;
		globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
			capturedBody = JSON.parse(init?.body as string);
			return new Response(JSON.stringify({ id: "msg_123", timestamp: 12345 }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}) as typeof fetch;

		try {
			const res = await sendTextMessage({
				chatId: "12036301@g.us",
				text: "Jadwal: https://prayer.unida.gontor.ac.id",
			});
			expect(res.id).toBe("msg_123");
			expect(capturedBody?.linkPreview).toBe(true);
			expect(capturedBody?.chatId).toBe("12036301@g.us");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("menghormati linkPreview: false bila ditentukan secara eksplisit", async () => {
		const originalFetch = globalThis.fetch;
		let capturedBody: { linkPreview?: boolean; chatId?: string } | undefined;
		globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
			capturedBody = JSON.parse(init?.body as string);
			return new Response(JSON.stringify({ id: "msg_124" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}) as typeof fetch;

		try {
			const res = await sendTextMessage({
				chatId: "12036301@g.us",
				text: "Jadwal tanpa preview",
				linkPreview: false,
			});
			expect(res.id).toBe("msg_124");
			expect(capturedBody?.linkPreview).toBe(false);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
