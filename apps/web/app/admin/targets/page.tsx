"use client";

import {
	AlertCircle,
	Check,
	CheckCircle2,
	Edit2,
	MessageSquare,
	RefreshCw,
	Search,
	ShieldCheck,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchApi } from "../../../lib/api-client";

interface MessageTarget {
	id: number;
	targetType: string;
	targetId: string;
	name: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export default function TargetsPage() {
	const [targets, setTargets] = useState<MessageTarget[]>([]);
	const [loading, setLoading] = useState(true);
	const [syncing, setSyncing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [filterActive, setFilterActive] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

	// Inline editing
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editName, setEditName] = useState("");

	// Load targets
	const loadTargets = useCallback(async () => {
		setLoading(true);
		setError(null);

		const res = await fetchApi<MessageTarget[]>("/api/admin/targets");
		if (res.error) {
			setError(res.error.message);
		} else if (res.data) {
			setTargets(res.data);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		loadTargets();
	}, [loadTargets]);

	// Sync groups from WAHA
	const handleSync = async () => {
		setSyncing(true);
		setError(null);
		setSuccessMsg(null);

		const res = await fetchApi<{
			totalSynced: number;
			newCount: number;
			updatedCount: number;
		}>("/api/admin/whatsapp/groups/sync", {
			method: "POST",
		});

		if (res.error) {
			setError(res.error.message);
		} else if (res.data) {
			setSuccessMsg(
				`Sinkronisasi selesai: ${res.data.totalSynced} grup terbaca (${res.data.newCount} baru, ${res.data.updatedCount} diperbarui). Grup baru berstatus nonaktif secara default.`,
			);
			await loadTargets();
		}
		setSyncing(false);
	};

	// Toggle active status
	const handleToggleActive = async (target: MessageTarget) => {
		const newStatus = !target.isActive;

		// Optimistic update
		setTargets((prev) =>
			prev.map((t) => (t.id === target.id ? { ...t, isActive: newStatus } : t)),
		);

		const res = await fetchApi<MessageTarget>(`/api/admin/targets/${target.id}`, {
			method: "PATCH",
			body: JSON.stringify({ isActive: newStatus }),
		});

		if (res.error) {
			setError(res.error.message);
			// Rollback
			setTargets((prev) =>
				prev.map((t) => (t.id === target.id ? { ...t, isActive: target.isActive } : t)),
			);
		}
	};

	// Save edited name
	const handleSaveName = async (id: number) => {
		if (!editName.trim()) {
			setEditingId(null);
			return;
		}

		const res = await fetchApi<MessageTarget>(`/api/admin/targets/${id}`, {
			method: "PATCH",
			body: JSON.stringify({ name: editName.trim() }),
		});

		if (res.error) {
			setError(res.error.message);
		} else if (res.data) {
			setTargets((prev) =>
				prev.map((t) => (t.id === id ? { ...t, name: editName.trim() } : t)),
			);
			setEditingId(null);
		}
	};

	// Filtered list
	const filteredTargets = useMemo(() => {
		return targets.filter((t) => {
			const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.targetId.toLowerCase().includes(searchQuery.toLowerCase());
			if (!matchesSearch) return false;

			if (filterActive === "ACTIVE") return t.isActive;
			if (filterActive === "INACTIVE") return !t.isActive;
			return true;
		});
	}, [targets, searchQuery, filterActive]);

	const activeCount = useMemo(() => targets.filter((t) => t.isActive).length, [targets]);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold text-[#102A46] sm:text-2xl">
						Grup & Target Pengiriman
					</h1>
					<p className="text-xs text-[#64748B]">
						Daftar grup WhatsApp terdaftar. Bot hanya mengirimkan pengingat ke grup yang berstatus aktif.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleSync}
						disabled={syncing}
						className="inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1D5FA7] disabled:opacity-50"
					>
						<RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
						<span>{syncing ? "Menyinkronkan..." : "Sinkronisasi Grup WAHA"}</span>
					</button>
				</div>
			</div>

			{/* Alert Messages */}
			{error && (
				<div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-xs text-red-700">
					<AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
					<div className="flex-1">{error}</div>
				</div>
			)}

			{successMsg && (
				<div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-700">
					<CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
					<div className="flex-1">{successMsg}</div>
				</div>
			)}

			{/* Summary Bar */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
				<div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
					<span className="text-[11px] font-medium text-[#64748B]">Total Grup Terdata</span>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="text-2xl font-extrabold text-[#102A46]">{targets.length}</span>
						<span className="text-xs text-[#64748B]">Grup</span>
					</div>
				</div>

				<div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
					<span className="text-[11px] font-medium text-[#64748B]">Grup Aktif (Menerima Pesan)</span>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="text-2xl font-extrabold text-emerald-700">{activeCount}</span>
						<span className="text-xs text-emerald-600">Aktif</span>
					</div>
				</div>

				<div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1D5FA7]">
						<ShieldCheck className="h-5 w-5" />
					</div>
					<div className="text-[11px] text-[#64748B]">
						Aturan aman: Grup baru dari hasil sync selalu default <strong className="text-[#102A46]">nonaktif</strong> untuk mencegah spam tak sengaja.
					</div>
				</div>
			</div>

			{/* Search & Filter Toolbar */}
			<div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-2xs ring-1 ring-slate-200/80 sm:flex-row sm:items-center sm:justify-between">
				{/* Search Bar */}
				<div className="relative flex-1">
					<Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Cari berdasarkan nama grup atau WhatsApp ID..."
						className="w-full rounded-xl bg-slate-50 py-2 pl-9 pr-4 text-xs text-[#172B43] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1D5FA7]"
					/>
				</div>

				{/* Filter Tabs */}
				<div className="flex items-center gap-1.5 self-start sm:self-auto">
					<button
						type="button"
						onClick={() => setFilterActive("ALL")}
						className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
							filterActive === "ALL"
								? "bg-[#123B6D] text-white"
								: "text-[#64748B] hover:bg-slate-100"
						}`}
					>
						Semua ({targets.length})
					</button>
					<button
						type="button"
						onClick={() => setFilterActive("ACTIVE")}
						className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
							filterActive === "ACTIVE"
								? "bg-emerald-600 text-white"
								: "text-[#64748B] hover:bg-slate-100"
						}`}
					>
						Aktif ({activeCount})
					</button>
					<button
						type="button"
						onClick={() => setFilterActive("INACTIVE")}
						className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
							filterActive === "INACTIVE"
								? "bg-slate-700 text-white"
								: "text-[#64748B] hover:bg-slate-100"
						}`}
					>
						Nonaktif ({targets.length - activeCount})
					</button>
				</div>
			</div>

			{/* Table of Targets */}
			<div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
				{loading ? (
					<div className="p-8 text-center text-xs text-[#64748B]">
						<RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#1D5FA7] mb-2" />
						Memuat daftar grup...
					</div>
				) : filteredTargets.length === 0 ? (
					<div className="p-12 text-center space-y-3">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
							<Users className="h-6 w-6" />
						</div>
						<h3 className="text-sm font-bold text-[#102A46]">
							{targets.length === 0
								? "Belum Ada Grup yang Terdata"
								: "Tidak Ada Grup yang Sesuai Pencarian"}
						</h3>
						<p className="text-xs text-[#64748B] max-w-sm mx-auto">
							{targets.length === 0
								? "Pastikan sesi WhatsApp di WAHA sudah WORKING, kemudian klik tombol 'Sinkronisasi Grup WAHA' di atas."
								: "Coba ubah kata kunci pencarian atau bersihkan filter."}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs">
							<thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
								<tr>
									<th className="px-6 py-3.5">Nama Grup</th>
									<th className="px-6 py-3.5">WhatsApp ID</th>
									<th className="px-6 py-3.5">Status Pengiriman</th>
									<th className="px-6 py-3.5 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{filteredTargets.map((target) => (
									<tr key={target.id} className="hover:bg-slate-50/60 transition">
										<td className="px-6 py-4">
											{editingId === target.id ? (
												<div className="flex items-center gap-2">
													<input
														type="text"
														value={editName}
														onChange={(e) => setEditName(e.target.value)}
														className="rounded-lg border border-[#1D5FA7] px-2 py-1 text-xs text-[#102A46] focus:outline-none"
														autoFocus
													/>
													<button
														type="button"
														onClick={() => handleSaveName(target.id)}
														className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
													>
														<Check className="h-4 w-4" />
													</button>
												</div>
											) : (
												<div className="flex items-center gap-2">
													<span className="font-bold text-[#102A46]">{target.name}</span>
													<button
														type="button"
														onClick={() => {
															setEditingId(target.id);
															setEditName(target.name);
														}}
														className="text-slate-400 hover:text-[#1D5FA7]"
														title="Ubah Nama Tampilan"
													>
														<Edit2 className="h-3 w-3" />
													</button>
												</div>
											)}
										</td>

										<td className="px-6 py-4 font-mono text-[11px] text-[#64748B]">
											{target.targetId}
										</td>

										<td className="px-6 py-4">
											<button
												type="button"
												onClick={() => handleToggleActive(target)}
												className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold transition shadow-2xs ${
													target.isActive
														? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30 hover:bg-emerald-100"
														: "bg-slate-100 text-slate-600 ring-1 ring-slate-300 hover:bg-slate-200"
												}`}
											>
												<span
													className={`h-2 w-2 rounded-full ${
														target.isActive ? "bg-emerald-500" : "bg-slate-400"
													}`}
												/>
												{target.isActive ? "Aktif (Menerima)" : "Nonaktif"}
											</button>
										</td>

										<td className="px-6 py-4 text-right">
											<Link
												href="/admin/whatsapp"
												className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1D5FA7] shadow-2xs hover:bg-slate-50"
											>
												<MessageSquare className="h-3 w-3" />
												<span>Uji Kirim</span>
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
