import crypto from "node:crypto";
import {
	calcPrayerTimes,
	formatHijri,
	type PrayerEngineInput,
} from "@unida-prayer/prayer-engine";
import { PRAYER_NAMES, type PrayerName } from "@unida-prayer/shared";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { createLogger } from "../../core/logger";
import { utcNow } from "../../core/time";
import { db } from "../../database/client";
import { appSettings } from "../../database/schema/appSettings";
import { hadiths, type Hadith } from "../../database/schema/hadiths";
import {
	scheduledMessages,
	type NewScheduledMessage,
} from "../../database/schema/messages";
import { messageTargets } from "../../database/schema/targets";
import { getResolvedSettings, type ResolvedSettings } from "../prayer/service";
import {
	formatIndonesianDate,
	renderAdhanMessage,
	renderPreReminderMessage,
} from "./templates";

const logger = createLogger("generator");

export function computeIdempotencyKey(
	prayerDate: string,
	prayerName: string,
	messageType: string,
	targetDbId: number,
): string {
	const raw = `${prayerDate}|${prayerName}|${messageType}|${targetDbId}`;
	return crypto.createHash("sha256").update(raw).digest("hex");
}


export interface GeneratorResult {
	horizonDays: number;
	activeTargetsCount: number;
	totalJobsGenerated: number;
	skippedReason?: string;
}

export interface RecalculateResult {
	cancelledPendingCount: number;
	generatedCount: number;
	preservedCount: number;
}

/**
 * Buat antrean pesan shalat untuk 7 hari ke depan (termasuk hari ini)
 * secara idempotent (tidak pernah menimpa baris SENT / FAILED / PROCESSING).
 */
export async function generateHorizonMessages(
	overrideSettings?: ResolvedSettings,
): Promise<GeneratorResult> {
	const settings = overrideSettings ?? (await getResolvedSettings());

	if (!settings.reminder.enabled) {
		logger.info("Pengingat dinonaktifkan di pengaturan. Generator dilewati.");
		return {
			horizonDays: 7,
			activeTargetsCount: 0,
			totalJobsGenerated: 0,
			skippedReason: "REMINDER_DISABLED",
		};
	}

	const activeTargets = await db
		.select()
		.from(messageTargets)
		.where(eq(messageTargets.isActive, true));

	if (activeTargets.length === 0) {
		logger.info("Tidak ada target/grup WhatsApp aktif. Generator dilewati.");
		return {
			horizonDays: 7,
			activeTargetsCount: 0,
			totalJobsGenerated: 0,
			skippedReason: "NO_ACTIVE_TARGETS",
		};
	}

	// Baca content_settings dari app_settings
	const contentSettingsRow = await db
		.select()
		.from(appSettings)
		.where(eq(appSettings.key, "content_settings"))
		.limit(1);

	const contentSettings = (contentSettingsRow[0]?.value as {
		includeHadith?: boolean;
	}) ?? { includeHadith: true };

	// Ambil hadits aktif
	const activeHadiths: Hadith[] = await db
		.select()
		.from(hadiths)
		.where(eq(hadiths.isActive, true));

	const tz = settings.location.timezone;
	const now = utcNow();

	const jobsToInsert: NewScheduledMessage[] = [];
	let lastPickedHadithId: number | null = null;

	// Loop 7 hari horizon
	for (let offset = 0; offset < 7; offset++) {
		const targetDate = addDays(now, offset);
		const dateLocal = formatInTimeZone(targetDate, tz, "yyyy-MM-dd");
		const dayOfMonth = Number.parseInt(dateLocal.slice(8, 10), 10);

		const engineInput: PrayerEngineInput = {
			dateLocal,
			latitude: settings.location.latitude,
			longitude: settings.location.longitude,
			timezone: tz,
			fajrAngle: settings.calculation.fajrAngle,
			ishaAngle: settings.calculation.ishaAngle,
			asrFactor: settings.calculation.asrFactor,
			adjustmentsMinutes: settings.adjustments,
		};

		const timesResult = calcPrayerTimes(engineInput);
		const hijriInfo = formatHijri(dateLocal, settings.hijri.adjustmentDays);
		const gregorianStr = formatIndonesianDate(targetDate, tz);

		for (const prayer of PRAYER_NAMES) {
			const prayerData = timesResult.times[prayer as PrayerName];
			const prayerTimeUtc = prayerData.utc;
			const timeFormatted = prayerData.timeLabel;

			for (const target of activeTargets) {
				// 1. PRE-REMINDER
				if (settings.reminder.preReminderEnabled) {
					const preMinutes = settings.reminder.preReminderMinutes || 3;
					const preScheduledAtUtc = new Date(
						prayerTimeUtc.getTime() - preMinutes * 60 * 1000,
					);
					const preKey = computeIdempotencyKey(
						dateLocal,
						prayer,
						"PRE_REMINDER",
						target.id,
					);

					const preRender = renderPreReminderMessage(prayer as PrayerName, dayOfMonth, {
						time: timeFormatted,
						hijri: hijriInfo.formatted,
						gregorian: gregorianStr,
						isFriday: timesResult.isFriday,
						minutes: preMinutes,
					});

					jobsToInsert.push({
						idempotencyKey: preKey,
						prayerDate: dateLocal,
						prayerName: prayer,
						messageType: "PRE_REMINDER",
						targetId: target.id,
						prayerTimeUtc,
						scheduledAtUtc: preScheduledAtUtc,
						messageBody: preRender.body,
						contentRef: preRender.contentRef,
						status: "PENDING",
					});
				}

				// 2. ADHAN
				if (settings.reminder.adhanReminderEnabled) {
					const adhanKey = computeIdempotencyKey(
						dateLocal,
						prayer,
						"ADHAN",
						target.id,
					);

					// Pilih hadits acak anti-repeat
					let selectedHadith: { id: number; text: string; source: string } | null = null;
					if (contentSettings.includeHadith !== false && activeHadiths.length > 0) {
						let pool = activeHadiths;
						if (activeHadiths.length > 1 && lastPickedHadithId !== null) {
							pool = activeHadiths.filter((h) => h.id !== lastPickedHadithId);
							if (pool.length === 0) pool = activeHadiths;
						}
						const picked = pool[Math.floor(Math.random() * pool.length)];
						if (picked) {
							selectedHadith = {
								id: picked.id,
								text: picked.text,
								source: picked.source,
							};
							lastPickedHadithId = picked.id;
						}
					}

					const adhanRender = renderAdhanMessage(prayer as PrayerName, dayOfMonth, {
						time: timeFormatted,
						hijri: hijriInfo.formatted,
						gregorian: gregorianStr,
						isFriday: timesResult.isFriday,
						hadith: selectedHadith,
					});

					jobsToInsert.push({
						idempotencyKey: adhanKey,
						prayerDate: dateLocal,
						prayerName: prayer,
						messageType: "ADHAN",
						targetId: target.id,
						prayerTimeUtc,
						scheduledAtUtc: prayerTimeUtc,
						messageBody: adhanRender.body,
						contentRef: adhanRender.contentRef,
						status: "PENDING",
					});
				}
			}
		}
	}

	// Insert idempotent ke MySQL: ON DUPLICATE KEY UPDATE id = id (no-op update)
	// Memastikan baris yang sudah SENT / FAILED / PROCESSING tidak disentuh sama sekali!
	// affectedRows MySQL: 1 untuk insert baru, 0 untuk duplikat no-op.
	let insertedCount = 0;
	if (jobsToInsert.length > 0) {
		const batchSize = 50;
		for (let i = 0; i < jobsToInsert.length; i += batchSize) {
			const batch = jobsToInsert.slice(i, i + batchSize);
			const result = await db
				.insert(scheduledMessages)
				.values(batch)
				.onDuplicateKeyUpdate({
					set: {
						id: sql`id`,
					},
				});
			const affected = Number(
				(result as unknown as { affectedRows?: unknown })?.affectedRows ?? 0,
			);
			insertedCount += Number.isSafeInteger(affected) ? affected : 0;
		}
	}

	logger.info("Generator horizon 7 hari selesai.", {
		activeTargets: activeTargets.length,
		totalJobsEvaluated: jobsToInsert.length,
		totalJobsInserted: insertedCount,
	});

	return {
		horizonDays: 7,
		activeTargetsCount: activeTargets.length,
		totalJobsGenerated: insertedCount,
	};
}

