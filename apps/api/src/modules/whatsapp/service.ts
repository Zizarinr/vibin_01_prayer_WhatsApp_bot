import { eq } from "drizzle-orm";
import { db } from "../../database/client";
import { messageTargets } from "../../database/schema/targets";
import {
	getSessionQr,
	getSessionStatus,
	listGroups,
	logoutSession,
	restartSession,
	sendTextMessage,
	startSession,
	stopSession,
	WahaError,
} from "../../integrations/waha";

export async function fetchSessionStatus() {
	return await getSessionStatus();
}

export async function startWahaSession() {
	return await startSession();
}

export async function stopWahaSession() {
	await stopSession();
	return { success: true };
}

export async function restartWahaSession() {
	await restartSession();
	return { success: true };
}

export async function logoutWahaSession() {
	await logoutSession();
	return { success: true };
}

export async function fetchQrCode() {
	return await getSessionQr();
}

export async function sendTestMessage(targetId: number, customText?: string) {
	const [target] = await db
		.select()
		.from(messageTargets)
		.where(eq(messageTargets.id, targetId));

	if (!target) {
		throw new WahaError("Target grup tidak ditemukan di database.", 404, "TARGET_NOT_FOUND");
	}

	const session = await getSessionStatus();
	if (session.status !== "WORKING") {
		throw new WahaError(
			`Sesi WhatsApp belum terhubung (status: ${session.status}). Pastikan pairing QR telah selesai.`,
			503,
			"WHATSAPP_SESSION_NOT_CONNECTED",
		);
	}

	const nowWib = new Date().toLocaleString("id-ID", {
		timeZone: "Asia/Jakarta",
		dateStyle: "full",
		timeStyle: "medium",
	});

	const text =
		customText?.trim() ||
		`🧪 *Uji Coba Pengiriman UNIDA Prayer*\n\nPesan uji coba ini dikirim oleh Administrator sistem untuk memastikan integrasi bot WhatsApp berjalan dengan baik.\n\n📅 Waktu uji: ${nowWib} WIB`;

	const result = await sendTextMessage({
		chatId: target.targetId,
		text,
	});

	return {
		success: true,
		targetName: target.name,
		targetId: target.targetId,
		messageId: result.id,
	};
}

export async function syncGroups() {
	const session = await getSessionStatus();
	if (session.status !== "WORKING") {
		throw new WahaError(
			`Sesi WhatsApp belum aktif (status: ${session.status}). Silakan start/pairing sesi terlebih dahulu untuk sync grup.`,
			503,
			"WHATSAPP_SESSION_NOT_CONNECTED",
		);
	}

	const groups = await listGroups();
	const existingRows = await db.select().from(messageTargets);
	const existingMap = new Map(existingRows.map((r) => [r.targetId, r]));

	let newCount = 0;
	let updatedCount = 0;

	for (const group of groups) {
		const existing = existingMap.get(group.id);
		if (existing) {
			// Update nama bila ada perubahan
			if (existing.name !== group.name) {
				await db
					.update(messageTargets)
					.set({ name: group.name, updatedAt: new Date() })
					.where(eq(messageTargets.id, existing.id));
				updatedCount += 1;
			}
		} else {
			// Grup baru default NONAKTIF
			await db.insert(messageTargets).values({
				targetType: "GROUP",
				targetId: group.id,
				name: group.name,
				isActive: false,
			});
			newCount += 1;
		}
	}

	return {
		totalSynced: groups.length,
		newCount,
		updatedCount,
	};
}
