import { Check, RotateCcw } from "lucide-react";

interface RecalculateConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export function RecalculateConfirmModal({
	isOpen,
	onClose,
	onConfirm,
}: RecalculateConfirmModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
			<div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
				<div className="flex items-center gap-3 text-amber-600">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
						<RotateCcw className="h-5 w-5" />
					</div>
					<h3 className="text-base font-bold text-[#102A46]">
						Konfirmasi Hitung Ulang (Recalculate)
					</h3>
				</div>

				<p className="text-xs text-[#64748B] leading-relaxed">
					Tindakan ini akan membatalkan seluruh jadwal pesan <strong>PENDING</strong> masa depan, lalu membuat ulang jadwal pengingat untuk <strong>7 hari ke depan</strong> berdasarkan parameter hisab saat ini.
				</p>

				<div className="rounded-xl bg-amber-50/80 p-3 text-[11px] text-amber-900 flex items-start gap-2">
					<Check className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
					<span>
						Pesan yang sudah berstatus <strong>SENT (Terkirim)</strong> atau <strong>FAILED</strong> tidak akan diubah atau dikirim ulang.
					</span>
				</div>

				<div className="flex items-center justify-end gap-2 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition"
					>
						Batalkan
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="rounded-xl bg-[#123B6D] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1D5FA7] transition"
					>
						Ya, Hitung Ulang Sekarang
					</button>
				</div>
			</div>
		</div>
	);
}
