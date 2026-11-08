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
import { config } from "../../core/config";
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
	TEMPLATE_BODY_MARKER,
	TEMPLATE_VERSION,
} from "./templates";
import { MANUAL_CANCEL_PREFIX } from "./service";

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

/**
 * Ambil jumlah baris terdampak dari hasil mentah drizzle-mysql
 * (berbentuk array `[OkPacket, ...]`, bukan objek langsung).
 */
function affectedRowsOf(result: unknown): number {
	const packet = Array.isArray(result) ? result[0] : result;
	const n = Number(
		(packet as { affectedRows?: unknown } | undefined)?.affectedRows ?? 0,
	);
	return Number.isSafeInteger(n) ? n : 0;
}

/**
 * Batalkan PENDING masa depan yang body-nya memakai template lama (tanpa
 * penanda `TEMPLATE_BODY_MARKER`). Tanpa ini, snapshot basi tetap terkirim
 * karena generator tidak pernah menimpa baris yang sudah ada.
 * Pembatalan manual admin tidak disentuh (tidak mungkin basi-di-sweep karena
 * statusnya sudah CANCELLED, bukan PENDING).
 */
export async function cancelStaleTemplatePending(now = utcNow()): Promise<number> {
	const result = await db
		.update(scheduledMessages)
		.set({
			status: "CANCELLED",
			lastError: `Dibatalkan otomatis: template pesan kedaluwarsa (tersedia v${TEMPLATE_VERSION}).`,
			updatedAt: now,
		})
		.where(
			and(
				eq(scheduledMessages.status, "PENDING"),
				gt(scheduledMessages.scheduledAtUtc, now),
				sql`${scheduledMessages.messageBody} NOT LIKE ${`%${TEMPLATE_BODY_MARKER}%`}`,
			),
		);

	return affectedRowsOf(result);
}

/**
 * Hidupkan ulang baris CANCELLED yang kuncinya diregenerasi (mis. pasca
 * recalculate atau sweep template basi) menjadi PENDING segar.
 * INSERT IGNORE tidak menimpa duplikat, sehingga tanpa langkah ini horizon
 * yang pernah dibatalkan tidak akan terisi lagi (antrean mati).
 * Yang dikecualikan: CANCELLED manual admin (`MANUAL_CANCEL_PREFIX`) —
 * itu penonaktifan sengaja per pesan dan tidak boleh bangkit otomatis.
 * SENT / FAILED / PROCESSING / EXPIRED / UNKNOWN tidak disentuh.
 */
export function isRegeneratableRow(
	status: string | null | undefined,
	lastError: string | null | undefined,
): boolean {
	if (status !== "CANCELLED") return false;
	return !(lastError ?? "").startsWith(MANUAL_CANCEL_PREFIX);
}

/**
 * Hapus draf antrean lama yang kuncinya diregenerasi (CANCELLED non-manual)
 * agar INSERT berikutnya menulis baris segar (id + createdAt baru).
 * PENDING segar yang kuncinya bertabrakan dibiarkan (INSERT no-op).
 * Tidak menyentuh SENT / FAILED / PROCESSING / EXPIRED / UNKNOWN dan
 * CANCELLED manual admin.
 * @returns jumlah baris yang dihapus + jumlah kunci yang tetap bertabrakan
 * (dipakai menghitung sisipan baru secara eksak).
 */
