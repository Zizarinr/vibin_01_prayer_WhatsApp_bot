import {
	ChevronLeft,
	ChevronRight,
	Eye,
	MessageSquare,
	RefreshCw,
	RotateCw,
	XCircle,
} from "lucide-react";
import { MessageStatusBadge } from "../shared/status-badges";

export interface ScheduledMessageItem {
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

interface MessagesTableProps {
	messages: ScheduledMessageItem[];
	loading: boolean;
	page: number;
	totalPages: number;
	totalCount: number;
	onPageChange: (newPage: number) => void;
	onViewDetail: (msg: ScheduledMessageItem) => void;
	onRequestRetry: (id: number) => void;
	onRequestCancel: (id: number) => void;
}

export function MessagesTable({
	messages,
	loading,
	page,
	totalPages,
	totalCount,
	onPageChange,
	onViewDetail,
	onRequestRetry,
	onRequestCancel,
}: MessagesTableProps) {
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

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-[#64748B] space-y-2">
				<RefreshCw className="h-6 w-6 animate-spin text-[#1D5FA7]" />
				<span className="text-xs">Memuat antrean pesan...</span>
			</div>
		);
	}

	if (messages.length === 0) {
		return (
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
		);
	}

	return (
		<div>
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
								<td className="py-3 px-4">
									<MessageStatusBadge status={item.status} />
								</td>
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
										onClick={() => onViewDetail(item)}
										title="Lihat Pesan Lengkap"
										className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-[#1D5FA7] transition"
									>
										<Eye className="h-4 w-4" />
									</button>

									{(item.status === "FAILED" || item.status === "UNKNOWN") && (
										<button
											type="button"
											onClick={() => onRequestRetry(item.id)}
											title="Coba Kirim Ulang (Retry)"
											className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
										>
											<RotateCw className="h-4 w-4" />
										</button>
									)}

									{item.status === "PENDING" && (
										<button
											type="button"
											onClick={() => onRequestCancel(item.id)}
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

			{/* Pagination Footer */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-[#64748B]">
					<span>
						Menampilkan halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> (Total {totalCount} pesan)
					</span>
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							disabled={page <= 1}
							onClick={() => onPageChange(Math.max(1, page - 1))}
							className="rounded-lg border border-slate-200 p-1.5 text-[#102A46] hover:bg-slate-50 disabled:opacity-40 transition"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<button
							type="button"
							disabled={page >= totalPages}
							onClick={() => onPageChange(Math.min(totalPages, page + 1))}
							className="rounded-lg border border-slate-200 p-1.5 text-[#102A46] hover:bg-slate-50 disabled:opacity-40 transition"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
