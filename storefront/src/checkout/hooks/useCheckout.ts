import { useEffect, useMemo } from "react";

import { type Checkout, useCheckoutQuery } from "@/checkout/graphql";
import { useCheckoutIdFromServer } from "@/checkout/contexts/CheckoutIdContext";
import { extractCheckoutIdFromUrl } from "@/checkout/lib/utils/url";
import { useCheckoutUpdateStateActions } from "@/checkout/state/updateStateStore";

export const useCheckout = ({ pause = false } = {}) => {
	const idFromServer = useCheckoutIdFromServer();
	const idFromUrl = useMemo(() => extractCheckoutIdFromUrl(), []);
	const id = idFromServer ?? idFromUrl;
	const { setLoadingCheckout } = useCheckoutUpdateStateActions();

	// If no checkout ID, pause the query
	const shouldPause = pause || !id;

	const [{ data, fetching, stale }, refetch] = useCheckoutQuery({
		variables: { id: id || "", languageCode: "EN_US" },
		pause: shouldPause,
	});

	useEffect(() => setLoadingCheckout(fetching || stale), [fetching, setLoadingCheckout, stale]);

	return useMemo(
		() => ({ 
			checkout: data?.checkout as Checkout | null, 
			fetching: fetching || stale, 
			refetch,
			hasValidCheckoutId: !!id,
		}),
		[data?.checkout, fetching, refetch, stale, id],
	);
};
