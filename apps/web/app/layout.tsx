import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "UNIDA Prayer — Jadwal Shalat Kampus Siman & Pengingat WhatsApp",
	description:
		"Jadwal shalat harian akurat untuk kampus Universitas Darussalam Gontor dan sistem bot pengingat waktu shalat via WhatsApp.",
	keywords: [
		"UNIDA Gontor",
		"Jadwal Shalat",
		"Siman Ponorogo",
		"Pengingat Shalat WhatsApp",
		"Prayer Reminder",
	],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="id"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col bg-[#F5F8FC] text-[#172B43] selection:bg-[#1D5FA7]/20 selection:text-[#123B6D]">
				{children}
			</body>
		</html>
	);
}
