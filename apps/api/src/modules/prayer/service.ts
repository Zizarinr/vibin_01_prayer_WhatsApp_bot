import {
	calcPrayerTimes,
	formatHijri,
	getNextPrayer,
	type HijriDateInfo,
	type NextPrayerInfo,
	type PrayerEngineInput,
	type PrayerOrSunrise,
	type PrayerTimesResult,
} from "@unida-prayer/prayer-engine";
import { formatInTimeZone } from "date-fns-tz";
import { db } from "../../database/client";
import { appSettings } from "../../database/schema/appSettings";

export interface ResolvedSettings {
	location: {
		name: string;
		latitude: number;
		longitude: number;
		timezone: string;
	};
	calculation: {
		fajrAngle: number;
		ishaAngle: number;
		asrFactor: 1 | 2;
		methodLabel: string;
	};
	adjustments: Record<PrayerOrSunrise, number>;
	hijri: {
		adjustmentDays: number;
	};
	reminder: {
		enabled: boolean;
		preReminderEnabled: boolean;
		adhanReminderEnabled: boolean;
		preReminderMinutes: number;
		lateGraceMinutes: number;
	};
}

export const DEFAULT_SETTINGS: ResolvedSettings = {
	location: {
		name: "UNIDA Gontor",
		latitude: -7.8652,
		longitude: 111.4617,
		timezone: "Asia/Jakarta",
	},
	calculation: {
		fajrAngle: 20.0,
		ishaAngle: 18.0,
		asrFactor: 1,
		methodLabel: "Kemenag",
	},
	adjustments: {
		FAJR: 0,
		SUNRISE: 0,
		DHUHR: 0,
		ASR: 0,
		MAGHRIB: 0,
		ISHA: 0,
	},
	hijri: {
		adjustmentDays: 0,
	},
	reminder: {
		enabled: true,
		preReminderEnabled: true,
		adhanReminderEnabled: true,
		preReminderMinutes: 3,
		lateGraceMinutes: 5,
	},
};

function isValidTimezone(tz: string): boolean {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}

export async function getResolvedSettings(): Promise<ResolvedSettings> {
	const rows = await db.select().from(appSettings);
	const map = new Map<string, unknown>();
	for (const row of rows) {
		map.set(row.key, row.value);
	}

	const loc = map.get("location") as Partial<ResolvedSettings["location"]> | undefined;
	const calc = map.get("prayer_calculation") as Partial<ResolvedSettings["calculation"]> | undefined;
	const adj = map.get("prayer_adjustments") as Partial<Record<string, number>> | undefined;
	const hij = map.get("hijri_settings") as Partial<ResolvedSettings["hijri"]> | undefined;
	const rem = map.get("reminder_settings") as Partial<ResolvedSettings["reminder"]> | undefined;

	const tzRaw = typeof loc?.timezone === "string" ? loc.timezone : DEFAULT_SETTINGS.location.timezone;
	const timezone = isValidTimezone(tzRaw) ? tzRaw : DEFAULT_SETTINGS.location.timezone;

	return {
		location: {
			name: typeof loc?.name === "string" ? loc.name : DEFAULT_SETTINGS.location.name,
			latitude: typeof loc?.latitude === "number" ? loc.latitude : DEFAULT_SETTINGS.location.latitude,
			longitude: typeof loc?.longitude === "number" ? loc.longitude : DEFAULT_SETTINGS.location.longitude,
			timezone,
		},
		calculation: {
			fajrAngle: typeof calc?.fajrAngle === "number" ? calc.fajrAngle : DEFAULT_SETTINGS.calculation.fajrAngle,
			ishaAngle: typeof calc?.ishaAngle === "number" ? calc.ishaAngle : DEFAULT_SETTINGS.calculation.ishaAngle,
			asrFactor: calc?.asrFactor === 2 ? 2 : 1,
			methodLabel: typeof calc?.methodLabel === "string" ? calc.methodLabel : DEFAULT_SETTINGS.calculation.methodLabel,
		},
		adjustments: {
			FAJR: typeof adj?.FAJR === "number" ? adj.FAJR : (typeof adj?.fajr === "number" ? adj.fajr : 0),
			SUNRISE: typeof adj?.SUNRISE === "number" ? adj.SUNRISE : (typeof adj?.sunrise === "number" ? adj.sunrise : 0),
			DHUHR: typeof adj?.DHUHR === "number" ? adj.DHUHR : (typeof adj?.dhuhr === "number" ? adj.dhuhr : 0),
			ASR: typeof adj?.ASR === "number" ? adj.ASR : (typeof adj?.asr === "number" ? adj.asr : 0),
			MAGHRIB: typeof adj?.MAGHRIB === "number" ? adj.MAGHRIB : (typeof adj?.maghrib === "number" ? adj.maghrib : 0),
			ISHA: typeof adj?.ISHA === "number" ? adj.ISHA : (typeof adj?.isha === "number" ? adj.isha : 0),
		},
		hijri: {
			adjustmentDays: typeof hij?.adjustmentDays === "number" ? hij.adjustmentDays : DEFAULT_SETTINGS.hijri.adjustmentDays,
		},
		reminder: {
			enabled: typeof rem?.enabled === "boolean" ? rem.enabled : DEFAULT_SETTINGS.reminder.enabled,
			preReminderEnabled: typeof rem?.preReminderEnabled === "boolean" ? rem.preReminderEnabled : DEFAULT_SETTINGS.reminder.preReminderEnabled,
			adhanReminderEnabled: typeof rem?.adhanReminderEnabled === "boolean" ? rem.adhanReminderEnabled : DEFAULT_SETTINGS.reminder.adhanReminderEnabled,
			preReminderMinutes: typeof rem?.preReminderMinutes === "number" ? rem.preReminderMinutes : DEFAULT_SETTINGS.reminder.preReminderMinutes,
			lateGraceMinutes: typeof rem?.lateGraceMinutes === "number" ? rem.lateGraceMinutes : DEFAULT_SETTINGS.reminder.lateGraceMinutes,
		},
	};
}

