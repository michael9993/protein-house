import * as Checkout from "@/lib/checkout";
import { CartNavItemClient } from "./CartNavItemClient";

/**
 * Server component that fetches cart data and passes to client component.
 * The client component handles drawer/page mode switching.
 */
export const CartNavItem = async ({ channel }: { channel: string }) => {
	const checkoutId = await Checkout.getIdFromCookies(channel);
	let checkout = null;
	if (checkoutId) {
		try {
			checkout = await Checkout.find(checkoutId);
		} catch (error) {
			// Silently handle errors - checkout might not be accessible
			console.warn('[CartNavItem] Could not load checkout:', error);
		}
	}

	const lineCount = checkout ? checkout.lines.reduce((result, line) => result + line.quantity, 0) : 0;

	return (
		<CartNavItemClient 
			channel={channel}
			lineCount={lineCount}
		/>
	);
};

