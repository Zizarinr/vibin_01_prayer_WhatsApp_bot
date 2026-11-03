import { and, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { config } from "../../core/config";
import { createLogger } from "../../core/logger";
import { utcNow } from "../../core/time";
import { db } from "../../database/client";
import { appSettings } from "../../database/schema/appSettings";
import {
	scheduledMessages,
	type ScheduledMessage,
} from "../../database/schema/messages";
import { messageTargets } from "../../database/schema/targets";
import { waha } from "../../integrations/waha";
import { WahaError } from "../../integrations/waha/types";
import { getResolvedSettings } from "../prayer/service";

const logger = createLogger("dispatcher");

const MAX_ATTEMPTS = 3;
const LEASE_TIMEOUT_MS = 5 * 60 * 1000; // 5 menit stale PROCESSING lease

export function getBackoffMs(attemptCount: number): number {
	switch (attemptCount) {
		case 1:
			return 30 * 1000; // 30s
		case 2:
			return 2 * 60 * 1000; // 2m
		default:
			return 5 * 60 * 1000; // 5m
	}
}

export interface DispatchTickResult {
	claimedCount: number;
	sentCount: number;
	failedCount: number;
	expiredCount: number;
	unknownCount: number;
	skippedReason?: string;
}

/**
 * Klaim atomik sejumlah pesan PENDING yang jatuh tempo.
 */
export async function claimDueMessages(
	batchSize = 10,
): Promise<ScheduledMessage[]> {
	const now = utcNow();

	return await db.transaction(async (tx) => {
		// Cari kandidat yang PENDING dan waktunya sudah tiba
		const candidates = await tx
			.select()
			.from(scheduledMessages)
			.where(
				and(
					eq(scheduledMessages.status, "PENDING"),
					or(
						and(
							isNull(scheduledMessages.nextAttemptAtUtc),
							lte(scheduledMessages.scheduledAtUtc, now),
						),
						and(
							sql`${scheduledMessages.nextAttemptAtUtc} IS NOT NULL`,
							lte(scheduledMessages.nextAttemptAtUtc, now),
						),
					),
				),
			)
			.orderBy(scheduledMessages.scheduledAtUtc)
			.limit(batchSize)
			.for("update");

		if (candidates.length === 0) {
			return [];
		}

		const ids = candidates.map((c) => c.id);

		// Perbarui status menjadi PROCESSING
		await tx
			.update(scheduledMessages)
			.set({
				status: "PROCESSING",
				claimedAtUtc: now,
				attemptCount: sql`${scheduledMessages.attemptCount} + 1`,
				updatedAt: now,
			})
			.where(inArray(scheduledMessages.id, ids));

		// Kembalikan daftar yang diklaim dengan data terbarui
		return candidates.map((c) => ({
			...c,
			status: "PROCESSING",
			claimedAtUtc: now,
			attemptCount: c.attemptCount + 1,
			updatedAt: now,
		}));
	});
}

/**
 * Eksekusi satu tick dispatcher pengiriman pesan shalat.
 */
export async function runDispatcherTick(batchSize = 10): Promise<DispatchTickResult> {
	const now = utcNow();
	const settings = await getResolvedSettings();

	// Cek kill-switch sendingEnabled
	const contentSettingsRow = await db
		.select()
		.from(appSettings)
		.where(eq(appSettings.key, "content_settings"))
		.limit(1);

	const contentSettings = (contentSettingsRow[0]?.value as {
		sendingEnabled?: boolean;
	}) ?? { sendingEnabled: true };

	if (contentSettings.sendingEnabled === false) {
		logger.warn("Kill-switch aktif: pengiriman pesan sedang dimatikan.");
		return {
			claimedCount: 0,
			sentCount: 0,
			failedCount: 0,
			expiredCount: 0,
			unknownCount: 0,
			skippedReason: "KILL_SWITCH_ACTIVE",
		};
	}

	const claimed = await claimDueMessages(batchSize);
	if (claimed.length === 0) {
		return {
			claimedCount: 0,
			sentCount: 0,
			failedCount: 0,
			expiredCount: 0,
			unknownCount: 0,
		};
	}

	logger.info(`Mengklaim ${claimed.length} pesan untuk diproses.`, {
		count: claimed.length,
	});

	let sentCount = 0;
	let failedCount = 0;
	let expiredCount = 0;
	let unknownCount = 0;

	// Ambil semua target terkait
	const targetIds = [...new Set(claimed.map((c) => c.targetId))];
	const targets = await db
		.select()
		.from(messageTargets)
		.where(inArray(messageTargets.id, targetIds));
	const targetMap = new Map(targets.map((t) => [t.id, t]));

	const lateGraceMs = (settings.reminder.lateGraceMinutes || 5) * 60 * 1000;

	// Cek status sesi WAHA terlebih dahulu
	let wahaIsWorking = true;
	try {
		const session = await waha.sessions.getStatus(config.wahaSession);
		if (session.status !== "WORKING") {
			wahaIsWorking = false;
			logger.warn(`Sesi WAHA '${config.wahaSession}' tidak WORKING (${session.status}).`);
		}
	} catch (err) {
		wahaIsWorking = false;
		logger.error("Gagal memeriksa sesi WAHA.", {
			error: err instanceof Error ? err.message : String(err),
		});
	}

	// Gunakan Promise.allSettled agar satu kegagalan target tidak memblokir target lain
	const promises = claimed.map(async (msg) => {
		const target = targetMap.get(msg.targetId);

		// 1. Cek target aktif
		if (!target || !target.isActive) {
			await db
				.update(scheduledMessages)
				.set({
					status: "CANCELLED",
					lastError: "Target grup WhatsApp tidak aktif atau telah dihapus.",
					updatedAt: utcNow(),
				})
				.where(eq(scheduledMessages.id, msg.id));
			return;
		}

		// 2. Cek apakah sudah expired melewati lateGraceMinutes
		const diffMs = now.getTime() - new Date(msg.scheduledAtUtc).getTime();
		if (diffMs > lateGraceMs) {
			expiredCount++;
			await db
				.update(scheduledMessages)
				.set({
					status: "EXPIRED",
					lastError: `Melewati batas toleransi keterlambatan (${settings.reminder.lateGraceMinutes} menit).`,
					updatedAt: utcNow(),
				})
				.where(eq(scheduledMessages.id, msg.id));
			return;
		}

		// 3. Bila sesi WAHA down, jadwalkan retry backoff jika belum lewat max attempt
		if (!wahaIsWorking) {
			if (msg.attemptCount < MAX_ATTEMPTS) {
				const nextAttempt = new Date(now.getTime() + getBackoffMs(msg.attemptCount));
				await db
					.update(scheduledMessages)
					.set({
						status: "PENDING",
						nextAttemptAtUtc: nextAttempt,
						lastError: "Sesi WhatsApp belum terhubung (menunggu reconnect).",
						updatedAt: utcNow(),
					})
					.where(eq(scheduledMessages.id, msg.id));
			} else {
				failedCount++;
				await db
					.update(scheduledMessages)
					.set({
						status: "FAILED",
						lastError: "Gagal kirim: sesi WhatsApp tidak terhubung setelah batas retry.",
						updatedAt: utcNow(),
					})
					.where(eq(scheduledMessages.id, msg.id));
			}
			return;
		}

		// 4. Kirim via WAHA
		try {
			const sendRes = await waha.messages.sendText({
				session: config.wahaSession,
				chatId: target.targetId,
				text: msg.messageBody,
			});

			sentCount++;
			await db
				.update(scheduledMessages)
				.set({
					status: "SENT",
					sentAtUtc: utcNow(),
					wahaMessageId: sendRes.id,
					lastError: null,
					updatedAt: utcNow(),
				})
				.where(eq(scheduledMessages.id, msg.id));

			logger.info("Pesan berhasil dikirim via WAHA.", {
				messageId: msg.id,
				target: target.name,
				wahaMessageId: sendRes.id,
			});
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);

			// Deteksi hasil ambigu: timeout setelah kirim atau koneksi terputus saat request berlangsung
			const isAmbiguous =
				errorMsg.toLowerCase().includes("timeout") ||
				errorMsg.toLowerCase().includes("network error") ||
				errorMsg.toLowerCase().includes("econnreset");

			if (isAmbiguous) {
				// Sesuai aturan keras AGENTS.md: JANGAN RETRY BUTA, tandai UNKNOWN
				unknownCount++;
				logger.warn("Hasil pengiriman ambigu. Menandai status UNKNOWN.", {
					messageId: msg.id,
					error: errorMsg,
				});
				await db
					.update(scheduledMessages)
					.set({
						status: "UNKNOWN",
						lastError: `Pengiriman ambigu (${errorMsg}). Memerlukan verifikasi manual.`,
						updatedAt: utcNow(),
					})
					.where(eq(scheduledMessages.id, msg.id));
				return;
			}

			// Cek apakah permanent rejection dari WAHA (mis. format ID salah / 4xx)
			const isPermanent =
				error instanceof WahaError &&
				error.statusCode >= 400 &&
				error.statusCode < 500 &&
				error.statusCode !== 408 &&
				error.statusCode !== 429;

			if (isPermanent || msg.attemptCount >= MAX_ATTEMPTS) {
				failedCount++;
				await db
					.update(scheduledMessages)
					.set({
						status: "FAILED",
						lastError: errorMsg,
						updatedAt: utcNow(),
					})
					.where(eq(scheduledMessages.id, msg.id));
			} else {
				// Retry dengan backoff
				const nextAttempt = new Date(now.getTime() + getBackoffMs(msg.attemptCount));
				await db
					.update(scheduledMessages)
					.set({
						status: "PENDING",
						nextAttemptAtUtc: nextAttempt,
						lastError: errorMsg,
						updatedAt: utcNow(),
					})
					.where(eq(scheduledMessages.id, msg.id));
			}
		}
	});

	await Promise.allSettled(promises);

	return {
		claimedCount: claimed.length,
		sentCount,
		failedCount,
		expiredCount,
		unknownCount,
	};
}

