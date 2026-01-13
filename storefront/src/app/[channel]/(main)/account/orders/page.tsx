import Link from "next/link";
import { CurrentUserOrderListDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { storeConfig } from "@/config";
import { OrdersListClient } from "./OrdersListClient";

export const metadata = {
	title: "My Orders | SportZone",
	description: "View and track your order history.",
};

const statusColors: Record<string, { bg: string; text: string }> = {
	UNFULFILLED: { bg: "bg-yellow-100", text: "text-yellow-700" },
	PARTIALLY_FULFILLED: { bg: "bg-blue-100", text: "text-blue-700" },
	FULFILLED: { bg: "bg-green-100", text: "text-green-700" },
	DELIVERED: { bg: "bg-green-100", text: "text-green-700" },
	CANCELED: { bg: "bg-red-100", text: "text-red-700" },
	RETURNED: { bg: "bg-neutral-100", text: "text-neutral-700" },
};

export default async function OrdersPage({ 
	params,
}: { 
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;
	
	// For now, we fetch more orders to show all - in production you'd use cursor-based pagination
	const { me: user } = await executeGraphQL(CurrentUserOrderListDocument, {
		variables: { first: 100 }, // Fetch more orders
		cache: "no-cache",
	});

	if (!user) {
		return null;
	}

	const allOrders = user.orders?.edges || [];
	const totalCount = user.orders?.totalCount || 0;
	const { branding } = storeConfig;

	// Transform orders data for client component
	const ordersData = allOrders.map(({ node: order }) => ({
		id: order.id,
		number: order.number,
		created: order.created,
		status: order.status || "UNFULFILLED",
		paymentStatus: order.paymentStatus,
		total: order.total,
		lines: order.lines || [],
		invoices: order.invoices || [],
		fulfillments: order.fulfillments || [],
	}));

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Header */}
			<div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
				<div>
					<h1 className="text-2xl font-bold text-neutral-900">My Orders</h1>
					<p className="mt-1 text-neutral-500">
						{totalCount} order{totalCount !== 1 ? "s" : ""} placed
					</p>
				</div>
			</div>

			{/* Orders List */}
			{ordersData.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-neutral-100 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
						<svg className="h-10 w-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
						</svg>
					</div>
					<h2 className="mt-6 text-xl font-semibold text-neutral-900">No orders yet</h2>
					<p className="mt-2 max-w-sm text-neutral-500">
						Looks like you haven&apos;t placed any orders yet. Start shopping to see your orders here!
					</p>
					<Link
						href={`/${channel}/products`}
						className="mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						style={{ backgroundColor: branding.colors.primary }}
					>
						Start Shopping
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
						</svg>
					</Link>
				</div>
			) : (
				<div className="animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
					<OrdersListClient 
						orders={ordersData} 
						channel={channel}
						statusColors={statusColors}
						primaryColor={branding.colors.primary}
					/>
				</div>
			)}
		</div>
	);
}

