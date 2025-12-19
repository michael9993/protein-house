import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { invariant } from "ts-invariant";
import { OrderByIdDocument, CheckoutAddLinesDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import * as Checkout from "@/lib/checkout";
import { storeConfig } from "@/config";
import { formatMoney } from "@/lib/utils";
import { ReorderButton } from "./ReorderButton";

export const metadata = {
	title: "Order Details | SportZone",
	description: "View your order details and tracking information.",
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
	UNFULFILLED: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Processing" },
	PARTIALLY_FULFILLED: { bg: "bg-blue-100", text: "text-blue-700", label: "Partially Shipped" },
	FULFILLED: { bg: "bg-green-100", text: "text-green-700", label: "Shipped" },
	DELIVERED: { bg: "bg-green-100", text: "text-green-700", label: "Delivered" },
	CANCELED: { bg: "bg-red-100", text: "text-red-700", label: "Canceled" },
	RETURNED: { bg: "bg-neutral-100", text: "text-neutral-700", label: "Returned" },
};

const paymentStatusColors: Record<string, { bg: string; text: string; label: string }> = {
	NOT_CHARGED: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
	PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
	PARTIALLY_CHARGED: { bg: "bg-blue-100", text: "text-blue-700", label: "Partially Paid" },
	FULLY_CHARGED: { bg: "bg-green-100", text: "text-green-700", label: "Paid" },
	PARTIALLY_REFUNDED: { bg: "bg-orange-100", text: "text-orange-700", label: "Partially Refunded" },
	FULLY_REFUNDED: { bg: "bg-neutral-100", text: "text-neutral-700", label: "Refunded" },
	REFUSED: { bg: "bg-red-100", text: "text-red-700", label: "Payment Failed" },
	CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
};

export default async function OrderDetailPage({
	params,
}: {
	params: Promise<{ channel: string; orderId: string }>;
}) {
	const { channel, orderId } = await params;
	const { branding } = storeConfig;

	const { order } = await executeGraphQL(OrderByIdDocument, {
		variables: { id: orderId },
		cache: "no-cache",
	});

	if (!order) {
		notFound();
	}

	const orderStatus = order.status || "UNFULFILLED";
	const paymentStatus = order.paymentStatus || "NOT_CHARGED";
	const statusStyle = statusColors[orderStatus] || statusColors.UNFULFILLED;
	const paymentStyle = paymentStatusColors[paymentStatus] || paymentStatusColors.NOT_CHARGED;

	// Extract order lines for reordering
	const orderLinesForReorder = (order.lines || [])
		.filter((line) => line.variant?.id)
		.map((line) => ({
			variantId: line.variant!.id,
			quantity: line.quantity,
			productName: line.productName || "Unknown Product",
		}));

	// Server action for reordering
	async function reorderItems(formData: FormData): Promise<{ success: boolean; error?: string; itemsAdded?: number }> {
		"use server";

		try {
			const linesJson = formData.get("lines") as string;
			const channelSlug = formData.get("channel") as string;
			const lines = JSON.parse(linesJson) as Array<{ variantId: string; quantity: number; productName: string }>;

			if (lines.length === 0) {
				return { success: false, error: "No items to reorder" };
			}

			if (!channelSlug) {
				return { success: false, error: "Channel not specified" };
			}

			// Get or create checkout
			const checkout = await Checkout.findOrCreate({
				checkoutId: await Checkout.getIdFromCookies(channelSlug),
				channel: channelSlug,
			});
			invariant(checkout, "Failed to create checkout");

			await Checkout.saveIdToCookie(channelSlug, checkout.id);

			// Format lines for the mutation
			const checkoutLines = lines.map((line) => ({
				variantId: line.variantId,
				quantity: line.quantity,
			}));

			// Add all lines at once
			const { checkoutLinesAdd } = await executeGraphQL(CheckoutAddLinesDocument, {
				variables: {
					id: checkout.id,
					lines: checkoutLines,
				},
				cache: "no-cache",
			});

			if (checkoutLinesAdd?.errors && checkoutLinesAdd.errors.length > 0) {
				const errorMessage = checkoutLinesAdd.errors
					.map((e) => e.message)
					.filter(Boolean)
					.join(", ");
				return { success: false, error: errorMessage || "Failed to add items to cart" };
			}

			revalidatePath("/cart");
			
			const itemsAdded = lines.reduce((sum, line) => sum + line.quantity, 0);
			return { success: true, itemsAdded };
		} catch (error) {
			console.error("Reorder error:", error);
			return { success: false, error: "An unexpected error occurred" };
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link
						href={`/${channel}/account/orders`}
						className="mb-2 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
						Back to Orders
					</Link>
					<h1 className="text-2xl font-bold text-neutral-900">Order #{order.number}</h1>
					<p className="mt-1 text-neutral-500">
						Placed on{" "}
						{new Date(order.created).toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
						{statusStyle.label}
					</span>
					<span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${paymentStyle.bg} ${paymentStyle.text}`}>
						{paymentStyle.label}
					</span>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Order Items */}
				<div className="lg:col-span-2">
					<div className="rounded-xl bg-white shadow-sm ring-1 ring-neutral-100">
						<div className="border-b border-neutral-100 px-6 py-4">
							<h2 className="font-semibold text-neutral-900">Order Items ({order.lines?.length || 0})</h2>
						</div>
						<div className="divide-y divide-neutral-100">
							{order.lines?.map((line) => (
								<div key={line.id} className="flex gap-4 p-6">
									<div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
										{line.thumbnail?.url ? (
											<img
												src={line.thumbnail.url}
												alt={line.thumbnail.alt || line.productName}
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center text-neutral-400">
												<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
											</div>
										)}
									</div>
									<div className="flex flex-1 flex-col">
										<div className="flex justify-between">
											<div>
												<h3 className="font-medium text-neutral-900">{line.productName}</h3>
												{line.variantName && (
													<p className="mt-0.5 text-sm text-neutral-500">{line.variantName}</p>
												)}
											</div>
											<p className="font-medium text-neutral-900">
												{formatMoney(line.totalPrice?.gross?.amount || 0, line.totalPrice?.gross?.currency || "USD")}
											</p>
										</div>
										<div className="mt-auto flex items-center justify-between pt-2">
											<p className="text-sm text-neutral-500">
												Qty: {line.quantity} × {formatMoney(line.unitPrice?.gross?.amount || 0, line.unitPrice?.gross?.currency || "USD")}
											</p>
											{line.variant?.product?.slug && (
												<Link
													href={`/${channel}/products/${line.variant.product.slug}`}
													className="text-sm font-medium hover:underline"
													style={{ color: branding.colors.primary }}
												>
													View Product
												</Link>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Order Summary & Details */}
				<div className="space-y-6">
					{/* Order Summary */}
					<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
						<h2 className="mb-4 font-semibold text-neutral-900">Order Summary</h2>
						<div className="space-y-3 text-sm">
							<div className="flex justify-between">
								<span className="text-neutral-600">Subtotal</span>
								<span className="font-medium text-neutral-900">
									{formatMoney(order.subtotal?.gross?.amount || 0, order.subtotal?.gross?.currency || "USD")}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-neutral-600">Shipping</span>
								<span className="font-medium text-neutral-900">
									{order.shippingPrice?.gross?.amount 
										? formatMoney(order.shippingPrice.gross.amount, order.shippingPrice.gross.currency)
										: "Free"}
								</span>
							</div>
							<div className="border-t border-neutral-200 pt-3">
								<div className="flex justify-between">
									<span className="font-semibold text-neutral-900">Total</span>
									<span className="font-semibold text-neutral-900">
										{formatMoney(order.total?.gross?.amount || 0, order.total?.gross?.currency || "USD")}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Shipping Address */}
					{order.shippingAddress && (
						<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
							<div className="mb-4 flex items-center gap-2">
								<svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
								</svg>
								<h2 className="font-semibold text-neutral-900">Shipping Address</h2>
							</div>
							<div className="text-sm text-neutral-600">
								<p className="font-medium text-neutral-900">
									{order.shippingAddress.firstName} {order.shippingAddress.lastName}
								</p>
								<p>{order.shippingAddress.streetAddress1}</p>
								{order.shippingAddress.streetAddress2 && (
									<p>{order.shippingAddress.streetAddress2}</p>
								)}
								<p>
									{order.shippingAddress.city}, {order.shippingAddress.postalCode}
								</p>
								<p>{order.shippingAddress.country?.country}</p>
								{order.shippingAddress.phone && (
									<p className="mt-2">{order.shippingAddress.phone}</p>
								)}
							</div>
						</div>
					)}

					{/* Billing Address */}
					{order.billingAddress && (
						<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
							<div className="mb-4 flex items-center gap-2">
								<svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
								</svg>
								<h2 className="font-semibold text-neutral-900">Billing Address</h2>
							</div>
							<div className="text-sm text-neutral-600">
								<p className="font-medium text-neutral-900">
									{order.billingAddress.firstName} {order.billingAddress.lastName}
								</p>
								<p>{order.billingAddress.streetAddress1}</p>
								{order.billingAddress.streetAddress2 && (
									<p>{order.billingAddress.streetAddress2}</p>
								)}
								<p>
									{order.billingAddress.city}, {order.billingAddress.postalCode}
								</p>
								<p>{order.billingAddress.country?.country}</p>
							</div>
						</div>
					)}

					{/* Tracking Information */}
					{order.fulfillments && order.fulfillments.length > 0 && (
						<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
							<div className="mb-4 flex items-center gap-2">
								<svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
								</svg>
								<h2 className="font-semibold text-neutral-900">Shipment Tracking</h2>
							</div>
							<div className="space-y-3">
								{order.fulfillments.map((fulfillment) => (
									<div key={fulfillment.id} className="rounded-lg bg-neutral-50 p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-xs font-medium uppercase text-neutral-500">Status</p>
												<p className="font-medium text-neutral-900">
													{fulfillment.status.toLowerCase().replace(/_/g, " ")}
												</p>
											</div>
											{fulfillment.trackingNumber && (
												<div className="text-right">
													<p className="text-xs font-medium uppercase text-neutral-500">Tracking #</p>
													<p className="font-mono font-medium text-neutral-900">
														{fulfillment.trackingNumber}
													</p>
												</div>
											)}
										</div>
										{fulfillment.trackingNumber && (
											<div className="mt-3 space-y-2">
												{/* Universal Trackers */}
												<div className="flex flex-wrap gap-2">
													<a
														href={`https://t.17track.net/en#nums=${fulfillment.trackingNumber}`}
														target="_blank"
														rel="noopener noreferrer"
														className="rounded-md border-2 border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
													>
														17Track
													</a>
													<a
														href={`https://parcelsapp.com/en/tracking/${fulfillment.trackingNumber}`}
														target="_blank"
														rel="noopener noreferrer"
														className="rounded-md border-2 border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
													>
														Parcelsapp
													</a>
													<a
														href={`https://track.aftership.com/${fulfillment.trackingNumber}`}
														target="_blank"
														rel="noopener noreferrer"
														className="rounded-md border-2 border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
													>
														AfterShip
													</a>
												</div>
												{/* Direct Carrier Links */}
												<div className="flex flex-wrap gap-2">
													<a
														href={`https://www.ups.com/track?tracknum=${fulfillment.trackingNumber}`}
														target="_blank"
														rel="noopener noreferrer"
														className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
													>
														UPS
													</a>
													<a
														href={`https://www.fedex.com/fedextrack/?trknbr=${fulfillment.trackingNumber}`}
														target="_blank"
														rel="noopener noreferrer"
														className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
													>
														FedEx
													</a>
													<a
														href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${fulfillment.trackingNumber}`}
														target="_blank"
														rel="noopener noreferrer"
														className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
													>
														USPS
													</a>
													<a
														href={`https://www.dhl.com/en/express/tracking.html?AWB=${fulfillment.trackingNumber}`}
														target="_blank"
														rel="noopener noreferrer"
														className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
													>
														DHL
													</a>
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Invoice */}
					{order.invoices && order.invoices.length > 0 && (
						<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
							<div className="mb-4 flex items-center gap-2">
								<svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
								</svg>
								<h2 className="font-semibold text-neutral-900">Invoice</h2>
							</div>
							<div className="space-y-2">
								{order.invoices.map((invoice) => (
									<div key={invoice.id} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3">
										<div>
											<p className="text-sm font-medium text-neutral-900">
												Invoice #{invoice.number || invoice.id.slice(-8)}
											</p>
											<p className="text-xs text-neutral-500">
												{new Date(invoice.createdAt).toLocaleDateString("en-US", {
													year: "numeric",
													month: "short",
													day: "numeric",
												})}
											</p>
										</div>
										{invoice.url && invoice.status === "SUCCESS" ? (
											<a
												href={invoice.url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white"
												style={{ backgroundColor: branding.colors.primary }}
											>
												<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
												</svg>
												Download
											</a>
										) : (
											<span className="text-xs text-neutral-500">
												{invoice.status === "PENDING" ? "Generating..." : "Unavailable"}
											</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Reorder Action */}
					<div id="reorder" className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
						<h2 className="mb-4 font-semibold text-neutral-900">Quick Actions</h2>
						{orderLinesForReorder.length > 0 && (
							<ReorderButton
								channel={channel}
								orderLines={orderLinesForReorder}
								reorderAction={reorderItems}
							/>
						)}
					</div>

					{/* Help */}
					<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
						<h2 className="mb-4 font-semibold text-neutral-900">Need Help?</h2>
						<div className="space-y-3">
							<Link
								href={`/${channel}/contact`}
								className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
							>
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
								</svg>
								Contact Support
							</Link>
							<Link
								href={`/${channel}/faq`}
								className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
							>
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
								</svg>
								View FAQs
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

