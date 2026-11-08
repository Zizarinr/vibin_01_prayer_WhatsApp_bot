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
