import { t } from "elysia";

export const testMessageSchema = t.Object({
	targetId: t.Optional(
		t.Number({
			description: "ID database tabel message_targets (mode grup tersimpan)",
		}),
	),
	phone: t.Optional(
		t.String({
			description: "Nomor HP tujuan (mode pribadi), mis. 081234567890",
		}),
	),
	text: t.Optional(
		t.String({
			description: "Teks pesan kustom untuk pengujian",
		}),
	),
});

export const testDayTargetSchema = t.Object({
	targetId: t.Optional(
		t.Number({
			description: "ID database tabel message_targets (mode grup tersimpan)",
		}),
	),
	phone: t.Optional(
		t.String({
			description: "Nomor HP tujuan (mode pribadi), mis. 081234567890",
		}),
	),
});

export const testDayStartSchema = t.Object({
	targetId: t.Optional(t.Number()),
	phone: t.Optional(t.String()),
	indexes: t.Optional(
		t.Array(t.Number(), {
			description: "Seq pesan terpilih dari pratinjau; kosong = semua",
		}),
	),
	delayBaseMs: t.Optional(t.Number({ description: "Jeda dasar antar pesan (default 3000)" })),
	delayJitterMs: t.Optional(t.Number({ description: "Jeda acak tambahan maks (default 2000)" })),
});

export const testDayCancelSchema = t.Object({
	runId: t.String({ description: "ID run dari /test-day/start" }),
});

export const testDayStatusQuerySchema = t.Object({
	runId: t.String({ description: "ID run dari /test-day/start" }),
});
