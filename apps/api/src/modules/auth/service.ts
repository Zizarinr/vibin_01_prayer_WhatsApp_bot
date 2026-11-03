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

interface SessionData {
	adminId: number;
	email: string;
	name: string;
	expiresAt: number;
}

// In-memory session store (TTL 7 hari)
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const sessions = new Map<string, SessionData>();

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

function generateSessionToken(adminId: number): string {
	const random = crypto.randomUUID().replaceAll("-", "");
	const payload = `${adminId}:${random}:${Date.now()}`;
	const signature = crypto
		.createHmac("sha256", config.appSecret)
		.update(payload)
		.digest("hex")
		.slice(0, 32);
	return `${payload}.${signature}`;
}

function verifySessionToken(token: string): boolean {
	const lastDot = token.lastIndexOf(".");
	if (lastDot === -1) return false;
	const payload = token.slice(0, lastDot);
	const signature = token.slice(lastDot + 1);
	const expected = crypto
		.createHmac("sha256", config.appSecret)
		.update(payload)
		.digest("hex")
		.slice(0, 32);
	return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
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

	const token = generateSessionToken(admin.id);
	sessions.set(token, {
		adminId: admin.id,
		email: admin.email,
		name: admin.name,
		expiresAt: Date.now() + SESSION_TTL_MS,
	});

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
	if (!token || !verifySessionToken(token)) {
		throw new AuthError("Sesi login tidak valid atau telah berakhir.", 401, "UNAUTHENTICATED");
	}

	const session = sessions.get(token);
	if (!session || Date.now() > session.expiresAt) {
		sessions.delete(token);
		throw new AuthError("Sesi login telah kedaluwarsa.", 401, "UNAUTHENTICATED");
	}

	const [admin] = await db
		.select()
		.from(admins)
		.where(eq(admins.id, session.adminId))
		.limit(1);

	if (!admin || !admin.isActive) {
		sessions.delete(token);
		throw new AuthError("Akun administrator tidak aktif atau tidak ditemukan.", 403, "FORBIDDEN");
	}

	return {
		id: admin.id,
		name: admin.name,
		email: admin.email,
		lastLoginAt: admin.lastLoginAt,
	};
}

export function logoutAdmin(token?: string): void {
	if (token) {
		sessions.delete(token);
	}
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

	// Cabut session lain untuk keamanan (Q-AUTH-02)
	for (const [key, val] of sessions.entries()) {
		if (val.adminId === adminId) {
			sessions.delete(key);
		}
	}
}
