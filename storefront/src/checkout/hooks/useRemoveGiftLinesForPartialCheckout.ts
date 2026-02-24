import { useEffect, useRef } from "react";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useCheckoutIdFromServer } from "@/checkout/contexts/CheckoutIdContext";
import { useCheckoutLineDeleteMutation } from "@/checkout/graphql";
import { getLanguageCodeForChannel } from "@/checkout/lib/utils/language";

const STORAGE_KEY = "checkout-no-gift-ids";
/** Must match CHECKOUT_NO_GIFT_COOKIE in cart-actions (used so checkout page can add ID to no-gift list when opened in new tab). */
const NO_GIFT_COOKIE_NAME = "checkout-no-gift-id";

function getNoGiftCheckoutIds(): string[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
	} catch {
		return [];
	}
}

/** If cookie matches checkoutId, add to sessionStorage and clear cookie (so new-tab / refresh still get no-gift list). */
function syncNoGiftIdFromCookie(checkoutId: string): void {
	if (typeof document === "undefined") return;
	try {
		const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${NO_GIFT_COOKIE_NAME}=([^;]*)`));
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

function removeCheckoutIdFromNoGiftList(checkoutId: string) {
	if (typeof window === "undefined") return;
	try {
		const ids = getNoGiftCheckoutIds().filter((id) => id !== checkoutId);
		if (ids.length === 0) {
			sessionStorage.removeItem(STORAGE_KEY);
		} else {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
		}
	} catch {
		// ignore
	}
}

const THROTTLE_MS = 2500;

/** Treat line as gift if isGift is true or if total is 0 and undiscounted price > 0 (fallback when API omits isGift). */
function isGiftLine(line: { isGift?: boolean; totalPrice?: { gross?: { amount: number } }; undiscountedUnitPrice?: { gross?: { amount: number } } }): boolean {
	if ((line as { isGift?: boolean }).isGift === true) return true;
	const total = line.totalPrice?.gross?.amount ?? 0;
	const undiscounted = line.undiscountedUnitPrice?.gross?.amount ?? 0;
	return total === 0 && undiscounted > 0;
}

/**
 * When the user proceeded to checkout with partial selection (e.g. gift deselected),
 * we store the new checkout ID in sessionStorage. This hook removes any gift lines
 * that Saleor may have re-added (e.g. on refetch or after voucher apply) so the
 * summary stays in sync with the user's selection. Throttled to avoid loops.
 */
export function useRemoveGiftLinesForPartialCheckout() {
	const { checkout, fetching, refetch } = useCheckout();
	const idFromServer = useCheckoutIdFromServer();
	const checkoutId = idFromServer ?? (typeof window !== "undefined" ? (() => {
		try {
			const params = new URLSearchParams(window.location.search);
			return params.get("checkout") ?? undefined;
		} catch {
			return undefined;
		}
	})() : undefined);
	const [, deleteLine] = useCheckoutLineDeleteMutation();
	const lastDeleteTimeRef = useRef<number>(0);

	useEffect(() => {
		if (fetching || !checkout?.id || !checkoutId || checkout.id !== checkoutId) return;

		syncNoGiftIdFromCookie(checkoutId);
		const noGiftIds = getNoGiftCheckoutIds();
		if (!noGiftIds.includes(checkout.id)) return;

		const giftLines = (checkout.lines ?? []).filter((line) => isGiftLine(line as Parameters<typeof isGiftLine>[0]));
		if (giftLines.length === 0) return;

		const now = Date.now();
		if (now - lastDeleteTimeRef.current < THROTTLE_MS) return;
		lastDeleteTimeRef.current = now;

		void (async () => {
			for (const line of giftLines) {
				try {
					await deleteLine({
						checkoutId: checkout.id,
						lineId: line.id,
						languageCode: getLanguageCodeForChannel(checkout.channel?.slug),
					});
				} catch {
					// Continue with next line
				}
			}
			refetch();
		})();
	}, [checkout?.id, checkout?.lines, checkoutId, deleteLine, fetching, refetch]);
}

export const CHECKOUT_NO_GIFT_STORAGE_KEY = STORAGE_KEY;

export function addCheckoutIdToNoGiftList(checkoutId: string) {
	if (typeof window === "undefined") return;
	try {
		const ids = getNoGiftCheckoutIds();
		if (ids.includes(checkoutId)) return;
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, checkoutId]));
	} catch {
		// ignore
	}
}
