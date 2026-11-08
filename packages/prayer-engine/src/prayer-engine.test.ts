import { describe, expect, it } from "bun:test";
import {
	calcPrayerTimes,
	formatHijri,
	getNextPrayer,
	getPrayerDisplayName,
	isFriday,
} from "./index";

describe("packages/prayer-engine", () => {
	const defaultInput = {
		dateLocal: "2026-11-04",
		latitude: -7.8652,
		longitude: 111.4617,
		timezone: "Asia/Jakarta",
		fajrAngle: 20.0,
		ishaAngle: 18.0,
		asrFactor: 1 as const,
		adjustmentsMinutes: {},
	};

	it("menghitung 5 waktu shalat + terbit secara kronologis berurutan", () => {
		const res = calcPrayerTimes(defaultInput);
		const { fajrUtc, sunriseUtc, dhuhrUtc, asrUtc, maghribUtc, ishaUtc } =
			res.utc;

		expect(fajrUtc.getTime()).toBeLessThan(sunriseUtc.getTime());
		expect(sunriseUtc.getTime()).toBeLessThan(dhuhrUtc.getTime());
		expect(dhuhrUtc.getTime()).toBeLessThan(asrUtc.getTime());
		expect(asrUtc.getTime()).toBeLessThan(maghribUtc.getTime());
		expect(maghribUtc.getTime()).toBeLessThan(ishaUtc.getTime());

		expect(res.times.FAJR.displayName).toBe("Subuh");
		expect(res.times.DHUHR.displayName).toBe("Dzuhur");
		expect(res.times.ASR.displayName).toBe("Ashar");
		expect(res.times.MAGHRIB.displayName).toBe("Maghrib");
		expect(res.times.ISHA.displayName).toBe("Isya");
	});

	it("menerapkan koreksi menit (adjustments) tepat per waktu", () => {
		const base = calcPrayerTimes(defaultInput);
		const adjusted = calcPrayerTimes({
			...defaultInput,
			adjustmentsMinutes: {
				FAJR: 2,
				DHUHR: -3,
			},
		});

		expect(adjusted.utc.fajrUtc.getTime() - base.utc.fajrUtc.getTime()).toBe(
			2 * 60 * 1000,
		);
		expect(adjusted.utc.dhuhrUtc.getTime() - base.utc.dhuhrUtc.getTime()).toBe(
			-3 * 60 * 1000,
		);
		expect(adjusted.utc.asrUtc.getTime()).toBe(base.utc.asrUtc.getTime());
		expect(adjusted.utc.maghribUtc.getTime()).toBe(base.utc.maghribUtc.getTime());
	});

	it("membatasi koreksi menit maksimal -10 sampai +10 menit", () => {
		const adjusted = calcPrayerTimes({
			...defaultInput,
			adjustmentsMinutes: {
				FAJR: 99,
				ISHA: -50,
			},
		});

		expect(adjusted.meta.adjustmentsMinutes.FAJR).toBe(10);
		expect(adjusted.meta.adjustmentsMinutes.ISHA).toBe(-10);
	});

	it("mendeteksi hari Jumat dan mengubah label Dzuhur menjadi Sholat Jumat tanpa ubah jam", () => {
		const fridayDate = "2026-11-06";
		expect(isFriday(fridayDate)).toBe(true);
		expect(getPrayerDisplayName("DHUHR", fridayDate)).toBe("Sholat Jumat");

		const res = calcPrayerTimes({
			...defaultInput,
			dateLocal: fridayDate,
		});
		expect(res.isFriday).toBe(true);
		expect(res.times.DHUHR.displayName).toBe("Sholat Jumat");

		expect(isFriday("2026-11-04")).toBe(false);
		expect(getPrayerDisplayName("DHUHR", "2026-11-04")).toBe("Dzuhur");
	});

	it("menghitung next prayer di antara waktu shalat dan keesokan harinya", () => {
		const res = calcPrayerTimes(defaultInput);

		const earlyMorning = new Date(res.utc.fajrUtc.getTime() - 3600 * 1000);
		const nextEarly = getNextPrayer({
			todayResult: res,
			nowUtc: earlyMorning,
		});
		expect(nextEarly.prayerName).toBe("FAJR");
		expect(nextEarly.isTomorrow).toBe(false);

		const afternoon = new Date(res.utc.dhuhrUtc.getTime() + 1800 * 1000);
		const nextAfternoon = getNextPrayer({
			todayResult: res,
			nowUtc: afternoon,
		});
		expect(nextAfternoon.prayerName).toBe("ASR");
		expect(nextAfternoon.isTomorrow).toBe(false);

		const lateNight = new Date(res.utc.ishaUtc.getTime() + 3600 * 1000);
		const nextTomorrow = getNextPrayer({
			todayResult: res,
			nowUtc: lateNight,
		});
		expect(nextTomorrow.prayerName).toBe("FAJR");
		expect(nextTomorrow.isTomorrow).toBe(true);
		expect(nextTomorrow.displayName).toContain("Subuh");
	});

	it("format penanggalan Hijriyah dan mendukung adjustmentDays (-2..+2)", () => {
		const hijri0 = formatHijri("2026-11-04", 0);
		expect(hijri0.formatted).toBeDefined();
		expect(hijri0.year).toBeGreaterThan(1400);

		const hijriPlus1 = formatHijri("2026-11-04", 1);
		expect(hijriPlus1.adjustmentDays).toBe(1);

		const hijriClamped = formatHijri("2026-11-04", 5);
		expect(hijriClamped.adjustmentDays).toBe(2);
	});
});
