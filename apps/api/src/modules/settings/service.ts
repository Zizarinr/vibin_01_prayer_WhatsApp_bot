import { utcNow } from "../../core/time";
import { db } from "../../database/client";
import { appSettings } from "../../database/schema/appSettings";
import { recalculateFuturePending, type RecalculateResult } from "../messages/generator";
import { getResolvedSettings, type ResolvedSettings } from "../prayer/service";

export interface AdminSettingsPayload {
	location?: Partial<ResolvedSettings["location"]>;
	prayer_calculation?: Partial<ResolvedSettings["calculation"]>;
	prayer_adjustments?: Partial<ResolvedSettings["adjustments"]>;
	reminder_settings?: Partial<ResolvedSettings["reminder"]>;
	hijri_settings?: Partial<ResolvedSettings["hijri"]>;
	content_settings?: {
		includeHadith?: boolean;
		sendingEnabled?: boolean;
	};
}

export interface AdminSettingsResponse {
	settings: {
		location: ResolvedSettings["location"];
		prayer_calculation: ResolvedSettings["calculation"];
		prayer_adjustments: ResolvedSettings["adjustments"];
		reminder_settings: ResolvedSettings["reminder"];
		hijri_settings: ResolvedSettings["hijri"];
		content_settings: {
			includeHadith: boolean;
			sendingEnabled: boolean;
		};
	};
	recalculateSummary?: RecalculateResult;
}

export async function getAdminSettings(): Promise<AdminSettingsResponse["settings"]> {
	const resolved = await getResolvedSettings();
	const rows = await db.select().from(appSettings);
	const map = new Map<string, unknown>();
	for (const row of rows) {
		map.set(row.key, row.value);
	}

	const content = (map.get("content_settings") as {
		includeHadith?: boolean;
		sendingEnabled?: boolean;
	}) ?? {};

	return {
		location: resolved.location,
		prayer_calculation: resolved.calculation,
		prayer_adjustments: resolved.adjustments,
		reminder_settings: resolved.reminder,
		hijri_settings: resolved.hijri,
		content_settings: {
			includeHadith: content.includeHadith ?? true,
			sendingEnabled: content.sendingEnabled ?? true,
		},
	};
}

export async function updateAdminSettings(
	patch: AdminSettingsPayload,
): Promise<AdminSettingsResponse> {
	const current = await getAdminSettings();
	const now = utcNow();

	// Upsert per key yang berubah
	if (patch.location) {
		const newLocation = { ...current.location, ...patch.location };
		await db
			.insert(appSettings)
			.values({ key: "location", value: newLocation, updatedAt: now })
			.onDuplicateKeyUpdate({ set: { value: newLocation, updatedAt: now } });
	}

	if (patch.prayer_calculation) {
		const newCalc = { ...current.prayer_calculation, ...patch.prayer_calculation };
		await db
			.insert(appSettings)
			.values({ key: "prayer_calculation", value: newCalc, updatedAt: now })
			.onDuplicateKeyUpdate({ set: { value: newCalc, updatedAt: now } });
	}

	if (patch.prayer_adjustments) {
		const newAdj = { ...current.prayer_adjustments, ...patch.prayer_adjustments };
		await db
			.insert(appSettings)
			.values({ key: "prayer_adjustments", value: newAdj, updatedAt: now })
			.onDuplicateKeyUpdate({ set: { value: newAdj, updatedAt: now } });
	}

	if (patch.reminder_settings) {
		const newRem = { ...current.reminder_settings, ...patch.reminder_settings };
		await db
			.insert(appSettings)
			.values({ key: "reminder_settings", value: newRem, updatedAt: now })
			.onDuplicateKeyUpdate({ set: { value: newRem, updatedAt: now } });
	}

	if (patch.hijri_settings) {
		const newHij = { ...current.hijri_settings, ...patch.hijri_settings };
		await db
			.insert(appSettings)
			.values({ key: "hijri_settings", value: newHij, updatedAt: now })
			.onDuplicateKeyUpdate({ set: { value: newHij, updatedAt: now } });
	}

	if (patch.content_settings) {
		const newContent = { ...current.content_settings, ...patch.content_settings };
		await db
			.insert(appSettings)
			.values({ key: "content_settings", value: newContent, updatedAt: now })
			.onDuplicateKeyUpdate({ set: { value: newContent, updatedAt: now } });
	}

	// Trigger regenerasi job PENDING masa depan bila setting hisab / jadwal berubah
	// hijri ikut memicu karena message_body memuat tanggal Hijriyah.
	let recalcResult: RecalculateResult | undefined;
	const shouldRecalc =
		patch.location ||
		patch.prayer_calculation ||
		patch.prayer_adjustments ||
		patch.reminder_settings ||
		patch.hijri_settings;

	if (shouldRecalc) {
		// Validasi timezone IANA sebelum generate ulang agar tidak crash formatInTimeZone.
		if (patch.location?.timezone) {
			try {
				Intl.DateTimeFormat(undefined, { timeZone: patch.location.timezone });
			} catch {
				throw new Error(`Timezone tidak valid: ${patch.location.timezone}`);
			}
		}
		recalcResult = await recalculateFuturePending();
	}

	const updated = await getAdminSettings();
	return {
		settings: updated,
		recalculateSummary: recalcResult,
	};
}
