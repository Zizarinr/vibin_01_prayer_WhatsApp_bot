export interface FormattedPrayerTime {
	utc: string;
	time24: string;
	timeLabel: string;
	displayName: string;
}

export interface NextPrayerInfo {
	prayerName: string;
	displayName: string;
	scheduledAtUtc: string;
	time24: string;
	timeLabel: string;
	remainingSeconds: number;
	isTomorrow: boolean;
}

export interface HijriDateInfo {
	formatted: string;
	day: number;
	monthName: string;
	year: number;
	adjustmentDays: number;
}

export interface TodayPrayerData {
	locationName: string;
	timezone: string;
	coordinates: {
		latitude: number;
		longitude: number;
	};
	dateLocal: string;
	isFriday: boolean;
	hijri: HijriDateInfo;
	times: {
		FAJR: FormattedPrayerTime;
		SUNRISE: FormattedPrayerTime;
		DHUHR: FormattedPrayerTime;
		ASR: FormattedPrayerTime;
		MAGHRIB: FormattedPrayerTime;
		ISHA: FormattedPrayerTime;
	};
	nextPrayer: NextPrayerInfo;
	serverNowUtc: string;
}

export type SlotStatus = "PASSED" | "NEXT" | "UPCOMING";
