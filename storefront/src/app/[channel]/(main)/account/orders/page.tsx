import { CurrentUserOrderListDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { OrdersPageContent } from "./OrdersPageContent";

export async function generateMetadata({ params }: { params: Promise<{ channel: string }> }) {
	const { channel } = await params;
	const config = await fetchStorefrontConfig(channel);
	const storeName = config.store?.name || "Store";
	const ordersTitle = config.content?.orders?.myOrdersTitle || "My Orders";
	return {
		title: `${ordersTitle} | ${storeName}`,
		description: config.content?.orders?.noOrdersMessage || "View and track your order history.",
		robots: { index: false, follow: false },
	};
}

const statusColors: Record<string, { bg: string; text: string }> = {
	UNFULFILLED: { bg: "bg-warning-100", text: "text-warning-700" },
	PARTIALLY_FULFILLED: { bg: "bg-info-100", text: "text-info-700" },
	FULFILLED: { bg: "bg-success-100", text: "text-success-700" },
	DELIVERED: { bg: "bg-success-100", text: "text-success-700" },
	CANCELED: { bg: "bg-error-100", text: "text-error-700" },
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

