import { describe, expect, it } from "bun:test";
import { computeIdempotencyKey, isRegeneratableRow } from "./generator";
import { MANUAL_CANCEL_PREFIX } from "./service";

describe("messages/generator", () => {
	it("menghasilkan idempotency_key deterministik dengan sha256 64-karakter", () => {
		const key1 = computeIdempotencyKey("2026-11-04", "FAJR", "ADHAN", 1);
		const key2 = computeIdempotencyKey("2026-11-04", "FAJR", "ADHAN", 1);
		const keyDiff = computeIdempotencyKey("2026-11-04", "FAJR", "PRE_REMINDER", 1);

		expect(key1).toBe(key2);
		expect(key1.length).toBe(64);
		expect(key1).not.toBe(keyDiff);
	});

	it("membedakan idempotency_key antar target yang berbeda", () => {
		const keyTarget1 = computeIdempotencyKey("2026-11-04", "MAGHRIB", "ADHAN", 1);
		const keyTarget2 = computeIdempotencyKey("2026-11-04", "MAGHRIB", "ADHAN", 2);

		expect(keyTarget1).not.toBe(keyTarget2);
	});

	it("hanya draf CANCELLED non-manual yang boleh diregenerasi", () => {
		expect(isRegeneratableRow("CANCELLED", "Dibatalkan karena perhitungan hisab.")).toBe(true);
		expect(isRegeneratableRow("CANCELLED", "Dibatalkan otomatis: template kedaluwarsa.")).toBe(
			true,
		);
		expect(isRegeneratableRow("CANCELLED", null)).toBe(true);
		expect(
			isRegeneratableRow("CANCELLED", `${MANUAL_CANCEL_PREFIX} oleh administrator pada X.`),
		).toBe(false);
		expect(isRegeneratableRow("PENDING", null)).toBe(false);
		expect(isRegeneratableRow("SENT", null)).toBe(false);
		expect(isRegeneratableRow("FAILED", null)).toBe(false);
		expect(isRegeneratableRow("PROCESSING", null)).toBe(false);
		expect(isRegeneratableRow("EXPIRED", null)).toBe(false);
		expect(isRegeneratableRow("UNKNOWN", null)).toBe(false);
	});
});
