import { and, desc, eq, like } from "drizzle-orm";
import { db } from "../../database/client";
import { messageTargets } from "../../database/schema/targets";

export class TargetNotFoundError extends Error {
	constructor(message = "Target grup tidak ditemukan.") {
		super(message);
		this.name = "TargetNotFoundError";
	}
}

export async function getTargetsList(filter?: {
	active?: string;
	search?: string;
}) {
	const conditions = [];

	if (filter?.active === "true") {
		conditions.push(eq(messageTargets.isActive, true));
	} else if (filter?.active === "false") {
		conditions.push(eq(messageTargets.isActive, false));
	}

	if (filter?.search && filter.search.trim().length > 0) {
		conditions.push(like(messageTargets.name, `%${filter.search.trim()}%`));
	}

	const query = db
		.select()
		.from(messageTargets)
		.orderBy(desc(messageTargets.updatedAt));

	if (conditions.length > 0) {
		return await query.where(and(...conditions));
	}

	return await query;
}

export async function updateTargetById(
	id: number,
	updates: { isActive?: boolean; name?: string },
) {
	const [existing] = await db
		.select()
		.from(messageTargets)
		.where(eq(messageTargets.id, id));

	if (!existing) {
		throw new TargetNotFoundError();
	}

	const values: Partial<typeof messageTargets.$inferInsert> = {
		updatedAt: new Date(),
	};

	if (typeof updates.isActive === "boolean") {
		values.isActive = updates.isActive;
	}
	if (typeof updates.name === "string" && updates.name.trim().length > 0) {
		values.name = updates.name.trim();
	}

	await db
		.update(messageTargets)
		.set(values)
		.where(eq(messageTargets.id, id));

	const [updated] = await db
		.select()
		.from(messageTargets)
		.where(eq(messageTargets.id, id));

	return updated;
}
