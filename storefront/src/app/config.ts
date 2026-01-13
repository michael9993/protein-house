import { createSaleorAuthClient } from "@saleor/auth-sdk";
import { getNextServerCookiesStorageAsync } from "@saleor/auth-sdk/next/server";
import { invariant } from "ts-invariant";

export const ProductsPerPage = 12;

// For server-side rendering in Docker, use SALEOR_API_URL (Docker service name)
// For client-side, use NEXT_PUBLIC_SALEOR_API_URL (localhost for browser)
const saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
invariant(saleorApiUrl, "Missing NEXT_PUBLIC_SALEOR_API_URL or SALEOR_API_URL env variable");

export const DefaultChannelSlug =
	process.env.NEXT_PUBLIC_DEFAULT_CHANNEL ?? "default-channel";

/**
 * Get list of active channel slugs from environment variable.
 * Format: comma-separated list, e.g., "default-channel,us-channel,eu-channel"
 * Falls back to DefaultChannelSlug if not set.
 */
export function getChannelsFromEnv(): string[] {
	const channelsEnv = process.env.NEXT_PUBLIC_CHANNELS;
	if (channelsEnv) {
		return channelsEnv
			.split(",")
			.map((slug) => slug.trim())
			.filter((slug) => slug.length > 0);
	}
	return [DefaultChannelSlug];
}

export const getServerAuthClient = async () => {
	const nextServerCookiesStorage = await getNextServerCookiesStorageAsync();
	return createSaleorAuthClient({
		saleorApiUrl,
		refreshTokenStorage: nextServerCookiesStorage,
		accessTokenStorage: nextServerCookiesStorage,
	});
};
