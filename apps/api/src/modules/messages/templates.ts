import type { PrayerName } from "@unida-prayer/shared";

export interface TemplateVariables {
	time: string; // mis. "04:12 WIB"
	hijri: string; // mis. "23 Jumadil Ula 1448 H"
	gregorian: string; // mis. "4 November 2026"
	isFriday: boolean;
	minutes?: number; // untuk pre-reminder
	hadith?: {
		id: number;
		text: string;
		source: string;
	} | null;
}

export interface RenderedMessage {
	body: string;
	contentRef: string;
}

const INDO_MONTHS = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

export function formatIndonesianDate(date: Date, timezone?: string): string {
	if (timezone) {
		try {
			const parts = new Intl.DateTimeFormat("id-ID", {
				timeZone: timezone,
				day: "numeric",
				month: "long",
				year: "numeric",
			}).formatToParts(date);
			const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
			return `${get("day")} ${get("month")} ${get("year")}`;
		} catch {
			// fallback ke lokal bila timezone invalid
		}
	}
	const day = date.getDate();
	const month = INDO_MONTHS[date.getMonth()];
	const year = date.getFullYear();
	return `${day} ${month} ${year}`;
}

const GREETING_FULL = `*Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*`;
const GREETING_SHORT = `*Assalamu'alaikum wr. wb.*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*`;

const FRIDAY_FOOTER = `Bagi kaum pria, mari bersiap lebih awal, potong kuku, gunakan wewangian, dan segerakan ke masjid terdekat untuk Sholat Jumat! 🤲`;

interface AdhanVariant {
	greeting: string;
	body: string;
	footer: string;
}

const ADHAN_TEMPLATES: Record<PrayerName, [AdhanVariant, AdhanVariant, AdhanVariant]> = {
	FAJR: [
		{
			greeting: `🌙 ${GREETING_FULL}`,
			body: `Alhamdulillah, sudah masuk waktu *Sholat Subuh* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})`,
			footer: `Yuk segerakan sholat Subuh berjamaah di masjid terdekat, jangan tunda! 🤲`,
		},
		{
			greeting: `✨ ${GREETING_FULL}`,
			body: `Fajar telah tiba, mari menyambut berkah pagi dengan mendirikan *Sholat Subuh* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`,
			footer: `Sholat subuh berjamaah adalah sumber cahaya di hari kiamat. Mari bersiap! 🤲`,
		},
		{
			greeting: `🌅 ${GREETING_SHORT}`,
			body: `Mari mulai hari ini dengan ketaatan. Waktu *Sholat Subuh* telah tiba untuk wilayah kita 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`,
			footer: `Awali langkah harimu dengan bersujud menghadap Allah SWT. Mari sholat! 🤲`,
		},
	],
	DHUHR: [
		{
			greeting: `☀️ ${GREETING_FULL}`,
			body: `Waktu *Sholat Dzuhur* telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})`,
			footer: `Tinggalkan sejenak aktivitasmu, saatnya menghadap Allah SWT. Rehatkan jiwa dengan sholat! 🤲`,
		},
		{
			greeting: `✨ ${GREETING_FULL}`,
			body: `Panggilan suci *Sholat Dzuhur* telah berkumandang di tengah kesibukan kita 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`,
			footer: `Mari sejenak basuh muka dengan air wudhu, segarkan pikiran, dan tunaikan kewajiban kita 🤲`,
		},
		{
			greeting: `🌤️ ${GREETING_SHORT}`,
			body: `Sudah masuk waktu *Sholat Dzuhur* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`,
			footer: `Kesuksesan sejati dimulai dari ketaatan sholat tepat waktu. Yuk, mari sholat Dzuhur dulu! 🤲`,
		},
	],
	ASR: [
		{
			greeting: `🌤️ ${GREETING_FULL}`,
			body: `Waktu *Sholat Ashar* telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})`,
			footer: `Jangan sampai terlewat, yuk sholat Ashar dulu! Jaga sholat wustha kita 🤲`,
		},
		{
			greeting: `✨ ${GREETING_FULL}`,
			body: `Mentari mulai condong, mari bersiap menunaikan ibadah *Sholat Ashar* tepat waktu 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`,
			footer: `Segera selesaikan tugas sejenak dan penuhi panggilan-Nya. Selamat menunaikan sholat Ashar 🤲`,
		},
		{
			greeting: `🌾 ${GREETING_SHORT}`,
			body: `Alhamdulillah, panggilan *Sholat Ashar* kembali memanggil kita 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`,
			footer: `Tinggalkan pekerjaan sejenak demi keberkahan usaha kita. Mari sholat tepat waktu! 🤲`,
		},
	],
	MAGHRIB: [
		{
			greeting: `🌅 ${GREETING_FULL}`,
			body: `Alhamdulillah, sudah masuk waktu *Sholat Maghrib* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})`,
			footer: `Syukuri penghujung hari, segera sholat Maghrib! Jangan tunda karena waktunya singkat 🤲`,
		},
		{
			greeting: `✨ ${GREETING_FULL}`,
			body: `Mentari telah tenggelam, saatnya bersyukur mendirikan *Sholat Maghrib* berjamaah 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`,
			footer: `Mari tutup aktivitas siang kita dengan menghadap Sang Pencipta. Segera bersuci dan sholat 🤲`,
		},
		{
			greeting: `🌆 ${GREETING_SHORT}`,
			body: `Waktu *Sholat Maghrib* yang penuh berkah telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`,
			footer: `Mari sambut malam dengan sujud yang khusyuk. Selamat melaksanakan sholat Maghrib 🤲`,
		},
	],
	ISHA: [
		{
			greeting: `🌙 ${GREETING_FULL}`,
			body: `Waktu *Sholat Isya* telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})`,
			footer: `Tutup harimu dengan sholat Isya berjamaah, semoga malam kita berkah dan penuh ketenangan! 🤲`,
		},
		{
			greeting: `✨ ${GREETING_FULL}`,
			body: `Panggilan terakhir hari ini, waktu *Sholat Isya* telah berkumandang 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`,
			footer: `Sempurnakan ibadah harian kita dengan sholat Isya tepat waktu sebelum beristirahat 🤲`,
		},
		{
			greeting: `🌌 ${GREETING_SHORT}`,
			body: `Waktu *Sholat Isya* yang damai telah masuk 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}`,
			footer: `Mari menghadap Allah SWT di penghujung hari. Selamat menunaikan ibadah sholat Isya 🤲`,
		},
	],
};

