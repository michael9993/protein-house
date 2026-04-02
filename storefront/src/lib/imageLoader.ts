/**
 * Custom Next.js Image Loader
 * Handles URL normalization for Docker environment
 * Server-side: uses Docker service name (saleor-api:8000)
 * Client-side: uses localhost:8000 (browser can access it)
 */
export default function imageLoader({ src, width: _width, quality: _quality }: { src: string; width: number; quality?: number }) {
	// If it's a full URL with localhost:8000, normalize it
	if (src.startsWith("http://localhost:8000") || src.startsWith("https://localhost:8000")) {
		// Server-side: replace with Docker service name
		if (typeof window === "undefined") {
			const apiBase = process.env.SALEOR_API_URL?.replace("/graphql/", "") || "http://saleor-api:8000";
			const normalized = src.replace(/https?:\/\/localhost:8000/, apiBase);
			if (process.env.NODE_ENV === "development") {
				console.log("[imageLoader] Server-side normalization:", src, "->", normalized);
			}
			return normalized;
		}
		// Client-side: keep localhost:8000 (browser can access it)
		return src;
	}

	// If it's already using Docker service name, return as-is
	if (src.startsWith("http://saleor-api:8000") || src.startsWith("https://saleor-api:8000")) {
		return src;
	}

	// For other URLs, return as-is
	return src;
}
