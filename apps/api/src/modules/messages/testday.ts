import crypto from "node:crypto";
import {
	calcPrayerTimes,
	formatHijri,
	type PrayerEngineInput,
} from "@unida-prayer/prayer-engine";
import { PRAYER_NAMES, type PrayerName } from "@unida-prayer/shared";
import { formatInTimeZone } from "date-fns-tz";
import { eq } from "drizzle-orm";
import { config } from "../../core/config";
import { createLogger } from "../../core/logger";
import { utcNow } from "../../core/time";
import { db } from "../../database/client";
import { appSettings } from "../../database/schema/appSettings";
import { hadiths, type Hadith } from "../../database/schema/hadiths";
import { messageTargets } from "../../database/schema/targets";
import {
	getSessionStatus,
	normalizePhoneToChatId,
	sendTextMessage,
	WahaError,
} from "../../integrations/waha";
import { getResolvedSettings, type ResolvedSettings } from "../prayer/service";
import {
	formatIndonesianDate,
	getPrayerDisplayName,
	renderAdhanMessage,
	renderPreReminderMessage,
} from "./templates";

const logger = createLogger("test-day");

export interface DayTestMessage {
	seq: number;
	prayerName: PrayerName;
	messageType: "PRE_REMINDER" | "ADHAN";
	label: string;
	body: string;
	contentRef: string;
}

export interface DayTestTarget {
	chatId: string;
	displayName: string;
}

export type DayTestRunStatus = "RUNNING" | "DONE" | "CANCELLED";

export interface DayTestRun {
	runId: string;
	target: DayTestTarget;
	messages: DayTestMessage[];
	status: DayTestRunStatus;
	sent: number;
	failed: number;
	results: { seq: number; ok: boolean; messageId?: string; error?: string }[];
	cancelRequested: boolean;
	createdAt: Date;
}

const runs = new Map<string, DayTestRun>();

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Selesaikan target uji: baris grup tersimpan ATAU nomor pribadi (tanpa simpan DB). */
export async function resolveDayTestTarget(input: {
	targetId?: number;
	phone?: string;
}): Promise<DayTestTarget> {
	if (input.targetId != null) {
		const [row] = await db
			.select()
			.from(messageTargets)
			.where(eq(messageTargets.id, input.targetId));

		if (!row) {
			throw new WahaError("Target grup tidak ditemukan di database.", 404, "TARGET_NOT_FOUND");
		}
		return { chatId: row.targetId, displayName: row.name };
	}

	if (input.phone?.trim()) {
		const chatId = normalizePhoneToChatId(input.phone);
		return { chatId, displayName: chatId };
	}

	throw new WahaError(
		"Pilih grup tersimpan atau isi nomor HP pribadi.",
		400,
		"VALIDATION_ERROR",
	);
}

export interface BuildDayInput {
	settings: ResolvedSettings;
	activeHadiths: Hadith[];
	includeHadith: boolean;
	dateLocal: string;
}

/**
 * Susun pesan uji 1 hari penuh (pre-reminder + adzan per waktu).
 * Logika render sama dengan generator antrean asli, tanpa tulis database.
 */
