"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { restoreAndSaveUserCart } from "@/app/actions";

/**
 * Client component that triggers cart restore when visiting the cart page.
 * This ensures the user's saved cart is restored even if they didn't come from OAuth redirect.
 */
export function CartRestoreTrigger({ channel }: { channel: string }) {
	const router = useRouter();
	const hasRestored = useRef(false);

	useEffect(() => {
		// Only restore once per mount
		if (hasRestored.current) return;
		
		console.log("[Cart Restore Trigger] 🔍 Checking if cart needs to be restored...");
		restoreAndSaveUserCart(channel)
			.then((result) => {
				if (result.success && result.checkoutId) {
					console.log(`[Cart Restore Trigger] ✅ Cart restored: ${result.checkoutId}`);
					hasRestored.current = true;
					// Revalidate the page to show the restored cart (no full reload)
					router.refresh();
				} else {
					console.log(`[Cart Restore Trigger] ℹ️  No cart to restore (user has no saved cart)`);
				}
			})
			.catch((error) => {
				console.error("[Cart Restore Trigger] Cart restore failed (non-fatal):", error);
			});
	}, [channel, router]);

	return null; // This component doesn't render anything
}

