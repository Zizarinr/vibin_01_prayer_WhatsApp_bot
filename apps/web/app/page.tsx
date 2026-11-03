"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarBanner } from "../components/landing/calendar-banner";
import { ErrorState } from "../components/landing/error-state";
import { Footer } from "../components/landing/footer";
import { Header } from "../components/landing/header";
import { NextPrayerHero } from "../components/landing/next-prayer-hero";
import { PrayerTimesGrid } from "../components/landing/prayer-times-grid";
import { SkeletonLoading } from "../components/landing/skeleton-loading";
import { ValidationNotice } from "../components/landing/validation-notice";
import { WhatsappBanner } from "../components/landing/whatsapp-banner";
import { fetchApi } from "../lib/api-client";
import type { SlotStatus, TodayPrayerData } from "../types/prayer";

export default function HomePage() {
	const [data, setData] = useState<TodayPrayerData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	// Skew waktu antara server dan browser (dalam milidetik)
	const [serverSkewMs, setServerSkewMs] = useState(0);
	const [now, setNow] = useState<number | null>(null);

	const loadPrayerData = useCallback(async (isRefresh = false) => {
		if (isRefresh) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}
		setError(null);

		const clientFetchStart = Date.now();
		const res = await fetchApi<TodayPrayerData>("/api/public/prayer/today");

		if (res.error || !res.data) {
			setError(
				res.error?.message ||
					"Jadwal shalat belum dapat dimuat dari server backend.",
			);
			setData(null);
		} else {
			const serverTime = new Date(res.data.serverNowUtc).getTime();
			// Estimasi round-trip latency dibagi 2
			const latency = (Date.now() - clientFetchStart) / 2;
			setServerSkewMs(serverTime + latency - Date.now());
			setData(res.data);
		}

		setLoading(false);
		setRefreshing(false);
	}, []);

	useEffect(() => {
		setNow(Date.now());
		loadPrayerData();
	}, [loadPrayerData]);

	// Timer 1 detik untuk jam berjalan & countdown
	useEffect(() => {
		const timer = setInterval(() => {
			setNow(Date.now());
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	// Perhitungan countdown waktu shalat berikutnya
	const countdown = useMemo(() => {
		if (!now || !data?.nextPrayer?.scheduledAtUtc) return null;
		const targetUtc = new Date(data.nextPrayer.scheduledAtUtc).getTime();
		const currentServerTime = now + serverSkewMs;
		const diffSeconds = Math.max(0, Math.floor((targetUtc - currentServerTime) / 1000));

		const hours = Math.floor(diffSeconds / 3600);
		const minutes = Math.floor((diffSeconds % 3600) / 60);
		const seconds = diffSeconds % 60;

		return {
			hours: String(hours).padStart(2, "0"),
			minutes: String(minutes).padStart(2, "0"),
			seconds: String(seconds).padStart(2, "0"),
		};
	}, [data, now, serverSkewMs]);

	// Jam lokal yang sedang berjalan (WIB)
	const liveTimeString = useMemo(() => {
		if (!now) return "--:--:--";
		const current = new Date(now + serverSkewMs);
		return current.toLocaleTimeString("id-ID", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});
	}, [now, serverSkewMs]);

	// Format tanggal Masehi dalam bahasa Indonesia
	const gregorianDateFormatted = useMemo(() => {
		if (!data?.dateLocal) return "";
		const [year, month, day] = data.dateLocal.split("-").map(Number);
		if (!year || !month || !day) return "";
		const d = new Date(year, month - 1, day);
		return d.toLocaleDateString("id-ID", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	}, [data?.dateLocal]);

	// Status tiap kartu waktu shalat
	const getSlotStatus = useCallback(
		(utcString: string, prayerName: string): SlotStatus => {
			if (!now || !data) return "UPCOMING";
			const currentServerTime = now + serverSkewMs;
			const targetTime = new Date(utcString).getTime();

			if (data.nextPrayer.prayerName === prayerName && !data.nextPrayer.isTomorrow) {
				return "NEXT";
			}
			if (targetTime < currentServerTime) {
				return "PASSED";
			}
			return "UPCOMING";
		},
		[data, now, serverSkewMs],
	);

	return (
		<div className="flex min-h-screen flex-col bg-[#F5F8FC]">
			{/* Header Navigasi & Live Clock */}
			<Header liveTimeString={liveTimeString} />

			<main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
				<div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
					{/* Banner Lokasi & Kalender Masehi/Hijriyah */}
					<CalendarBanner
						locationName={data?.locationName ?? "UNIDA Gontor"}
						gregorianDateFormatted={gregorianDateFormatted}
						hijri={data?.hijri}
					/>

					{/* Loading State Skeleton */}
					{loading && <SkeletonLoading />}

					{/* Honest Error State ("State Gagal Jujur") */}
					{error && !loading && (
						<ErrorState
							message={error}
							refreshing={refreshing}
							onRetry={() => loadPrayerData(true)}
						/>
					)}

					{/* Konten Utama Jadwal & Next Prayer */}
					{data && !loading && !error && (
						<>
							{/* Hero Card: Next Prayer & Real-time Countdown */}
							<NextPrayerHero
								nextPrayer={data.nextPrayer}
								countdown={countdown}
							/>

							{/* Grid 6 Waktu Shalat (5 Waktu Utama + Terbit) */}
							<PrayerTimesGrid
								data={data}
								refreshing={refreshing}
								onRefresh={() => loadPrayerData(true)}
								getSlotStatus={getSlotStatus}
							/>

							{/* Info Integrasi WhatsApp Bot */}
							<WhatsappBanner />

							{/* Pemberitahuan Ketentuan Rujukan Hisab */}
							<ValidationNotice />
						</>
					)}
				</div>
			</main>

			{/* Footer */}
			<Footer />
		</div>
	);
}
