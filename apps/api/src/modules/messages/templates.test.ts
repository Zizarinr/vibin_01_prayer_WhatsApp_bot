import { describe, expect, it } from "bun:test";
import {
	formatIndonesianDate,
	renderAdhanMessage,
	renderPreReminderMessage,
} from "./templates";

describe("messages/templates", () => {
	it("memformat tanggal Indonesia dengan hari secara benar", () => {
		const d = new Date(2026, 10, 4);
		expect(formatIndonesianDate(d)).toBe("Rabu, 4 November 2026");
		const sunday = new Date(2026, 10, 1);
		expect(formatIndonesianDate(sunday)).toBe("Ahad, 1 November 2026");
		expect(formatIndonesianDate(sunday, "Asia/Jakarta")).toBe("Ahad, 1 November 2026");
	});

	it("merender pesan ADHAN Subuh dengan hadits", () => {
		const rendered = renderAdhanMessage("FAJR", 4, {
			time: "04:12 WIB",
			hijri: "23 Jumadil Ula 1448 H",
			gregorian: "Rabu, 4 November 2026",
			isFriday: false,
			detailUrl: "https://prayer.unida.gontor.ac.id/",
			hadith: {
				id: 1,
				text: "Sholat paling utama adalah yang tepat pada waktunya.",
				source: "HR. Bukhari & Muslim",
			},
		});

		expect(rendered.body).toContain("Sholat Subuh");
		expect(rendered.body).toContain("04:12 WIB");
		expect(rendered.body).toContain("23 Jumadil Ula 1448 H");
		expect(rendered.body).toContain("Rabu, 4 November 2026");
		expect(rendered.body).toContain("📖 *Hadith Hari Ini:*");
		expect(rendered.body).toContain("HR. Bukhari & Muslim");
		expect(rendered.body).toContain(
			"🔗 Jadwal lengkap: https://prayer.unida.gontor.ac.id",
		);
		expect(rendered.contentRef).toBe("hadith:1");
	});

	it("merender header 'Ayat Hari Ini' bila sumber hadits diawali QS.", () => {
		const rendered = renderAdhanMessage("ASR", 3, {
			time: "14:48 WIB",
			hijri: "23 Jumadil Ula 1448 H",
			gregorian: "Selasa, 3 November 2026",
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
		expect(rendered.body).toContain("Selasa, 3 November 2026");
	});

	it("merender pesan Dzuhur pada hari Jumat dengan label Sholat Jumat dan footer khusus Jumat", () => {
		const rendered = renderAdhanMessage("DHUHR", 6, {
			time: "11:30 WIB",
			hijri: "25 Jumadil Ula 1448 H",
			gregorian: "Jumat, 6 November 2026",
			isFriday: true,
			detailUrl: "https://prayer.unida.gontor.ac.id",
			hadith: null,
		});

		expect(rendered.body).toContain("Sholat Jumat");
		expect(rendered.body).not.toContain("Sholat Dzuhur");
		expect(rendered.body).toContain(
			"Bagi kaum pria, mari bersiap lebih awal, potong kuku, gunakan wewangian",
		);
		expect(rendered.body).toContain("Jumat, 6 November 2026");
		expect(rendered.body).toContain("🔗 Jadwal lengkap:");
		expect(rendered.contentRef).toBe("template:dhuhr:v1");
	});

	it("melewatkan baris link bila detailUrl kosong atau invalid", () => {
		const withoutUrl = renderAdhanMessage("FAJR", 4, {
			time: "04:12 WIB",
			hijri: "23 Jumadil Ula 1448 H",
			gregorian: "Rabu, 4 November 2026",
			isFriday: false,
			hadith: null,
		});

		expect(withoutUrl.body).not.toContain("Jadwal lengkap");

		const invalidUrl = renderPreReminderMessage("FAJR", 4, {
			time: "04:12 WIB",
			hijri: "23 Jumadil Ula 1448 H",
			gregorian: "Rabu, 4 November 2026",
			isFriday: false,
			minutes: 5,
			detailUrl: "bukan-url",
		});

		expect(invalidUrl.body).not.toContain("Jadwal lengkap");
	});

	it("merender pre-reminder dengan menit dan nama sholat", () => {
		const normal = renderPreReminderMessage("MAGHRIB", 1, {
			time: "17:40 WIB",
			hijri: "23 Jumadil Ula 1448 H",
			gregorian: "Ahad, 1 November 2026",
			isFriday: false,
			minutes: 5,
			detailUrl: "https://prayer.unida.gontor.ac.id/",
		});

		expect(normal.body).toContain("5 menit");
		expect(normal.body).toContain("Sholat Maghrib");
		expect(normal.body).toContain("17:40 WIB");
		expect(normal.body).toContain("23 Jumadil Ula 1448 H");
		expect(normal.body).toContain("Ahad, 1 November 2026");
		expect(normal.body).toContain(
			"🔗 Jadwal lengkap: https://prayer.unida.gontor.ac.id",
		);

		const friday = renderPreReminderMessage("DHUHR", 6, {
			time: "11:30 WIB",
			hijri: "25 Jumadil Ula 1448 H",
			gregorian: "Jumat, 6 November 2026",
			isFriday: true,
			minutes: 10,
		});

		expect(friday.body).toContain("10 menit");
		expect(friday.body).toContain("Sholat Jumat");
		expect(friday.body).toContain("Jumat, 6 November 2026");
	});
});
