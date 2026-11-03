/**
 * Prayer engine — kalkulasi & format jadwal shalat.
 *
 * FASE 1: hanya kontrak tipe. Porting `adhan-js` dari V1 dikerjakan di Fase 2
 * (lihat docs/04-prayer-engine-kalender.md, docs/12-migrasi-v1-ke-v2.md).
 */
import type { PrayerName } from "@unida-prayer/shared";

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
	adjustmentsMinutes: Partial<Record<PrayerName | "SUNRISE", number>>;
}

export interface PrayerTimesUtc {
	fajrUtc: Date;
	sunriseUtc: Date;
	dhuhrUtc: Date;
	asrUtc: Date;
	maghribUtc: Date;
	ishaUtc: Date;
}

export function calcPrayerTimes(_input: PrayerEngineInput): PrayerTimesUtc {
	throw new Error("calcPrayerTimes belum diimplementasikan (Fase 2).");
}
