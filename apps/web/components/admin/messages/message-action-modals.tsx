import { RotateCw, XCircle } from "lucide-react";

interface RetryModalProps {
	confirmRetryId: number | null;
	actionLoading: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export function MessageRetryModal({
	confirmRetryId,
	actionLoading,
	onClose,
	onConfirm,
}: RetryModalProps) {
	if (!confirmRetryId) return null;

	return (
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
						onClick={onClose}
						className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition"
					>
						Batal
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={actionLoading}
						className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
					>
						{actionLoading ? "Memproses..." : "Ya, Kirim Ulang"}
					</button>
				</div>
			</div>
		</div>
	);
}

interface CancelModalProps {
	confirmCancelId: number | null;
	actionLoading: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export function MessageCancelModal({
	confirmCancelId,
	actionLoading,
	onClose,
	onConfirm,
}: CancelModalProps) {
	if (!confirmCancelId) return null;

	return (
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
						onClick={onClose}
						className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition"
					>
						Kembali
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={actionLoading}
						className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition"
					>
						{actionLoading ? "Membatalkan..." : "Ya, Batalkan Pesan"}
					</button>
				</div>
			</div>
		</div>
	);
}
