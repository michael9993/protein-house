"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { useBranding, useDashboardText } from "@/providers/StoreConfigProvider";

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

	return (
		<div className="space-y-8 animate-fade-in">
			{/* Recent Orders */}
			<div className="rounded-xl bg-white shadow-sm ring-1 ring-neutral-100 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
				<div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
					<h2 className="text-lg font-semibold text-neutral-900">{dashboardText.recentOrders}</h2>
					<Link
						href={`/${channel}/account/orders`}
						className="text-sm font-medium hover:underline flex items-center gap-1"
						style={{ color: branding.colors.primary }}
					>
						{dashboardText.viewAllButton}
						<span className="rtl-flip-arrow inline-block">→</span>
					</Link>
				</div>
				
				{recentOrders.length === 0 ? (
					<div className="flex flex-col items-center justify-center px-6 py-12 text-center">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
							<svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
							</svg>
						</div>
						<h3 className="mt-4 font-semibold text-neutral-900">{dashboardText.noOrdersYet}</h3>
						<p className="mt-1 text-sm text-neutral-500">
							{dashboardText.whenYouPlaceOrder}
						</p>
						<Link
							href={`/${channel}/products`}
							className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
							style={{ backgroundColor: branding.colors.primary }}
						>
							{dashboardText.startShopping}
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
									<p className="font-medium text-neutral-900">{dashboardText.orderNumberPrefix}{order.number}</p>
									<p className="text-sm text-neutral-500">
										{new Date(order.created).toLocaleDateString("en-US", {
											year: "numeric",
											month: "short",
											day: "numeric",
										})}
									</p>
								</div>
								<div className="text-end">
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
									{dashboardText.viewButton}
								</Link>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
