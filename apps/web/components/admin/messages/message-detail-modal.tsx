import { Copy, MessageSquare, X } from "lucide-react";
import { useState } from "react";
import { MessageStatusBadge } from "../shared/status-badges";
import type { ScheduledMessageItem } from "./messages-table";

interface MessageDetailModalProps {
	message: ScheduledMessageItem | null;
	onClose: () => void;
}

export function MessageDetailModal({ message, onClose }: MessageDetailModalProps) {
	const [copied, setCopied] = useState(false);

	if (!message) return null;

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
			<div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl space-y-4">
				<div className="flex items-center justify-between border-b border-slate-100 pb-3">
					<div className="flex items-center gap-2">
						<MessageSquare className="h-5 w-5 text-[#1D5FA7]" />
						<h3 className="text-sm font-bold text-[#102A46]">
							Snapshot Pesan WhatsApp #{message.id}
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-2xl p-3 border border-slate-100">
					<div>
						<span className="text-[11px] text-[#64748B]">Target Grup:</span>
						<p className="font-bold text-[#102A46]">{message.targetName}</p>
					</div>
					<div>
						<span className="text-[11px] text-[#64748B]">Waktu Shalat:</span>
						<p className="font-bold text-[#102A46]">
							{formatPrayerName(message.prayerName)} ({message.messageType})
						</p>
					</div>
					<div>
						<span className="text-[11px] text-[#64748B]">Status:</span>
						<div>
							<MessageStatusBadge status={message.status} />
						</div>
					</div>
					<div>
						<span className="text-[11px] text-[#64748B]">WAHA Msg ID:</span>
						<p className="font-mono text-[11px] text-[#102A46] truncate">
							{message.wahaMessageId || "-"}
						</p>
					</div>
				</div>

				<div>
					<div className="flex items-center justify-between mb-1.5">
						<label className="text-xs font-bold text-[#102A46]">
							Isi Pesan Terformat:
						</label>
						<button
							type="button"
							onClick={() => copyToClipboard(message.messageBody)}
							className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D5FA7] hover:underline"
						>
							<Copy className="h-3.5 w-3.5" />
							<span>{copied ? "Tersalin!" : "Salin Teks"}</span>
						</button>
					</div>
					<div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-emerald-50/50 border border-emerald-100 p-4 font-sans text-xs text-slate-800 leading-relaxed">
						{message.messageBody}
					</div>
				</div>

				{message.lastError && (
					<div className="rounded-xl bg-rose-50 p-3 text-[11px] text-rose-800 border border-rose-100">
						<span className="font-bold">Error Terakhir:</span> {message.lastError}
					</div>
				)}

				<div className="flex justify-end pt-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-xl bg-[#123B6D] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1D5FA7] transition"
					>
						Tutup
					</button>
				</div>
			</div>
		</div>
	);
}
