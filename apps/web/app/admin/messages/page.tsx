"use client";

import {
	AlertCircle,
	AlertTriangle,
	Check,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock,
	Copy,
	Eye,
	MessageSquare,
	RefreshCw,
	RotateCw,
	Search,
	X,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api-client";

interface ScheduledMessageItem {
	id: number;
	idempotencyKey: string;
	prayerDate: string;
	prayerName: string;
	messageType: string;
	targetId: number;
	targetName: string;
	targetExternalId: string;
	prayerTimeUtc: string;
	scheduledAtUtc: string;
	messageBody: string;
	contentRef: string | null;
	status: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "EXPIRED" | "CANCELLED" | "UNKNOWN";
	attemptCount: number;
	nextAttemptAtUtc: string | null;
	claimedAtUtc: string | null;
	sentAtUtc: string | null;
	wahaMessageId: string | null;
	lastError: string | null;
	createdAt: string;
	updatedAt: string;
}

interface MessagesResponse {
	items: ScheduledMessageItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export default function AdminMessagesPage() {
	const [messages, setMessages] = useState<ScheduledMessageItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	// Filter states
	const [statusFilter, setStatusFilter] = useState<string>("ALL");
	const [prayerFilter, setPrayerFilter] = useState<string>("ALL");
	const [typeFilter, setTypeFilter] = useState<string>("ALL");
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);

	// Action modals
	const [selectedMessage, setSelectedMessage] = useState<ScheduledMessageItem | null>(null);
	const [confirmRetryId, setConfirmRetryId] = useState<number | null>(null);
	const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
	const [actionLoading, setActionLoading] = useState(false);
	const [copied, setCopied] = useState(false);

	const loadMessages = useCallback(async () => {
		setLoading(true);
		setError(null);

		const queryParams = new URLSearchParams();
		queryParams.set("page", String(page));
		queryParams.set("limit", "15");

		if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
		if (prayerFilter !== "ALL") queryParams.set("prayerName", prayerFilter);
		if (typeFilter !== "ALL") queryParams.set("messageType", typeFilter);
		if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());

		const res = await fetchApi<MessagesResponse>(`/api/admin/messages?${queryParams.toString()}`);

		if (res.data) {
			setMessages(res.data.items);
			setTotalPages(res.data.totalPages);
			setTotalCount(res.data.total);
		} else if (res.error) {
			setError(res.error.message);
		}
		setLoading(false);
	}, [page, statusFilter, prayerFilter, typeFilter, searchQuery]);

	useEffect(() => {
		loadMessages();
	}, [loadMessages]);

	// Eksekusi Retry
	const handleRetry = async () => {
		if (!confirmRetryId) return;
		setActionLoading(true);
		setError(null);

		const res = await fetchApi<ScheduledMessageItem>(
			`/api/admin/messages/${confirmRetryId}/retry`,
			{ method: "POST" },
		);

		if (res.data) {
			setSuccessMsg(`Pesan ID #${confirmRetryId} berhasil dijadwalkan ulang untuk dikirim.`);
			setConfirmRetryId(null);
			loadMessages();
		} else if (res.error) {
			setError(res.error.message);
		}
		setActionLoading(false);
	};

	// Eksekusi Cancel
	const handleCancel = async () => {
		if (!confirmCancelId) return;
		setActionLoading(true);
		setError(null);

		const res = await fetchApi<ScheduledMessageItem>(
			`/api/admin/messages/${confirmCancelId}/cancel`,
			{ method: "POST" },
		);

		if (res.data) {
			setSuccessMsg(`Pesan ID #${confirmCancelId} berhasil dibatalkan.`);
			setConfirmCancelId(null);
			loadMessages();
		} else if (res.error) {
			setError(res.error.message);
		}
		setActionLoading(false);
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const getStatusBadge = (status: ScheduledMessageItem["status"]) => {
		switch (status) {
			case "SENT":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/30">
						<Check className="h-3 w-3" /> Terkirim
					</span>
				);
			case "PENDING":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-blue-600/30">
						<Clock className="h-3 w-3" /> Antrean
					</span>
				);
			case "PROCESSING":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-600/30">
						<RefreshCw className="h-3 w-3 animate-spin" /> Proses
					</span>
				);
			case "FAILED":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-600/30">
						<X className="h-3 w-3" /> Gagal
					</span>
				);
			case "UNKNOWN":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-800 ring-1 ring-orange-600/40">
						<AlertTriangle className="h-3 w-3" /> Ambigu
					</span>
				);
			case "EXPIRED":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-400/30">
						Kedaluwarsa
					</span>
				);
			case "CANCELLED":
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-300">
						Dibatalkan
					</span>
				);
		}
	};

	const formatPrayerName = (prayer: string) => {
		switch (prayer) {
			case "FAJR":
				return "Subuh";
			case "DHUHR":
				return "Dzuhur/Jumat";
			case "ASR":
				return "Ashar";
			case "MAGHRIB":
				return "Maghrib";
			case "ISHA":
				return "Isya";
			default:
				return prayer;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold text-[#102A46] sm:text-2xl">
						Riwayat & Antrean Pesan
					</h1>
					<p className="text-xs text-[#64748B]">
						Pantau jadwal pengiriman pengingat shalat, status pesan terkirim, dan penanganan kegagalan.
					</p>
				</div>
				<button
					type="button"
					onClick={() => loadMessages()}
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#102A46] shadow-2xs hover:bg-slate-50 transition"
				>
					<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					<span>Segarkan</span>
				</button>
			</div>

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

			{/* Filters Bar */}
			<div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					{/* Search */}
					<div className="relative flex-1">
						<Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
						<input
							type="text"
							placeholder="Cari nama grup atau isi pesan..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPage(1);
							}}
							className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-[#172B43] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
						/>
					</div>

					{/* Sholat Filter */}
					<select
						value={prayerFilter}
						onChange={(e) => {
							setPrayerFilter(e.target.value);
							setPage(1);
						}}
						className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-[#102A46] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					>
						<option value="ALL">Semua Waktu Shalat</option>
						<option value="FAJR">Subuh</option>
						<option value="DHUHR">Dzuhur / Jumat</option>
						<option value="ASR">Ashar</option>
						<option value="MAGHRIB">Maghrib</option>
						<option value="ISHA">Isya</option>
					</select>

					{/* Tipe Filter */}
					<select
						value={typeFilter}
						onChange={(e) => {
							setTypeFilter(e.target.value);
							setPage(1);
						}}
						className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-[#102A46] focus:bg-white focus:border-[#1D5FA7] focus:outline-none"
					>
						<option value="ALL">Semua Jenis Pesan</option>
						<option value="ADHAN">Adzan</option>
						<option value="PRE_REMINDER">Pre-Reminder</option>
					</select>
				</div>

				{/* Status Tabs */}
				<div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
					{[
						{ label: "Semua Status", value: "ALL" },
						{ label: "Antrean (PENDING)", value: "PENDING" },
						{ label: "Terkirim (SENT)", value: "SENT" },
						{ label: "Gagal (FAILED)", value: "FAILED" },
						{ label: "Ambigu (UNKNOWN)", value: "UNKNOWN" },
						{ label: "Kedaluwarsa", value: "EXPIRED" },
						{ label: "Dibatalkan", value: "CANCELLED" },
					].map((tab) => (
						<button
							key={tab.value}
							type="button"
							onClick={() => {
								setStatusFilter(tab.value);
								setPage(1);
							}}
							className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
								statusFilter === tab.value
									? "bg-[#123B6D] text-white shadow-2xs"
									: "bg-slate-100 text-[#64748B] hover:bg-slate-200/70 hover:text-[#102A46]"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Messages Table */}
			<div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
				{loading ? (
					<div className="flex flex-col items-center justify-center p-12 text-[#64748B] space-y-2">
						<RefreshCw className="h-6 w-6 animate-spin text-[#1D5FA7]" />
						<span className="text-xs">Memuat antrean pesan...</span>
					</div>
				) : messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-12 text-center text-[#64748B] space-y-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1D5FA7]">
							<MessageSquare className="h-6 w-6" />
						</div>
						<h3 className="text-sm font-bold text-[#102A46]">
							Tidak Ada Pesan Ditemukan
						</h3>
						<p className="max-w-sm text-xs">
							Tidak ada data pesan yang sesuai dengan filter saat ini. Coba ubah kata kunci pencarian atau status filter.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse text-xs">
							<thead>
								<tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-[#64748B]">
									<th className="py-3 px-4">Status</th>
									<th className="py-3 px-4">Waktu & Tipe</th>
									<th className="py-3 px-4">Target Grup</th>
									<th className="py-3 px-4">Jadwal Kirim</th>
									<th className="py-3 px-4">Percobaan</th>
									<th className="py-3 px-4 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 text-[#172B43]">
								{messages.map((item) => (
									<tr key={item.id} className="hover:bg-slate-50/80 transition">
										<td className="py-3 px-4">{getStatusBadge(item.status)}</td>
										<td className="py-3 px-4">
											<div className="font-bold text-[#102A46]">
												{formatPrayerName(item.prayerName)}
											</div>
											<span className="text-[11px] text-[#64748B]">
												{item.messageType === "ADHAN" ? "Adzan" : "Pre-Reminder"}
											</span>
										</td>
										<td className="py-3 px-4">
											<div className="font-semibold text-[#102A46]">{item.targetName}</div>
											<span className="text-[10px] text-slate-400 font-mono">
												{item.targetExternalId}
											</span>
										</td>
										<td className="py-3 px-4">
											<div className="font-medium text-[#102A46]">{item.prayerDate}</div>
											<span className="text-[11px] text-[#64748B]">
												{new Date(item.scheduledAtUtc).toLocaleTimeString("id-ID", {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
										</td>
										<td className="py-3 px-4">
											<span className="font-semibold text-[#102A46]">
												{item.attemptCount}x
											</span>
											{item.lastError && (
												<div
													title={item.lastError}
													className="max-w-[140px] truncate text-[10px] text-rose-600 font-medium"
												>
													{item.lastError}
												</div>
											)}
										</td>
										<td className="py-3 px-4 text-right space-x-1">
											<button
												type="button"
												onClick={() => setSelectedMessage(item)}
												title="Lihat Pesan Lengkap"
												className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-[#1D5FA7] transition"
											>
												<Eye className="h-4 w-4" />
											</button>

											{(item.status === "FAILED" || item.status === "UNKNOWN") && (
												<button
													type="button"
													onClick={() => setConfirmRetryId(item.id)}
													title="Coba Kirim Ulang (Retry)"
													className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
												>
													<RotateCw className="h-4 w-4" />
												</button>
											)}

											{item.status === "PENDING" && (
												<button
													type="button"
													onClick={() => setConfirmCancelId(item.id)}
													title="Batalkan Pesan"
													className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition"
												>
													<XCircle className="h-4 w-4" />
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Pagination Footer */}
				{!loading && totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-[#64748B]">
						<span>
							Menampilkan halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> (Total {totalCount} pesan)
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

			{/* Modal Detail Snapshot Pesan */}
			{selectedMessage && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
					<div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl space-y-4">
						<div className="flex items-center justify-between border-b border-slate-100 pb-3">
							<div className="flex items-center gap-2">
								<MessageSquare className="h-5 w-5 text-[#1D5FA7]" />
								<h3 className="text-sm font-bold text-[#102A46]">
									Snapshot Pesan WhatsApp #{selectedMessage.id}
								</h3>
							</div>
							<button
								type="button"
								onClick={() => setSelectedMessage(null)}
								className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Metadata */}
						<div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-2xl p-3 border border-slate-100">
							<div>
								<span className="text-[11px] text-[#64748B]">Target Grup:</span>
								<p className="font-bold text-[#102A46]">{selectedMessage.targetName}</p>
							</div>
							<div>
								<span className="text-[11px] text-[#64748B]">Waktu Shalat:</span>
								<p className="font-bold text-[#102A46]">
									{formatPrayerName(selectedMessage.prayerName)} ({selectedMessage.messageType})
								</p>
							</div>
							<div>
								<span className="text-[11px] text-[#64748B]">Status:</span>
								<div>{getStatusBadge(selectedMessage.status)}</div>
							</div>
							<div>
								<span className="text-[11px] text-[#64748B]">WAHA Msg ID:</span>
								<p className="font-mono text-[11px] text-[#102A46] truncate">
									{selectedMessage.wahaMessageId || "-"}
								</p>
							</div>
						</div>

						{/* Message Body View */}
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label className="text-xs font-bold text-[#102A46]">
									Isi Pesan Terformat:
								</label>
								<button
									type="button"
									onClick={() => copyToClipboard(selectedMessage.messageBody)}
									className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D5FA7] hover:underline"
								>
									<Copy className="h-3.5 w-3.5" />
									<span>{copied ? "Tersalin!" : "Salin Teks"}</span>
								</button>
							</div>
							<div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-emerald-50/50 border border-emerald-100 p-4 font-sans text-xs text-slate-800 leading-relaxed">
								{selectedMessage.messageBody}
							</div>
						</div>

						{/* Error Details */}
						{selectedMessage.lastError && (
							<div className="rounded-xl bg-rose-50 p-3 text-[11px] text-rose-800 border border-rose-100">
								<span className="font-bold">Error Terakhir:</span> {selectedMessage.lastError}
							</div>
						)}

						<div className="flex justify-end pt-2">
							<button
								type="button"
								onClick={() => setSelectedMessage(null)}
								className="rounded-xl bg-[#123B6D] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1D5FA7] transition"
							>
								Tutup
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Konfirmasi Retry */}
			{confirmRetryId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
					<div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl space-y-4">
						<div className="flex items-center gap-3 text-emerald-600">
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
								<RotateCw className="h-5 w-5" />
							</div>
							<h3 className="text-base font-bold text-[#102A46]">
								Retry Pengiriman Pesan
							</h3>
						</div>
						<p className="text-xs text-[#64748B]">
							Apakah Anda yakin ingin menjadwalkan ulang pengiriman pesan ID #{confirmRetryId}? Pesan akan dikembalikan ke status PENDING dan segera diproses worker.
						</p>
						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setConfirmRetryId(null)}
								className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleRetry}
								disabled={actionLoading}
								className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
							>
								{actionLoading ? "Memproses..." : "Ya, Kirim Ulang"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Konfirmasi Cancel */}
			{confirmCancelId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
					<div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl space-y-4">
						<div className="flex items-center gap-3 text-rose-600">
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
								<XCircle className="h-5 w-5" />
							</div>
							<h3 className="text-base font-bold text-[#102A46]">
								Batalkan Pesan Antrean
							</h3>
						</div>
						<p className="text-xs text-[#64748B]">
							Apakah Anda yakin ingin membatalkan pengiriman pesan ID #{confirmCancelId}? Pesan ini tidak akan dikirimkan ke WhatsApp.
						</p>
						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setConfirmCancelId(null)}
								className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50"
							>
								Kembali
							</button>
							<button
								type="button"
								onClick={handleCancel}
								disabled={actionLoading}
								className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
							>
								{actionLoading ? "Membatalkan..." : "Ya, Batalkan Pesan"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
