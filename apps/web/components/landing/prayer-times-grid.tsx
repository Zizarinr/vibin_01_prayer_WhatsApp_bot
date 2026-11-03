import {
	CloudSun,
	Moon,
	RefreshCw,
	Sun,
	SunMedium,
	Sunrise,
	Sunset,
} from "lucide-react";
import type { SlotStatus, TodayPrayerData } from "../../types/prayer";
import { PrayerCard } from "./prayer-card";

interface PrayerTimesGridProps {
	data: TodayPrayerData;
	refreshing: boolean;
	onRefresh: () => void;
	getSlotStatus: (utcString: string, prayerName: string) => SlotStatus;
}

export function PrayerTimesGrid({
	data,
	refreshing,
	onRefresh,
	getSlotStatus,
}: PrayerTimesGridProps) {
	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-base font-bold text-[#102A46] sm:text-lg">
					Jadwal Shalat Hari Ini
				</h3>
				<button
					type="button"
					onClick={onRefresh}
					disabled={refreshing}
					className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D5FA7] hover:underline disabled:opacity-50"
				>
					<RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
					<span>Segarkan</span>
				</button>
			</div>

			<div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
				{/* Subuh */}
				<PrayerCard
					name="Subuh"
					time={data.times.FAJR.timeLabel}
					icon={<Sunrise className="h-5 w-5" />}
					status={getSlotStatus(data.times.FAJR.utc, "FAJR")}
				/>

				{/* Terbit (Astronomical Reference Card) */}
				<PrayerCard
					name="Terbit"
					time={data.times.SUNRISE.timeLabel}
					icon={<SunMedium className="h-5 w-5" />}
					status={getSlotStatus(data.times.SUNRISE.utc, "SUNRISE")}
					isAstronomicalNote
				/>

				{/* Dzuhur / Sholat Jumat */}
				<PrayerCard
					name={data.times.DHUHR.displayName}
					time={data.times.DHUHR.timeLabel}
					icon={<Sun className="h-5 w-5" />}
					status={getSlotStatus(data.times.DHUHR.utc, "DHUHR")}
					badge={data.isFriday ? "Jumat Berkah" : undefined}
				/>

				{/* Ashar */}
				<PrayerCard
					name="Ashar"
					time={data.times.ASR.timeLabel}
					icon={<CloudSun className="h-5 w-5" />}
					status={getSlotStatus(data.times.ASR.utc, "ASR")}
				/>

				{/* Maghrib */}
				<PrayerCard
					name="Maghrib"
					time={data.times.MAGHRIB.timeLabel}
					icon={<Sunset className="h-5 w-5" />}
					status={getSlotStatus(data.times.MAGHRIB.utc, "MAGHRIB")}
				/>

				{/* Isya */}
				<PrayerCard
					name="Isya"
					time={data.times.ISHA.timeLabel}
					icon={<Moon className="h-5 w-5" />}
					status={getSlotStatus(data.times.ISHA.utc, "ISHA")}
				/>
			</div>
		</div>
	);
}
