import { eq } from "drizzle-orm";
import { createLogger } from "./core/logger";
import { db } from "./database/client";
import { admins } from "./database/schema/admins";
import { hadiths } from "./database/schema/hadiths";

const logger = createLogger("seed");

function argValue(name: string): string | undefined {
	const prefix = `--${name}=`;
	for (const arg of process.argv.slice(2)) {
		if (arg.startsWith(prefix)) return arg.slice(prefix.length);
	}
	return undefined;
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface SeedHadith {
	id?: number;
	text: unknown;
	source: unknown;
}

async function seedAdmin(): Promise<void> {
	const email = (argValue("email") ?? process.env.SEED_ADMIN_EMAIL ?? "")
		.trim()
		.toLowerCase();
	const name = (
		argValue("name") ??
		process.env.SEED_ADMIN_NAME ??
		"Administrator"
	).trim();
	let password = argValue("password") ?? process.env.SEED_ADMIN_PASSWORD ?? "";
	let generated = false;
	if (!password) {
		password =
			crypto.randomUUID().replaceAll("-", "") +
			crypto.randomUUID().replaceAll("-", "");
		generated = true;
	}
	if (!isValidEmail(email)) {
		throw new Error(
			"Seed admin butuh email valid: bun run db:seed --email=admin@contoh.ac.id [--name=...] [--password=...]",
		);
	}
	if (name.length < 2)
		throw new Error("Seed admin butuh --name minimal 2 karakter.");
	if (password.length < 12)
		throw new Error("Seed admin butuh password minimal 12 karakter.");

	const existing = await db
		.select({ id: admins.id })
		.from(admins)
		.where(eq(admins.email, email));
	if (existing.length > 0) {
		logger.info("Admin sudah ada, dilewati.", { email });
		return;
	}
	const passwordHash = await Bun.password.hash(password, {
		algorithm: "argon2id",
	});
	await db.insert(admins).values({ name, email, passwordHash, isActive: true });
	logger.info("Admin dibuat.", { email });
	if (generated) {
		// Dicetak sekali ke stdout operator. Segera ganti setelah login pertama.
		console.log(`SEED_ADMIN_PASSWORD=${password}`);
	}
}

async function seedHadiths(): Promise<void> {
	const file = Bun.file(new URL("../../../data/hadiths.json", import.meta.url));
	if (!(await file.exists())) {
		logger.warn("data/hadiths.json tidak ditemukan, seed hadits dilewati.", {});
		return;
	}
	const raw = (await file.json()) as unknown;
	if (!Array.isArray(raw))
		throw new Error("data/hadiths.json harus berupa array.");
	const existing = await db.select({ seedKey: hadiths.seedKey }).from(hadiths);
	const taken = new Set(existing.map((row) => row.seedKey));
	let inserted = 0;
	for (const item of raw as SeedHadith[]) {
		if (typeof item.text !== "string" || typeof item.source !== "string")
			continue;
		const text = item.text.trim();
		const source = item.source.trim();
		if (text.length < 10 || source.length === 0) continue;
		const key =
			typeof item.id === "number"
				? `hadith-${item.id}`
				: `hadith-text-${text.length}-${source.length}`;
		if (taken.has(key)) continue;
		await db
			.insert(hadiths)
			.values({ seedKey: key, text, source, isActive: true });
		taken.add(key);
		inserted += 1;
	}
	logger.info("Seed hadits selesai.", { inserted });
}

await seedAdmin();
await seedHadiths();
logger.info("Seed selesai.", {});
process.exit(0);
