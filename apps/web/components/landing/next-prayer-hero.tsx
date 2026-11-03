import { Clock, Sparkles } from "lucide-react";
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
		<div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#123B6D] via-[#102A46] to-[#0A1B2E] p-6 text-white shadow-xl sm:p-8">
			{/* Subtle ambient lighting */}
			<div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#1D5FA7]/30 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#6BA9D8]/20 blur-3xl" />

			<div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div className="space-y-3">
					<div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#6BA9D8] backdrop-blur-md ring-1 ring-white/15">
						<Sparkles className="h-3.5 w-3.5" />
						<span>Waktu Shalat Berikutnya</span>
					</div>

					<div>
						<h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
							{nextPrayer.displayName}
						</h2>
						<p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
							<Clock className="h-4 w-4 text-[#6BA9D8]" />
							<span>
								Pukul{" "}
								<strong className="text-white font-bold">
									{nextPrayer.timeLabel}
								</strong>
							</span>
							{nextPrayer.isTomorrow && (
								<span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs font-medium text-amber-300">
									Keesokan Hari
								</span>
							)}
						</p>
					</div>
				</div>

				{/* Countdown Display Box */}
				{countdown && (
					<div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/20 sm:p-5">
						<span className="text-xs font-medium uppercase tracking-wider text-slate-300">
							Menuju Kumandang Adzan
						</span>
						<div className="mt-2 flex items-baseline gap-2">
							{/* Hours */}
							<div className="flex flex-col items-center">
								<span className="tabular-nums font-mono text-3xl font-extrabold text-white sm:text-4xl">
									{countdown.hours}
								</span>
								<span className="text-[10px] uppercase tracking-wider text-slate-300">
									Jam
								</span>
							</div>
							<span className="font-mono text-2xl font-bold text-[#6BA9D8]">:</span>
							{/* Minutes */}
							<div className="flex flex-col items-center">
								<span className="tabular-nums font-mono text-3xl font-extrabold text-white sm:text-4xl">
									{countdown.minutes}
								</span>
								<span className="text-[10px] uppercase tracking-wider text-slate-300">
									Menit
								</span>
							</div>
							<span className="font-mono text-2xl font-bold text-[#6BA9D8]">:</span>
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
