import { t } from "elysia";

export const getMessagesQuerySchema = t.Object({
	page: t.Optional(t.Numeric({ minimum: 1 })),
	limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
	status: t.Optional(t.String()),
	prayerName: t.Optional(t.String()),
	messageType: t.Optional(t.String()),
	targetId: t.Optional(t.Numeric()),
	from: t.Optional(t.String()),
	to: t.Optional(t.String()),
	search: t.Optional(t.String()),
});

export const messageIdParamSchema = t.Object({
	id: t.Numeric(),
});
