/**
 * Waktu UTC — satu-satunya sumber "sekarang" di backend/worker.
 * Jangan pakai Date lokal host untuk logika jadwal (lihat docs/04 §4.3).
 */
export function utcNow(): Date {
	return new Date();
}

export function toIsoUtc(date: Date): string {
	return date.toISOString();
}
