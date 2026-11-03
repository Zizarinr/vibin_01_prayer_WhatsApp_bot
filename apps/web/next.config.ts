import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Production berjalan sebagai container Node standalone (lihat docs/10-devops-cicd.md).
	output: "standalone",
	/* config options here */
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
};

export default nextConfig;
