import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		process.env.WEB_URL ||
		"https://prayer.unida.gontor.ac.id";
	const cleanBase = baseUrl.replace(/\/+$/, "");

	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/admin/", "/api/"],
			},
		],
		sitemap: `${cleanBase}/sitemap.xml`,
	};
}