/**
 * Batalkan job PENDING untuk target yang baru saja dinonaktifkan.
 */
export async function cancelFuturePendingForInactiveTargets(): Promise<number> {
	const inactiveTargets = await db
		.select({ id: messageTargets.id })
		.from(messageTargets)
		.where(eq(messageTargets.isActive, false));

	if (inactiveTargets.length === 0) return 0;

	const targetIds = inactiveTargets.map((t) => t.id);
	const now = utcNow();

	const result = await db
		.update(scheduledMessages)
		.set({
			status: "CANCELLED",
			lastError: "Target grup WhatsApp dinonaktifkan oleh administrator.",
			updatedAt: now,
		})
		.where(
			and(
				inArray(scheduledMessages.targetId, targetIds),
				eq(scheduledMessages.status, "PENDING"),
				gt(scheduledMessages.scheduledAtUtc, now),
			),
		);

	return Number((result as unknown as { affectedRows?: unknown })?.affectedRows ?? 0);
}

/**
 * Regenerasi job PENDING masa depan saat admin mengubah konfigurasi jadwal / hisab.
 * Sesuai docs/06-worker-scheduler.md §6.6:
 * - SENT, FAILED, PROCESSING tidak disentuh.
 * - PENDING masa depan (scheduled_at > now) dibatalkan lalu di-generate ulang.
 */
export async function recalculateFuturePending(): Promise<RecalculateResult> {
	const now = utcNow();

	// 1. Hitung dan batalkan PENDING masa depan
	const cancelled = await db
		.update(scheduledMessages)
		.set({
			status: "CANCELLED",
			lastError: "Dibatalkan karena perhitungan hisab / pengaturan shalat diperbarui.",
			updatedAt: now,
		})
		.where(
			and(
				eq(scheduledMessages.status, "PENDING"),
				gt(scheduledMessages.scheduledAtUtc, now),
			),
		);

	// 2. Generate ulang horizon 7 hari ke depan
	const genResult = await generateHorizonMessages();

	// 3. Ambil ringkasan
	const preservedRows = await db
		.select({ count: sql<number>`count(*)` })
		.from(scheduledMessages)
		.where(inArray(scheduledMessages.status, ["SENT", "PROCESSING"]));

	return {
		cancelledPendingCount: Number(
			(cancelled as unknown as { affectedRows?: unknown })?.affectedRows ?? 0,
		),
		generatedCount: genResult.totalJobsGenerated,
		preservedCount: Number(preservedRows[0]?.count ?? 0),
	};
}
