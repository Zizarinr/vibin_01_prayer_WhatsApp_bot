import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { config } from "../../core/config";
import { utcNow } from "../../core/time";
import { db } from "../../database/client";
import { admins } from "../../database/schema/admins";

export interface AdminProfile {
	id: number;
	name: string;
	email: string;
	lastLoginAt: Date | null;
}

// Sesi stateless: token = adminId.random.issuedAt.expiresAt.signature
// signature = HMAC(appSecret, payload + "." + passwordHash) sehingga
// ganti password otomatis menginvalidasi semua token lama.
// Survive restart API (tidak ada Map in-memory).
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthError extends Error {
	constructor(
		message: string,
		public statusCode: number = 401,
		public code: string = "UNAUTHENTICATED",
	) {
		super(message);
		this.name = "AuthError";
	}
}

function signPayload(payload: string, passwordHash: string): string {
	return crypto
		.createHmac("sha256", config.appSecret)
		.update(`${payload}.${passwordHash}`)
		.digest("hex")
		.slice(0, 32);
}

function generateSessionToken(adminId: number, passwordHash: string): string {
	const random = crypto.randomUUID().replaceAll("-", "");
	const issuedAt = Date.now();
	const expiresAt = issuedAt + SESSION_TTL_MS;
	const payload = `${adminId}.${random}.${issuedAt}.${expiresAt}`;
	return `${payload}.${signPayload(payload, passwordHash)}`;
}

function safeEqual(a: string, b: string): boolean {
	const ba = Buffer.from(a);
	const bb = Buffer.from(b);
	if (ba.length !== bb.length) return false;
	return crypto.timingSafeEqual(ba, bb);
}

export async function loginAdmin(
	emailRaw: string,
	passwordRaw: string,
): Promise<{ admin: AdminProfile; token: string }> {
	const email = emailRaw.trim().toLowerCase();
	const [admin] = await db
		.select()
		.from(admins)
		.where(eq(admins.email, email))
		.limit(1);

	if (!admin) {
		throw new AuthError("Email atau kata sandi tidak sesuai.", 401, "UNAUTHENTICATED");
	}

	if (!admin.isActive) {
		throw new AuthError("Akun administrator telah dinonaktifkan.", 403, "FORBIDDEN");
	}

	const isMatch = await Bun.password.verify(passwordRaw, admin.passwordHash);
	if (!isMatch) {
		throw new AuthError("Email atau kata sandi tidak sesuai.", 401, "UNAUTHENTICATED");
	}

	const now = utcNow();
	await db
		.update(admins)
		.set({
			lastLoginAt: now,
			updatedAt: now,
		})
		.where(eq(admins.id, admin.id));

	const token = generateSessionToken(admin.id, admin.passwordHash);

	return {
		admin: {
			id: admin.id,
			name: admin.name,
			email: admin.email,
			lastLoginAt: now,
		},
		token,
	};
}

export async function getSessionAdmin(token?: string): Promise<AdminProfile> {
	if (!token) {
		throw new AuthError("Sesi login tidak valid atau telah berakhir.", 401, "UNAUTHENTICATED");
	}
	const parts = token.split(".");
	if (parts.length !== 5) {
		throw new AuthError("Sesi login tidak valid atau telah berakhir.", 401, "UNAUTHENTICATED");
	}
	const [adminIdRaw, random, issuedAtRaw, expiresAtRaw, signature] = parts as [
		string,
		string,
		string,
		string,
		string,
	];
	const adminId = Number.parseInt(adminIdRaw ?? "", 10);
	const issuedAt = Number.parseInt(issuedAtRaw ?? "", 10);
	const expiresAt = Number.parseInt(expiresAtRaw ?? "", 10);
	if (
		!Number.isSafeInteger(adminId) ||
		adminId <= 0 ||
		!Number.isSafeInteger(issuedAt) ||
		!Number.isSafeInteger(expiresAt) ||
		!random ||
		random.length < 10 ||
		!signature ||
		Date.now() > expiresAt
	) {
		throw new AuthError("Sesi login tidak valid atau telah berakhir.", 401, "UNAUTHENTICATED");
	}

	const [admin] = await db
		.select()
		.from(admins)
		.where(eq(admins.id, adminId))
		.limit(1);

	if (!admin || !admin.isActive) {
		throw new AuthError("Akun administrator tidak aktif atau tidak ditemukan.", 403, "FORBIDDEN");
	}

	const payload = `${adminIdRaw}.${random}.${issuedAtRaw}.${expiresAtRaw}`;
	const expected = signPayload(payload, admin.passwordHash);
	if (!safeEqual(signature, expected)) {
		throw new AuthError("Sesi login tidak valid atau telah berakhir.", 401, "UNAUTHENTICATED");
	}

	return {
		id: admin.id,
		name: admin.name,
		email: admin.email,
		lastLoginAt: admin.lastLoginAt,
	};
}

export function logoutAdmin(_token?: string): void {
	// Stateless: logout cukup hapus cookie di sisi klien (routes.ts).
	// Token kedaluwarsa otomatis via expiresAt; ganti password membatalkan semua token.
}

export async function changeAdminPassword(
	adminId: number,
	oldPassword: string,
	newPassword: string,
): Promise<void> {
	if (!newPassword || newPassword.length < 12) {
		throw new AuthError(
			"Kata sandi baru minimal harus terdiri dari 12 karakter.",
			400,
			"VALIDATION_ERROR",
		);
	}

	const [admin] = await db
		.select()
		.from(admins)
		.where(eq(admins.id, adminId))
		.limit(1);

	if (!admin) {
		throw new AuthError("Administrator tidak ditemukan.", 404, "NOT_FOUND");
	}

	const isMatch = await Bun.password.verify(oldPassword, admin.passwordHash);
	if (!isMatch) {
		throw new AuthError("Kata sandi lama tidak sesuai.", 400, "VALIDATION_ERROR");
	}

	const passwordHash = await Bun.password.hash(newPassword, {
		algorithm: "argon2id",
	});

	const now = utcNow();
	await db
		.update(admins)
		.set({
			passwordHash,
			updatedAt: now,
		})
		.where(eq(admins.id, adminId));

	// Token lama otomatis invalid karena signature mengikat passwordHash lama.
}