export function buildDayTestMessages(input: BuildDayInput): DayTestMessage[] {
	const { settings, activeHadiths, includeHadith, dateLocal } = input;
	const tz = settings.location.timezone;
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
	const gregorianStr = formatIndonesianDate(new Date(`${dateLocal}T12:00:00`), tz);
	const preMinutes = settings.reminder.preReminderMinutes || 3;

	const messages: DayTestMessage[] = [];
	let lastPickedHadithId: number | null = null;

	for (const prayer of PRAYER_NAMES) {
		const prayerData = timesResult.times[prayer as PrayerName];
		const displayName = getPrayerDisplayName(prayer as PrayerName, timesResult.isFriday);

		if (settings.reminder.preReminderEnabled) {
			const preRender = renderPreReminderMessage(prayer as PrayerName, dayOfMonth, {
				time: prayerData.timeLabel,
				hijri: hijriInfo.formatted,
				gregorian: gregorianStr,
				isFriday: timesResult.isFriday,
				minutes: preMinutes,
				detailUrl: config.webUrl,
			});
			messages.push({
				seq: messages.length,
				prayerName: prayer as PrayerName,
				messageType: "PRE_REMINDER",
				label: `Pre-reminder · ${displayName}`,
				body: preRender.body,
				contentRef: preRender.contentRef,
			});
		}

		if (settings.reminder.adhanReminderEnabled) {
			let selectedHadith: { id: number; text: string; source: string } | null = null;
			if (includeHadith && activeHadiths.length > 0) {
				let pool = activeHadiths;
				if (activeHadiths.length > 1 && lastPickedHadithId !== null) {
					pool = activeHadiths.filter((h) => h.id !== lastPickedHadithId);
					if (pool.length === 0) pool = activeHadiths;
				}
				const picked = pool[Math.floor(Math.random() * pool.length)];
				if (picked) {
					selectedHadith = { id: picked.id, text: picked.text, source: picked.source };
					lastPickedHadithId = picked.id;
				}
			}

			const adhanRender = renderAdhanMessage(prayer as PrayerName, dayOfMonth, {
				time: prayerData.timeLabel,
				hijri: hijriInfo.formatted,
				gregorian: gregorianStr,
				isFriday: timesResult.isFriday,
				hadith: selectedHadith,
				detailUrl: config.webUrl,
			});
			messages.push({
				seq: messages.length,
				prayerName: prayer as PrayerName,
				messageType: "ADHAN",
				label: `Adzan · ${displayName}`,
				body: adhanRender.body,
				contentRef: adhanRender.contentRef,
			});
		}
	}

	return messages;
}

export interface DayTestPreview {
	target: DayTestTarget;
	dateLocal: string;
	messages: DayTestMessage[];
	estimatedSeconds: number;
}

function estimateSeconds(count: number, delayBaseMs: number, delayJitterMs: number): number {
	if (count === 0) return 0;
	return Math.ceil(((count - 1) * (delayBaseMs + delayJitterMs)) / 1000) + count * 2;
}

/** Bangun pratinjau tanpa mengirim apa pun. */
export async function previewDayTest(
	input: { targetId?: number; phone?: string },
	delayBaseMs = 3000,
	delayJitterMs = 2000,
): Promise<DayTestPreview> {
	const target = await resolveDayTestTarget(input);
	const settings = await getResolvedSettings();

	if (!settings.reminder.enabled) {
		throw new WahaError(
			"Pengingat shalat sedang dinonaktifkan di pengaturan. Aktifkan dulu untuk uji.",
			400,
			"BUSINESS_RULE_VIOLATION",
		);
	}

	const [contentRow, activeHadiths] = await Promise.all([
		db.select().from(appSettings).where(eq(appSettings.key, "content_settings")).limit(1),
		db.select().from(hadiths).where(eq(hadiths.isActive, true)),
	]);
	const includeHadith =
		(contentRow[0]?.value as { includeHadith?: boolean } | undefined)?.includeHadith !== false;

	const tz = settings.location.timezone;
	const dateLocal = formatInTimeZone(utcNow(), tz, "yyyy-MM-dd");
	const messages = buildDayTestMessages({ settings, activeHadiths, includeHadith, dateLocal });

	return {
		target,
		dateLocal,
		messages,
		estimatedSeconds: estimateSeconds(messages.length, delayBaseMs, delayJitterMs),
	};
}

