import { AlertTriangle } from "lucide-react";

interface SessionActionModalProps {
	confirmAction: "STOP" | "RESTART" | "LOGOUT" | null;
	actionLoading: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export function SessionActionModal({
	confirmAction,
	actionLoading,
	onClose,
	onConfirm,
}: SessionActionModalProps) {
	if (!confirmAction) return null;

	const title =
		confirmAction === "STOP"
			? "Hentikan Sesi WhatsApp?"
			: confirmAction === "RESTART"
				? "Restart Sesi WhatsApp?"
				: "Logout & Hapus Pairing WhatsApp?";

	const message =
		confirmAction === "STOP"
			? "Menghentikan sesi akan memutus koneksi gateway ke WhatsApp. Bot tidak dapat mengirim pesan pengingat shalat hingga sesi dimulai kembali."
			: confirmAction === "RESTART"
				? "Merestart sesi akan memuat ulang koneksi ke server WAHA. Proses ini memerlukan beberapa detik."
				: "PERINGATAN: Tindakan ini akan menghapus sesi login dan pairing perangkat pada WAHA. Anda harus melakukan pemindaian QR code ulang untuk menghubungkan kembali bot WhatsApp.";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
			<div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl space-y-4">
				<div className="flex items-center gap-3 text-rose-600">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
						<AlertTriangle className="h-5 w-5" />
					</div>
					<h3 className="text-base font-bold text-[#102A46]">{title}</h3>
				</div>

				<p className="text-xs text-[#64748B] leading-relaxed">{message}</p>

				<div className="flex items-center justify-end gap-2 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition"
					>
						Batal
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={actionLoading}
						className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition"
					>
						{actionLoading ? "Memproses..." : "Ya, Lanjutkan"}
					</button>
				</div>
			</div>
		</div>
	);
}