const PRE_TEMPLATES: [string, string, string] = [
	`⏰ *Pengingat Sholat — Keluarga Besar UNIDA Gontor*\n\n*{{minutes}} menit* lagi masuk waktu *{{prayerName}}* 🕌\nSegera bersiap-siap dan ambil wudhu! 💧`,
	`⏰ *Pre-Reminder Sholat — UNIDA Gontor*\n\nPersiapan diri, *{{minutes}} menit* lagi adzan *{{prayerName}}* akan berkumandang 🕌\nMari bersuci dan segerakan bersiap! 💧`,
	`⏰ *Pengingat Sholat — Keluarga Besar UNIDA Gontor*\n\nWaktu *{{prayerName}}* segera tiba dalam *{{minutes}} menit* 🕌\nTinggalkan pekerjaan sejenak dan bersiaplah mengambil wudhu! 💧`,
];

export function getPrayerDisplayName(prayer: PrayerName, isFriday: boolean): string {
	if (prayer === "DHUHR" && isFriday) {
		return "Sholat Jumat";
	}
	switch (prayer) {
		case "FAJR":
			return "Sholat Subuh";
		case "DHUHR":
			return "Sholat Dzuhur";
		case "ASR":
			return "Sholat Ashar";
		case "MAGHRIB":
			return "Sholat Maghrib";
		case "ISHA":
			return "Sholat Isya";
	}
}

/**
 * Render pesan ADHAN snapshot sesuai docs/15-pembekuan-template-hadits.md.
 */
export function renderAdhanMessage(
	prayer: PrayerName,
	dayOfMonth: number,
	vars: TemplateVariables,
): RenderedMessage {
	const variantIndex = (Math.abs(dayOfMonth) % 3) as 0 | 1 | 2;
	const template = ADHAN_TEMPLATES[prayer][variantIndex] ?? ADHAN_TEMPLATES[prayer][0];

	let bodyText = template.body
		.replace("{{time}}", vars.time)
		.replace("{{hijri}}", vars.hijri)
		.replace("{{gregorian}}", vars.gregorian);

	let footerText = template.footer;

	if (prayer === "DHUHR" && vars.isFriday) {
		bodyText = bodyText.replace("Sholat Dzuhur", "Sholat Jumat");
		footerText = FRIDAY_FOOTER;
	}

	const parts: string[] = [template.greeting, bodyText];

	let contentRef = `template:${prayer.toLowerCase()}:v${variantIndex + 1}`;

	if (vars.hadith) {
		const isQuran = vars.hadith.source.trim().toUpperCase().startsWith("QS.");
		const header = isQuran ? "📖 *Ayat Hari Ini:*" : "📖 *Hadith Hari Ini:*";
		const hadithBlock = `${header}\n"${vars.hadith.text}"\n*(${vars.hadith.source})*`;
		parts.push(hadithBlock);
		contentRef = `hadith:${vars.hadith.id}`;
	}

	parts.push(footerText);

	return {
		body: parts.join("\n\n"),
		contentRef,
	};
}

/**
 * Render pesan PRE_REMINDER snapshot sesuai docs/15-pembekuan-template-hadits.md.
 */
export function renderPreReminderMessage(
	prayer: PrayerName,
	dayOfMonth: number,
	vars: TemplateVariables,
): RenderedMessage {
	const variantIndex = (Math.abs(dayOfMonth) % 3) as 0 | 1 | 2;
	const template = PRE_TEMPLATES[variantIndex] ?? PRE_TEMPLATES[0];
	const prayerName = getPrayerDisplayName(prayer, vars.isFriday);
	const minutes = vars.minutes ?? 3;

	const body = template
		.replace("{{minutes}}", String(minutes))
		.replace("{{prayerName}}", prayerName);

	return {
		body,
		contentRef: `template:pre:v${variantIndex + 1}`,
	};
}
