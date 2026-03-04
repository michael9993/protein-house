import { invariant } from "ts-invariant";
import { fetchStorefrontConfig } from "@/lib/storefront-control/fetch-config";
import * as Checkout from "@/lib/checkout";
import { CheckoutPageClient } from "./CheckoutPageClient";
import { CheckoutV2Loader, OrderConfirmationV2Loader } from "./CheckoutV2Loaders";
import { executeGraphQL } from "@/lib/graphql";
import { GetOrderForConfirmationDocument } from "@/gql/graphql";
import type { CheckoutTextConfig } from "@/lib/checkout/useCheckoutText";

// Feature flag: V2 is now the default checkout. Set NEXT_PUBLIC_CHECKOUT_V2=false to revert.
// The actual dynamic(..., { ssr: false }) calls live in CheckoutV2Loaders.tsx
// (a Client Component), because ssr:false is not allowed in Server Components.
const USE_CHECKOUT_V2 = process.env.NEXT_PUBLIC_CHECKOUT_V2 !== "false";

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

	// Fetch config once for V2 checkout text translations
	const config = USE_CHECKOUT_V2 ? await fetchStorefrontConfig(channel) : null;
	const checkoutText = (config?.content?.checkout ?? undefined) as CheckoutTextConfig | undefined;

	const isOrderConfirmation = !!searchParams.order;

	// V2: order confirmation
	if (USE_CHECKOUT_V2 && searchParams.order) {
		const { order } = await executeGraphQL(GetOrderForConfirmationDocument, {
			variables: {
				id: searchParams.order,
			},
			revalidate: 0,
		});

		if (!order) {
			// Order not found — fall through to legacy (which shows an error state)
		} else {
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

	// V2: checkout flow
	if (USE_CHECKOUT_V2) {
		return (
			<CheckoutV2Loader
				channel={channel}
				checkoutId={searchParams.checkout ?? undefined}
				initialCheckout={initialCheckout}
				checkoutText={checkoutText}
			/>
		);
	}

	// Default: legacy checkout
	return (
		<CheckoutPageClient
			saleorApiUrl={process.env.NEXT_PUBLIC_SALEOR_API_URL}
			isOrderConfirmation={isOrderConfirmation}
			channel={channel}
			checkoutId={searchParams.checkout ?? undefined}
		/>
	);
}
