"use client";

import Link from "next/link";
import { useBranding, useOrdersText, useDashboardText } from "@/providers/StoreConfigProvider";
import { OrdersListClient } from "./OrdersListClient";

interface Order {
	id: string;
	number?: string | null;
	created: string;
	status: string;
	paymentStatus?: string;
	total: { gross: { amount: number; currency: string } };
	lines: any[];
	invoices: any[];
	fulfillments: any[];
}

interface OrdersPageContentProps {
	channel: string;
	orders: Order[];
	totalCount: number;
	statusColors: Record<string, { bg: string; text: string }>;
}

export function OrdersPageContent({ channel, orders, totalCount, statusColors }: OrdersPageContentProps) {
	const branding = useBranding();
	const ordersText = useOrdersText();
	const dashboardText = useDashboardText();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-neutral-900">{ordersText.myOrdersTitle}</h1>
				<p className="mt-1 text-neutral-500">
					{ordersText.ordersPlacedCount.replace("{count}", totalCount.toString())}
				</p>
			</div>

			{/* Orders List */}
			{orders.length === 0 ? (
				<div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 px-6 py-16 text-center">
					<p className="text-lg font-semibold text-neutral-900">{ordersText.noOrders}</p>
					<p className="mt-2 mx-auto max-w-sm text-sm text-neutral-500">
						{ordersText.noOrdersYetMessage}
					</p>
					<Link
						href={`/${channel}/products`}
						className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
						style={{ backgroundColor: branding.colors.primary }}
					>
						{dashboardText.startShopping}
					</Link>
				</div>
			) : (
				<OrdersListClient
					orders={orders}
					channel={channel}
					statusColors={statusColors}
					primaryColor={branding.colors.primary}
				/>
			)}
		</div>
	);
}
