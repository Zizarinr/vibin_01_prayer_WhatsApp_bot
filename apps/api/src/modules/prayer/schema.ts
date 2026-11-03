import { t } from "elysia";

export const todayQuerySchema = t.Object({
	date: t.Optional(
		t.String({
			pattern: "^\\d{4}-\\d{2}-\\d{2}$",
			description: "Tanggal lokal YYYY-MM-DD",
		}),
	),
});

export const previewBodySchema = t.Object({
	dateLocal: t.Optional(
		t.String({
			pattern: "^\\d{4}-\\d{2}-\\d{2}$",
			description: "Tanggal lokal YYYY-MM-DD",
		}),
	),
	latitude: t.Optional(t.Number({ minimum: -90, maximum: 90 })),
	longitude: t.Optional(t.Number({ minimum: -180, maximum: 180 })),
	timezone: t.Optional(t.String()),
	fajrAngle: t.Optional(t.Number({ minimum: 0, maximum: 35 })),
	ishaAngle: t.Optional(t.Number({ minimum: 0, maximum: 35 })),
	asrFactor: t.Optional(t.Union([t.Literal(1), t.Literal(2)])),
	adjustmentsMinutes: t.Optional(
		t.Object({
			FAJR: t.Optional(t.Number({ minimum: -10, maximum: 10 })),
			SUNRISE: t.Optional(t.Number({ minimum: -10, maximum: 10 })),
			DHUHR: t.Optional(t.Number({ minimum: -10, maximum: 10 })),
			ASR: t.Optional(t.Number({ minimum: -10, maximum: 10 })),
			MAGHRIB: t.Optional(t.Number({ minimum: -10, maximum: 10 })),
			ISHA: t.Optional(t.Number({ minimum: -10, maximum: 10 })),
		}),
	),
	hijriAdjustmentDays: t.Optional(
		t.Number({ minimum: -2, maximum: 2, description: "Koreksi -2..+2 hari" }),
	),
});
