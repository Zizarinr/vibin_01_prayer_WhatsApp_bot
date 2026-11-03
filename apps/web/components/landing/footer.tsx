import { ShieldCheck } from "lucide-react";
import { UnidaPrayerLogo } from "../shared/unida-prayer-logo";

export function Footer() {
	return (
		<footer className="mt-auto border-t border-slate-200/80 bg-white py-8 text-xs text-[#64748B]">
			<div className="mx-auto max-w-5xl px-4 sm:px-6">
				<div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
					<UnidaPrayerLogo href="/" size="sm" variant="full" />

					<div className="flex flex-col items-center gap-2 sm:items-end">
						<div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-600/20">
							<ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
							<span>Sistem Operasional Kampus Siman</span>
						</div>
						<p className="text-[11px] text-slate-400 text-center sm:text-right">
							© 2026 Universitas Darussalam Gontor • UNIDA Prayer System V2.0
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
