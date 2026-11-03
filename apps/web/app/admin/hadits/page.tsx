"use client";

import {
	AlertCircle,
	AlertTriangle,
	BookOpen,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Edit2,
	Plus,
	RefreshCw,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api-client";

interface HadithItem {
	id: number;
	seedKey: string | null;
	text: string;
	source: string;
	topic: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

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
	const [formTopic, setFormTopic] = useState("sholat_tepat_waktu");
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
		setFormTopic("sholat_tepat_waktu");
		setFormIsActive(true);
		setShowCreateModal(true);
	};

	const handleOpenEdit = (h: HadithItem) => {
		setEditingHadith(h);
		setFormText(h.text);
		setFormSource(h.source);
		setFormTopic(h.topic);
		setFormIsActive(h.isActive);
	};

	// Simpan Hadits Baru
	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setActionLoading(true);
		setError(null);

		const res = await fetchApi<HadithItem>("/api/admin/hadiths", {
			method: "POST",
			body: JSON.stringify({
				text: formText,
				source: formSource,
				topic: formTopic,
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

	// Simpan Update Hadits
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
				topic: formTopic,
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

	// Toggle Aktif/Nonaktif Langsung
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

	// Hapus Hadits
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
			{error && (
				<div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800">
					<AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
					<span className="flex-1 font-medium">{error}</span>
					<button
						type="button"
						onClick={() => setError(null)}
						className="text-rose-600 hover:underline"
					>
						Tutup
					</button>
				</div>
			)}

			{successMsg && (
				<div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
					<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
					<span className="flex-1 font-medium">{successMsg}</span>
					<button
						type="button"
						onClick={() => setSuccessMsg(null)}
						className="text-emerald-600 hover:underline"
					>
						Tutup
					</button>
				</div>
			)}

			{/* Filter & Search Bar */}
			<div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
					<input
						type="text"
						placeholder="Cari teks hadits atau sumber..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setPage(1);
						}}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					/>
				</div>

				<div className="flex items-center gap-1.5 text-xs">
					{(["ALL", "ACTIVE", "INACTIVE"] as const).map((filter) => (
						<button
							key={filter}
							type="button"
							onClick={() => {
								setActiveFilter(filter);
								setPage(1);
							}}
							className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
								activeFilter === filter
									? "bg-[#123B6D] text-white shadow-2xs"
									: "bg-slate-100 text-[#64748B] hover:bg-slate-200/70 hover:text-[#102A46]"
							}`}
						>
							{filter === "ALL" ? "Semua" : filter === "ACTIVE" ? "Aktif" : "Nonaktif"}
						</button>
					))}
				</div>
			</div>

			{/* Table / List */}
			<div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
				{loading ? (
					<div className="flex flex-col items-center justify-center p-12 text-[#64748B] space-y-2">
						<RefreshCw className="h-6 w-6 animate-spin text-[#1D5FA7]" />
						<span className="text-xs">Memuat daftar hadits...</span>
					</div>
				) : hadiths.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-12 text-center text-[#64748B] space-y-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1D5FA7]">
							<BookOpen className="h-6 w-6" />
						</div>
						<h3 className="text-sm font-bold text-[#102A46]">
							Belum Ada Hadits Ditemukan
						</h3>
						<p className="max-w-sm text-xs">
							Tidak ada data hadits yang sesuai dengan filter. Tambahkan hadits baru atau ubah kriteria pencarian.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse text-xs">
							<thead>
								<tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-[#64748B]">
									<th className="py-3 px-4 w-12 text-center">#</th>
									<th className="py-3 px-4">Teks Terjemahan</th>
									<th className="py-3 px-4 w-52">Sumber Periwayatan</th>
									<th className="py-3 px-4 w-28 text-center">Status</th>
									<th className="py-3 px-4 w-28 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 text-[#172B43]">
								{hadiths.map((h, idx) => (
									<tr key={h.id} className="hover:bg-slate-50/80 transition">
										<td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
											{(page - 1) * 15 + idx + 1}
										</td>
										<td className="py-3 px-4">
											<p className="font-medium text-[#102A46] leading-relaxed line-clamp-2">
												&ldquo;{h.text}&rdquo;
											</p>
											{h.seedKey && (
												<span className="inline-block mt-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
													Seed: {h.seedKey}
												</span>
											)}
										</td>
										<td className="py-3 px-4">
											<span className="inline-flex items-center gap-1 font-semibold text-[#123B6D] bg-blue-50/80 px-2.5 py-1 rounded-lg text-[11px]">
												{h.source}
											</span>
										</td>
										<td className="py-3 px-4 text-center">
											<button
												type="button"
												onClick={() => handleToggleActive(h)}
												className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
													h.isActive
														? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30 hover:bg-emerald-100"
														: "bg-slate-100 text-slate-600 ring-1 ring-slate-300 hover:bg-slate-200"
												}`}
											>
												{h.isActive ? "Aktif" : "Nonaktif"}
											</button>
										</td>
										<td className="py-3 px-4 text-right space-x-1">
											<button
												type="button"
												onClick={() => handleOpenEdit(h)}
												title="Edit Hadits"
												className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-[#1D5FA7] transition"
											>
												<Edit2 className="h-4 w-4" />
											</button>
											<button
												type="button"
												onClick={() => setDeleteTargetId(h.id)}
												title="Hapus / Nonaktifkan Hadits"
												className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Pagination */}
				{!loading && totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-[#64748B]">
						<span>
							Menampilkan halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> (Total {totalCount} hadits)
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className="rounded-lg border border-slate-200 p-1.5 text-[#102A46] hover:bg-slate-50 disabled:opacity-40 transition"
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<button
								type="button"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								className="rounded-lg border border-slate-200 p-1.5 text-[#102A46] hover:bg-slate-50 disabled:opacity-40 transition"
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Modal Tambah / Edit Hadits */}
			{(showCreateModal || editingHadith) && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
					<div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl space-y-4">
						<div className="flex items-center justify-between border-b border-slate-100 pb-3">
							<div className="flex items-center gap-2">
								<BookOpen className="h-5 w-5 text-[#1D5FA7]" />
								<h3 className="text-sm font-bold text-[#102A46]">
									{editingHadith ? "Edit Kutipan Hadits / Ayat" : "Tambah Hadits / Ayat Baru"}
								</h3>
							</div>
							<button
								type="button"
								onClick={() => {
									setShowCreateModal(false);
									setEditingHadith(null);
								}}
								className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<form
							onSubmit={editingHadith ? handleUpdate : handleCreate}
							className="space-y-4 text-xs"
						>
							<div>
								<label className="block text-xs font-bold text-[#102A46] mb-1">
									Teks Terjemahan (Bahasa Indonesia):
								</label>
								<textarea
									required
									rows={4}
									value={formText}
									onChange={(e) => setFormText(e.target.value)}
									placeholder="Tuliskan terjemahan hadits atau ayat secara lengkap dan terverifikasi..."
									className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
								/>
								<span className="text-[10px] text-[#64748B]">Minimal 10 karakter.</span>
							</div>

							<div>
								<label className="block text-xs font-bold text-[#102A46] mb-1">
									Sumber Periwayatan / Rujukan:
								</label>
								<input
									type="text"
									required
									value={formSource}
									onChange={(e) => setFormSource(e.target.value)}
									placeholder="Contoh: HR. Bukhari & Muslim / QS. Al-Baqarah: 238"
									className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
								/>
								<span className="text-[10px] text-[#64748B]">
									Bila rujukan diawali <code>QS.</code>, sistem otomatis mencantumkan judul &ldquo;Ayat Hari Ini&rdquo;.
								</span>
							</div>

							<div className="flex items-center gap-2 pt-1">
								<input
									type="checkbox"
									id="hadith-active-check"
									checked={formIsActive}
									onChange={(e) => setFormIsActive(e.target.checked)}
									className="h-4 w-4 rounded-md border-slate-300 text-[#123B6D] focus:ring-[#1D5FA7]"
								/>
								<label
									htmlFor="hadith-active-check"
									className="text-xs font-bold text-[#102A46] cursor-pointer"
								>
									Aktifkan hadits ini untuk pengiriman pesan shalat
								</label>
							</div>

							<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
								<button
									type="button"
									onClick={() => {
										setShowCreateModal(false);
										setEditingHadith(null);
									}}
									className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={actionLoading}
									className="rounded-xl bg-[#123B6D] px-4 py-2 text-xs font-bold text-white hover:bg-[#1D5FA7] disabled:opacity-50 transition"
								>
									{actionLoading ? "Menyimpan..." : "Simpan Hadits"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Modal Konfirmasi Hapus */}
			{deleteTargetId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
					<div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl space-y-4">
						<div className="flex items-center gap-3 text-rose-600">
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
								<Trash2 className="h-5 w-5" />
							</div>
							<h3 className="text-base font-bold text-[#102A46]">
								Hapus / Nonaktifkan Hadits
							</h3>
						</div>
						<p className="text-xs text-[#64748B] leading-relaxed">
							Apakah Anda yakin ingin menghapus hadits ID #{deleteTargetId}? Bila hadits ini pernah tercatat dalam riwayat pesan, sistem akan secara aman mengubah statusnya menjadi <strong>nonaktif</strong> demi menjaga integritas data audit.
						</p>
						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setDeleteTargetId(null)}
								className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={actionLoading}
								className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
							>
								{actionLoading ? "Memproses..." : "Ya, Hapus Hadits"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
