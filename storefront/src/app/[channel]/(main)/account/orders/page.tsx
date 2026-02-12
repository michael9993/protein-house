import { CurrentUserOrderListDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { OrdersPageContent } from "./OrdersPageContent";

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
	const languageCode = getLanguageCodeForChannel(channel);

	// For now, we fetch more orders to show all - in production you'd use cursor-based pagination
	const { me: user } = await executeGraphQL(CurrentUserOrderListDocument, {
		variables: { first: 100, languageCode }, // Fetch more orders
		cache: "no-cache",
	});

	if (!user) {
		return null;
	}

	const allOrders = user.orders?.edges || [];
	const totalCount = user.orders?.totalCount || 0;

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
		<OrdersPageContent
			channel={channel}
			orders={ordersData}
			totalCount={totalCount}
			statusColors={statusColors}
		/>
	);
}

