import { UserMenu } from "./UserMenu";
import { CurrentUserDocument, type CurrentUserQuery, CurrentUserOrderListDocument, CurrentUserAddressesDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { isAuthOrRscContextError } from "@/lib/auth-errors";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { storeConfig } from "@/config";

export async function UserMenuContainer({ channel }: { channel: string }) {
	let user: CurrentUserQuery["me"] = null;
	try {
		const result = await executeGraphQL(CurrentUserDocument, {
			cache: "no-cache",
		});
		user = result.me;
	} catch (error) {
		if (isAuthOrRscContextError(error)) {
			user = null;
		} else {
			throw error;
		}
	}

	// Fetch config for navbar text
	const dynamicConfig = await fetchStorefrontConfig(channel).catch(() => null);
	const signInText = dynamicConfig?.content?.navbar?.signInText || storeConfig.content?.navbar?.signInText || storeConfig.content?.account?.signInButton || "Sign In";

	if (user) {
		// Fetch counts for orders and addresses
		const [ordersResult, addressesResult] = await Promise.all([
			executeGraphQL(CurrentUserOrderListDocument, {
				variables: { first: 1 }, // Just need the count
				cache: "no-cache",
			}).catch(() => ({ me: { orders: { totalCount: 0 } } })),
			executeGraphQL(CurrentUserAddressesDocument, {
				cache: "no-cache",
			}).catch(() => ({ me: { addresses: [] } })),
		]);

		const ordersCount = ordersResult.me?.orders?.totalCount || 0;
		const addressesCount = addressesResult.me?.addresses?.length || 0;

		return <UserMenu user={user} ordersCount={ordersCount} addressesCount={addressesCount} />;
	}

	return (
		<LinkWithChannel
			href="/login"
			className="nav-action-btn group flex items-center gap-1.5 rounded-full p-2 text-sm font-medium text-neutral-600 transition-all duration-200 hover:bg-neutral-100 hover:text-neutral-900"
		>
			<svg
				className="h-5 w-5 text-neutral-600 transition-colors group-hover:text-neutral-900"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
				/>
			</svg>
			<span className="hidden lg:inline text-xs font-semibold">{signInText}</span>
		</LinkWithChannel>
	);
}
