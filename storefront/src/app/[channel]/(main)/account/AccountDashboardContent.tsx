"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { useBranding, useDashboardText, useOrdersText, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";

interface Order {
	id: string;
	number?: string | null;
	created: string;
	status?: string | null;
	total: { gross: { amount: number; currency: string } };
}

interface AccountDashboardContentProps {
	channel: string;
	recentOrders: Array<{ node: Order }>;
}

export function AccountDashboardContent({ channel, recentOrders }: AccountDashboardContentProps) {
	const branding = useBranding();
	const dashboardText = useDashboardText();
	const ordersText = useOrdersText();
	const cdStyle = useComponentStyle("account.dashboard");
	const cdClasses = useComponentClasses("account.dashboard");

	const statusLabels: Record<string, string> = {
		UNFULFILLED: ordersText.statusProcessing,
		PARTIALLY_FULFILLED: ordersText.statusPartiallyShipped,
		FULFILLED: ordersText.statusShipped,
		DELIVERED: ordersText.statusDelivered,
		CANCELED: ordersText.statusCanceled,
		RETURNED: ordersText.statusReturned,
	};

	return (
		<div data-cd="account-dashboard" className={`rounded-lg border border-neutral-200 bg-white ${cdClasses}`} style={{
			...buildComponentStyle("account.dashboard", cdStyle),
		}}>
			<div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5">
				<h2 className="text-sm font-semibold text-neutral-900">{dashboardText.recentOrders}</h2>
				<Link
					href={`/${channel}/account/orders`}
					className="text-sm font-medium hover:underline"
					style={{ color: branding.colors.primary }}
				>
					{dashboardText.viewAllButton}
				</Link>
			</div>

			{recentOrders.length === 0 ? (
				<div className="px-5 py-12 text-center">
					<p className="font-medium text-neutral-900">{dashboardText.noOrdersYet}</p>
					<p className="mt-1 text-sm text-neutral-500">
						{dashboardText.whenYouPlaceOrder}
					</p>
					<Link
						href={`/${channel}/products`}
						className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
						style={{ backgroundColor: branding.colors.primary }}
					>
						{dashboardText.startShopping}
					</Link>
				</div>
			) : (
				<div className="divide-y divide-neutral-100">
					{recentOrders.map(({ node: order }) => (
						<Link
							key={order.id}
							href={`/${channel}/account/orders/${order.id}`}
							className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-neutral-50"
						>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-neutral-900">{dashboardText.orderNumberPrefix}{order.number}</p>
								<p className="text-xs text-neutral-500">
									{new Date(order.created).toLocaleDateString("en-US", {
										year: "numeric",
										month: "short",
										day: "numeric",
									})}
								</p>
							</div>
							<div className="text-end">
								<p className="text-sm font-medium text-neutral-900">
									{formatMoney(order.total.gross.amount, order.total.gross.currency)}
								</p>
								<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
									order.status === "FULFILLED"
										? "bg-success-50 text-success-700"
										: order.status === "CANCELED"
										? "bg-error-50 text-error-700"
										: "bg-neutral-100 text-neutral-600"
								}`}>
									{statusLabels[order.status || "UNFULFILLED"] || (order.status || "PENDING").toLowerCase().replace(/_/g, " ")}
								</span>
							</div>
							<span
								className="text-sm font-medium"
								style={{ color: branding.colors.primary }}
							>
								{dashboardText.viewButton} &rarr;
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
