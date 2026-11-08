import { describe, expect, it } from "bun:test";
import { normalizePhoneToChatId } from "./phone";
import { WahaError } from "./types";

describe("normalizePhoneToChatId", () => {
	it("mengubah 08... menjadi 62...@c.us", () => {
		expect(normalizePhoneToChatId("081234567890")).toBe("6281234567890@c.us");
	});

	it("menerima +62, 62, dan tanpa kode negara (asumsi Indonesia)", () => {
		expect(normalizePhoneToChatId("+6281234567890")).toBe("6281234567890@c.us");
		expect(normalizePhoneToChatId("6281234567890")).toBe("6281234567890@c.us");
		expect(normalizePhoneToChatId("81234567890")).toBe("6281234567890@c.us");
	});

	it("mengabaikan spasi, strip, dan tanda plus", () => {
		expect(normalizePhoneToChatId("0812-3456-7890")).toBe("6281234567890@c.us");
	});

	it("menolak nomor terlalu pendek / tidak valid dengan 400", () => {
		for (const bad of ["123", "abcdefghij", "", "62"]) {
			try {
				normalizePhoneToChatId(bad);
				throw new Error(`seharusnya menolak: ${bad}`);
			} catch (error) {
				expect(error).toBeInstanceOf(WahaError);
				expect((error as WahaError).statusCode).toBe(400);
				expect((error as WahaError).code).toBe("VALIDATION_ERROR");
			}
		}
	});

	it("menolak ID grup (@g.us) untuk mode pribadi", () => {
		try {
			normalizePhoneToChatId("120363408856124103@g.us");
			throw new Error("seharusnya menolak ID grup");
		} catch (error) {
			expect(error).toBeInstanceOf(WahaError);
			expect((error as WahaError).statusCode).toBe(400);
		}
	});
});
