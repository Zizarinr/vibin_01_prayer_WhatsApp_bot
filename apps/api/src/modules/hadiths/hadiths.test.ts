import { describe, expect, it } from "bun:test";
import { createHadith, HadithValidationError } from "./service";

describe("modules/hadiths", () => {
	it("menolak pembuatan hadits dengan teks kurang dari 10 karakter", async () => {
		expect(
			createHadith({
				text: "Pendek",
				source: "HR. Muslim",
			}),
		).rejects.toBeInstanceOf(HadithValidationError);
	});

	it("menolak pembuatan hadits tanpa sumber periwayatan", async () => {
		expect(
			createHadith({
				text: "Ini teks hadits yang cukup panjang lebih dari sepuluh karakter",
				source: "   ",
			}),
		).rejects.toBeInstanceOf(HadithValidationError);
	});
});
