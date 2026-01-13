import { Suspense } from "react";
import { ChannelsListDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { ChannelPicker } from "./ChannelPicker";

interface Channel {
	id: string;
	name: string;
	slug: string;
	currencyCode: string;
	isActive: boolean;
}

async function fetchChannels(): Promise<Channel[]> {
	try {
		// Channels query requires authentication - use app token if available (same pattern as Footer)
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
		
		return (result.channels || [])
			.filter((ch: Channel) => ch.isActive)
			.map((ch: Channel) => ({
				id: ch.id,
				name: ch.name,
				slug: ch.slug,
				currencyCode: ch.currencyCode,
				isActive: ch.isActive,
			}));
	} catch (error) {
		// If channels query fails (no auth or no app token), return empty array - picker will be hidden
		// This is expected behavior when SALEOR_APP_TOKEN is not configured
		console.error("Failed to fetch channels (this is expected if no app token is configured):", error);
		return [];
	}
}

export async function ChannelPickerWrapper() {
	const channels = await fetchChannels();
	
	if (channels.length <= 1) {
		return null;
	}
	
	return (
		<Suspense fallback={<div className="h-9 w-20 animate-pulse rounded-md bg-neutral-100" />}>
			<ChannelPicker channels={channels} />
		</Suspense>
	);
}

