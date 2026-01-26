import { invariant } from "ts-invariant";
import { fetchStorefrontConfig } from "@/lib/storefront-control/fetch-config";
import { CheckoutPageClient } from "./CheckoutPageClient";

export async function generateMetadata(props: { params: Promise<{ channel: string }> }) {
	const { channel } = await props.params;
	const config = await fetchStorefrontConfig(channel);
	return {
		title: `${config.content?.checkout?.checkoutTitle || "Checkout"}${config.store.name ? ` · ${config.store.name}` : ""}`,
	};
}

export default async function CheckoutPage(props: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<{ checkout?: string; order?: string }>;
}) {
	const { channel } = await props.params;
	const searchParams = await props.searchParams;
	
	invariant(process.env.NEXT_PUBLIC_SALEOR_API_URL, "Missing NEXT_PUBLIC_SALEOR_API_URL env variable");

	if (!searchParams.checkout && !searchParams.order) {
		return null;
	}

	const isOrderConfirmation = !!searchParams.order;

	return (
		<CheckoutPageClient
			saleorApiUrl={process.env.NEXT_PUBLIC_SALEOR_API_URL}
			isOrderConfirmation={isOrderConfirmation}
			channel={channel}
		/>
	);
}
