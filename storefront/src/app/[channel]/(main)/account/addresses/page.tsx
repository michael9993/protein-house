import { redirect } from "next/navigation";
import { CurrentUserAddressesDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { AddressesClient } from "./AddressesClient";

export const metadata = {
	title: "My Addresses | SportZone",
	description: "Manage your saved addresses for faster checkout.",
};

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

	return (
		<AddressesClient
			channel={channel}
			addresses={addresses}
			defaultShippingId={defaultShippingId}
			defaultBillingId={defaultBillingId}
		/>
	);
}
