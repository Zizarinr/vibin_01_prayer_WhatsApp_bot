import { describe, expect, it } from "bun:test";
import { getActivePhase } from "./dynamic-prayer-background";
import type { TodayPrayerData } from "../../types/prayer";

const mockPrayerData: TodayPrayerData = {
	locationName: "UNIDA Gontor",
	timezone: "Asia/Jakarta",
	coordinates: { latitude: -7.8652, longitude: 111.4617 },
	dateLocal: "2026-11-08",
	isFriday: false,
	hijri: {
		formatted: "28 Jumadil Ula 1448",
		day: 28,
		monthName: "Jumadil Ula",
		year: 1448,
		adjustmentDays: 0,
	},
	times: {
		FAJR: {
			utc: "2026-11-07T20:53:00.000Z",
			time24: "03:53",
			timeLabel: "03:53",
			displayName: "Subuh",
		},
		SUNRISE: {
			utc: "2026-11-07T22:08:00.000Z",
			time24: "05:08",
			timeLabel: "05:08",
			displayName: "Terbit",
		},
		DHUHR: {
			utc: "2026-11-08T04:26:00.000Z",
			time24: "11:26",
			timeLabel: "11:26",
			displayName: "Dzuhur",
		},
		ASR: {
			utc: "2026-11-08T07:44:00.000Z",
			time24: "14:44",
			timeLabel: "14:44",
			displayName: "Ashar",
		},
		MAGHRIB: {
			utc: "2026-11-08T10:44:00.000Z",
			time24: "17:44",
			timeLabel: "17:44",
			displayName: "Maghrib",
		},
		ISHA: {
			utc: "2026-11-08T11:56:00.000Z",
			time24: "18:56",
			timeLabel: "18:56",
			displayName: "Isya",
		},
	},
	nextPrayer: {
		prayerName: "DHUHR",
		displayName: "Dzuhur",
		scheduledAtUtc: "2026-11-08T04:26:00.000Z",
		time24: "11:26",
		timeLabel: "11:26",
		remainingSeconds: 3600,
		isTomorrow: false,
	},
	serverNowUtc: "2026-11-08T03:00:00.000Z",
};

describe("getActivePhase", () => {
	it("mengembalikan SUBUH di antara Fajr dan Sunrise", () => {
		const t = new Date("2026-11-07T21:30:00.000Z").getTime();
		expect(getActivePhase(mockPrayerData, t, 0)).toBe("SUBUH");
	});

	it("mengembalikan DZUHUR di antara Sunrise dan Asr", () => {
		const t = new Date("2026-11-08T05:00:00.000Z").getTime();
		expect(getActivePhase(mockPrayerData, t, 0)).toBe("DZUHUR");
	});

	it("mengembalikan ASHAR di antara Asr dan Maghrib", () => {
		const t = new Date("2026-11-08T09:00:00.000Z").getTime();
		expect(getActivePhase(mockPrayerData, t, 0)).toBe("ASHAR");
	});

	it("mengembalikan MAGHRIB di antara Maghrib dan Isha", () => {
		const t = new Date("2026-11-08T11:15:00.000Z").getTime();
		expect(getActivePhase(mockPrayerData, t, 0)).toBe("MAGHRIB");
	});

	it("mengembalikan ISYA setelah Isha dan sebelum Fajr esok", () => {
		const t = new Date("2026-11-08T14:00:00.000Z").getTime();
		expect(getActivePhase(mockPrayerData, t, 0)).toBe("ISYA");
	});
});
