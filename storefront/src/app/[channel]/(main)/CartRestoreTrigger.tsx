"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { restoreAndSaveUserCart } from "@/app/actions";

/**
 * Client component that triggers cart restore after OAuth login.
 * This is needed because Server Actions can't modify cookies when called
 * from Server Components during render, but they CAN when called from client components.
 */
export function CartRestoreTrigger({ channel }: { channel: string }) {
	const searchParams = useSearchParams();
	const restoreCart = searchParams?.get("restore_cart") === "true";

	useEffect(() => {
		if (restoreCart) {
			console.log("[Cart Restore Trigger] 🔍 Restore cart parameter detected, restoring user cart...");
			restoreAndSaveUserCart(channel)
				.then((result) => {
					if (result.success && result.checkoutId) {
						console.log(`[Cart Restore Trigger] ✅ Cart restored: ${result.checkoutId}`);
						// Optionally redirect to remove the query param
						// window.history.replaceState({}, "", window.location.pathname);
					} else {
						console.log(`[Cart Restore Trigger] ℹ️  No cart to restore (user has no saved cart)`);
					}
				})
				.catch((error) => {
					console.error("[Cart Restore Trigger] Cart restore failed (non-fatal):", error);
				});
		}
	}, [restoreCart, channel]);

	return null; // This component doesn't render anything
}

