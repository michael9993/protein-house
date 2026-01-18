import { CurrentUserOrderListDocument, CurrentUserAddressesDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { AccountStatsGrid } from "./AccountStatsGrid";
import { AccountSections } from "./AccountSections";
import { AccountDashboardContent } from "./AccountDashboardContent";
import { AccountWelcomeHeader } from "./AccountWelcomeHeader";

export const metadata = {
	title: "My Account | SportZone",
	description: "Manage your SportZone account, view orders, and update your preferences.",
};

export default async function AccountDashboardPage({ 
	params 
}: { 
	params: Promise<{ channel: string }> 
}) {
	const { channel } = await params;
	const [ordersResult, addressesResult] = await Promise.all([
		executeGraphQL(CurrentUserOrderListDocument, {
			variables: { first: 100 }, // Get more orders for accurate count
			cache: "no-cache",
		}),
		executeGraphQL(CurrentUserAddressesDocument, {
			cache: "no-cache",
		}).catch(() => ({ me: { addresses: [] } })),
	]);

	const user = ordersResult.me;
	if (!user) {
		return null;
	}

	const totalOrderCount = user.orders?.totalCount || 0;
	const orders = user.orders?.edges || [];
	const recentOrders = orders.slice(0, 3);
	const addressCount = addressesResult.me?.addresses?.length || 0;
	const memberSince = user.dateJoined 
		? new Date(user.dateJoined).getFullYear().toString() 
		: new Date().getFullYear().toString();

	return (
		<div className="space-y-8 animate-fade-in">
			{/* Welcome Header - Must be first for proper RTL layout */}
			<AccountWelcomeHeader userFirstName={user.firstName} />

			{/* Stats Grid */}
			<div className="animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
				<AccountStatsGrid
					totalOrders={totalOrderCount}
					savedAddresses={addressCount}
					memberSince={memberSince}
				/>
			</div>

			{/* Account Sections: Orders, Wishlist, Addresses */}
			<AccountSections 
				channel={channel}
				ordersCount={totalOrderCount}
				addressesCount={addressCount}
			/>

			{/* Recent Orders */}
			<AccountDashboardContent
				channel={channel}
				recentOrders={recentOrders}
			/>
		</div>
	);
}

