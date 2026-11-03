import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
	themeColor: "#123B6D",
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
};

export const metadata: Metadata = {
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_APP_URL || "https://prayer.unida.gontor.ac.id",
	),
	title: "UNIDA Prayer — Jadwal Shalat Kampus Siman & Pengingat WhatsApp",
	description:
		"Jadwal shalat harian akurat untuk kampus Universitas Darussalam Gontor dan sistem bot pengingat waktu shalat via WhatsApp.",
	keywords: [
		"UNIDA Gontor",
		"Jadwal Shalat",
		"Siman Ponorogo",
		"Pengingat Shalat WhatsApp",
		"Prayer Reminder",
		"Hisab Kemenag",
	],
	authors: [{ name: "UNIDA Gontor" }],
	creator: "UNIDA Gontor",
	icons: {
		icon: [
			{ url: "/favicon.ico" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
		],
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
	},
	manifest: "/manifest.json",
	openGraph: {
		title: "UNIDA Prayer — Jadwal Shalat Kampus Siman & Pengingat WhatsApp",
		description:
			"Jadwal shalat harian resmi dan terakurat kampus Universitas Darussalam Gontor Siman serta bot pengingat WhatsApp.",
		siteName: "UNIDA Prayer",
		locale: "id_ID",
		type: "website",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "UNIDA Prayer Banner",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "UNIDA Prayer — Jadwal Shalat Kampus Siman & Pengingat WhatsApp",
		description:
			"Jadwal shalat harian akurat kampus UNIDA Gontor dan bot pengingat waktu shalat via WhatsApp.",
		images: ["/og-image.png"],
	},
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