async function processRun(
	run: DayTestRun,
	delayBaseMs: number,
	delayJitterMs: number,
): Promise<void> {
	for (const msg of run.messages) {
		if (run.cancelRequested) {
			run.status = "CANCELLED";
			logger.info("Uji sehari dibatalkan admin.", { runId: run.runId, sent: run.sent });
			return;
		}

		try {
			const result = await sendTextMessage({ chatId: run.target.chatId, text: msg.body });
			run.sent += 1;
			run.results.push({ seq: msg.seq, ok: true, messageId: result.id });
		} catch (error) {
			run.failed += 1;
			run.results.push({
				seq: msg.seq,
				ok: false,
				error: error instanceof Error ? error.message : String(error),
			});
			logger.warn("Pesan uji gagal, lanjut ke berikutnya.", {
				runId: run.runId,
				seq: msg.seq,
				error: error instanceof Error ? error.message : String(error),
			});
		}

		const jitter = Math.floor(Math.random() * (delayJitterMs + 1));
		await sleep(delayBaseMs + jitter);
	}

	run.status = "DONE";
	logger.info("Uji sehari selesai.", { runId: run.runId, sent: run.sent, failed: run.failed });
}

export interface StartDayTestInput {
	targetId?: number;
	phone?: string;
	indexes?: number[];
	delayBaseMs?: number;
	delayJitterMs?: number;
}

/** Mulai pengiriman uji di background. Kembalikan runId untuk polling/batal. */
export async function startDayTestRun(input: StartDayTestInput): Promise<{
	runId: string;
	total: number;
	estimatedSeconds: number;
}> {
	for (const run of runs.values()) {
		if (run.status === "RUNNING") {
			throw new WahaError(
				"Sudah ada uji berjalan. Tunggu selesai atau batalkan dulu.",
				409,
				"CONFLICT",
			);
		}
	}

	const session = await getSessionStatus();
	if (session.status !== "WORKING") {
		throw new WahaError(
			`Sesi WhatsApp belum terhubung (status: ${session.status}). Pastikan pairing QR telah selesai.`,
			503,
			"WHATSAPP_SESSION_NOT_CONNECTED",
		);
	}

	const delayBaseMs = Math.min(Math.max(input.delayBaseMs ?? 3000, 1000), 15000);
	const delayJitterMs = Math.min(Math.max(input.delayJitterMs ?? 2000, 0), 5000);

	const preview = await previewDayTest(
		{ targetId: input.targetId, phone: input.phone },
		delayBaseMs,
		delayJitterMs,
	);

	let messages = preview.messages;
	if (input.indexes && input.indexes.length > 0) {
		const wanted = new Set(input.indexes);
		messages = preview.messages.filter((m) => wanted.has(m.seq));
		if (messages.length === 0) {
			throw new WahaError("Tidak ada pesan terpilih untuk dikirim.", 400, "VALIDATION_ERROR");
		}
	}

	const run: DayTestRun = {
		runId: crypto.randomUUID(),
		target: preview.target,
		messages,
		status: "RUNNING",
		sent: 0,
		failed: 0,
		results: [],
		cancelRequested: false,
		createdAt: new Date(),
	};
	runs.set(run.runId, run);

	// Batasi memori: buang run lama yang sudah selesai.
	if (runs.size > 20) {
		const done = [...runs.values()]
			.filter((r) => r.status !== "RUNNING")
			.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		while (runs.size > 20 && done.length > 0) {
			const oldest = done.shift();
			if (oldest) runs.delete(oldest.runId);
		}
	}

	void processRun(run, delayBaseMs, delayJitterMs);

	return {
		runId: run.runId,
		total: messages.length,
		estimatedSeconds: estimateSeconds(messages.length, delayBaseMs, delayJitterMs),
	};
}

export function getDayTestRun(runId: string): DayTestRun {
	const run = runs.get(runId);
	if (!run) {
		throw new WahaError(
			"Data uji tidak ditemukan (mungkin server baru di-restart). Ulangi dari pratinjau.",
			404,
			"NOT_FOUND",
		);
	}
	return run;
}

export function cancelDayTestRun(runId: string): DayTestRun {
	const run = getDayTestRun(runId);
	if (run.status === "RUNNING") {
		run.cancelRequested = true;
	}
	return run;
}
