import { describe, expect, it } from "bun:test";
import {
	formatIndonesianDate,
	renderAdhanMessage,
	renderPreReminderMessage,
} from "./templates";

describe("messages/templates", () => {
	it("memformat tanggal Indonesia secara benar", () => {
		const d = new Date(2026, 10, 4);
		expect(formatIndonesianDate(d)).toBe("4 November 2026");
	});

	it("merender pesan ADHAN Subuh dengan hadits", () => {
		const rendered = renderAdhanMessage("FAJR", 4, {
			time: "04:12 WIB",
			hijri: "23 Jumadil Ula 1448 H",
			gregorian: "4 November 2026",
			isFriday: false,
			hadith: {
				id: 1,
				text: "Sholat paling utama adalah yang tepat pada waktunya.",
				source: "HR. Bukhari & Muslim",
			},
		});

		expect(rendered.body).toContain("Sholat Subuh");
		expect(rendered.body).toContain("04:12 WIB");
		expect(rendered.body).toContain("23 Jumadil Ula 1448 H");
		expect(rendered.body).toContain("📖 *Hadith Hari Ini:*");
		expect(rendered.body).toContain("HR. Bukhari & Muslim");
		expect(rendered.contentRef).toBe("hadith:1");
	});

	it("merender header 'Ayat Hari Ini' bila sumber hadits diawali QS.", () => {
		const rendered = renderAdhanMessage("ASR", 3, {
			time: "14:48 WIB",
			hijri: "23 Jumadil Ula 1448 H",
			gregorian: "3 November 2026",
			isFriday: false,
			hadith: {
				id: 9,
				text: "Peliharalah semua sholat dan sholat wustha...",
				source: "QS. Al-Baqarah: 238",
			},
		});

		expect(rendered.body).toContain("📖 *Ayat Hari Ini:*");
		expect(rendered.body).not.toContain("📖 *Hadith Hari Ini:*");
		expect(rendered.body).toContain("QS. Al-Baqarah: 238");
	});

	it("merender pesan Dzuhur pada hari Jumat dengan label Sholat Jumat dan footer khusus Jumat", () => {
		const rendered = renderAdhanMessage("DHUHR", 6, {
			time: "11:30 WIB",
			hijri: "25 Jumadil Ula 1448 H",
			gregorian: "6 November 2026",
			isFriday: true,
			hadith: null,
		});

		expect(rendered.body).toContain("Sholat Jumat");
		expect(rendered.body).not.toContain("Sholat Dzuhur");
		expect(rendered.body).toContain(
			"Bagi kaum pria, mari bersiap lebih awal, potong kuku, gunakan wewangian",
		);
		expect(rendered.contentRef).toBe("template:dhuhr:v1");
	});

	it("merender pre-reminder dengan menit dan nama sholat", () => {
		const normal = renderPreReminderMessage("MAGHRIB", 1, {
			time: "17:40 WIB",
			hijri: "23 Jumadil Ula 1448 H",
			gregorian: "1 November 2026",
			isFriday: false,
			minutes: 5,
		});

		expect(normal.body).toContain("5 menit");
		expect(normal.body).toContain("Sholat Maghrib");

		const friday = renderPreReminderMessage("DHUHR", 6, {
			time: "11:30 WIB",
			hijri: "25 Jumadil Ula 1448 H",
			gregorian: "6 November 2026",
			isFriday: true,
			minutes: 10,
		});

		expect(friday.body).toContain("10 menit");
		expect(friday.body).toContain("Sholat Jumat");
	});
});
