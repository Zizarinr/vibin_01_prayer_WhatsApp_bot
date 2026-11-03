import type { PrayerName } from "@unida-prayer/shared";

export type { PrayerName };

export type PrayerOrSunrise = PrayerName | "SUNRISE";

export interface PrayerEngineInput {
	/** Tanggal lokal YYYY-MM-DD di timezone lokasi. */
	dateLocal: string;
	latitude: number;
	longitude: number;
	/** IANA timezone, mis. "Asia/Jakarta". */
	timezone: string;
	fajrAngle: number;
	ishaAngle: number;
	/** 1 = Syafi'i (default), 2 = Hanafi. */
	asrFactor: 1 | 2;
	/** Koreksi menit per waktu (-10 s/d +10 menit). */
	adjustmentsMinutes?: Partial<Record<PrayerOrSunrise, number>>;
}

export interface PrayerTimesUtc {
	fajrUtc: Date;
	sunriseUtc: Date;
	dhuhrUtc: Date;
	asrUtc: Date;
	maghribUtc: Date;
	ishaUtc: Date;
}

export interface FormattedPrayerTime {
	utc: Date;
	time24: string; // "04:15"
	timeLabel: string; // "04:15 WIB"
	displayName: string; // "Subuh" / "Jumat"
}

export interface PrayerTimesResult {
	dateLocal: string;
	timezone: string;
	isFriday: boolean;
	utc: PrayerTimesUtc;
	times: Record<PrayerOrSunrise, FormattedPrayerTime>;
	meta: {
		latitude: number;
		longitude: number;
		fajrAngle: number;
		ishaAngle: number;
		asrFactor: 1 | 2;
		adjustmentsMinutes: Record<PrayerOrSunrise, number>;
	};
}

export interface NextPrayerInfo {
	prayerName: PrayerName;
	displayName: string;
	scheduledAtUtc: Date;
	time24: string;
	timeLabel: string;
	remainingSeconds: number;
	isTomorrow: boolean;
}

export interface HijriDateInfo {
	formatted: string;
	day: number;
	monthName: string;
	year: number;
	adjustmentDays: number;
}