export interface TodayPrayerResponse {
	locationName: string;
	timezone: string;
	coordinates: {
		latitude: number;
		longitude: number;
	};
	dateLocal: string;
	isFriday: boolean;
	hijri: HijriDateInfo;
	times: PrayerTimesResult["times"];
	nextPrayer: NextPrayerInfo;
	serverNowUtc: string;
}

export async function getTodayPrayer(dateQuery?: string): Promise<TodayPrayerResponse> {
	const settings = await getResolvedSettings();
	const now = new Date();

	const dateLocal =
		dateQuery && /^\d{4}-\d{2}-\d{2}$/.test(dateQuery)
			? dateQuery
			: formatInTimeZone(now, settings.location.timezone, "yyyy-MM-dd");

	const engineInput: PrayerEngineInput = {
		dateLocal,
		latitude: settings.location.latitude,
		longitude: settings.location.longitude,
		timezone: settings.location.timezone,
		fajrAngle: settings.calculation.fajrAngle,
		ishaAngle: settings.calculation.ishaAngle,
		asrFactor: settings.calculation.asrFactor,
		adjustmentsMinutes: settings.adjustments,
	};

	const prayerTimes = calcPrayerTimes(engineInput);
	const hijri = formatHijri(dateLocal, settings.hijri.adjustmentDays);
	const nextPrayer = getNextPrayer({
		todayResult: prayerTimes,
		nowUtc: now,
		inputForTomorrow: {
			...engineInput,
			dateLocal: formatInTimeZone(
				new Date(now.getTime() + 24 * 60 * 60 * 1000),
				settings.location.timezone,
				"yyyy-MM-dd",
			),
		},
	});

	return {
		locationName: settings.location.name,
		timezone: settings.location.timezone,
		coordinates: {
			latitude: settings.location.latitude,
			longitude: settings.location.longitude,
		},
		dateLocal,
		isFriday: prayerTimes.isFriday,
		hijri,
		times: prayerTimes.times,
		nextPrayer,
		serverNowUtc: now.toISOString(),
	};
}

export async function getNextPrayerOnly(): Promise<{
	nextPrayer: NextPrayerInfo;
	serverNowUtc: string;
}> {
	const today = await getTodayPrayer();
	return {
		nextPrayer: today.nextPrayer,
		serverNowUtc: today.serverNowUtc,
	};
}

export async function getPublicSettings() {
	const settings = await getResolvedSettings();
	return {
		locationName: settings.location.name,
		timezone: settings.location.timezone,
		coordinates: {
			latitude: settings.location.latitude,
			longitude: settings.location.longitude,
		},
		methodLabel: settings.calculation.methodLabel,
		preReminderMinutes: settings.reminder.preReminderMinutes,
		hijriAdjustmentDays: settings.hijri.adjustmentDays,
	};
}

export interface PreviewPrayerInput {
	dateLocal?: string;
	latitude?: number;
	longitude?: number;
	timezone?: string;
	fajrAngle?: number;
	ishaAngle?: number;
	asrFactor?: 1 | 2;
	adjustmentsMinutes?: Partial<Record<PrayerOrSunrise, number>>;
	hijriAdjustmentDays?: number;
}

export async function previewPrayerTimes(candidate: PreviewPrayerInput) {
	const settings = await getResolvedSettings();
	const now = new Date();

	const timezone = candidate.timezone ?? settings.location.timezone;
	const dateLocal =
		candidate.dateLocal ??
		formatInTimeZone(now, timezone, "yyyy-MM-dd");

	const engineInput: PrayerEngineInput = {
		dateLocal,
		latitude: candidate.latitude ?? settings.location.latitude,
		longitude: candidate.longitude ?? settings.location.longitude,
		timezone,
		fajrAngle: candidate.fajrAngle ?? settings.calculation.fajrAngle,
		ishaAngle: candidate.ishaAngle ?? settings.calculation.ishaAngle,
		asrFactor: candidate.asrFactor ?? settings.calculation.asrFactor,
		adjustmentsMinutes: {
			...settings.adjustments,
			...candidate.adjustmentsMinutes,
		},
	};

	const prayerTimes = calcPrayerTimes(engineInput);
	const hijriAdj = candidate.hijriAdjustmentDays ?? settings.hijri.adjustmentDays;
	const hijri = formatHijri(dateLocal, hijriAdj);

	return {
		input: engineInput,
		hijri,
		times: prayerTimes.times,
		isFriday: prayerTimes.isFriday,
		serverNowUtc: now.toISOString(),
	};
}
