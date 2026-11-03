import { t } from "elysia";

export const targetsQuerySchema = t.Object({
	active: t.Optional(t.String({ description: "Filter 'true' atau 'false'" })),
	search: t.Optional(t.String({ description: "Kata kunci nama grup" })),
});

export const patchTargetSchema = t.Object({
	isActive: t.Optional(t.Boolean({ description: "Status aktif penerima jadwal" })),
	name: t.Optional(t.String({ minLength: 1, maxLength: 190 })),
});
