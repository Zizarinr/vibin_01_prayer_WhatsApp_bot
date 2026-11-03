import { describe, expect, it } from "bun:test";
import { computeIdempotencyKey } from "./generator";

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
});
