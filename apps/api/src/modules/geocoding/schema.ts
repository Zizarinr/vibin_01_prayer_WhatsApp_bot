import { t } from "elysia";

export const geocodingSearchQuerySchema = t.Object({
	q: t.String({ minLength: 2, maxLength: 100 }),
});

export const geocodingReverseQuerySchema = t.Object({
	lat: t.Numeric({ minimum: -90, maximum: 90 }),
	lon: t.Numeric({ minimum: -180, maximum: 180 }),
});
