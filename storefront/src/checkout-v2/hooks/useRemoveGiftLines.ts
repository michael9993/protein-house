/**
 * When the user proceeds to checkout with partial selection (gift deselected),
 * this hook removes any gift lines that Saleor may have re-added after mutations.
 *
 * Ported from storefront/src/checkout/hooks/useRemoveGiftLinesForPartialCheckout.ts
 * — adapted to use checkout-v2 state context and server action for line removal.
 */
"use client";

import { useEffect, useRef } from "react";
import { useCheckoutState } from "@/checkout-v2/CheckoutStateProvider";
import { removeLine } from "@/checkout-v2/_actions/remove-line";

const STORAGE_KEY = "checkout-no-gift-ids";
const NO_GIFT_COOKIE_NAME = "checkout-no-gift-id";
const THROTTLE_MS = 2500;

function getNoGiftCheckoutIds(): string[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed)
			? parsed.filter((id): id is string => typeof id === "string")
			: [];
	} catch {
		return [];
	}
}

function syncNoGiftIdFromCookie(checkoutId: string): void {
	if (typeof document === "undefined") return;
	try {
		const match = document.cookie.match(
			new RegExp(`(?:^|;\\s*)${NO_GIFT_COOKIE_NAME}=([^;]*)`),
		);
		const cookieValue = match?.[1]?.trim();
		if (!cookieValue || cookieValue !== checkoutId) return;
		const ids = getNoGiftCheckoutIds();
		if (!ids.includes(checkoutId)) {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, checkoutId]));
		}
		document.cookie = `${NO_GIFT_COOKIE_NAME}=; path=/; max-age=0`;
	} catch {
		/* ignore */
	}
}

function isGiftLine(line: {
	isGift?: boolean;
	totalPrice?: { gross?: { amount: number } };
	undiscountedUnitPrice?: { gross?: { amount: number } };
}): boolean {
	if (line.isGift === true) return true;
	const total = line.totalPrice?.gross?.amount ?? 0;
	const undiscounted = line.undiscountedUnitPrice?.gross?.amount ?? 0;
	return total === 0 && undiscounted > 0;
}

export function useRemoveGiftLines(checkoutId: string | undefined) {
	const { state, dispatch } = useCheckoutState();
	const checkout = state.checkout;
	const lastDeleteTimeRef = useRef<number>(0);

	useEffect(() => {
		if (!checkout?.id || !checkoutId || checkout.id !== checkoutId) return;

		syncNoGiftIdFromCookie(checkoutId);
		const noGiftIds = getNoGiftCheckoutIds();
		if (!noGiftIds.includes(checkout.id)) return;

		const lines = checkout.lines ?? [];
		const giftLines = lines.filter((line) =>
			isGiftLine(line as unknown as {
				id: string;
				isGift?: boolean;
				totalPrice?: { gross?: { amount: number } };
				undiscountedUnitPrice?: { gross?: { amount: number } };
			}),
		);
		if (giftLines.length === 0) return;

		const now = Date.now();
		if (now - lastDeleteTimeRef.current < THROTTLE_MS) return;
		lastDeleteTimeRef.current = now;

		void (async () => {
			for (const line of giftLines) {
				try {
					dispatch({ type: "OPTIMISTIC_REMOVE_LINE", lineId: line.id });
					const result = await removeLine(checkout.id, line.id);
					if (result.errors.length > 0) {
						dispatch({ type: "REVERT_OPTIMISTIC" });
					}
				} catch {
					dispatch({ type: "REVERT_OPTIMISTIC" });
				}
			}
		})();
	}, [checkout?.id, checkout?.lines, checkoutId, dispatch]);
}

export function addCheckoutIdToNoGiftList(checkoutId: string) {
	if (typeof window === "undefined") return;
	try {
		const ids = getNoGiftCheckoutIds();
		if (ids.includes(checkoutId)) return;
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, checkoutId]));
	} catch {
		/* ignore */
	}
}
