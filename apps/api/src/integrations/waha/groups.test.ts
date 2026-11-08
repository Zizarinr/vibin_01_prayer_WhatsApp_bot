import { describe, expect, it } from "bun:test";
import { normalizeGroups } from "./groups";

describe("normalizeGroups", () => {
	it("memetakan bentuk GOWS {JID, Name} kapital", () => {
		const res = normalizeGroups([
			{ JID: "120363408856124103@g.us", Name: "Grup Siman" },
		]);
		expect(res).toEqual([{ id: "120363408856124103@g.us", name: "Grup Siman" }]);
	});

	it("memetakan bentuk klasik {id, name} lowercase", () => {
		const res = normalizeGroups([{ id: "12036301@g.us", name: "Grup Lama" }]);
		expect(res).toEqual([{ id: "12036301@g.us", name: "Grup Lama" }]);
	});

	it("memetakan bentuk klasik {id._serialized, subject}", () => {
		const res = normalizeGroups([
			{ id: { _serialized: "12036302@g.us" }, subject: "Subjek Grup" },
		]);
		expect(res).toEqual([{ id: "12036302@g.us", name: "Subjek Grup" }]);
	});

	it("membuang entri tanpa id valid (bukan string 'undefined')", () => {
		const res = normalizeGroups([
			{ Name: "Tanpa JID" },
			{ JID: "12036303@g.us", Name: "Valid" },
		]);
		expect(res).toEqual([{ id: "12036303@g.us", name: "Valid" }]);
	});

	it("memakai id sebagai nama bila nama kosong", () => {
		const res = normalizeGroups([{ JID: "12036304@g.us" }]);
		expect(res).toEqual([{ id: "12036304@g.us", name: "12036304@g.us" }]);
	});

	it("mengembalikan [] untuk respons non-array", () => {
		expect(normalizeGroups(null)).toEqual([]);
		expect(normalizeGroups({})).toEqual([]);
	});
});
