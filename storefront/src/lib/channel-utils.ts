/**
 * Channel Utilities
 * 
 * Helper functions for working with channels and currency
 */

import { ChannelsListDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

interface Channel {
	id: string;
	name: string;
	slug: string;
	currencyCode: string;
	isActive: boolean;
}

let channelsCache: Channel[] | null = null;
let channelsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all channels (with caching)
 */
async function getChannels(): Promise<Channel[]> {
	const now = Date.now();
	
	// Return cached channels if still valid
	if (channelsCache && (now - channelsCacheTime) < CACHE_DURATION) {
		return channelsCache;
	}
	
	try {
		const result = process.env.SALEOR_APP_TOKEN
			? await executeGraphQL(ChannelsListDocument, {
					withAuth: false,
					headers: {
						Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}`,
					},
			  })
			: null;
		
		if (!result?.channels) {
			return [];
		}
		
		channelsCache = (result.channels || [])
			.filter((ch: Channel) => ch.isActive)
			.map((ch: Channel) => ({
				id: ch.id,
				name: ch.name,
				slug: ch.slug,
				currencyCode: ch.currencyCode,
				isActive: ch.isActive,
			}));
		
		channelsCacheTime = now;
		return channelsCache;
	} catch (error) {
		console.warn("Failed to fetch channels:", error);
		return channelsCache || [];
	}
}

/**
 * Get currency code for a channel slug
 * Returns the currency code for the given channel, or empty string if not found
 */
export async function getChannelCurrency(channelSlug: string): Promise<string> {
	const channels = await getChannels();
	const channel = channels.find(
		(ch) => ch.slug === channelSlug || ch.currencyCode.toLowerCase() === channelSlug.toLowerCase()
	);
	const code = channel?.currencyCode;
	return code?.trim() || "";
}

/**
 * Client-side version (for use in components)
 * Uses a simple fetch without auth token
 */
export async function getChannelCurrencyClient(channelSlug: string): Promise<string> {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
		if (!apiUrl) {
			return ""; // Return empty string instead of USD fallback
		}

		const response = await fetch(apiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: `
					query GetChannelCurrency($slug: String!) {
						channel(slug: $slug) {
							currencyCode
						}
					}
				`,
				variables: { slug: channelSlug },
			}),
			next: { revalidate: 30 },
		});

		const result = (await response.json()) as { data?: { channel?: { currencyCode?: string } } };
		const code = result.data?.channel?.currencyCode;
		// Normalize: trim and return, or empty string if not found (don't default to USD)
		return code?.trim() || "";
	} catch (error) {
		console.warn("Failed to fetch channel currency:", error);
		// Return empty string instead of USD - let the UI handle gracefully
		return "";
	}
}