/**
 * Recovery saat startup/restart worker:
 * 1. Ambil job PROCESSING yang stale (claimed_at_utc < now - leaseTimeout):
 *    - Jika belum ada wahaMessageId -> kembalikan ke PENDING.
 *    - Jika ada indikasi ambigu -> jadikan UNKNOWN.
 * 2. Tandai PENDING yang sudah lewat grace time -> EXPIRED.
 */
export async function runStartupRecovery(): Promise<{
	recoveredPending: number;
	recoveredUnknown: number;
	expiredCount: number;
}> {
	const now = utcNow();
	const leaseCutoff = new Date(now.getTime() - LEASE_TIMEOUT_MS);
	const settings = await getResolvedSettings();
	const lateGraceMs = (settings.reminder.lateGraceMinutes || 5) * 60 * 1000;
	const graceCutoff = new Date(now.getTime() - lateGraceMs);

	// 1. Stale PROCESSING
	const staleJobs = await db
		.select()
		.from(scheduledMessages)
		.where(
			and(
				eq(scheduledMessages.status, "PROCESSING"),
				lte(scheduledMessages.claimedAtUtc, leaseCutoff),
			),
		);

	let recoveredPending = 0;
	let recoveredUnknown = 0;

	for (const job of staleJobs) {
		if (job.wahaMessageId) {
			// Sudah punya id tapi status gantung -> UNKNOWN
			await db
				.update(scheduledMessages)
				.set({
					status: "UNKNOWN",
					lastError: "Status gantung saat restart worker dengan WAHA ID parsial.",
					updatedAt: now,
				})
				.where(eq(scheduledMessages.id, job.id));
			recoveredUnknown++;
		} else {
			// Belum terkirim -> kembalikan ke PENDING
			await db
				.update(scheduledMessages)
				.set({
					status: "PENDING",
					nextAttemptAtUtc: now,
					lastError: "Dipulihkan kembali ke PENDING pasca restart worker.",
					updatedAt: now,
				})
				.where(eq(scheduledMessages.id, job.id));
			recoveredPending++;
		}
	}

	// 2. PENDING yang sudah kadaluarsa saat worker mati
	const expiredResult = await db
		.update(scheduledMessages)
		.set({
			status: "EXPIRED",
			lastError: "Kedaluwarsa saat worker sedang offline.",
			updatedAt: now,
		})
		.where(
			and(
				eq(scheduledMessages.status, "PENDING"),
				lte(scheduledMessages.scheduledAtUtc, graceCutoff),
			),
		);

	logger.info("Startup recovery selesai.", {
		recoveredPending,
		recoveredUnknown,
		expired: Number(expiredResult[0]?.affectedRows ?? 0),
	});

	return {
		recoveredPending,
		recoveredUnknown,
		expiredCount: Number(expiredResult[0]?.affectedRows ?? 0),
	};
}
