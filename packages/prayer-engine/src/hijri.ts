import type { HijriDateInfo } from "./types";

/**
 * Format tanggal Masehi ke penanggalan Hijriyah (Umm al-Qura).
 * Mendukung koreksi tampilan adjustmentDays (-2 s/d +2 hari).
 */
export function formatHijri(
	dateOrDateLocal: Date | string,
	adjustmentDays = 0,
): HijriDateInfo {
	const clampedAdjustment = Math.max(-2, Math.min(2, Math.round(adjustmentDays)));

	let baseDate: Date;
	if (typeof dateOrDateLocal === "string") {
		const parts = dateOrDateLocal.split("-").map(Number);
		if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) {
			throw new Error(
				`Format tanggal tidak valid: "${dateOrDateLocal}", gunakan YYYY-MM-DD.`,
			);
		}
		const year = parts[0] as number;
		const month = parts[1] as number;
		const day = parts[2] as number;
		baseDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
	} else {
		baseDate = new Date(dateOrDateLocal.getTime());
	}

	const adjustedDate = new Date(
		baseDate.getTime() + clampedAdjustment * 24 * 60 * 60 * 1000,
	);

	const formatter = new Intl.DateTimeFormat("id-ID-u-ca-islamic-umalqura", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const parts = formatter.formatToParts(adjustedDate);
	let day = 1;
	let monthName = "";
	let year = 1400;

	for (const part of parts) {
		if (part.type === "day") {
			day = Number.parseInt(part.value, 10) || 1;
		} else if (part.type === "month") {
			monthName = part.value;
		} else if (part.type === "year") {
			year = Number.parseInt(part.value, 10) || 1400;
		}
	}

	const formatted = formatter.format(adjustedDate);

	return {
		formatted,
		day,
		monthName,
		year,
		adjustmentDays: clampedAdjustment,
	};
}
