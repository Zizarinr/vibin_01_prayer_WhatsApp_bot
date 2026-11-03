import { t } from "elysia";

export const getHadithsQuerySchema = t.Object({
	active: t.Optional(t.BooleanString()),
	search: t.Optional(t.String()),
	page: t.Optional(t.Numeric({ minimum: 1 })),
	limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
});

export const createHadithBodySchema = t.Object({
	text: t.String({ minLength: 10 }),
	source: t.String({ minLength: 1 }),
	topic: t.Optional(t.String()),
	isActive: t.Optional(t.Boolean()),
});

export const updateHadithBodySchema = t.Object({
	text: t.Optional(t.String({ minLength: 10 })),
	source: t.Optional(t.String({ minLength: 1 })),
	topic: t.Optional(t.String()),
	isActive: t.Optional(t.Boolean()),
});

export const hadithIdParamSchema = t.Object({
	id: t.Numeric(),
});
