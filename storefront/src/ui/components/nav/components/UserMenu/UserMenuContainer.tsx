import { UserMenu } from "./UserMenu";
import { CurrentUserDocument, CurrentUserOrderListDocument, CurrentUserAddressesDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

export async function UserMenuContainer() {
	const { me: user } = await executeGraphQL(CurrentUserDocument, {
		cache: "no-cache",
	});

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
		<div className="flex items-center gap-2">
			{/* Login Link */}
			<LinkWithChannel 
				href="/login" 
				className="group flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition-all duration-200 hover:bg-neutral-100 hover:text-neutral-900"
			>
				<svg 
					className="h-5 w-5 text-neutral-500 transition-colors group-hover:text-neutral-700" 
					fill="none" 
					viewBox="0 0 24 24" 
					stroke="currentColor"
					strokeWidth={1.5}
				>
					<path 
						strokeLinecap="round" 
						strokeLinejoin="round" 
						d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" 
					/>
				</svg>
				<span className="hidden lg:inline">Sign In</span>
			</LinkWithChannel>
		</div>
	);
}
