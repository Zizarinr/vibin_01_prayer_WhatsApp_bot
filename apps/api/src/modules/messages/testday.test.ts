import { describe, expect, it } from "bun:test";
import { DEFAULT_SETTINGS } from "../prayer/service";
import { buildDayTestMessages } from "./testday";
import type { Hadith } from "../../database/schema/hadiths";

function fakeHadith(id: number): Hadith {
	return {
		id,
		seedKey: `test-${id}`,
		text: `Hadits uji ${id}`,
		source: "HR. Uji",
		topic: "Umum",
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

describe("buildDayTestMessages", () => {
	it("menyusun 10 pesan (pre + adzan × 5 waktu) berurutan", () => {
		const messages = buildDayTestMessages({
			settings: DEFAULT_SETTINGS,
			activeHadiths: [fakeHadith(1), fakeHadith(2), fakeHadith(3)],
			includeHadith: true,
			dateLocal: "2026-11-08",
		});

		expect(messages.length).toBe(10);
		expect(messages.map((m) => m.messageType)).toEqual([
			"PRE_REMINDER",
			"ADHAN",
			"PRE_REMINDER",
			"ADHAN",
			"PRE_REMINDER",
			"ADHAN",
			"PRE_REMINDER",
			"ADHAN",
			"PRE_REMINDER",
			"ADHAN",
		]);
		expect(messages.map((m) => m.seq)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
	});

	it("pre-reminder memuat menit setting dan adzan memuat blok hadits", () => {
		const messages = buildDayTestMessages({
			settings: DEFAULT_SETTINGS,
			activeHadiths: [fakeHadith(1)],
			includeHadith: true,
			dateLocal: "2026-11-08",
		});

		const pre = messages.find((m) => m.messageType === "PRE_REMINDER");
		expect(pre?.body).toContain("3 menit");
		const adhan = messages.find((m) => m.messageType === "ADHAN");
		expect(adhan?.body).toContain("Hadith Hari Ini");
	});

	it("tidak menyisipkan hadits bila includeHadith false atau kosong", () => {
		const withoutFlag = buildDayTestMessages({
			settings: DEFAULT_SETTINGS,
			activeHadiths: [fakeHadith(1)],
			includeHadith: false,
			dateLocal: "2026-11-08",
		});
		expect(withoutFlag.some((m) => m.body.includes("Hadith Hari Ini"))).toBe(false);

		const withoutData = buildDayTestMessages({
			settings: DEFAULT_SETTINGS,
			activeHadiths: [],
			includeHadith: true,
			dateLocal: "2026-11-08",
		});
		expect(withoutData.some((m) => m.body.includes("Hadith Hari Ini"))).toBe(false);
	});

	it("hadits berurutan tidak repeat bila pool > 1", () => {
		const messages = buildDayTestMessages({
			settings: DEFAULT_SETTINGS,
			activeHadiths: [fakeHadith(1), fakeHadith(2)],
			includeHadith: true,
			dateLocal: "2026-11-08",
		});
		const refs = messages
			.filter((m) => m.messageType === "ADHAN")
			.map((m) => m.contentRef);
		for (let i = 1; i < refs.length; i++) {
			expect(refs[i]).not.toBe(refs[i - 1]);
		}
	});

	it("memakai label Jumat bila tanggal Jumat", () => {
		const messages = buildDayTestMessages({
			settings: DEFAULT_SETTINGS,
			activeHadiths: [],
			includeHadith: false,
			dateLocal: "2026-11-06",
		});
		const dhuhur = messages.filter((m) => m.prayerName === "DHUHR");
		expect(dhuhur.length).toBe(2);
		expect(dhuhur.every((m) => m.body.includes("Sholat Jumat") || m.label.includes("Jumat"))).toBe(
			true,
		);
	});

	it("hanya adzan bila pre-reminder dimatikan", () => {
		const messages = buildDayTestMessages({
			settings: {
				...DEFAULT_SETTINGS,
				reminder: { ...DEFAULT_SETTINGS.reminder, preReminderEnabled: false },
			},
			activeHadiths: [],
			includeHadith: false,
			dateLocal: "2026-11-08",
		});
		expect(messages.length).toBe(5);
		expect(messages.every((m) => m.messageType === "ADHAN")).toBe(true);
	});
});
