import { WahaError } from "./types";

/**
 * Normalisasi nomor HP admin menjadi chatId WhatsApp (`<digit>@c.us`).
 * Menerima "0813...", "+62813...", "62813...", "813..." (diasumsikan Indonesia).
 * Menolak ID grup (`@g.us` / mengandung "-") — uji pribadi hanya untuk nomor.
 */
export function normalizePhoneToChatId(input: string): string {
	const raw = input.trim();

	if (raw.includes("@")) {
		throw new WahaError(
			"Uji pribadi hanya untuk nomor HP, bukan ID grup/chat. Pilih mode grup untuk menguji ke grup.",
			400,
			"VALIDATION_ERROR",
		);
	}

	let digits = raw.replace(/\D/g, "");
	if (digits.startsWith("0")) {
		digits = `62${digits.slice(1)}`;
	} else if (!digits.startsWith("62") && digits.length >= 9 && digits.length <= 13) {
		digits = `62${digits}`;
	}

	if (!/^\d{10,15}$/.test(digits)) {
		throw new WahaError(
			"Nomor HP tidak valid. Contoh: 081234567890 atau 6281234567890.",
			400,
			"VALIDATION_ERROR",
		);
	}

	return `${digits}@c.us`;
}
