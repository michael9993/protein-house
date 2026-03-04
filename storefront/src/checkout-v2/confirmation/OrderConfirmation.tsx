"use client";

import { useEffect, useRef } from "react";
import type { GetOrderForConfirmationQuery } from "@/gql/graphql";
import { trackPurchase } from "@/lib/analytics";
import { useAutoCartCleanup } from "@/checkout-v2/hooks/useCartCleanup";
import { useCheckoutText, CheckoutTextProvider } from "@/checkout-v2/hooks/useCheckoutText";
import { CheckoutHeader } from "@/checkout-v2/components/CheckoutHeader";
import { CheckoutFooter } from "@/checkout-v2/components/CheckoutFooter";
import { OrderSummary } from "./OrderSummary";
import { OrderNextSteps } from "./OrderNextSteps";
import type { CheckoutTextConfig } from "@/lib/checkout/useCheckoutText";

type Order = NonNullable<GetOrderForConfirmationQuery["order"]>;

interface Props {
	order: Order;
	channel: string;
	checkoutText?: CheckoutTextConfig;
}

// ---------------------------------------------------------------------------
// Inner component — rendered inside CheckoutTextProvider
// ---------------------------------------------------------------------------

function OrderConfirmationInner({ order, channel }: Omit<Props, "checkoutText">) {
	const t = useCheckoutText();
	const purchaseTracked = useRef(false);

	// Clean up original cart lines after purchase
	useAutoCartCleanup(order.id);

	// GA4 purchase event — fire exactly once when order data is available
	useEffect(() => {
		if (purchaseTracked.current) return;
		purchaseTracked.current = true;

		trackPurchase({
			transaction_id: order.number,
			currency: order.total.gross.currency,
			value: order.total.gross.amount,
			tax: order.total.tax.amount,
			shipping: order.shippingPrice.gross.amount,
			coupon: order.voucher?.code ?? undefined,
			items: order.lines.map((line) => ({
				item_id: line.id,
				item_name: line.productName,
				price: line.unitPrice.gross.amount,
				currency: line.unitPrice.gross.currency,
				quantity: line.quantity,
			})),
		});
	}, [order]);

	return (
		<div className="min-h-dvh bg-gradient-to-b from-neutral-50 to-white print:bg-white">
			<section className="mx-auto flex min-h-dvh max-w-7xl flex-col px-4 py-6 sm:px-8">
				<CheckoutHeader channel={channel} />

				{/* Print-only receipt header */}
				<div className="hidden print:block print:mt-2 print:border-b print:pb-2">
					<h1 className="text-2xl font-bold text-neutral-900">
						{t.orderReceiptTitle ?? "Order Receipt"}
					</h1>
					<p className="mt-1 text-sm text-neutral-500">
						{t.orderNumberPrefix ?? "Order #"}{order.number}
					</p>
					<p className="text-sm text-neutral-500">{order.userEmail}</p>
				</div>

				{/* Success banner */}
				<header className="mt-8 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-6 print:hidden">
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
							<svg
								className="h-6 w-6 text-emerald-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<div className="flex-1">
							<p
								className="text-sm font-medium text-emerald-700"
								data-testid="orderConfrmationTitle"
							>
								{t.orderConfirmedTitle ?? "Order Confirmed"}
							</p>
							<h1 className="mt-1 text-2xl font-bold text-neutral-900">
								{t.orderNumberPrefix ?? "Order #"}{order.number}
							</h1>
							<p className="mt-2 text-sm text-neutral-600">
								{t.orderConfirmedMessage ??
									"Thank you for your order! We've received it and will notify you when your package ships."}
							</p>
							{order.userEmail && (
								<div className="mt-3 flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 text-sm">
									<svg
										className="h-4 w-4 text-neutral-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>
									<span className="text-neutral-500">
										{t.confirmationSentTo ?? "Confirmation sent to:"}{" "}
									</span>
									<span className="font-medium text-neutral-900">{order.userEmail}</span>
								</div>
							)}
						</div>
					</div>
				</header>

				{/* Two-column layout */}
				<div className="mt-8 flex flex-1 flex-col gap-8 lg:flex-row lg:items-start print:mt-3 print:gap-4">
					{/* Left — next steps + CTAs */}
					<main className="flex-1">
						<OrderNextSteps channel={channel} />
					</main>

					{/* Right — order summary (sticky on desktop) */}
					<div className="w-full lg:sticky lg:top-8 lg:w-80 xl:w-96">
						<OrderSummary order={order} />
					</div>
				</div>

				{/* Print footer */}
				<div className="hidden print:block print:mt-3 print:border-t print:pt-2">
					<p className="text-center text-sm text-neutral-500">
						{t.thankYouPurchaseMessage ??
							"Thank you for your purchase! If you have any questions, please contact our support team."}
					</p>
				</div>

				<CheckoutFooter channel={channel} />
			</section>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Public export — wraps CheckoutTextProvider
// ---------------------------------------------------------------------------

export function OrderConfirmationV2({ order, channel, checkoutText }: Props) {
	return (
		<CheckoutTextProvider config={checkoutText}>
			<OrderConfirmationInner order={order} channel={channel} />
		</CheckoutTextProvider>
	);
}
