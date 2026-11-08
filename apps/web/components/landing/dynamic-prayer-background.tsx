"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { TodayPrayerData } from "../../types/prayer";

export type PrayerTimePhase = "SUBUH" | "DZUHUR" | "ASHAR" | "MAGHRIB" | "ISYA";

interface DynamicPrayerBackgroundProps {
	data: TodayPrayerData | null;
	now: number | null;
	serverSkewMs: number;
}

interface BackgroundVariant {
	key: PrayerTimePhase;
	label: string;
	src: string;
	alt: string;
}

const BACKGROUND_VARIANTS: BackgroundVariant[] = [
	{
		key: "SUBUH",
		label: "Fajar / Subuh",
		src: "/backgrounds/unida-subuh.jpg",
		alt: "Gedung Utama UNIDA Gontor - Waktu Subuh / Fajar",
	},
	{
		key: "DZUHUR",
		label: "Siang / Dzuhur",
		src: "/backgrounds/unida-dzuhur.jpg",
		alt: "Gedung Utama UNIDA Gontor - Waktu Dzuhur / Siang",
	},
	{
		key: "ASHAR",
		label: "Sore / Ashar",
		src: "/backgrounds/unida-ashar.jpg",
		alt: "Gedung Utama UNIDA Gontor - Waktu Ashar / Sore",
	},
	{
		key: "MAGHRIB",
		label: "Senja / Maghrib",
		src: "/backgrounds/unida-maghrib.jpg",
		alt: "Gedung Utama UNIDA Gontor - Waktu Maghrib / Senja",
	},
	{
		key: "ISYA",
		label: "Malam / Isya",
		src: "/backgrounds/unida-isya.jpg",
		alt: "Gedung Utama UNIDA Gontor - Waktu Isya / Malam",
	},
];

export function getActivePhase(
	data: TodayPrayerData | null,
	now: number | null,
	serverSkewMs = 0,
): PrayerTimePhase {
	// Prerender / SSR stabil tanpa evaluasi Date() dinamis
	if (!now) {
		return "DZUHUR";
	}

	const currentTime = now + serverSkewMs;

	// Fallback bila data hisab belum tersedia di browser
	if (!data) {
		const hour = new Date(currentTime).getHours();
		if (hour >= 4 && hour < 6) return "SUBUH";
		if (hour >= 6 && hour < 15) return "DZUHUR";
		if (hour >= 15 && hour < 18) return "ASHAR";
		if (hour >= 18 && hour < 19) return "MAGHRIB";
		return "ISYA";
	}
	const tFajr = new Date(data.times.FAJR.utc).getTime();
	const tSunrise = new Date(data.times.SUNRISE.utc).getTime();
	const tAsr = new Date(data.times.ASR.utc).getTime();
	const tMaghrib = new Date(data.times.MAGHRIB.utc).getTime();
	const tIsha = new Date(data.times.ISHA.utc).getTime();

	if (currentTime >= tFajr && currentTime < tSunrise) {
		return "SUBUH";
	}
	if (currentTime >= tSunrise && currentTime < tAsr) {
		return "DZUHUR";
	}
	if (currentTime >= tAsr && currentTime < tMaghrib) {
		return "ASHAR";
	}
	if (currentTime >= tMaghrib && currentTime < tIsha) {
		return "MAGHRIB";
	}
	return "ISYA";
}

export function DynamicPrayerBackground({
	data,
	now,
	serverSkewMs,
}: DynamicPrayerBackgroundProps) {
	const activePhase = useMemo(
		() => getActivePhase(data, now, serverSkewMs),
		[data, now, serverSkewMs],
	);

	return (
		<aside
			aria-label="Latar belakang kampus dinamis"
			className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
		>
			{/* Daftar Layer Background Gambar dengan Cross-fade */}
			{BACKGROUND_VARIANTS.map((variant) => {
				const isActive = variant.key === activePhase;
				return (
					<div
						key={variant.key}
						className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
							isActive ? "opacity-100 z-10" : "opacity-0 z-0"
						}`}
					>
						<Image
							src={variant.src}
							alt={variant.alt}
							fill
							priority={variant.key === "DZUHUR" || isActive}
							className="object-cover object-center scale-[1.02] transform-gpu filter brightness-[0.92]"
							sizes="100vw"
							quality={85}
						/>
					</div>
				);
			})}

			{/* Pelindung Kontras & Gradasi Terintegrasi */}
			<div className="absolute inset-0 z-20 bg-linear-to-b from-[#0A1B2E]/55 via-[#102A46]/35 to-[#F5F8FC]/95 backdrop-blur-[2px]" />
		</aside>
	);
}
