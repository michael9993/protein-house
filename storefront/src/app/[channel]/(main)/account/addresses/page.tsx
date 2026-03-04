import { redirect } from "next/navigation";
import { CurrentUserAddressesDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import type { CheckoutTextConfig } from "@/checkout/hooks/useCheckoutText";
import { AddressesClient } from "./AddressesClient";

export async function generateMetadata({ params }: { params: Promise<{ channel: string }> }) {
	const { channel } = await params;
	const config = await fetchStorefrontConfig(channel);
	const storeName = config.store?.name || "Store";
	const addressesTitle = config.content?.addresses?.myAddresses || "My Addresses";
	return {
		title: `${addressesTitle} | ${storeName}`,
		description: config.content?.addresses?.noAddressesMessage || "Manage your saved addresses for faster checkout.",
		robots: { index: false, follow: false },
	};
}

export default async function AddressesPage({
	params,
}: {
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;

	const { me: user } = await executeGraphQL(CurrentUserAddressesDocument, {
		cache: "no-cache",
	});

	if (!user) {
		redirect(`/${channel}/login?redirect=/${channel}/account/addresses`);
	}

	const addresses = user.addresses || [];
	const defaultShippingId = user.defaultShippingAddress?.id;
	const defaultBillingId = user.defaultBillingAddress?.id;
	const config = await fetchStorefrontConfig(channel);
	const checkoutText = (config?.content?.checkout ?? undefined) as CheckoutTextConfig | undefined;

	return (
		<AddressesClient
			channel={channel}
			addresses={addresses}
			defaultShippingId={defaultShippingId}
			defaultBillingId={defaultBillingId}
			checkoutText={checkoutText}
		/>
	);
}
