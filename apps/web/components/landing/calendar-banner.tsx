import { Calendar, HelpCircle, MapPin } from "lucide-react";
import type { HijriDateInfo } from "../../types/prayer";

interface CalendarBannerProps {
	locationName: string;
	gregorianDateFormatted: string;
	hijri?: HijriDateInfo;
}

export function CalendarBanner({
	locationName,
	gregorianDateFormatted,
	hijri,
}: CalendarBannerProps) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 sm:flex-row sm:items-center sm:justify-between sm:p-5">
			<div className="flex items-center gap-3">
				<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1D5FA7]">
					<MapPin className="h-5 w-5" />
				</div>
				<div>
					<div className="flex items-center gap-2">
						<span className="text-sm font-bold text-[#102A46]">
							{locationName}
						</span>
						<span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-600/20">
							Siman, Ponorogo
						</span>
					</div>
					<p className="text-xs text-[#64748B]">
						Koordinat: −7.8652° LS, 111.4617° BT • Zona: Asia/Jakarta (WIB)
					</p>
				</div>
			</div>

			<div className="border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 sm:text-right">
				<div className="flex items-center gap-2 sm:justify-end">
					<Calendar className="h-4 w-4 text-[#1D5FA7]" />
					<span className="text-sm font-semibold text-[#102A46]">
						{gregorianDateFormatted || "Memuat tanggal..."}
					</span>
				</div>
				<div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-[#1D5FA7] sm:justify-end">
					<span>{hijri?.formatted ?? "Memuat kalender Hijriyah..."}</span>
					<span
						className="cursor-help text-slate-400 hover:text-slate-600"
						title="Penanggalan Umm al-Qura. Dapat berbeda ±2 hari dengan kalender resmi kampus; admin dapat menyetel koreksi."
					>
						<HelpCircle className="h-3 w-3" />
					</span>
				</div>
			</div>
		</div>
	);
}
