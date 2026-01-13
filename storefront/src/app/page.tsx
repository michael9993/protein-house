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
			console.log("[Root Redirect] Fetching channels from API...");
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
				console.log("[Root Redirect] Active channels found:", activeChannels.map(c => c.slug));
				
				// Check if saved channel preference is valid
				if (savedChannel) {
					const savedChannelIsValid = activeChannels.some(ch => ch.slug === savedChannel);
					if (savedChannelIsValid) {
						console.log("[Root Redirect] Using saved channel preference:", savedChannel);
						return savedChannel;
					} else {
						console.log("[Root Redirect] Saved channel preference is invalid, using first channel:", savedChannel);
					}
				}
				
				const firstChannel = activeChannels[0];
				console.log("[Root Redirect] Redirecting to:", firstChannel.slug);
				return firstChannel.slug;
			}
		}
	} catch (error) {
		console.error("[Root Redirect] Failed to fetch channels from API:", error);
		if (error instanceof Error) {
			console.error("[Root Redirect] Error message:", error.message);
			// If it's a permission error, suggest using env variable
			if (error.message.includes("AUTHENTICATED_APP") || error.message.includes("AUTHENTICATED_STAFF_USER")) {
				console.warn("[Root Redirect] Permission error detected. Falling back to env variable or default.");
				console.warn("  To fix: Grant AUTHENTICATED_APP permission to your app token in Saleor");
			}
		}
		// Fall through to env variable or default
	}
	
	// Fallback: Use channels from environment variable (if explicitly set)
	const envChannelsEnv = process.env.NEXT_PUBLIC_CHANNELS;
	if (envChannelsEnv && envChannelsEnv.trim().length > 0) {
		const envChannels = getChannelsFromEnv();
		if (envChannels.length > 0) {
			console.log("[Root Redirect] Using channels from NEXT_PUBLIC_CHANNELS env:", envChannels);
			// Check if saved channel is in env channels
			if (savedChannel && envChannels.includes(savedChannel)) {
				console.log("[Root Redirect] Using saved channel preference from env:", savedChannel);
				return savedChannel;
			}
			return envChannels[0];
		}
	}
	
	// Final fallback to config default
	console.warn("[Root Redirect] No channels found, using DefaultChannelSlug");
	return DefaultChannelSlug;
}

export default async function EmptyPage() {
	const channel = await getFirstActiveChannel();
	console.log("[Root Redirect] Final redirect to:", `/${channel}`);
	redirect(`/${channel}`);
};
