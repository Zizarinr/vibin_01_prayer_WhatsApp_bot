import { CheckCircle2, Send } from "lucide-react";

export function WhatsappBanner() {
	return (
		<div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-7">
			<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-4">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50">
						<Send className="h-6 w-6" />
					</div>
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<h4 className="text-base font-bold text-[#102A46]">
								Pengingat Otomatis WhatsApp Bot
							</h4>
							<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
								Aktif
							</span>
						</div>
						<p className="text-xs text-[#64748B] sm:text-sm">
							UNIDA Prayer mengirimkan pesan pre-reminder 3 menit sebelum adzan dan notifikasi tepat waktu shalat disertai hadits/ayat pilihan ke grup WhatsApp civitas akademika.
						</p>
					</div>
				</div>

				<div className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-50/80 px-4 py-2.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
					<CheckCircle2 className="h-4 w-4 text-emerald-600" />
					<span>Terkoneksi Grup Kampus</span>
				</div>
			</div>
		</div>
	);
}
