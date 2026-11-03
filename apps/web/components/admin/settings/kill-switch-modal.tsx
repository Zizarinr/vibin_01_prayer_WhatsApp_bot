import { ShieldAlert } from "lucide-react";

interface KillSwitchModalProps {
	isOpen: boolean;
	pendingKillSwitchState: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export function KillSwitchModal({
	isOpen,
	pendingKillSwitchState,
	onClose,
	onConfirm,
}: KillSwitchModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
			<div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl space-y-4">
				<div className="flex items-center gap-3 text-rose-600">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
						<ShieldAlert className="h-5 w-5" />
					</div>
					<h3 className="text-base font-bold text-[#102A46]">
						{pendingKillSwitchState
							? "Nyalakan Pengiriman Pesan?"
							: "Konfirmasi Matikan Pengiriman (Kill-Switch)?"}
					</h3>
				</div>
				<p className="text-xs text-[#64748B] leading-relaxed">
					{pendingKillSwitchState
						? "Sistem akan mengaktifkan kembali pengiriman pesan otomatis ke WhatsApp. Seluruh antrean yang relevan akan diproses oleh worker."
						: "PERINGATAN: Semua pengiriman pengingat shalat ke WhatsApp akan langsung DITAHAN sementara. Antrean pesan akan tetap dibuat namun tidak akan terkirim hingga diaktifkan kembali."}
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
						className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
							pendingKillSwitchState
								? "bg-emerald-600 hover:bg-emerald-700"
								: "bg-rose-600 hover:bg-rose-700"
						}`}
					>
						{pendingKillSwitchState ? "Ya, Aktifkan" : "Ya, Matikan Sekarang"}
					</button>
				</div>
			</div>
		</div>
	);
}
