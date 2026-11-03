import { t } from "elysia";

export const testMessageSchema = t.Object({
	targetId: t.Number({
		description: "ID database tabel message_targets",
	}),
	text: t.Optional(
		t.String({
			description: "Teks pesan kustom untuk pengujian",
		}),
	),
});
