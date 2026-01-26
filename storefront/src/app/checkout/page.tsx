import { redirect } from "next/navigation";
import { cookies } from "next/headers";

/**
 * Legacy checkout route - redirects to channel-aware checkout
 * 
 * The checkout is now at /{channel}/checkout to properly load
 * storefront control configuration for each channel.
 */
export default async function LegacyCheckoutPage(props: {
	searchParams: Promise<{ checkout?: string; order?: string }>;
}) {
	const searchParams = await props.searchParams;
	
	// Get channel from cookie or use default
	const cookieStore = await cookies();
	const channelCookie = cookieStore.get("channel");
	const channel = channelCookie?.value || process.env.NEXT_PUBLIC_DEFAULT_CHANNEL || "default-channel";
	
	// Build redirect URL with search params
	const params = new URLSearchParams();
	if (searchParams.checkout) {
		params.set("checkout", searchParams.checkout);
	}
	if (searchParams.order) {
		params.set("order", searchParams.order);
	}
	
	const queryString = params.toString();
	const redirectUrl = `/${channel}/checkout${queryString ? `?${queryString}` : ""}`;
	
	redirect(redirectUrl);
}
