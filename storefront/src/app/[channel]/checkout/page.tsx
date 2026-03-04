import { invariant } from "ts-invariant";
import { fetchStorefrontConfig } from "@/lib/storefront-control/fetch-config";
import * as Checkout from "@/lib/checkout";
import { CheckoutV2Loader, OrderConfirmationV2Loader } from "./CheckoutV2Loaders";
import { executeGraphQL } from "@/lib/graphql";
import { GetOrderForConfirmationDocument } from "@/gql/graphql";
import type { CheckoutTextConfig } from "@/lib/checkout/useCheckoutText";

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

	// Fetch config for checkout text translations
	const config = await fetchStorefrontConfig(channel);
	const checkoutText = (config?.content?.checkout ?? undefined) as CheckoutTextConfig | undefined;

	// Order confirmation
	if (searchParams.order) {
		const { order } = await executeGraphQL(GetOrderForConfirmationDocument, {
			variables: {
				id: searchParams.order,
			},
			revalidate: 0,
		});

		if (order) {
			return <OrderConfirmationV2Loader order={order} channel={channel} checkoutText={checkoutText} />;
		}
	}

	// Fetch the checkout once for auto-voucher logic + V2 initial state hydration
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let initialCheckout: any = null;
	if (searchParams.checkout && !searchParams.order) {
		try {
			initialCheckout = await Checkout.find(searchParams.checkout, {
				channel,
				skipOwnershipCheck: true,
			});
			const subtotalAmount = initialCheckout?.subtotalPrice?.gross?.amount ?? 0;
			if (
				initialCheckout &&
				!(initialCheckout as { voucherCode?: string }).voucherCode &&
				initialCheckout.lines?.length
			) {
				await Checkout.applyAutoVouchers(searchParams.checkout, channel, subtotalAmount);
			}
		} catch (e) {
			// Non-fatal: checkout may be invalid or permissions issue
			console.debug("[Checkout Page] Auto-apply vouchers:", e);
		}
	}

	// Checkout flow
	return (
		<CheckoutV2Loader
			channel={channel}
			checkoutId={searchParams.checkout ?? undefined}
			initialCheckout={initialCheckout}
			checkoutText={checkoutText}
		/>
	);
}