export async function deleteRegeneratedRows(
	jobs: NewScheduledMessage[],
): Promise<{ deleted: number; kept: number }> {
	const freshKeys = new Set(jobs.map((j) => j.idempotencyKey));
	if (freshKeys.size === 0) return { deleted: 0, kept: 0 };

	const existing = await db
		.select({
			key: scheduledMessages.idempotencyKey,
			status: scheduledMessages.status,
			lastError: scheduledMessages.lastError,
		})
		.from(scheduledMessages)
		.where(inArray(scheduledMessages.idempotencyKey, [...freshKeys]));

	const deletable = existing
		.filter((row) => isRegeneratableRow(row.status, row.lastError))
		.map((row) => row.key);
	if (deletable.length > 0) {
		await db
			.delete(scheduledMessages)
			.where(
				and(
					eq(scheduledMessages.status, "CANCELLED"),
					inArray(scheduledMessages.idempotencyKey, deletable),
				),
			);
	}
	return { deleted: deletable.length, kept: existing.length - deletable.length };
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

	const contentSettingsRow = await db
		.select()
		.from(appSettings)
		.where(eq(appSettings.key, "content_settings"))
		.limit(1);

	const contentSettings = (contentSettingsRow[0]?.value as {
		includeHadith?: boolean;
	}) ?? { includeHadith: true };

	const activeHadiths: Hadith[] = await db
		.select()
		.from(hadiths)
		.where(eq(hadiths.isActive, true));

	const staleCancelled = await cancelStaleTemplatePending();
	if (staleCancelled > 0) {
		logger.info("Antrean template basi dibatalkan untuk diregenerasi.", {
			staleCancelled,
			templateVersion: TEMPLATE_VERSION,
		});
	}

	const tz = settings.location.timezone;
	const now = utcNow();

	const jobsToInsert: NewScheduledMessage[] = [];
	let lastPickedHadithId: number | null = null;

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
						detailUrl: config.webUrl,
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

				if (settings.reminder.adhanReminderEnabled) {
					const adhanKey = computeIdempotencyKey(
						dateLocal,
						prayer,
						"ADHAN",
						target.id,
					);

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
						detailUrl: config.webUrl,
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

	// Insert idempotent ke MySQL. Baris yang kuncinya sudah ada tidak disentuh
	// (SENT / FAILED / PROCESSING / PENDING segar aman).
	// Draf lama (CANCELLED non-manual) yang kuncinya diregenerasi dihapus dulu
	// (lihat deleteRegeneratedRows) agar diganti baris segar.
	// Catatan: affectedRows ON DUPLICATE KEY UPDATE menghitung 2 per baris duplikat,
	// jadi hitungan sisipan eksak = total kunci − kunci yang tetap bertabrakan.
	let insertedCount = 0;
	if (jobsToInsert.length > 0) {
		const { deleted: deletedCount, kept: keptCount } =
			await deleteRegeneratedRows(jobsToInsert);
		if (deletedCount > 0) {
			logger.info("Draf antrean lama dihapus untuk diganti baris segar.", {
				deletedCount,
				templateVersion: TEMPLATE_VERSION,
			});
		}
		const batchSize = 50;
		for (let i = 0; i < jobsToInsert.length; i += batchSize) {
			const batch = jobsToInsert.slice(i, i + batchSize);
			await db.insert(scheduledMessages).values(batch).onDuplicateKeyUpdate({
				set: {
					id: sql`id`,
				},
			});
		}
		insertedCount = jobsToInsert.length - keptCount;
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

	return affectedRowsOf(result);
}

/**
 * Regenerasi job PENDING masa depan saat admin mengubah konfigurasi jadwal / hisab.
 * Sesuai docs/06-worker-scheduler.md §6.6:
 * - SENT, FAILED, PROCESSING tidak disentuh.
 * - PENDING masa depan (scheduled_at > now) dibatalkan lalu di-generate ulang.
 * - Draf lama (CANCELLED non-manual) yang kuncinya diregenerasi dihapus dan
 *   diganti baris segar (deleteRegeneratedRows); CANCELLED manual admin dipertahankan.
 */
export async function recalculateFuturePending(): Promise<RecalculateResult> {
	const now = utcNow();

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

	const genResult = await generateHorizonMessages();

	const preservedRows = await db
		.select({ count: sql<number>`count(*)` })
		.from(scheduledMessages)
		.where(inArray(scheduledMessages.status, ["SENT", "PROCESSING"]));

	return {
		cancelledPendingCount: affectedRowsOf(cancelled),
		generatedCount: genResult.totalJobsGenerated,
		preservedCount: Number(preservedRows[0]?.count ?? 0),
	};
}
