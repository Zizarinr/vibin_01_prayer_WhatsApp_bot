import { describe, expect, it } from "bun:test";
import { reverseGeocodeLocation, searchLocations } from "./service";

describe("apps/api/modules/geocoding", () => {
	it("mengabaikan query pencarian kosong atau kurang dari 2 karakter", async () => {
		const emptyRes = await searchLocations("");
		expect(emptyRes).toEqual([]);

		const shortRes = await searchLocations("a");
		expect(shortRes).toEqual([]);
	});

	it("dapat mencari lokasi 'UNIDA Gontor' dan mengembalikan koordinat angka", async () => {
		const results = await searchLocations("UNIDA Gontor");
		expect(Array.isArray(results)).toBe(true);

		const first = results[0];
		if (first) {
			expect(typeof first.placeId).toBe("number");
			expect(typeof first.name).toBe("string");
			expect(typeof first.latitude).toBe("number");
			expect(typeof first.longitude).toBe("number");
			expect(first.latitude).toBeLessThan(0); // Garis lintang Indonesia selatan khatulistiwa
			expect(first.longitude).toBeGreaterThan(90); // Garis bujur Indonesia
		}
	});

	it("dapat melakukan reverse geocode dari koordinat Ponorogo", async () => {
		const result = await reverseGeocodeLocation(-7.8652, 111.4617);
		if (result) {
			expect(typeof result.placeId).toBe("number");
			expect(typeof result.name).toBe("string");
			expect(typeof result.latitude).toBe("number");
			expect(typeof result.longitude).toBe("number");
		}
	});
});
