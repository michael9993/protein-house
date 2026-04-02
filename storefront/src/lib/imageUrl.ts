/**
 * Normalize image URLs for Docker environment
 * 
 * With unoptimized images (development), we keep localhost:8000 for browser access.
 * With optimized images (production), we normalize server-side to use Docker service name.
 * 
 * NOTE: This function is currently not used because we have unoptimized: true in development.
 * It's kept for potential future use when image optimization is enabled.
 */
export function normalizeImageUrl(url: string | null | undefined): string | undefined {
	if (!url) return undefined;

	// In development with unoptimized images, return URL as-is (browser needs localhost:8000)
	// In production with optimized images, normalize to Docker service name for server-side fetching
	if (process.env.NODE_ENV === "development") {
		// Development: keep localhost:8000 for browser access
		return url;
	}

	// Production: normalize server-side URLs to Docker service name
	if (typeof window === "undefined") {
		if (url.startsWith("http://localhost:8000") || url.startsWith("https://localhost:8000")) {
			const apiBase = process.env.SALEOR_API_URL?.replace("/graphql/", "") || "http://saleor-api:8000";
			return url.replace(/https?:\/\/localhost:8000/, apiBase);
		}
	}

	return url;
}

