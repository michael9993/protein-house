"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/utils";

interface OrderLine {
	id: string;
	productName: string;
	variantName?: string | null;
	quantity: number;
	thumbnail?: { url: string; alt?: string | null } | null;
	variant?: {
		id: string;
		product?: {
			slug: string;
		} | null;
	} | null;
}

interface Invoice {
	id: string;
	number?: string | null;
	createdAt: string;
	url?: string | null;
	status: string;
}

interface Fulfillment {
	id: string;
	status: string;
	created: string;
	trackingNumber?: string | null;
}

interface Order {
	id: string;
	number?: string | null;
	created: string;
	status: string;
	paymentStatus?: string;
	total: { gross: { amount: number; currency: string } };
	lines: OrderLine[];
	invoices: Invoice[];
	fulfillments: Fulfillment[];
}

interface OrdersListClientProps {
	orders: Order[];
	channel: string;
	statusColors: Record<string, { bg: string; text: string }>;
	primaryColor: string;
}

// Toast notification component
function Toast({ 
	message, 
	type, 
	onClose 
}: { 
	message: string; 
	type: "info" | "success" | "error" | "warning"; 
	onClose: () => void;
}) {
	useEffect(() => {
		const timer = setTimeout(onClose, 5000);
		return () => clearTimeout(timer);
	}, [onClose]);

	const styles = {
		info: "bg-blue-50 text-blue-800 border-blue-200",
		success: "bg-green-50 text-green-800 border-green-200",
		error: "bg-red-50 text-red-800 border-red-200",
		warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
	};

	const icons = {
		info: (
			<svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		),
		success: (
			<svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		),
		error: (
			<svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		),
		warning: (
			<svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
		),
	};

	return (
		<div className={`fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-lg border p-4 shadow-lg ${styles[type]}`}>
			{icons[type]}
			<div className="flex-1">
				<p className="text-sm font-medium">{message}</p>
			</div>
			<button onClick={onClose} className="text-current opacity-70 hover:opacity-100">
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	);
}

