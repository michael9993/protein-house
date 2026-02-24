import { useEffect, useMemo, useRef } from "react";

import { type Checkout, useCheckoutQuery } from "@/checkout/graphql";
import { useCheckoutIdFromServer } from "@/checkout/contexts/CheckoutIdContext";
import { extractCheckoutIdFromUrl } from "@/checkout/lib/utils/url";
import { getLanguageCodeForChannel, getChannelFromUrl } from "@/checkout/lib/utils/language";
import { useCheckoutUpdateStateActions } from "@/checkout/state/updateStateStore";

export const useCheckout = ({ pause = false } = {}) => {
	const idFromServer = useCheckoutIdFromServer();
	const idFromUrl = useMemo(() => extractCheckoutIdFromUrl(), []);
	const id = idFromServer ?? idFromUrl;
	const { setLoadingCheckout } = useCheckoutUpdateStateActions();

	// Derive language code from URL channel slug (available before first fetch)
	const channelFromUrl = useMemo(() => getChannelFromUrl(), []);
	const languageCode = useMemo(
		() => getLanguageCodeForChannel(channelFromUrl),
		[channelFromUrl],
	);

	// If no checkout ID, pause the query
	const shouldPause = pause || !id;

	const [{ data, fetching, stale }, refetch] = useCheckoutQuery({
		variables: { id: id || "", languageCode },
		pause: shouldPause,
	});

	// Keep last known checkout data during cache invalidation refetches.
	// When urql's document cache invalidates a query (after a mutation),
	// data temporarily becomes undefined. This ref preserves the previous
	// checkout so the UI doesn't flash a skeleton during refetch.
	const lastCheckoutRef = useRef<Checkout | null>(null);
	if (data?.checkout) {
		lastCheckoutRef.current = data.checkout as Checkout;
	}

	const checkout = (data?.checkout ?? lastCheckoutRef.current) as Checkout | null;

	useEffect(() => setLoadingCheckout(fetching || stale), [fetching, setLoadingCheckout, stale]);

	return useMemo(
		() => ({
			checkout,
			fetching: fetching || stale,
			refetch,
			hasValidCheckoutId: !!id,
			languageCode,
		}),
		[checkout, fetching, refetch, stale, id, languageCode],
	);
};
