"use client";

import { RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchApi } from "../../../lib/api-client";
import { ErrorBanner, SuccessBanner } from "../../../components/admin/shared/alert-banners";
import { TargetFilters } from "../../../components/admin/targets/target-filters";
import {
	TargetTable,
	type MessageTarget,
} from "../../../components/admin/targets/target-table";

export default function TargetsPage() {
	const [targets, setTargets] = useState<MessageTarget[]>([]);
	const [loading, setLoading] = useState(true);
	const [syncing, setSyncing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [filterActive, setFilterActive] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

	const [editingId, setEditingId] = useState<number | null>(null);
	const [editName, setEditName] = useState("");

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

	const handleToggleActive = async (target: MessageTarget) => {
		const newStatus = !target.isActive;

		setTargets((prev) =>
			prev.map((t) => (t.id === target.id ? { ...t, isActive: newStatus } : t)),
		);

		const res = await fetchApi<MessageTarget>(`/api/admin/targets/${target.id}`, {
			method: "PATCH",
			body: JSON.stringify({ isActive: newStatus }),
		});

		if (res.error) {
			setError(res.error.message);
			setTargets((prev) =>
				prev.map((t) => (t.id === target.id ? { ...t, isActive: !newStatus } : t)),
			);
		}
	};

	const handleStartEdit = (target: MessageTarget) => {
		setEditingId(target.id);
		setEditName(target.name);
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditName("");
	};

	const handleSaveEdit = async (id: number) => {
		if (!editName.trim()) return;

		setTargets((prev) =>
			prev.map((t) => (t.id === id ? { ...t, name: editName.trim() } : t)),
		);
		setEditingId(null);

		const res = await fetchApi<MessageTarget>(`/api/admin/targets/${id}`, {
			method: "PATCH",
			body: JSON.stringify({ name: editName.trim() }),
		});

		if (res.error) {
			setError(res.error.message);
			loadTargets();
		}
	};

	const filteredTargets = useMemo(() => {
		return targets.filter((t) => {
			if (filterActive === "ACTIVE" && !t.isActive) return false;
			if (filterActive === "INACTIVE" && t.isActive) return false;

			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				return (
					t.name.toLowerCase().includes(q) || t.targetId.toLowerCase().includes(q)
				);
			}

			return true;
		});
	}, [targets, filterActive, searchQuery]);

	const activeCount = useMemo(() => targets.filter((t) => t.isActive).length, [targets]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold text-[#102A46] sm:text-2xl">
						Grup & Target Pengiriman
					</h1>
					<p className="text-xs text-[#64748B]">
						Kelola daftar grup WhatsApp penerima pengingat shalat. Hanya grup dengan status{" "}
						<strong>Aktif</strong> yang akan menerima pesan.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleSync}
						disabled={syncing || loading}
						className="inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1D5FA7] transition disabled:opacity-50"
					>
						<RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
						<span>{syncing ? "Sinkronisasi..." : "Sinkronisasi Grup"}</span>
					</button>
				</div>
			</div>

			<ErrorBanner message={error} onClose={() => setError(null)} />
			<SuccessBanner message={successMsg} onClose={() => setSuccessMsg(null)} />

			<div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200/80 px-4 py-3 shadow-2xs text-xs text-[#64748B]">
				<div>
					Total terdaftar: <strong className="text-[#102A46]">{targets.length} grup</strong> • Aktif menerima pesan:{" "}
					<strong className="text-emerald-700">{activeCount} grup</strong>
				</div>
				<div className="flex items-center gap-1.5 text-[11px] text-[#1D5FA7]">
					<ShieldCheck className="h-4 w-4" />
					<span>Grup baru hasil sync default nonaktif</span>
				</div>
			</div>

			<TargetFilters
				searchQuery={searchQuery}
				filterActive={filterActive}
				onSearchChange={setSearchQuery}
				onFilterChange={setFilterActive}
			/>

			<div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
				<TargetTable
					targets={filteredTargets}
					loading={loading}
					editingId={editingId}
					editName={editName}
					onStartEdit={handleStartEdit}
					onCancelEdit={handleCancelEdit}
					onChangeEditName={setEditName}
					onSaveEdit={handleSaveEdit}
					onToggleActive={handleToggleActive}
				/>
			</div>
		</div>
	);
}
