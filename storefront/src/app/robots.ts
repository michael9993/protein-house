import { type MetadataRoute } from "next";

const BASE_URL =
	process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/api/",
				"/checkout/",
				"/account/",
				"/cart",
				"/login",
				"/register",
				"/forgot-password",
				"/confirm-email",
				"/verify-email",
				"/track-order",
			],
		},
		sitemap: `${BASE_URL}/sitemap.xml`,
	};
}
