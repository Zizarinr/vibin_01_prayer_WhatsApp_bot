import { describe, expect, test } from "bun:test";
import { fail, JOB_STATUSES, ok, PRAYER_NAMES } from "./index";

describe("shared response helpers", () => {
	test("ok() membungkus data dengan error null", () => {
		expect(ok({ sum: 5 })).toEqual({ data: { sum: 5 }, error: null });
	});

	test("fail() memakai kode dan pesan yang diberikan", () => {
		expect(fail("DB_UNAVAILABLE", "Database tidak dapat dijangkau.")).toEqual({
			data: null,
			error: {
				code: "DB_UNAVAILABLE",
				message: "Database tidak dapat dijangkau.",
			},
		});
	});
});

describe("shared domain constants", () => {
	test("lima waktu shalat terdaftar", () => {
		expect([...PRAYER_NAMES]).toEqual([
			"FAJR",
			"DHUHR",
			"ASR",
			"MAGHRIB",
			"ISHA",
		]);
	});

	test("status UNKNOWN tersedia untuk hasil ambigu", () => {
		expect([...JOB_STATUSES]).toContain("UNKNOWN");
	});
});
