import { describe, expect, it } from "bun:test";
import {
	getPublicSettings,
	getResolvedSettings,
	getTodayPrayer,
	previewPrayerTimes,
} from "./service";

describe("apps/api/modules/prayer", () => {
	it("mengambil resolved settings dengan fallback default yang aman", async () => {
		const settings = await getResolvedSettings();
		expect(settings.location.name).toBe("UNIDA Gontor");
		expect(settings.location.timezone).toBe("Asia/Jakarta");
		expect(settings.calculation.fajrAngle).toBe(20.0);
		expect(settings.calculation.ishaAngle).toBe(18.0);
		expect(settings.reminder.preReminderMinutes).toBe(3);
	});

	it("menghitung jadwal hari ini beserta next prayer dan hijriyah", async () => {
		const today = await getTodayPrayer("2026-11-04");
		expect(today.locationName).toBe("UNIDA Gontor");
		expect(today.dateLocal).toBe("2026-11-04");
		expect(today.isFriday).toBe(false);
		expect(today.times.FAJR).toBeDefined();
		expect(today.times.DHUHR.displayName).toBe("Dzuhur");
		expect(today.nextPrayer).toBeDefined();
		expect(today.hijri.formatted).toBeDefined();
		expect(today.serverNowUtc).toBeDefined();
	});

	it("menangani hari Jumat dan mengubah label Sholat Jumat", async () => {
		const friday = await getTodayPrayer("2026-11-06");
		expect(friday.isFriday).toBe(true);
		expect(friday.times.DHUHR.displayName).toBe("Sholat Jumat");
	});

	it("whitelist public settings tidak membocorkan credential atau URL rahasia", async () => {
		const pub = await getPublicSettings();
		expect(pub.locationName).toBe("UNIDA Gontor");
		expect(pub.timezone).toBe("Asia/Jakarta");
		expect(pub.coordinates.latitude).toBeCloseTo(-7.8652, 3);
		expect((pub as Record<string, unknown>).password).toBeUndefined();
		expect((pub as Record<string, unknown>).DATABASE_URL).toBeUndefined();
		expect((pub as Record<string, unknown>).wahaApiKey).toBeUndefined();
	});

	it("preview hisab dapat menerima override candidate tanpa mengubah database", async () => {
		const preview = await previewPrayerTimes({
			dateLocal: "2026-12-01",
			latitude: -6.2,
			longitude: 106.8,
			adjustmentsMinutes: {
				FAJR: 3,
			},
		});

		expect(preview.input.dateLocal).toBe("2026-12-01");
		expect(preview.input.latitude).toBe(-6.2);
		expect(preview.input.adjustmentsMinutes?.FAJR).toBe(3);
		expect(preview.times.FAJR.time24).toBeDefined();
	});
});
