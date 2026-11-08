import { and, desc, eq, like, sql } from "drizzle-orm";
import { utcNow } from "../../core/time";
import { db } from "../../database/client";
import { hadiths, type Hadith } from "../../database/schema/hadiths";
import { scheduledMessages } from "../../database/schema/messages";

export interface GetHadithsParams {
	active?: boolean;
	search?: string;
	page?: number;
	limit?: number;
}

export interface PaginatedHadiths {
	items: Hadith[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	warningZeroActive: boolean;
}

export class HadithNotFoundError extends Error {
	constructor(id: number) {
		super(`Hadits dengan ID ${id} tidak ditemukan.`);
		this.name = "HadithNotFoundError";
	}
}

export class HadithValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "HadithValidationError";
	}
}

export async function getHadiths(params: GetHadithsParams): Promise<PaginatedHadiths> {
	const page = Math.max(1, params.page ?? 1);
	const limit = Math.min(100, Math.max(1, params.limit ?? 20));
	const offset = (page - 1) * limit;

	const conditions = [];

	if (params.active !== undefined) {
		conditions.push(eq(hadiths.isActive, params.active));
	}
	if (params.search) {
		const s = `%${params.search}%`;
		conditions.push(like(hadiths.text, s));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const countRes = await db
		.select({ count: sql<number>`count(*)` })
		.from(hadiths)
		.where(whereClause);
	const total = Number(countRes[0]?.count ?? 0);

	const items = await db
		.select()
		.from(hadiths)
		.where(whereClause)
		.orderBy(desc(hadiths.id))
		.limit(limit)
		.offset(offset);

	const activeCountRes = await db
		.select({ count: sql<number>`count(*)` })
		.from(hadiths)
		.where(eq(hadiths.isActive, true));
	const activeCount = Number(activeCountRes[0]?.count ?? 0);

	return {
		items,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit) || 1,
		warningZeroActive: activeCount === 0,
	};
}

export async function createHadith(data: {
	text: string;
	source: string;
	topic?: string;
	isActive?: boolean;
}): Promise<Hadith> {
	if (!data.text || data.text.trim().length < 10) {
		throw new HadithValidationError("Teks hadits minimal harus terdiri dari 10 karakter.");
	}
	if (!data.source || data.source.trim().length === 0) {
		throw new HadithValidationError("Sumber periwayatan / ayat harus diisi.");
	}

	const now = utcNow();
	const result = await db.insert(hadiths).values({
		text: data.text.trim(),
		source: data.source.trim(),
		topic: data.topic?.trim() || "sholat_tepat_waktu",
		isActive: data.isActive ?? true,
		createdAt: now,
		updatedAt: now,
	});

	const insertId = Number(result[0].insertId);
	const created = await db.select().from(hadiths).where(eq(hadiths.id, insertId)).limit(1);
	if (!created[0]) {
		throw new Error("Gagal mengambil hadits yang baru dibuat.");
	}
	return created[0];
}

export async function updateHadith(
	id: number,
	data: {
		text?: string;
		source?: string;
		topic?: string;
		isActive?: boolean;
	},
): Promise<Hadith> {
	const existing = await db.select().from(hadiths).where(eq(hadiths.id, id)).limit(1);
	if (existing.length === 0) {
		throw new HadithNotFoundError(id);
	}

	if (data.text !== undefined && data.text.trim().length < 10) {
		throw new HadithValidationError("Teks hadits minimal harus terdiri dari 10 karakter.");
	}
	if (data.source !== undefined && data.source.trim().length === 0) {
		throw new HadithValidationError("Sumber periwayatan / ayat tidak boleh kosong.");
	}

	const now = utcNow();
	await db
		.update(hadiths)
		.set({
			...(data.text !== undefined ? { text: data.text.trim() } : {}),
			...(data.source !== undefined ? { source: data.source.trim() } : {}),
			...(data.topic !== undefined ? { topic: data.topic.trim() } : {}),
			...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
			updatedAt: now,
		})
		.where(eq(hadiths.id, id));

	const updated = await db.select().from(hadiths).where(eq(hadiths.id, id)).limit(1);
	if (!updated[0]) {
		throw new HadithNotFoundError(id);
	}
	return updated[0];
}

export async function deleteHadith(id: number): Promise<{ softDeleted: boolean }> {
	const existing = await db.select().from(hadiths).where(eq(hadiths.id, id)).limit(1);
	if (existing.length === 0) {
		throw new HadithNotFoundError(id);
	}

	const contentRef = `hadith:${id}`;
	const usedRows = await db
		.select({ count: sql<number>`count(*)` })
		.from(scheduledMessages)
		.where(eq(scheduledMessages.contentRef, contentRef));

	const isUsed = Number(usedRows[0]?.count ?? 0) > 0;

	if (isUsed) {
		await db
			.update(hadiths)
			.set({
				isActive: false,
				updatedAt: utcNow(),
			})
			.where(eq(hadiths.id, id));
		return { softDeleted: true };
	}

	await db.delete(hadiths).where(eq(hadiths.id, id));
	return { softDeleted: false };
}
