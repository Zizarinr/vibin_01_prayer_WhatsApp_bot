import { PRAYER_NAMES } from "@unida-prayer/shared";
import {
	CalculationParameters,
	Coordinates,
	Madhab,
	PrayerTimes,
} from "adhan";
import { addDays, format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type {
	FormattedPrayerTime,
	NextPrayerInfo,
	PrayerEngineInput,
	PrayerOrSunrise,
	PrayerTimesResult,
	PrayerTimesUtc,
} from "./types";

const ALL_PRAYER_SLOTS: PrayerOrSunrise[] = [
	"FAJR",
	"SUNRISE",
	"DHUHR",
	"ASR",
	"MAGHRIB",
	"ISHA",
];

export function getTimezoneLabel(
	timezone: string,
	date: Date = new Date(),
): string {
	switch (timezone) {
		case "Asia/Jakarta":
		case "Asia/Pontianak":
			return "WIB";
		case "Asia/Makassar":
		case "Asia/Ujung_Pandang":
		case "Asia/Denpasar":
			return "WITA";
		case "Asia/Jayapura":
			return "WIT";
		default:
			try {
				return formatInTimeZone(date, timezone, "zzz");
			} catch {
				return timezone;
			}
	}
}

export function isFriday(dateLocal: string, timezone = "Asia/Jakarta"): boolean {
	const parts = dateLocal.split("-").map(Number);
	if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) {
		throw new Error(
			`Format tanggal tidak valid: "${dateLocal}", gunakan YYYY-MM-DD.`,
		);
	}
	const year = parts[0] as number;
	const month = parts[1] as number;
	const day = parts[2] as number;
	try {
		const noonUtc = new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
		const weekday = formatInTimeZone(noonUtc, timezone, "i");
		return weekday === "5";
	} catch {
		const d = new Date(year, month - 1, day, 12, 0, 0);
		return d.getDay() === 5;
	}
}

export function getPrayerDisplayName(
	prayer: PrayerOrSunrise,
	dateLocal: string,
	timezone = "Asia/Jakarta",
): string {
	if (prayer === "FAJR") return "Subuh";
	if (prayer === "SUNRISE") return "Terbit";
	if (prayer === "DHUHR") return isFriday(dateLocal, timezone) ? "Sholat Jumat" : "Dzuhur";
	if (prayer === "ASR") return "Ashar";
	if (prayer === "MAGHRIB") return "Maghrib";
	if (prayer === "ISHA") return "Isya";
	return prayer;
}

