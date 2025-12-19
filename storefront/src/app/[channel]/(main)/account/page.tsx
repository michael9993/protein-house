import Link from "next/link";
import { CurrentUserOrderListDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { storeConfig } from "@/config";
import { formatMoney } from "@/lib/utils";
import { AccountStatsGrid } from "./AccountStatsGrid";

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
	const { me: user } = await executeGraphQL(CurrentUserOrderListDocument, {
		variables: { first: 100 }, // Get more orders for accurate count
		cache: "no-cache",
	});

	if (!user) {
		return null;
	}

	const totalOrderCount = user.orders?.totalCount || 0;
	const orders = user.orders?.edges || [];
	const recentOrders = orders.slice(0, 3);
	const addressCount = user.addresses?.length || 0;
	const memberSince = user.dateJoined 
		? new Date(user.dateJoined).getFullYear().toString() 
		: new Date().getFullYear().toString();
	const { branding } = storeConfig;

	return (
		<div className="space-y-8">
			{/* Welcome Header */}
			<div className="rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 px-6 py-8 text-white">
				<h1 className="text-2xl font-bold">
					Welcome back, {user.firstName || "there"}! 👋
				</h1>
				<p className="mt-2 text-neutral-300">
					Here&apos;s what&apos;s happening with your account today.
				</p>
			</div>

			{/* Stats Grid */}
			<AccountStatsGrid
				totalOrders={totalOrderCount}
				savedAddresses={addressCount}
				memberSince={memberSince}
			/>

			{/* Quick Actions */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Link
					href={`/${channel}/products`}
					className="group flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md"
				>
					<div 
						className="flex h-12 w-12 items-center justify-center rounded-lg text-white transition-transform group-hover:scale-110"
						style={{ backgroundColor: branding.colors.primary }}
					>
						<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
						</svg>
					</div>
					<div>
						<h3 className="font-semibold text-neutral-900">Continue Shopping</h3>
						<p className="text-sm text-neutral-500">Browse our latest products</p>
					</div>
					<svg className="ml-auto h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</Link>

				<Link
					href={`/${channel}/account/orders`}
					className="group flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md"
				>
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
						<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
						</svg>
					</div>
					<div>
						<h3 className="font-semibold text-neutral-900">Track Orders</h3>
						<p className="text-sm text-neutral-500">View order status & history</p>
					</div>
					<svg className="ml-auto h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</Link>

				<Link
					href={`/${channel}/account/settings`}
					className="group flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md"
				>
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 transition-transform group-hover:scale-110">
						<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<div>
						<h3 className="font-semibold text-neutral-900">Account Settings</h3>
						<p className="text-sm text-neutral-500">Update your profile</p>
					</div>
					<svg className="ml-auto h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</Link>
			</div>

			{/* Recent Orders */}
			<div className="rounded-xl bg-white shadow-sm ring-1 ring-neutral-100">
				<div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
					<h2 className="text-lg font-semibold text-neutral-900">Recent Orders</h2>
					<Link
						href={`/${channel}/account/orders`}
						className="text-sm font-medium hover:underline"
						style={{ color: branding.colors.primary }}
					>
						View All →
					</Link>
				</div>
				
				{recentOrders.length === 0 ? (
					<div className="flex flex-col items-center justify-center px-6 py-12 text-center">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
							<svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
							</svg>
						</div>
						<h3 className="mt-4 font-semibold text-neutral-900">No orders yet</h3>
						<p className="mt-1 text-sm text-neutral-500">
							When you place an order, it will appear here.
						</p>
						<Link
							href={`/${channel}/products`}
							className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
							style={{ backgroundColor: branding.colors.primary }}
						>
							Start Shopping
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
							</svg>
						</Link>
					</div>
				) : (
					<div className="divide-y divide-neutral-100">
						{recentOrders.map(({ node: order }) => (
							<div key={order.id} className="flex items-center gap-4 px-6 py-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100">
									<svg className="h-6 w-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
									</svg>
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-medium text-neutral-900">Order #{order.number}</p>
									<p className="text-sm text-neutral-500">
										{new Date(order.created).toLocaleDateString("en-US", {
											year: "numeric",
											month: "short",
											day: "numeric",
										})}
									</p>
								</div>
								<div className="text-right">
									<p className="font-medium text-neutral-900">
										{formatMoney(order.total.gross.amount, order.total.gross.currency)}
									</p>
								<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
									order.status === "FULFILLED" 
										? "bg-green-100 text-green-700"
										: order.status === "CANCELED"
										? "bg-red-100 text-red-700"
										: "bg-yellow-100 text-yellow-700"
								}`}>
									{(order.status || "PENDING").toLowerCase().replace(/_/g, " ")}
								</span>
								</div>
								<Link
									href={`/${channel}/account/orders/${order.id}`}
									className="text-sm font-medium hover:underline"
									style={{ color: branding.colors.primary }}
								>
									View
								</Link>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

