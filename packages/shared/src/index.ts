/**
 * Shared domain constants — sumber kebenaran untuk status & tipe pesan.
 * Diimpor oleh apps/api dan apps/web (via Eden Treaty / fetch types).
 */

export const PRAYER_NAMES = [
	"FAJR",
	"DHUHR",
	"ASR",
	"MAGHRIB",
	"ISHA",
] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

export const MESSAGE_TYPES = ["PRE_REMINDER", "ADHAN"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const JOB_STATUSES = [
	"PENDING",
	"PROCESSING",
	"SENT",
	"FAILED",
	"EXPIRED",
	"CANCELLED",
	"UNKNOWN",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const TARGET_TYPES = ["GROUP", "CHAT"] as const;
export type TargetType = (typeof TARGET_TYPES)[number];

/** Kode error API (lihat docs/05-backend-api.md §5.1). */
export const ERROR_CODES = [
	"VALIDATION_ERROR",
	"UNAUTHENTICATED",
	"FORBIDDEN",
	"NOT_FOUND",
	"CONFLICT",
	"BUSINESS_RULE_VIOLATION",
	"RATE_LIMITED",
	"WHATSAPP_SESSION_NOT_CONNECTED",
	"TARGET_NOT_FOUND",
	"MESSAGE_ALREADY_SENT",
	"MESSAGE_EXPIRED",
	"WAHA_UPSTREAM_ERROR",
	"DB_UNAVAILABLE",
	"INTERNAL_ERROR",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiSuccess<T> {
	data: T;
	error: null;
}

export interface ApiFailure {
	data: null;
	error: {
		code: ErrorCode;
		message: string;
	};
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T): ApiSuccess<T> {
	return { data, error: null };
}

export function fail(code: ErrorCode, message: string): ApiFailure {
	return { data: null, error: { code, message } };
}