export function calcPrayerTimes(input: PrayerEngineInput): PrayerTimesResult {
	const {
		dateLocal,
		latitude,
		longitude,
		timezone = "Asia/Jakarta",
		fajrAngle = 20.0,
		ishaAngle = 18.0,
		asrFactor = 1,
		adjustmentsMinutes = {},
	} = input;

	if (typeof dateLocal !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateLocal)) {
		throw new Error(
			`Format dateLocal harus YYYY-MM-DD, diterima: "${dateLocal}".`,
		);
	}
	if (latitude < -90 || latitude > 90) {
		throw new Error(`Latitude di luar rentang (-90..90): ${latitude}`);
	}
	if (longitude < -180 || longitude > 180) {
		throw new Error(`Longitude di luar rentang (-180..180): ${longitude}`);
	}
	if (fajrAngle < 0 || fajrAngle > 35) {
		throw new Error(`Fajr angle tidak masuk akal: ${fajrAngle}`);
	}
	if (ishaAngle < 0 || ishaAngle > 35) {
		throw new Error(`Isha angle tidak masuk akal: ${ishaAngle}`);
	}

	const parts = dateLocal.split("-").map(Number);
	const year = parts[0] as number;
	const month = parts[1] as number;
	const day = parts[2] as number;
	const calcDate = new Date(year, month - 1, day, 12, 0, 0);

	const coords = new Coordinates(latitude, longitude);
	const params = new CalculationParameters("Other", fajrAngle, ishaAngle);
	params.madhab = asrFactor === 2 ? Madhab.Hanafi : Madhab.Shafi;

	const raw = new PrayerTimes(coords, calcDate, params);

	const safeAdjustments: Record<PrayerOrSunrise, number> = {
		FAJR: 0,
		SUNRISE: 0,
		DHUHR: 0,
		ASR: 0,
		MAGHRIB: 0,
		ISHA: 0,
	};

	for (const slot of ALL_PRAYER_SLOTS) {
		const rawAdj = adjustmentsMinutes[slot];
		if (typeof rawAdj === "number" && !Number.isNaN(rawAdj)) {
			// Batasi koreksi -10 s/d +10 menit sesuai Q-PRAY-02
			safeAdjustments[slot] = Math.max(-10, Math.min(10, Math.round(rawAdj)));
		}
	}

	function applyMinutes(baseUtc: Date, minutes: number): Date {
		return new Date(baseUtc.getTime() + minutes * 60 * 1000);
	}

	const utc: PrayerTimesUtc = {
		fajrUtc: applyMinutes(raw.fajr, safeAdjustments.FAJR),
		sunriseUtc: applyMinutes(raw.sunrise, safeAdjustments.SUNRISE),
		dhuhrUtc: applyMinutes(raw.dhuhr, safeAdjustments.DHUHR),
		asrUtc: applyMinutes(raw.asr, safeAdjustments.ASR),
		maghribUtc: applyMinutes(raw.maghrib, safeAdjustments.MAGHRIB),
		ishaUtc: applyMinutes(raw.isha, safeAdjustments.ISHA),
	};

	const tzLabel = getTimezoneLabel(timezone, utc.dhuhrUtc);
	const friday = isFriday(dateLocal, timezone);

	const times: Record<PrayerOrSunrise, FormattedPrayerTime> = {
		FAJR: {
			utc: utc.fajrUtc,
			time24: formatInTimeZone(utc.fajrUtc, timezone, "HH:mm"),
			timeLabel: `${formatInTimeZone(utc.fajrUtc, timezone, "HH:mm")} ${tzLabel}`,
			displayName: getPrayerDisplayName("FAJR", dateLocal, timezone),
		},
		SUNRISE: {
			utc: utc.sunriseUtc,
			time24: formatInTimeZone(utc.sunriseUtc, timezone, "HH:mm"),
			timeLabel: `${formatInTimeZone(utc.sunriseUtc, timezone, "HH:mm")} ${tzLabel}`,
			displayName: getPrayerDisplayName("SUNRISE", dateLocal, timezone),
		},
		DHUHR: {
			utc: utc.dhuhrUtc,
			time24: formatInTimeZone(utc.dhuhrUtc, timezone, "HH:mm"),
			timeLabel: `${formatInTimeZone(utc.dhuhrUtc, timezone, "HH:mm")} ${tzLabel}`,
			displayName: getPrayerDisplayName("DHUHR", dateLocal, timezone),
		},
		ASR: {
			utc: utc.asrUtc,
			time24: formatInTimeZone(utc.asrUtc, timezone, "HH:mm"),
			timeLabel: `${formatInTimeZone(utc.asrUtc, timezone, "HH:mm")} ${tzLabel}`,
			displayName: getPrayerDisplayName("ASR", dateLocal, timezone),
		},
		MAGHRIB: {
			utc: utc.maghribUtc,
			time24: formatInTimeZone(utc.maghribUtc, timezone, "HH:mm"),
			timeLabel: `${formatInTimeZone(utc.maghribUtc, timezone, "HH:mm")} ${tzLabel}`,
			displayName: getPrayerDisplayName("MAGHRIB", dateLocal, timezone),
		},
		ISHA: {
			utc: utc.ishaUtc,
			time24: formatInTimeZone(utc.ishaUtc, timezone, "HH:mm"),
			timeLabel: `${formatInTimeZone(utc.ishaUtc, timezone, "HH:mm")} ${tzLabel}`,
			displayName: getPrayerDisplayName("ISHA", dateLocal, timezone),
		},
	};

	return {
		dateLocal,
		timezone,
		isFriday: friday,
		utc,
		times,
		meta: {
			latitude,
			longitude,
			fajrAngle,
			ishaAngle,
			asrFactor,
			adjustmentsMinutes: safeAdjustments,
		},
	};
}

export function getNextPrayer(params: {
	todayResult: PrayerTimesResult;
	nowUtc?: Date;
	inputForTomorrow?: PrayerEngineInput;
	tomorrowResult?: PrayerTimesResult;
}): NextPrayerInfo {
	const now = params.nowUtc ?? new Date();
	const today = params.todayResult;

	// Hanya 5 waktu shalat utama yang menjadi target (SUNRISE diabaikan untuk trigger)
	for (const name of PRAYER_NAMES) {
		const item = today.times[name];
		if (item.utc.getTime() > now.getTime()) {
			const remainingSeconds = Math.max(
				0,
				Math.floor((item.utc.getTime() - now.getTime()) / 1000),
			);
			return {
				prayerName: name,
				displayName: item.displayName,
				scheduledAtUtc: item.utc,
				time24: item.time24,
				timeLabel: item.timeLabel,
				remainingSeconds,
				isTomorrow: false,
			};
		}
	}

	// Semua shalat hari ini sudah lewat -> ambil Subuh besok
	let tomorrow = params.tomorrowResult;
	if (!tomorrow) {
		const nextDate = format(
			addDays(parseISO(today.dateLocal), 1),
			"yyyy-MM-dd",
		);
		const tomorrowInput: PrayerEngineInput = params.inputForTomorrow ?? {
			dateLocal: nextDate,
			latitude: today.meta.latitude,
			longitude: today.meta.longitude,
			timezone: today.timezone,
			fajrAngle: today.meta.fajrAngle,
			ishaAngle: today.meta.ishaAngle,
			asrFactor: today.meta.asrFactor,
			adjustmentsMinutes: today.meta.adjustmentsMinutes,
		};
		tomorrow = calcPrayerTimes(tomorrowInput);
	}

	const subuhBesok = tomorrow.times.FAJR;
	const remainingSeconds = Math.max(
		0,
		Math.floor((subuhBesok.utc.getTime() - now.getTime()) / 1000),
	);

	return {
		prayerName: "FAJR",
		displayName: "Subuh (Besok)",
		scheduledAtUtc: subuhBesok.utc,
		time24: subuhBesok.time24,
		timeLabel: subuhBesok.timeLabel,
		remainingSeconds,
		isTomorrow: true,
	};
}
