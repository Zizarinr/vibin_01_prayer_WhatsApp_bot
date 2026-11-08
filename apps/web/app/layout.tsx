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

const appUrl =
	process.env.NEXT_PUBLIC_APP_URL ||
	process.env.WEB_URL ||
	"https://prayer.unida.gontor.ac.id";
const cleanAppUrl = appUrl.replace(/\/+$/, "");

export const metadata: Metadata = {
	metadataBase: new URL(cleanAppUrl),
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
	alternates: {
		canonical: "/",
	},
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
		url: cleanAppUrl,
		siteName: "UNIDA Prayer",
		locale: "id_ID",
		type: "website",
		images: [
			{
				url: "/og-image.jpg",
				secureUrl: `${cleanAppUrl}/og-image.jpg`,
				width: 1200,
				height: 630,
				type: "image/jpeg",
				alt: "UNIDA Prayer — Jadwal Shalat Kampus Siman & Pengingat WhatsApp",
			},
			{
				url: "/og-image-square.jpg",
				secureUrl: `${cleanAppUrl}/og-image-square.jpg`,
				width: 512,
				height: 512,
				type: "image/jpeg",
				alt: "UNIDA Prayer Icon",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "UNIDA Prayer — Jadwal Shalat Kampus Siman & Pengingat WhatsApp",
		description:
			"Jadwal shalat harian akurat kampus UNIDA Gontor dan bot pengingat waktu shalat via WhatsApp.",
		images: [`${cleanAppUrl}/og-image.jpg`],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			"@id": `${cleanAppUrl}/#website`,
			url: cleanAppUrl,
			name: "UNIDA Prayer",
			description:
				"Jadwal shalat harian akurat kampus Universitas Darussalam Gontor dan bot pengingat WhatsApp",
			inLanguage: "id-ID",
		},
		{
			"@type": "EducationalOrganization",
			"@id": "https://unida.gontor.ac.id/#organization",
			name: "Universitas Darussalam Gontor",
			url: "https://unida.gontor.ac.id",
			address: {
				"@type": "PostalAddress",
				streetAddress: "Jl. Raya Siman Km 6",
				addressLocality: "Ponorogo",
				addressRegion: "Jawa Timur",
				postalCode: "63471",
				addressCountry: "ID",
			},
		},
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
			<head>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</head>
			<body className="min-h-full flex flex-col bg-[#F5F8FC] text-[#172B43] selection:bg-[#1D5FA7]/20 selection:text-[#123B6D]">
				{children}
			</body>
		</html>
	);
}
