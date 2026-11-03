import { Trash2 } from "lucide-react";

interface HadithDeleteModalProps {
	deleteTargetId: number | null;
	actionLoading: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export function HadithDeleteModal({
	deleteTargetId,
	actionLoading,
	onClose,
	onConfirm,
}: HadithDeleteModalProps) {
	if (!deleteTargetId) return null;

	return (
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
						onClick={onClose}
						className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50"
					>
						Batal
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={actionLoading}
						className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
					>
						{actionLoading ? "Memproses..." : "Ya, Hapus Hadits"}
					</button>
				</div>
			</div>
		</div>
	);
}