// Invoice modal component
function InvoiceModal({
	order,
	onClose,
	primaryColor,
	onRequestInvoice,
	isRequesting,
}: {
	order: Order;
	onClose: () => void;
	primaryColor: string;
	onRequestInvoice: () => void;
	isRequesting: boolean;
}) {
	const isPaid = order.paymentStatus === "FULLY_CHARGED" || order.paymentStatus === "PARTIALLY_CHARGED";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-md rounded-xl bg-white shadow-xl">
				<div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
					<h3 className="text-lg font-semibold text-neutral-900">Invoice</h3>
					<button
						onClick={onClose}
						className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div className="p-6">
					<div className="mb-4 rounded-lg bg-neutral-50 p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-medium uppercase text-neutral-500">Order</p>
								<p className="font-semibold text-neutral-900">#{order.number}</p>
							</div>
							<div className="text-right">
								<p className="text-xs font-medium uppercase text-neutral-500">Total</p>
								<p className="font-semibold text-neutral-900">
									{formatMoney(order.total.gross.amount, order.total.gross.currency)}
								</p>
							</div>
						</div>
					</div>

					{isPaid ? (
						// Paid order - offer to generate and download invoice
						<div className="space-y-4">
							<div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
								<svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<div>
									<p className="font-medium text-green-800">Invoice Available</p>
									<p className="text-sm text-green-700">
										Click below to generate and download your invoice as a PDF.
									</p>
								</div>
							</div>
							<button
								onClick={onRequestInvoice}
								disabled={isRequesting}
								className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
								style={{ backgroundColor: primaryColor }}
							>
								{isRequesting ? (
									<>
										<svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
										</svg>
										Generating Invoice...
									</>
								) : (
									<>
										<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
										</svg>
										Generate &amp; Download Invoice
									</>
								)}
							</button>
							<p className="text-center text-xs text-neutral-500">
								Your invoice will be generated instantly and downloaded as a PDF.
							</p>
						</div>
					) : (
						// Unpaid/unconfirmed order
						<div className="space-y-4">
							<div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
								<svg className="mt-0.5 h-6 w-6 flex-shrink-0 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
								</svg>
								<div>
									<p className="font-medium text-neutral-800">Invoice Pending</p>
									<p className="mt-1 text-sm text-neutral-600">
										Invoices are generated once payment is completed and will be sent to your email address. 
										You can also download your invoice from this page once our staff confirms your order.
									</p>
								</div>
							</div>
							<p className="text-center text-xs text-neutral-500">
								Need your invoice sooner? Please contact our support team.
							</p>
						</div>
					)}
				</div>

				<div className="border-t border-neutral-100 px-6 py-4">
					<button
						onClick={onClose}
						className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

export function OrdersListClient({ orders, channel, statusColors, primaryColor }: OrdersListClientProps) {
	const router = useRouter();
	const [, startTransition] = useTransition();
	const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
	const [showAllOrders, setShowAllOrders] = useState(false);
	const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
	const [invoiceModalOrder, setInvoiceModalOrder] = useState<Order | null>(null);
	const [isRequestingInvoice, setIsRequestingInvoice] = useState(false);
	const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" | "warning" } | null>(null);

	// Show first 10 orders, or all if showAllOrders is true
	const displayedOrders = showAllOrders ? orders : orders.slice(0, 10);
	const hasMoreOrders = orders.length > 10;

	const showToast = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
		setToast({ message, type });
	};

	const handleViewInvoice = async (order: Order) => {
		// Always show the invoice modal - we'll generate the PDF on demand
		// This ensures the PDF is actually created even if an invoice record exists
		setInvoiceModalOrder(order);
	};

	const handleRequestInvoice = async () => {
		if (!invoiceModalOrder) return;
		
		setIsRequestingInvoice(true);
		try {
			// Request invoice generation via API
			const response = await fetch(`/api/invoice/request`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId: invoiceModalOrder.id }),
			});
			
			const data = await response.json() as { success?: boolean; invoice?: { url?: string }; pending?: boolean; message?: string };
			
			if (data.success) {
				if (data.invoice?.url) {
					// Invoice is ready - download it immediately
					showToast("Invoice generated successfully! Opening download...", "success");
					window.open(data.invoice.url, "_blank");
					setInvoiceModalOrder(null);
				} else if (data.pending) {
					// Invoice is being generated - poll for completion
					showToast(data.message || "Invoice is being generated...", "info");
					pollForInvoice(invoiceModalOrder.id);
				} else {
					showToast(data.message || "Invoice request submitted successfully.", "success");
					setInvoiceModalOrder(null);
				}
			} else {
				showToast(data.message || "Unable to generate invoice. Please contact support.", "error");
			}
		} catch (error) {
			showToast("Unable to generate invoice. Please try again later or contact support.", "error");
		} finally {
			setIsRequestingInvoice(false);
		}
	};

	// Poll for invoice completion
	const pollForInvoice = async (orderId: string, attempts = 0) => {
		if (attempts >= 10) {
			showToast("Invoice generation is taking longer than expected. Please refresh the page.", "warning");
			setInvoiceModalOrder(null);
			return;
		}

		await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

		try {
			const response = await fetch(`/api/invoice/request?orderId=${orderId}`);
			const data = await response.json() as { success?: boolean; invoice?: { url?: string }; pending?: boolean; message?: string };

			if (data.success && data.invoice?.url) {
				showToast("Invoice ready! Opening download...", "success");
				window.open(data.invoice.url, "_blank");
				setInvoiceModalOrder(null);
				router.refresh(); // Refresh to update the UI
			} else if (data.pending) {
				// Still generating, continue polling
				pollForInvoice(orderId, attempts + 1);
			} else {
				showToast("Invoice generation completed. Please refresh the page to see it.", "info");
				setInvoiceModalOrder(null);
			}
		} catch (error) {
			console.error("Invoice poll error:", error);
			pollForInvoice(orderId, attempts + 1);
		}
	};

	const handleTrackPackage = (order: Order) => {
		const fulfillment = order.fulfillments?.find((f) => f.trackingNumber);
		
		if (fulfillment?.trackingNumber) {
			setTrackingModalOrder(order);
		} else {
			showToast("Tracking information is not yet available for this order. Please check back later.", "info");
		}
	};

	const handleBuyAgain = async (order: Order) => {
		setLoadingOrderId(order.id);
		// Navigate to order details page where the reorder functionality exists
		startTransition(() => {
			router.push(`/${channel}/account/orders/${order.id}#reorder`);
		});
	};

	return (
		<>
			<div className="space-y-4">
				{displayedOrders.map((order) => {
					const orderStatus = order.status;
					const statusStyle = statusColors[orderStatus] || statusColors.UNFULFILLED;
					const lines = order.lines.slice(0, 3);
					const remainingCount = order.lines.length - 3;
					const hasFulfillment = order.fulfillments?.some((f) => f.trackingNumber);
					const hasInvoice = order.invoices?.some((inv) => inv.url);

					return (
						<div
							key={order.id}
							className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-100"
						>
							{/* Order Header */}
							<div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 bg-neutral-50 px-6 py-4">
								<div className="flex flex-wrap items-center gap-6">
									<div>
										<p className="text-xs font-medium uppercase text-neutral-500">Order Number</p>
										<p className="font-semibold text-neutral-900">#{order.number}</p>
									</div>
									<div>
										<p className="text-xs font-medium uppercase text-neutral-500">Date Placed</p>
										<p className="font-medium text-neutral-700">
											{new Date(order.created).toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</p>
									</div>
									<div>
										<p className="text-xs font-medium uppercase text-neutral-500">Total</p>
										<p className="font-semibold text-neutral-900">
											{formatMoney(order.total.gross.amount, order.total.gross.currency)}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
										{orderStatus.toLowerCase().replace(/_/g, " ")}
									</span>
									<Link
										href={`/${channel}/account/orders/${order.id}`}
										className="text-sm font-medium hover:underline"
										style={{ color: primaryColor }}
									>
										View Details →
									</Link>
								</div>
							</div>

							{/* Order Items Preview */}
							<div className="px-6 py-4">
								<div className="flex flex-wrap items-center gap-4">
									{lines.map((line) => (
										<div key={line.id} className="flex items-center gap-3">
											<div className="h-16 w-16 overflow-hidden rounded-lg bg-neutral-100">
												{line.thumbnail?.url ? (
													<img
														src={line.thumbnail.url}
														alt={line.thumbnail.alt || line.productName}
														className="h-full w-full object-cover"
													/>
												) : (
													<div className="flex h-full w-full items-center justify-center text-neutral-400">
														<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
														</svg>
													</div>
												)}
											</div>
											<div className="min-w-0">
												<p className="truncate text-sm font-medium text-neutral-900">
													{line.productName}
												</p>
												<p className="text-xs text-neutral-500">
													Qty: {line.quantity}
												</p>
											</div>
										</div>
									))}
									{remainingCount > 0 && (
										<div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-100 text-sm font-medium text-neutral-600">
											+{remainingCount}
										</div>
									)}
								</div>
							</div>

							{/* Order Actions */}
							<div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 bg-neutral-50 px-6 py-3">
								<div className="flex items-center gap-4 text-sm">
									{hasFulfillment && (
										<>
											<button 
												onClick={() => handleTrackPackage(order)}
												className="flex items-center gap-1.5 font-medium text-neutral-600 hover:text-neutral-900"
											>
												<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
												</svg>
												Track Package
											</button>
											<span className="text-neutral-300">|</span>
										</>
									)}
									<button 
										onClick={() => handleViewInvoice(order)}
										className="flex items-center gap-1.5 font-medium text-neutral-600 hover:text-neutral-900"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											{hasInvoice ? (
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
											) : (
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
											)}
										</svg>
										{hasInvoice ? "Download Invoice" : "Get Invoice"}
									</button>
								</div>
								{(orderStatus === "FULFILLED" || orderStatus === "DELIVERED") && (
									<button 
										onClick={() => handleBuyAgain(order)}
										disabled={loadingOrderId === order.id}
										className="flex items-center gap-1.5 text-sm font-medium hover:underline disabled:opacity-50"
										style={{ color: primaryColor }}
									>
										{loadingOrderId === order.id ? (
											<>
												<svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
												</svg>
												Loading...
											</>
										) : (
											<>
												<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
												</svg>
												Buy Again
											</>
										)}
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Load More Button */}
			{hasMoreOrders && !showAllOrders && (
				<div className="mt-6 text-center">
					<button
						onClick={() => setShowAllOrders(true)}
						className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
					>
						Show All Orders ({orders.length})
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>
				</div>
			)}

			{showAllOrders && hasMoreOrders && (
				<div className="mt-6 text-center">
					<button
						onClick={() => setShowAllOrders(false)}
						className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
					>
						Show Less
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
						</svg>
					</button>
				</div>
			)}

			{/* Tracking Modal */}
			{trackingModalOrder && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="text-lg font-semibold text-neutral-900">Track Package</h3>
							<button
								onClick={() => setTrackingModalOrder(null)}
								className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
							>
								<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						
						<div className="mb-4 rounded-lg bg-neutral-50 p-4">
							<p className="text-sm text-neutral-600">Order #{trackingModalOrder.number}</p>
							{trackingModalOrder.fulfillments?.map((fulfillment) => (
								fulfillment.trackingNumber && (
									<div key={fulfillment.id} className="mt-3">
										<p className="text-xs font-medium uppercase text-neutral-500">Tracking Number</p>
										<p className="mt-1 font-mono text-lg font-semibold text-neutral-900">
											{fulfillment.trackingNumber}
										</p>
										<p className="mt-1 text-xs text-neutral-500">
											Status: {fulfillment.status.toLowerCase().replace(/_/g, " ")}
										</p>
									</div>
								)
							))}
						</div>

						<div className="space-y-4">
							<p className="text-sm text-neutral-600">
								Track your package using any of the services below:
							</p>
							
							{/* Universal Trackers */}
							<div>
								<p className="mb-2 text-xs font-semibold uppercase text-neutral-500">Universal Trackers (Recommended)</p>
								<div className="flex flex-wrap gap-2">
									{CARRIER_CONFIGS.filter(c => c.isUniversal).map((carrier) => (
										<a
											key={carrier.name}
											href={carrier.url(trackingModalOrder.fulfillments?.[0]?.trackingNumber || "")}
											target="_blank"
											rel="noopener noreferrer"
											className="rounded-lg border-2 border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
										>
											{carrier.name}
										</a>
									))}
								</div>
							</div>

							{/* Direct Carrier Links */}
							<div>
								<p className="mb-2 text-xs font-semibold uppercase text-neutral-500">Direct Carrier Links</p>
								<div className="flex flex-wrap gap-2">
									{CARRIER_CONFIGS.filter(c => !c.isUniversal).map((carrier) => (
										<a
											key={carrier.name}
											href={carrier.url(trackingModalOrder.fulfillments?.[0]?.trackingNumber || "")}
											target="_blank"
											rel="noopener noreferrer"
											className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
										>
											{carrier.name}
										</a>
									))}
								</div>
							</div>
						</div>

						<button
							onClick={() => setTrackingModalOrder(null)}
							className="mt-6 w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
						>
							Close
						</button>
					</div>
				</div>
			)}

			{/* Invoice Modal */}
			{invoiceModalOrder && (
				<InvoiceModal
					order={invoiceModalOrder}
					onClose={() => setInvoiceModalOrder(null)}
					primaryColor={primaryColor}
					onRequestInvoice={handleRequestInvoice}
					isRequesting={isRequestingInvoice}
				/>
			)}

			{/* Toast Notification */}
			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={() => setToast(null)}
				/>
			)}
		</>
	);
}

// Carrier tracking URL configurations
const CARRIER_CONFIGS: Array<{
	name: string;
	url: (trackingNumber: string) => string;
	logo?: string;
	isUniversal?: boolean;
}> = [
	// Universal Trackers (work with any carrier)
	{
		name: "17Track",
		url: (t) => `https://t.17track.net/en#nums=${t}`,
		isUniversal: true,
	},
	{
		name: "Parcelsapp",
		url: (t) => `https://parcelsapp.com/en/tracking/${t}`,
		isUniversal: true,
	},
	{
		name: "AfterShip",
		url: (t) => `https://track.aftership.com/${t}`,
		isUniversal: true,
	},
	// Major US Carriers
	{
		name: "UPS",
		url: (t) => `https://www.ups.com/track?tracknum=${t}`,
	},
	{
		name: "FedEx",
		url: (t) => `https://www.fedex.com/fedextrack/?trknbr=${t}`,
	},
	{
		name: "USPS",
		url: (t) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`,
	},
	{
		name: "DHL",
		url: (t) => `https://www.dhl.com/en/express/tracking.html?AWB=${t}`,
	},
	// International Carriers
	{
		name: "Canada Post",
		url: (t) => `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${t}`,
	},
	{
		name: "Royal Mail",
		url: (t) => `https://www.royalmail.com/track-your-item#/tracking-results/${t}`,
	},
	{
		name: "Australia Post",
		url: (t) => `https://auspost.com.au/mypost/track/#/details/${t}`,
	},
	{
		name: "China Post",
		url: (t) => `https://t.17track.net/en#nums=${t}`,
	},
];

