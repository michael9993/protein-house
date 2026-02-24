import { useMemo } from "react";
import { type OrderFragment, useOrderQuery } from "@/checkout/graphql";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { getLanguageCodeForChannel, getChannelFromUrl } from "@/checkout/lib/utils/language";

export const useOrder = () => {
	const { orderId } = getQueryParams();
	const languageCode = useMemo(() => getLanguageCodeForChannel(getChannelFromUrl()), []);

	const [{ data, fetching: loading }] = useOrderQuery({
		pause: !orderId,
		variables: { languageCode, id: orderId as string },
	});

	return { order: data?.order as OrderFragment, loading };
};
