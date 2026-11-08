import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { utcNow } from "../../core/time";
import { db } from "../../database/client";
import { scheduledMessages, type ScheduledMessage } from "../../database/schema/messages";
import { messageTargets } from "../../database/schema/targets";

export interface GetMessagesParams {
	page?: number;
	limit?: number;
	status?: string;
	prayerName?: string;
	messageType?: string;
	targetId?: number;
	from?: string;
	to?: string;
	search?: string;
}

export interface ScheduledMessageWithTarget extends ScheduledMessage {
	targetName: string;
	targetExternalId: string;
}

export interface PaginatedMessages {
	items: ScheduledMessageWithTarget[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export class MessageNotFoundError extends Error {
	constructor(id: number) {
		super(`Pesan dengan ID ${id} tidak ditemukan.`);
		this.name = "MessageNotFoundError";
	}
}

export class MessageActionInvalidError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MessageActionInvalidError";
	}
}

export async function getMessages(
	params: GetMessagesParams,
): Promise<PaginatedMessages> {
	const page = Math.max(1, params.page ?? 1);
	const limit = Math.min(100, Math.max(1, params.limit ?? 20));
	const offset = (page - 1) * limit;

	const conditions = [];

	if (params.status) {
		conditions.push(eq(scheduledMessages.status, params.status));
	}
	if (params.prayerName) {
		conditions.push(eq(scheduledMessages.prayerName, params.prayerName));
	}
	if (params.messageType) {
		conditions.push(eq(scheduledMessages.messageType, params.messageType));
	}
	if (params.targetId) {
		conditions.push(eq(scheduledMessages.targetId, params.targetId));
	}
	if (params.from) {
		conditions.push(gte(scheduledMessages.prayerDate, params.from));
	}
	if (params.to) {
		conditions.push(lte(scheduledMessages.prayerDate, params.to));
	}
	if (params.search) {
		const s = `%${params.search}%`;
		conditions.push(
			or(
				like(scheduledMessages.messageBody, s),
				like(messageTargets.name, s),
			),
		);
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(scheduledMessages)
		.leftJoin(messageTargets, eq(scheduledMessages.targetId, messageTargets.id))
		.where(whereClause);

	const total = Number(countResult[0]?.count ?? 0);

	const rows = await db
		.select({
			msg: scheduledMessages,
			targetName: messageTargets.name,
			targetExternalId: messageTargets.targetId,
		})
		.from(scheduledMessages)
		.leftJoin(messageTargets, eq(scheduledMessages.targetId, messageTargets.id))
		.where(whereClause)
		.orderBy(desc(scheduledMessages.scheduledAtUtc), desc(scheduledMessages.id))
		.limit(limit)
		.offset(offset);

	const items: ScheduledMessageWithTarget[] = rows.map((r) => ({
		...r.msg,
		targetName: r.targetName ?? "(Target Tidak Diketahui)",
		targetExternalId: r.targetExternalId ?? "",
	}));

	return {
		items,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit) || 1,
	};
}

export async function getMessageById(
	id: number,
): Promise<ScheduledMessageWithTarget> {
	const rows = await db
		.select({
			msg: scheduledMessages,
			targetName: messageTargets.name,
			targetExternalId: messageTargets.targetId,
		})
		.from(scheduledMessages)
		.leftJoin(messageTargets, eq(scheduledMessages.targetId, messageTargets.id))
		.where(eq(scheduledMessages.id, id))
		.limit(1);

	if (rows.length === 0 || !rows[0]) {
		throw new MessageNotFoundError(id);
	}

	const r = rows[0];
	return {
		...r.msg,
		targetName: r.targetName ?? "(Target Tidak Diketahui)",
		targetExternalId: r.targetExternalId ?? "",
	};
}

/**
 * Retry manual untuk pesan FAILED atau UNKNOWN.
 */
export async function retryMessage(id: number): Promise<ScheduledMessageWithTarget> {
	const msg = await getMessageById(id);

	if (msg.status !== "FAILED" && msg.status !== "UNKNOWN") {
		throw new MessageActionInvalidError(
			`Pesan dengan status '${msg.status}' tidak dapat di-retry manual. Hanya pesan FAILED atau UNKNOWN yang diizinkan.`,
		);
	}

	const now = utcNow();

	await db
		.update(scheduledMessages)
		.set({
			status: "PENDING",
			nextAttemptAtUtc: now,
			lastError: `Dijadwalkan retry manual oleh administrator pada ${now.toISOString()}.`,
			updatedAt: now,
		})
		.where(eq(scheduledMessages.id, id));

	return await getMessageById(id);
}

/**
 * Batalkan pesan PENDING secara manual.
 */
export async function cancelMessage(id: number): Promise<ScheduledMessageWithTarget> {
	const msg = await getMessageById(id);

	if (msg.status !== "PENDING" && msg.status !== "PROCESSING") {
		throw new MessageActionInvalidError(
			`Pesan dengan status '${msg.status}' tidak dapat dibatalkan. Hanya pesan PENDING yang dapat dibatalkan.`,
		);
	}

	const now = utcNow();

	await db
		.update(scheduledMessages)
		.set({
			status: "CANCELLED",
			lastError: `Dibatalkan secara manual oleh administrator pada ${now.toISOString()}.`,
			updatedAt: now,
		})
		.where(eq(scheduledMessages.id, id));

	return await getMessageById(id);
}
