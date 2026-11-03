import { describe, expect, it } from "bun:test";
import { getBackoffMs } from "./dispatcher";
import { computeIdempotencyKey } from "./generator";
import {
	renderAdhanMessage,
	renderPreReminderMessage,
} from "./templates";

describe("scheduler integration test (logic & flow)", () => {
	it("alur generator menghasilkan idempotency key unik untuk kombinasi tanggal, waktu, tipe pesan, dan target", () => {
		const targetId1 = 101;
		const targetId2 = 102;
		const prayerDate = "2026-11-04";

		const preKey1 = computeIdempotencyKey(prayerDate, "FAJR", "PRE_REMINDER", targetId1);
		const preKey2 = computeIdempotencyKey(prayerDate, "FAJR", "PRE_REMINDER", targetId2);
		const adhanKey1 = computeIdempotencyKey(prayerDate, "FAJR", "ADHAN", targetId1);

		expect(preKey1).not.toBe(preKey2);
		expect(preKey1).not.toBe(adhanKey1);
	});

	it("alur template merender pesan adzan dan pre-reminder secara lengkap dengan label Jumat dan waktu", () => {
		const adhan = renderAdhanMessage("DHUHR", 6, {
			time: "11:35 WIB",
			hijri: "25 Jumadil Ula 1448 H",
			gregorian: "6 November 2026",
			isFriday: true,
			hadith: {
				id: 2,
				text: "Barangsiapa menjaga sholat, niscaya ia menjadi cahaya...",
				source: "HR. Ahmad",
			},
		});

		expect(adhan.body).toContain("Sholat Jumat");
		expect(adhan.body).toContain("11:35 WIB");
		expect(adhan.body).toContain("📖 *Hadith Hari Ini:*");
		expect(adhan.contentRef).toBe("hadith:2");

		const pre = renderPreReminderMessage("DHUHR", 6, {
			time: "11:35 WIB",
			hijri: "25 Jumadil Ula 1448 H",
			gregorian: "6 November 2026",
			isFriday: true,
			minutes: 3,
		});

		expect(pre.body).toContain("3 menit");
		expect(pre.body).toContain("Sholat Jumat");
	});

	it("dispatcher backoff menjadwalkan interval bertingkat tanpa retry buta untuk status ambigu", () => {
		expect(getBackoffMs(1)).toBe(30_000);
		expect(getBackoffMs(2)).toBe(120_000);
		expect(getBackoffMs(3)).toBe(300_000);
	});
});
