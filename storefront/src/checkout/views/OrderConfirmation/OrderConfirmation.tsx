import { Suspense, useCallback, useRef } from "react";
import { Summary, SummarySkeleton } from "@/checkout/sections/Summary";
import { OrderInfo } from "@/checkout/sections/OrderInfo";
import { useOrder } from "@/checkout/hooks/useOrder";
import { useAutoCartCleanup } from "@/checkout/hooks/useCartCleanup";

export const OrderConfirmation = () => {
	const { order } = useOrder();
	const printRef = useRef<HTMLDivElement>(null);

	// Automatically clean up purchased items from the original cart
	useAutoCartCleanup(order?.id);

	const handlePrint = useCallback(() => {
		// Trigger browser print
		window.print();
	}, []);

	// Format date for display (order date not available in OrderFragment)
	const orderDate = '';

	return (
		<>
			{/* Print-only receipt header */}
			<div className="hidden print:block print:mb-8">
				<div className="border-b-2 pb-4 mb-4" style={{ borderColor: "var(--store-text)" }}>
					<h1 className="text-2xl font-bold" style={{ color: "var(--store-text)" }}>Order Receipt</h1>
					<p className="text-sm" style={{ color: "var(--store-text-muted)" }}>Order #{order.number}</p>
					<p className="text-sm" style={{ color: "var(--store-text-muted)" }}>{orderDate}</p>
				</div>
			</div>

			<main ref={printRef} className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 print:block">
				{/* Order Confirmation Details */}
				<div className="space-y-8 print:space-y-4">
					{/* Success Header - Hidden in print */}
					<header 
						className="state-success rounded-xl border p-6 print:hidden"
						style={{ 
							background: "linear-gradient(to right, var(--store-success-bg), var(--store-success-light))"
						}}
					>
						<div className="flex items-start gap-4">
							<div 
								className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
								style={{ backgroundColor: "var(--store-success-light)" }}
							>
								<svg className="h-6 w-6" style={{ color: "var(--store-success)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium" style={{ color: "var(--store-success-text)" }} data-testid="orderConfrmationTitle">
									Order Confirmed
								</p>
								<h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--store-text)" }}>
									Order #{order.number}
								</h1>
								<p className="mt-3 text-sm" style={{ color: "var(--store-text-muted)" }}>
									Thank you for your order! We&apos;ve received it and will notify you when your package ships.
								</p>
								<div 
									className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
									style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
								>
									<svg className="h-4 w-4" style={{ color: "var(--store-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<span style={{ color: "var(--store-text-muted)" }}>Confirmation sent to: </span>
									<span className="font-medium" style={{ color: "var(--store-text)" }}>{order.userEmail}</span>
								</div>
							</div>
						</div>
					</header>

					{/* Print-only order summary header */}
					<div className="hidden print:block print:border print:rounded print:p-4 print:mb-4" style={{ borderColor: "var(--store-neutral-300)" }}>
						<div className="flex justify-between items-start">
							<div>
								<p className="font-medium">Customer:</p>
								<p>{order.userEmail}</p>
							</div>
							<div className="text-right">
								<p className="font-medium">Order Date:</p>
								<p>{orderDate}</p>
							</div>
						</div>
					</div>

					{/* What's Next - Hidden in print */}
					<div 
						className="rounded-xl border p-6 print:hidden"
						style={{ 
							backgroundColor: "var(--store-bg)",
							borderColor: "var(--store-neutral-200)"
						}}
					>
						<h2 className="mb-4 flex items-center gap-2 font-semibold" style={{ color: "var(--store-text)" }}>
							<svg className="h-5 w-5" style={{ color: "var(--store-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
							</svg>
							What&apos;s Next?
						</h2>
						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<div 
									className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium"
									style={{ backgroundColor: "var(--store-primary-light)", color: "var(--store-primary)" }}
								>
									1
								</div>
								<div>
									<p className="font-medium" style={{ color: "var(--store-text)" }}>Order Processing</p>
									<p className="text-sm" style={{ color: "var(--store-text-muted)" }}>We&apos;re preparing your order for shipment.</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div 
									className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium"
									style={{ backgroundColor: "var(--store-neutral-100)", color: "var(--store-neutral-600)" }}
								>
									2
								</div>
								<div>
									<p className="font-medium" style={{ color: "var(--store-text)" }}>Shipping Notification</p>
									<p className="text-sm" style={{ color: "var(--store-text-muted)" }}>You&apos;ll receive tracking info when shipped.</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div 
									className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium"
									style={{ backgroundColor: "var(--store-neutral-100)", color: "var(--store-neutral-600)" }}
								>
									3
								</div>
								<div>
									<p className="font-medium" style={{ color: "var(--store-text)" }}>Delivery</p>
									<p className="text-sm" style={{ color: "var(--store-text-muted)" }}>Your order will arrive at your doorstep!</p>
								</div>
							</div>
						</div>
					</div>

					{/* Order Details */}
					<OrderInfo />

					{/* Actions - Hidden in print */}
					<div className="flex flex-wrap gap-3 print:hidden">
						<a
							href="/"
							className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
							style={{ backgroundColor: "var(--store-primary)" }}
						>
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
							</svg>
							Continue Shopping
						</a>
						<button
							onClick={handlePrint}
							type="button"
							className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
							style={{ 
								borderColor: "var(--store-neutral-300)",
								backgroundColor: "var(--store-bg)",
								color: "var(--store-text)"
							}}
						>
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
							</svg>
							Print Receipt
						</button>
					</div>
				</div>

				{/* Order Summary */}
				<div className="lg:pt-0 print:mt-6">
					<Suspense fallback={<SummarySkeleton />}>
						<Summary
							{...order}
							discount={order?.discounts?.find(({ type }) => type === "VOUCHER")?.amount}
							voucherCode={order?.voucher?.code}
							totalPrice={order?.total}
							subtotalPrice={order?.subtotal}
							editable={false}
						/>
					</Suspense>
				</div>

				{/* Print-only footer */}
				<div className="hidden print:block print:mt-8 print:pt-4 print:border-t print:col-span-2" style={{ borderColor: "var(--store-neutral-300)" }}>
					<p className="text-sm text-center" style={{ color: "var(--store-text-muted)" }}>
						Thank you for your purchase! If you have any questions, please contact our support team.
					</p>
				</div>
			</main>
		</>
	);
};
