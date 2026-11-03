"use client";

import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	ChevronRight,
	Clock,
	CloudSun,
	Compass,
	HelpCircle,
	Lock,
	MapPin,
	Moon,
	RefreshCw,
	Send,
	Sparkles,
	Sun,
	SunMedium,
	Sunrise,
	Sunset,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchApi } from "../lib/api-client";

interface FormattedPrayerTime {
	utc: string;
	time24: string;
	timeLabel: string;
	displayName: string;
}

interface NextPrayerInfo {
	prayerName: string;
	displayName: string;
	scheduledAtUtc: string;
	time24: string;
	timeLabel: string;
	remainingSeconds: number;
	isTomorrow: boolean;
}

interface HijriDateInfo {
	formatted: string;
	day: number;
	monthName: string;
	year: number;
	adjustmentDays: number;
}

interface TodayPrayerData {
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

export default function HomePage() {
	const [data, setData] = useState<TodayPrayerData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	// Skew antara waktu server dan client (dalam milidetik)
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
			totalSeconds: diffSeconds,
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

	// Tentukan status tiap kartu shalat (LEWAT, AKTIF/BERIKUTNYA, MENDATANG)
	const getSlotStatus = (utcString: string, prayerName: string) => {
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
	};

	return (
		<div className="flex min-h-screen flex-col bg-[#F5F8FC]">
			{/* Top Notification / Institution Bar */}
			<header className="border-b border-blue-100/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B6D] text-white shadow-sm ring-2 ring-[#1D5FA7]/20">
							<Moon className="h-5 w-5 text-[#6BA9D8]" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-base font-bold tracking-tight text-[#102A46] sm:text-lg">
									UNIDA Prayer
								</h1>
								<span className="hidden rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#1D5FA7] ring-1 ring-blue-700/10 sm:inline-block">
									V2.0
								</span>
							</div>
							<p className="text-xs font-medium text-[#64748B]">
								Universitas Darussalam Gontor • Kampus Siman
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 sm:gap-4">
						{/* Real-time Clock Pill */}
						<div className="flex items-center gap-1.5 rounded-lg bg-[#EAF2FB] px-3 py-1.5 text-xs font-semibold text-[#123B6D]">
							<Clock className="h-3.5 w-3.5 text-[#1D5FA7]" />
							<span className="tabular-nums font-mono text-sm tracking-wide">
								{liveTimeString}
							</span>
							<span className="text-[10px] text-[#64748B]">WIB</span>
						</div>

						{/* Admin Portal Button */}
						<Link
							href="/login"
							className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#172B43] shadow-2xs transition-all hover:border-[#1D5FA7]/30 hover:bg-slate-50 hover:text-[#123B6D]"
							title="Masuk ke Dashboard Admin"
						>
							<Lock className="h-3.5 w-3.5 text-[#64748B]" />
							<span className="hidden sm:inline">Admin</span>
						</Link>
					</div>
				</div>
			</header>

			<main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
				<div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
					{/* Location & Calendar Banner */}
					<div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 sm:flex-row sm:items-center sm:justify-between sm:p-5">
						<div className="flex items-center gap-3">
							<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1D5FA7]">
								<MapPin className="h-5 w-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-bold text-[#102A46]">
										{data?.locationName ?? "UNIDA Gontor"}
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
								<span>{data?.hijri?.formatted ?? "Memuat kalender Hijriyah..."}</span>
								<span
									className="cursor-help text-slate-400 hover:text-slate-600"
									title="Penanggalan Umm al-Qura. Dapat berbeda ±2 hari dengan kalender resmi kampus; admin dapat menyetel koreksi."
								>
									<HelpCircle className="h-3 w-3" />
								</span>
							</div>
						</div>
					</div>

					{/* Loading State Skeleton */}
					{loading && (
						<div className="space-y-6">
							<div className="h-64 w-full animate-pulse rounded-3xl bg-white p-8 ring-1 ring-slate-200/80">
								<div className="h-6 w-36 rounded-md bg-slate-200" />
								<div className="mt-4 h-12 w-64 rounded-lg bg-slate-200" />
								<div className="mt-6 h-16 w-full rounded-xl bg-slate-100" />
							</div>
							<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
								{[...Array(6)].map((_, i) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
										key={i}
										className="h-36 animate-pulse rounded-2xl bg-white p-4 ring-1 ring-slate-200/80"
									>
										<div className="h-8 w-8 rounded-lg bg-slate-200" />
										<div className="mt-4 h-4 w-16 rounded bg-slate-200" />
										<div className="mt-2 h-6 w-20 rounded bg-slate-100" />
									</div>
								))}
							</div>
						</div>
					)}

					{/* Honest Error State ("State Gagal Jujur" — Dilarang Tampilkan Data Palsu) */}
					{error && !loading && (
						<div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
							<div className="flex flex-col items-center text-center">
								<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
									<AlertCircle className="h-7 w-7" />
								</div>
								<h2 className="mt-4 text-lg font-bold text-[#102A46] sm:text-xl">
									Jadwal Belum Dapat Dimuat
								</h2>
								<p className="mt-2 max-w-md text-sm text-[#64748B]">
									{error}
								</p>
								<div className="mt-3 rounded-lg bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-600/20">
									Sesuai standar keandalan UNIDA Prayer, sistem tidak akan menampilkan perkiraan atau jadwal palsu saat backend tidak terjangkau.
								</div>
								<button
									type="button"
									onClick={() => loadPrayerData(true)}
									disabled={refreshing}
									className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#123B6D] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D5FA7] disabled:opacity-50"
								>
									<RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
									{refreshing ? "Menghubungi Server..." : "Coba Muat Ulang"}
								</button>
							</div>
						</div>
					)}

					{/* Main Content Area */}
					{data && !loading && !error && (
						<>
							{/* Hero Card: Next Prayer & Countdown */}
							<div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#123B6D] via-[#102A46] to-[#0A1B2E] p-6 text-white shadow-xl sm:p-8">
								{/* Subtle geometric pattern / glow overlay */}
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
												{data.nextPrayer.displayName}
											</h2>
											<p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
												<Clock className="h-4 w-4 text-[#6BA9D8]" />
												<span>
													Pukul{" "}
													<strong className="text-white font-bold">
														{data.nextPrayer.timeLabel}
													</strong>
												</span>
												{data.nextPrayer.isTomorrow && (
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

							{/* 5 Main Prayer Times Grid + Sunrise Reference Card */}
							<div>
								<div className="mb-4 flex items-center justify-between">
									<h3 className="text-base font-bold text-[#102A46] sm:text-lg">
										Jadwal Shalat Hari Ini
									</h3>
									<button
										type="button"
										onClick={() => loadPrayerData(true)}
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

							{/* WhatsApp Bot Integration Info Card */}
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

									<Link
										href="/login"
										className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#123B6D] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1D5FA7]"
									>
										<span>Kelola Grup & Jadwal</span>
										<ChevronRight className="h-4 w-4" />
									</Link>
								</div>
							</div>

							{/* Calculation & Validation Notice Banner */}
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
						</>
					)}
				</div>
			</main>

			{/* Clean Footer */}
			<footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-center text-xs text-[#64748B]">
				<div className="mx-auto max-w-5xl px-4 space-y-2">
					<p className="font-medium text-[#172B43]">
						© 2026 Universitas Darussalam Gontor • UNIDA Prayer System
					</p>
					<p className="text-[11px] text-slate-400">
						Dirancang untuk internal civitas akademika UNIDA Gontor. Menggunakan integrasi WhatsApp resmi kampus.
					</p>
				</div>
			</footer>
		</div>
	);
}

interface PrayerCardProps {
	name: string;
	time: string;
	icon: React.ReactNode;
	status: "PASSED" | "NEXT" | "UPCOMING";
	badge?: string;
	isAstronomicalNote?: boolean;
}

function PrayerCard({
	name,
	time,
	icon,
	status,
	badge,
	isAstronomicalNote = false,
}: PrayerCardProps) {
	const isNext = status === "NEXT";
	const isPassed = status === "PASSED";

	return (
		<div
			className={`relative flex flex-col justify-between rounded-2xl p-4 transition-all ${
				isNext
					? "bg-white ring-2 ring-[#1D5FA7] shadow-md -translate-y-0.5"
					: isPassed
						? "bg-slate-50/80 border border-slate-200/60 opacity-70"
						: "bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300"
			}`}
		>
			{/* Status Tag for Next Prayer */}
			{isNext && (
				<span className="absolute -top-2.5 right-3 rounded-full bg-[#1D5FA7] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
					Berikutnya
				</span>
			)}

			<div>
				<div className="flex items-center justify-between">
					<div
						className={`flex h-9 w-9 items-center justify-center rounded-xl ${
							isNext
								? "bg-[#123B6D] text-[#6BA9D8]"
								: isPassed
									? "bg-slate-200/80 text-slate-500"
									: "bg-blue-50 text-[#1D5FA7]"
						}`}
					>
						{icon}
					</div>

					{badge && (
						<span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
							{badge}
						</span>
					)}

					{isPassed && (
						<span title="Sudah lewat">
							<CheckCircle2 className="h-4 w-4 text-slate-400" />
						</span>
					)}
				</div>

				<div className="mt-3">
					<h4 className="text-xs font-bold text-[#102A46]">{name}</h4>
					{isAstronomicalNote && (
						<span className="text-[10px] text-slate-400">Batas Terbit</span>
					)}
				</div>
			</div>

			<div className="mt-4 pt-2 border-t border-slate-100">
				<span
					className={`font-mono text-base font-extrabold tracking-tight tabular-nums ${
						isNext ? "text-[#123B6D]" : isPassed ? "text-slate-500" : "text-[#172B43]"
					}`}
				>
					{time.replace(" WIB", "")}
				</span>
				<span className="ml-1 text-[10px] font-semibold text-[#64748B]">WIB</span>
			</div>
		</div>
	);
}
