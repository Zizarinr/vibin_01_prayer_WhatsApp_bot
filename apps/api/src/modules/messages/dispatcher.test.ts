import { describe, expect, it } from "bun:test";
import { getBackoffMs } from "./dispatcher";

describe("messages/dispatcher", () => {
	it("menghitung interval backoff secara bertingkat: 30s -> 2m -> 5m", () => {
		expect(getBackoffMs(1)).toBe(30 * 1000);
		expect(getBackoffMs(2)).toBe(120 * 1000);
		expect(getBackoffMs(3)).toBe(300 * 1000);
		expect(getBackoffMs(4)).toBe(300 * 1000);
	});
});
