import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Production berjalan sebagai container Node standalone (lihat docs/10-devops-cicd.md).
	output: "standalone",
	cacheComponents: true,
	partialPrefetching: true,
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
