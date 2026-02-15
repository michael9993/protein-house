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
		
		restoreAndSaveUserCart(channel)
			.then((result) => {
				if (result.success && result.checkoutId) {
					hasRestored.current = true;
					router.refresh();
				}
			})
			.catch(() => {
				// Cart restore is best-effort
			});
	}, [channel, router]);

	return null; // This component doesn't render anything
}

