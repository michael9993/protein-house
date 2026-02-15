import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { executeGraphQL } from "@/lib/graphql";
import { ChannelsListDocument } from "@/gql/graphql";
import { DefaultChannelSlug, getChannelsFromEnv } from "@/app/config";

// Force dynamic rendering - don't cache this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getFirstActiveChannel(): Promise<string> {
	// First, check for saved channel preference in cookies
	const cookieStore = await cookies();
	const savedChannel = cookieStore.get("saleor_channel_preference")?.value;
	
	// Try to fetch channels from API first (if app token is available)
	// This is the preferred method as it gets the actual active channels from Saleor
	let activeChannels: Array<{ slug: string; isActive: boolean }> = [];
	
	try {
		const appToken = process.env.SALEOR_APP_TOKEN;
		
		if (appToken) {
			const channels = await executeGraphQL(ChannelsListDocument, {
				withAuth: false,
				headers: {
					Authorization: `Bearer ${appToken}`,
				},
				cache: "no-cache", // Disable caching
			});
			
			activeChannels = channels.channels
				?.filter((channel) => channel.isActive)
				.sort((a, b) => a.slug.localeCompare(b.slug)) || [];
			
			if (activeChannels.length > 0) {
				// Check if saved channel preference is valid
				if (savedChannel) {
					const savedChannelIsValid = activeChannels.some(ch => ch.slug === savedChannel);
					if (savedChannelIsValid) {
						return savedChannel;
					}
				}

				return activeChannels[0].slug;
			}
		}
	} catch (error) {
		console.error("[Root Redirect] Failed to fetch channels from API:", error);
		// Fall through to env variable or default
		// Fall through to env variable or default
	}
	
	// Fallback: Use channels from environment variable (if explicitly set)
	const envChannelsEnv = process.env.NEXT_PUBLIC_CHANNELS;
	if (envChannelsEnv && envChannelsEnv.trim().length > 0) {
		const envChannels = getChannelsFromEnv();
		if (envChannels.length > 0) {
			if (savedChannel && envChannels.includes(savedChannel)) {
				return savedChannel;
			}
			return envChannels[0];
		}
	}
	
	// Final fallback to config default
	return DefaultChannelSlug;
}

export default async function EmptyPage() {
	const channel = await getFirstActiveChannel();
	redirect(`/${channel}`);
};
