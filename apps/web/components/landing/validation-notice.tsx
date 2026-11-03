import { Compass } from "lucide-react";

export function ValidationNotice() {
	return (
		<div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 text-xs text-[#64748B]">
			<div className="flex items-start gap-2.5">
				<Compass className="h-4 w-4 shrink-0 text-[#1D5FA7] mt-0.5" />
				<div className="space-y-1">
					<p className="font-semibold text-[#172B43]">
						Rujukan Hisab & Ketentuan Validasi:
					</p>
					<p>
						Jadwal hasil perhitungan hisab lokal kampus Siman (−7.8652, 111.4617) menggunakan metode sudut Subuh 20.0°, Isya 18.0°, Madhab Syafi&apos;i; validasi terhadap rujukan resmi Kemenag RI dan jadwal muadzin Masjid Jami&apos; UNIDA Gontor berjalan secara berkala.
					</p>
				</div>
			</div>
		</div>
	);
}
