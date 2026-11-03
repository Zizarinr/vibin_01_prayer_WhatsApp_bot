import { RefreshCw, X } from "lucide-react";

interface QrPairingModalProps {
	isOpen: boolean;
	qrData: string | null;
	loadingQr: boolean;
	onClose: () => void;
	onReloadQr: () => void;
}

export function QrPairingModal({
	isOpen,
	qrData,
	loadingQr,
	onClose,
	onReloadQr,
}: QrPairingModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
			<div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl space-y-4">
				<div className="flex items-center justify-between border-b border-slate-100 pb-3">
					<h3 className="text-sm font-bold text-[#102A46]">
						Pindai QR Code WhatsApp
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="flex flex-col items-center justify-center space-y-3 py-2">
					{loadingQr ? (
						<div className="flex h-56 w-56 flex-col items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
							<RefreshCw className="h-6 w-6 animate-spin text-[#1D5FA7]" />
							<span className="mt-2 text-xs">Mengambil QR Code...</span>
						</div>
					) : qrData ? (
						<div className="rounded-2xl border-2 border-slate-200 p-2 shadow-xs bg-white">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={qrData}
								alt="WhatsApp QR Code"
								className="h-56 w-56 rounded-xl object-contain"
							/>
						</div>
					) : (
						<div className="flex h-56 w-56 flex-col items-center justify-center rounded-2xl bg-slate-50 p-4 text-center text-xs text-slate-500">
							<p>QR code belum siap atau sesi sedang memuat.</p>
							<button
								type="button"
								onClick={onReloadQr}
								className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1D5FA7] hover:bg-blue-100"
							>
								<RefreshCw className="h-3.5 w-3.5" />
								<span>Muat Ulang QR</span>
							</button>
						</div>
					)}

					<p className="text-center text-[11px] text-[#64748B] leading-relaxed">
						Buka WhatsApp di ponsel &rarr; <strong>Perangkat Tertaut</strong> &rarr; <strong>Tautkan Perangkat</strong>, lalu arahkan kamera ke kode di atas.
					</p>
				</div>

				<div className="flex items-center justify-between pt-2 border-t border-slate-100">
					<span className="text-[10px] text-slate-400">
						Polling otomatis tiap 4 detik
					</span>
					<button
						type="button"
						onClick={onClose}
						className="rounded-xl bg-[#123B6D] px-4 py-2 text-xs font-bold text-white hover:bg-[#1D5FA7] transition"
					>
						Tutup
					</button>
				</div>
			</div>
		</div>
	);
}
