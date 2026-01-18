import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { executeGraphQL } from "@/lib/graphql";
import { ChannelsListDocument } from "@/gql/graphql";
import { DefaultChannelSlug, getChannelsFromEnv } from "@/app/config";

// Force dynamic rendering for channel validation
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const generateStaticParams = async () => {
	// Try to fetch channels from API first (if app token is available)
	// This is the preferred method as it gets the actual active channels from Saleor
	if (process.env.SALEOR_APP_TOKEN) {
		try {
			const channels = await executeGraphQL(ChannelsListDocument, {
				withAuth: false, // disable cookie-based auth for this call
				headers: {
					// and use app token instead
					Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}`,
				},
			});
			const activeChannels = channels.channels
				?.filter((channel) => channel.isActive)
				.map((channel) => ({ channel: channel.slug })) ?? [];
			
			if (activeChannels.length > 0) {
				return activeChannels;
			}
		} catch (error) {
			console.error("[generateStaticParams] Failed to fetch channels from API:", error);
			// If it's a timeout/network error, log a helpful message
			if (error instanceof Error && (
				error.message?.includes('fetch failed') ||
				error.message?.includes('timeout') ||
				(error.cause && (error.cause as any).code === 'ETIMEDOUT')
			)) {
				console.warn("[generateStaticParams] Network/timeout error detected. This may be due to unstable tunnel connection.");
				console.warn("  Consider setting NEXT_PUBLIC_CHANNELS env variable as a fallback.");
			}
			// Fall through to env variable or default
		}
	}

	// Fallback: Use channels from environment variable (if explicitly set)
	const envChannelsEnv = process.env.NEXT_PUBLIC_CHANNELS;
	if (envChannelsEnv && envChannelsEnv.trim().length > 0) {
		const envChannels = getChannelsFromEnv();
		return envChannels.map((slug) => ({ channel: slug }));
	}
	
	// Final fallback: use default channel
	return [{ channel: DefaultChannelSlug }];
};

async function getValidChannelSlugs(): Promise<string[]> {
	// Try to fetch channels from API first (if app token is available)
	// This is the preferred method as it gets the actual active channels from Saleor
	try {
		const appToken = process.env.SALEOR_APP_TOKEN;
		if (appToken) {
			const channels = await executeGraphQL(ChannelsListDocument, {
				withAuth: false,
				headers: {
					Authorization: `Bearer ${appToken}`,
				},
				cache: "no-cache", // Disable caching to get fresh data
			});
			
			const validSlugs = channels.channels
				?.filter((channel) => channel.isActive)
				.map((channel) => channel.slug) ?? [];
			
			if (validSlugs.length > 0) {
				console.log("[Channel Validation] Valid channel slugs from API:", validSlugs);
				return validSlugs;
			}
		}
	} catch (error) {
		console.error("[Channel Validation] Failed to fetch channels from API:", error);
		if (error instanceof Error) {
			// If it's a permission error, suggest using env variable
			if (error.message.includes("AUTHENTICATED_APP") || error.message.includes("AUTHENTICATED_STAFF_USER")) {
				console.warn("[Channel Validation] Permission error detected. Falling back to env variable or default.");
				console.warn("  To fix: Grant AUTHENTICATED_APP permission to your app token in Saleor");
			}
			// If it's a timeout/network error, log a helpful message
			if (error.message?.includes('fetch failed') || 
				error.message?.includes('timeout') ||
				(error.cause && (error.cause as any).code === 'ETIMEDOUT')) {
				console.warn("[Channel Validation] Network/timeout error detected. This may be due to unstable tunnel connection.");
				console.warn("  Consider setting NEXT_PUBLIC_CHANNELS env variable as a fallback.");
			}
		}
		// Fall through to env variable or default
	}
	
	// Fallback: Use channels from environment variable (if explicitly set)
	// Only use this if API call failed or no app token is available
	const envChannels = getChannelsFromEnv();
	// Check if env variable is explicitly set (not just the default)
	const envChannelsEnv = process.env.NEXT_PUBLIC_CHANNELS;
	if (envChannelsEnv && envChannelsEnv.trim().length > 0) {
		console.log("[Channel Validation] Using channels from NEXT_PUBLIC_CHANNELS env:", envChannels);
		return envChannels;
	}
	
	// Final fallback: use default channel
	console.warn("[Channel Validation] No channels found, using DefaultChannelSlug");
	return [DefaultChannelSlug];
}

export default async function ChannelLayout({ 
	children,
	params,
}: { 
	children: ReactNode;
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;
	const validSlugs = await getValidChannelSlugs();
	
	// Validate channel slug - redirect to default if invalid
	// This prevents issues where currency codes (like "usd") are used instead of channel slugs
	if (!validSlugs.includes(channel)) {
		const defaultChannel = validSlugs[0] || DefaultChannelSlug;
		// Redirect to default channel homepage
		// Note: We redirect to homepage rather than preserving path to avoid complexity
		// Users can navigate from there if needed
		redirect(`/${defaultChannel}`);
	}
	
	return children;
}
