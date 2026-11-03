import { t } from "elysia";

export const patchSettingsBodySchema = t.Object({
	location: t.Optional(
		t.Object({
			name: t.Optional(t.String({ minLength: 2 })),
			latitude: t.Optional(t.Number({ minimum: -90, maximum: 90 })),
			longitude: t.Optional(t.Number({ minimum: -180, maximum: 180 })),
			timezone: t.Optional(t.String()),
		}),
	),
	prayer_calculation: t.Optional(
		t.Object({
			fajrAngle: t.Optional(t.Number({ minimum: 0, maximum: 30 })),
			ishaAngle: t.Optional(t.Number({ minimum: 0, maximum: 30 })),
			asrFactor: t.Optional(t.Union([t.Literal(1), t.Literal(2)])),
			methodLabel: t.Optional(t.String()),
		}),
	),
	prayer_adjustments: t.Optional(
		t.Object({
			FAJR: t.Optional(t.Integer({ minimum: -10, maximum: 10 })),
			SUNRISE: t.Optional(t.Integer({ minimum: -10, maximum: 10 })),
			DHUHR: t.Optional(t.Integer({ minimum: -10, maximum: 10 })),
			ASR: t.Optional(t.Integer({ minimum: -10, maximum: 10 })),
			MAGHRIB: t.Optional(t.Integer({ minimum: -10, maximum: 10 })),
			ISHA: t.Optional(t.Integer({ minimum: -10, maximum: 10 })),
		}),
	),
	reminder_settings: t.Optional(
		t.Object({
			enabled: t.Optional(t.Boolean()),
			preReminderEnabled: t.Optional(t.Boolean()),
			adhanReminderEnabled: t.Optional(t.Boolean()),
			preReminderMinutes: t.Optional(t.Integer({ minimum: 1, maximum: 30 })),
			lateGraceMinutes: t.Optional(t.Integer({ minimum: 1, maximum: 60 })),
		}),
	),
	hijri_settings: t.Optional(
		t.Object({
			adjustmentDays: t.Optional(t.Integer({ minimum: -2, maximum: 2 })),
		}),
	),
	content_settings: t.Optional(
		t.Object({
			includeHadith: t.Optional(t.Boolean()),
			sendingEnabled: t.Optional(t.Boolean()),
		}),
	),
});
