import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Dev lokal: Next.js 16 memblokir origin non-localhost untuk resource dev
	// (HMR). Tanpa ini, akses via http://127.0.0.1:3000 gagal hidrasi —
	// halaman stuck "Memuat tanggal..." walau rewrite /api normal.
	// Hanya berpengaruh di `next dev`; diabaikan saat production build.
	allowedDevOrigins: ["127.0.0.1"],
	// Production berjalan sebagai container Node standalone (lihat docs/10-devops-cicd.md).
	output: "standalone",
	cacheComponents: true,
	partialPrefetching: true,
	// Admin + landing masih full Client Component (fetch di useEffect),
	// belum ada static shell untuk instant navigation. Batasi validasi
	// hanya ke segmen yang opt-in eksplisit agar dev overlay
	// "instant-unrendered-segment" tidak berisik di /admin.
	experimental: {
		instantInsights: {
			validationLevel: "manual-warning",
		},
	},
	turbopack: {
		rules: {
			"*.css": {
				loaders: ["@tailwindcss/turbopack"],
				as: "*.css",
			},
		},
	},
	async rewrites() {
		const apiUrl =
			process.env.INTERNAL_API_URL || "http://127.0.0.1:3001";
		return [
			{
				source: "/api/:path*",
				destination: `${apiUrl}/api/:path*`,
			},
		];
	},
};

export default nextConfig;
