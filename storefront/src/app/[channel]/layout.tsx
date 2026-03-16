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
				return validSlugs;
			}
		}
	} catch (error) {
		console.error("[Channel Validation] Failed to fetch channels from API:", error);
		// Fall through to env variable or default
	}
	
	// Fallback: Use channels from environment variable (if explicitly set)
	// Only use this if API call failed or no app token is available
	const envChannels = getChannelsFromEnv();
	// Check if env variable is explicitly set (not just the default)
	const envChannelsEnv = process.env.NEXT_PUBLIC_CHANNELS;
	if (envChannelsEnv && envChannelsEnv.trim().length > 0) {
		return envChannels;
	}

	// Final fallback: use default channel
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
		// Redirect to default channel, preserving the rest of the path
		redirect(`/${defaultChannel}`);
	}
	
	// Map channel to locale/direction for SEO and screen readers
	// This runs as an inline script before React hydrates to avoid flash
	const RTL_CHANNELS = ["default-channel", "ils"];
	const isRtl = RTL_CHANNELS.includes(channel);
	const lang = isRtl ? "he" : "en";
	const dir = isRtl ? "rtl" : "ltr";

	return (
		<>
			<script
				dangerouslySetInnerHTML={{
					__html: `document.documentElement.lang="${lang}";document.documentElement.dir="${dir}";`,
				}}
			/>
			{children}
		</>
	);
}
