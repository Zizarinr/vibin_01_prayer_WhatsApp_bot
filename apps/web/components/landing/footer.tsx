import { UnidaPrayerLogo } from "../shared/unida-prayer-logo";

export function Footer() {
	return (
		<footer className="mt-auto border-t border-blue-900/50 bg-linear-to-br from-[#123B6D] via-[#102A46] to-[#0A1B2E] py-8 text-xs text-slate-300">
			<div className="mx-auto max-w-5xl px-4 sm:px-6">
				<div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
					<UnidaPrayerLogo href="/" size="sm" variant="full" theme="dark" />

					<div className="flex flex-col items-center gap-2 sm:items-end">
						<div className="flex items-center text-xs font-semibold text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full ring-1 ring-emerald-400/30 backdrop-blur-xs">
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
