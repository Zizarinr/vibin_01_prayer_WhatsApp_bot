"use client";

import { AlertTriangle, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api-client";
import { HadithDeleteModal } from "../../../components/admin/hadits/hadith-delete-modal";
import { HadithFormModal } from "../../../components/admin/hadits/hadith-form-modal";
import { HaditsFilters } from "../../../components/admin/hadits/hadits-filters";
import {
	HaditsTable,
	type HadithItem,
} from "../../../components/admin/hadits/hadits-table";
import { ErrorBanner, SuccessBanner } from "../../../components/admin/shared/alert-banners";

interface HadithsResponse {
	items: HadithItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	warningZeroActive: boolean;
}

export default function AdminHadithsPage() {
	const [hadiths, setHadiths] = useState<HadithItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [warningZeroActive, setWarningZeroActive] = useState(false);

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);

	// Modals
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editingHadith, setEditingHadith] = useState<HadithItem | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
	const [actionLoading, setActionLoading] = useState(false);

	// Form inputs for create/edit
	const [formText, setFormText] = useState("");
	const [formSource, setFormSource] = useState("");
	const [formIsActive, setFormIsActive] = useState(true);

	const loadHadiths = useCallback(async () => {
		setLoading(true);
		setError(null);

		const params = new URLSearchParams();
		params.set("page", String(page));
		params.set("limit", "15");

		if (activeFilter === "ACTIVE") params.set("active", "true");
		if (activeFilter === "INACTIVE") params.set("active", "false");
		if (searchQuery.trim()) params.set("search", searchQuery.trim());

		const res = await fetchApi<HadithsResponse>(`/api/admin/hadiths?${params.toString()}`);

		if (res.data) {
			setHadiths(res.data.items);
			setTotalPages(res.data.totalPages);
			setTotalCount(res.data.total);
			setWarningZeroActive(res.data.warningZeroActive);
		} else if (res.error) {
			setError(res.error.message);
		}
		setLoading(false);
	}, [page, activeFilter, searchQuery]);

	useEffect(() => {
		loadHadiths();
	}, [loadHadiths]);

	const handleOpenCreate = () => {
		setFormText("");
		setFormSource("");
		setFormIsActive(true);
		setShowCreateModal(true);
	};

	const handleOpenEdit = (h: HadithItem) => {
		setEditingHadith(h);
		setFormText(h.text);
		setFormSource(h.source);
		setFormIsActive(h.isActive);
	};

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setActionLoading(true);
		setError(null);

		const res = await fetchApi<HadithItem>("/api/admin/hadiths", {
			method: "POST",
			body: JSON.stringify({
				text: formText,
				source: formSource,
				topic: "sholat_tepat_waktu",
				isActive: formIsActive,
			}),
		});

		if (res.data) {
			setSuccessMsg("Kutipan hadits / ayat berhasil ditambahkan.");
			setShowCreateModal(false);
			loadHadiths();
		} else if (res.error) {
			setError(res.error.message);
		}
		setActionLoading(false);
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingHadith) return;
		setActionLoading(true);
		setError(null);

		const res = await fetchApi<HadithItem>(`/api/admin/hadiths/${editingHadith.id}`, {
			method: "PATCH",
			body: JSON.stringify({
				text: formText,
				source: formSource,
				topic: editingHadith.topic,
				isActive: formIsActive,
			}),
		});

		if (res.data) {
			setSuccessMsg("Kutipan hadits / ayat berhasil diperbarui.");
			setEditingHadith(null);
			loadHadiths();
		} else if (res.error) {
			setError(res.error.message);
		}
		setActionLoading(false);
	};

	const handleToggleActive = async (h: HadithItem) => {
		const nextState = !h.isActive;
		const res = await fetchApi<HadithItem>(`/api/admin/hadiths/${h.id}`, {
			method: "PATCH",
			body: JSON.stringify({ isActive: nextState }),
		});

		if (res.data) {
			setHadiths((prev) =>
				prev.map((item) => (item.id === h.id ? { ...item, isActive: nextState } : item)),
			);
		} else if (res.error) {
			setError(res.error.message);
		}
	};

	const handleDelete = async () => {
		if (!deleteTargetId) return;
		setActionLoading(true);
		setError(null);

		const res = await fetchApi<{ softDeleted: boolean }>(
			`/api/admin/hadiths/${deleteTargetId}`,
			{ method: "DELETE" },
		);

		if (res.data) {
			if (res.data.softDeleted) {
				setSuccessMsg(
					"Hadits telah dinonaktifkan (soft-delete) karena pernah digunakan pada riwayat pengiriman pesan.",
				);
			} else {
				setSuccessMsg("Hadits berhasil dihapus secara permanen.");
			}
			setDeleteTargetId(null);
			loadHadiths();
		} else if (res.error) {
			setError(res.error.message);
		}
		setActionLoading(false);
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold text-[#102A46] sm:text-2xl">
						Konten Hadits & Ayat Shalat
					</h1>
					<p className="text-xs text-[#64748B]">
						Kelola kutipan hadits dan ayat harian yang disisipkan pada pesan adzan WhatsApp.
					</p>
				</div>
				<button
					type="button"
					onClick={handleOpenCreate}
					className="inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1D5FA7] transition"
				>
					<Plus className="h-4 w-4" />
					<span>Tambah Hadits / Ayat</span>
				</button>
			</div>

			{/* Warning 0 Hadits Aktif */}
			{warningZeroActive && (
				<div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900">
					<AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
					<span className="flex-1 font-medium">
						<strong>Peringatan Sistem:</strong> Tidak ada hadits aktif saat ini. Pesan pengingat shalat akan tetap dikirim secara normal tanpa kutipan hadits.
					</span>
				</div>
			)}

			{/* Alert Messages */}
			<ErrorBanner message={error} onClose={() => setError(null)} />
			<SuccessBanner message={successMsg} onClose={() => setSuccessMsg(null)} />

			{/* Filter & Search Bar */}
			<HaditsFilters
				searchQuery={searchQuery}
				activeFilter={activeFilter}
				onSearchChange={(q) => {
					setSearchQuery(q);
					setPage(1);
				}}
				onFilterChange={(f) => {
					setActiveFilter(f);
					setPage(1);
				}}
			/>

			{/* Table Container */}
			<div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
				<HaditsTable
					hadiths={hadiths}
					loading={loading}
					page={page}
					totalPages={totalPages}
					totalCount={totalCount}
					onPageChange={setPage}
					onToggleActive={handleToggleActive}
					onOpenEdit={handleOpenEdit}
					onRequestDelete={setDeleteTargetId}
				/>
			</div>

			{/* Modals */}
			<HadithFormModal
				isOpen={showCreateModal || editingHadith !== null}
				editingHadith={editingHadith}
				formText={formText}
				formSource={formSource}
				formIsActive={formIsActive}
				actionLoading={actionLoading}
				onChangeText={setFormText}
				onChangeSource={setFormSource}
				onChangeIsActive={setFormIsActive}
				onClose={() => {
					setShowCreateModal(false);
					setEditingHadith(null);
				}}
				onSubmit={editingHadith ? handleUpdate : handleCreate}
			/>

			<HadithDeleteModal
				deleteTargetId={deleteTargetId}
				actionLoading={actionLoading}
				onClose={() => setDeleteTargetId(null)}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
