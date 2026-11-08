import { describe, expect, it } from "bun:test";
import { getTargetsList, TargetNotFoundError, updateTargetById } from "./service";

describe("apps/api/modules/targets", () => {
	it("mengambil daftar target dari database tanpa error", async () => {
		const list = await getTargetsList();
		expect(Array.isArray(list)).toBe(true);
	});

	it("melempar TargetNotFoundError bila mengupdate target yang tidak ada", async () => {
		expect(
			updateTargetById(999999999, { isActive: true }),
		).rejects.toThrow(TargetNotFoundError);
	});
});
