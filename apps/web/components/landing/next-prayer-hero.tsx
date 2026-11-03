import { Clock, Timer } from "lucide-react";
import type { NextPrayerInfo } from "../../types/prayer";

interface CountdownValues {
	hours: string;
	minutes: string;
	seconds: string;
}

interface NextPrayerHeroProps {
	nextPrayer: NextPrayerInfo;
	countdown: CountdownValues | null;
}

export function NextPrayerHero({
	nextPrayer,
	countdown,
}: NextPrayerHeroProps) {
	return (
		<div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#123B6D] via-[#102A46] to-[#0A1B2E] p-6 text-white shadow-xl ring-1 ring-white/10 sm:p-8">
			{/* Subtle ambient lighting */}
			<div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#1D5FA7]/30 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#6BA9D8]/20 blur-3xl" />

			{/* Decorative Islamic Dome Arch Silhouette in background */}
			<svg
				className="pointer-events-none absolute right-4 bottom-0 h-48 w-48 text-white/[0.03] lg:h-64 lg:w-64"
				viewBox="0 0 100 100"
				fill="currentColor"
			>
				<path d="M 20 100 L 20 60 C 20 35, 50 20, 50 20 C 50 20, 80 35, 80 60 L 80 100 Z" />
			</svg>

			<div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div className="space-y-3">
					<div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#6BA9D8] backdrop-blur-md ring-1 ring-white/15">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
						</span>
						<Timer className="h-3.5 w-3.5" />
						<span>Waktu Shalat Berikutnya</span>
					</div>

					<div>
						<h2 className="text-3xl font-black tracking-tight sm:text-5xl text-white">
							{nextPrayer.displayName}
						</h2>
						<p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
							<Clock className="h-4 w-4 text-[#6BA9D8]" />
							<span>
								Pukul{" "}
								<strong className="text-white text-base font-bold">
									{nextPrayer.timeLabel} WIB
								</strong>
							</span>
							{nextPrayer.isTomorrow && (
								<span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-400/30">
									Keesokan Hari
								</span>
							)}
						</p>
					</div>
				</div>

				{/* Countdown Display Box */}
				{countdown && (
					<div className="rounded-2xl bg-white/10 p-4.5 backdrop-blur-md ring-1 ring-white/20 sm:p-5 shadow-inner">
						<span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
							Menuju Kumandang Adzan
						</span>
						<div className="mt-2.5 flex items-baseline gap-2.5">
							{/* Hours */}
							<div className="flex flex-col items-center">
								<span className="tabular-nums font-mono text-3xl font-extrabold text-white sm:text-4xl">
									{countdown.hours}
								</span>
								<span className="text-[10px] uppercase tracking-wider text-slate-300">
									Jam
								</span>
							</div>
							<span className="font-mono text-2xl font-bold text-[#6BA9D8] animate-pulse">:</span>
							{/* Minutes */}
							<div className="flex flex-col items-center">
								<span className="tabular-nums font-mono text-3xl font-extrabold text-white sm:text-4xl">
									{countdown.minutes}
								</span>
								<span className="text-[10px] uppercase tracking-wider text-slate-300">
									Menit
								</span>
							</div>
							<span className="font-mono text-2xl font-bold text-[#6BA9D8] animate-pulse">:</span>
							{/* Seconds */}
							<div className="flex flex-col items-center">
								<span className="tabular-nums font-mono text-3xl font-extrabold text-emerald-400 sm:text-4xl">
									{countdown.seconds}
								</span>
								<span className="text-[10px] uppercase tracking-wider text-slate-300">
									Detik
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
