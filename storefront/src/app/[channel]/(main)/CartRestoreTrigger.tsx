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
			restoreAndSaveUserCart(channel).catch(() => {
				// Cart restore is best-effort
			});
		}
	}, [restoreCart, channel]);

	return null; // This component doesn't render anything
}

