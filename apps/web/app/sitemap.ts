import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		process.env.WEB_URL ||
		"https://prayer.unida.gontor.ac.id";
	const cleanBase = baseUrl.replace(/\/+$/, "");

	return [
		{
			url: cleanBase,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1,
		},
	];
}
