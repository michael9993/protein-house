"use client";

import { useEffect, useRef, useState } from "react";
import type { GetOrderForConfirmationQuery } from "@/gql/graphql";
import { trackPurchase } from "@/lib/analytics";
import { trackMetaPurchase } from "@/lib/meta-pixel-events";
import { trackTikTokCompletePayment } from "@/lib/tiktok-pixel-events";
import { saleorAuthClient } from "@/ui/components/AuthProvider";
import { registerAccount } from "@/checkout-v2/_actions/register-account";
import { useAutoCartCleanup } from "@/checkout-v2/hooks/useCartCleanup";
import { useCheckoutText, CheckoutTextProvider } from "@/checkout-v2/hooks/useCheckoutText";
import { CheckoutHeader } from "@/checkout-v2/components/CheckoutHeader";
import { CheckoutFooter } from "@/checkout-v2/components/CheckoutFooter";
import { OrderSummary } from "./OrderSummary";
import { OrderNextSteps } from "./OrderNextSteps";
import type { CheckoutTextConfig } from "@/lib/checkout/useCheckoutText";
import { useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";

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
	const cdStyle = useComponentStyle("checkout.confirmation");
	const cdClasses = useComponentClasses("checkout.confirmation");
	const t = useCheckoutText();
	const purchaseTracked = useRef(false);
	const registrationAttempted = useRef(false);
	const [accountCreated, setAccountCreated] = useState(false);

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

		// Meta Pixel Purchase
		trackMetaPurchase({
			content_ids: order.lines.map((line) => line.id),
			content_name: `Order ${order.number}`,
			value: order.total.gross.amount,
			currency: order.total.gross.currency,
			num_items: order.lines.reduce((sum, line) => sum + line.quantity, 0),
		});

		// TikTok Pixel CompletePayment
		trackTikTokCompletePayment({
			content_id: order.number,
			content_type: "product",
			value: order.total.gross.amount,
			currency: order.total.gross.currency,
		});
	}, [order]);

	// Deferred account creation — runs once on confirmation page load
	// Best practice: account creation after order, never during checkout
	useEffect(() => {
		if (registrationAttempted.current) return;

		const pendingPassword = sessionStorage.getItem("checkout_pending_account");
		if (!pendingPassword) return;

		registrationAttempted.current = true;
		sessionStorage.removeItem("checkout_pending_account");

		const email = order.userEmail ?? "";
		const addr = order.shippingAddress;

		if (!email) return;

		// Build address input from order shipping address
		const shippingAddress = addr
			? {
					firstName: addr.firstName ?? "",
					lastName: addr.lastName ?? "",
					streetAddress1: addr.streetAddress1 ?? "",
					streetAddress2: addr.streetAddress2 ?? "",
					city: addr.city ?? "",
					cityArea: addr.cityArea ?? "",
					postalCode: addr.postalCode ?? "",
					countryCode: addr.country?.code ?? "",
					countryArea: addr.countryArea ?? "",
					phone: addr.phone ?? "",
					companyName: addr.companyName ?? "",
				}
			: null;

		registerAccount(
			email,
			pendingPassword,
			channel,
			addr?.firstName ?? "",
			addr?.lastName ?? "",
			shippingAddress,
		)
			.then((result) => {
				if (result.success) {
					setAccountCreated(true);
					// Auto sign-in so user is authenticated on the client side
					saleorAuthClient
						.signIn({ email, password: pendingPassword }, { cache: "no-store" })
						.catch(() => {
							// Non-fatal — account exists, user can sign in manually
						});
				} else {
					console.warn("[OrderConfirmation] Account creation failed:", result.error);
				}
			})
			.catch((err) => {
				console.warn("[OrderConfirmation] Account creation error:", err);
			});
	}, [order, channel]);

	return (
		<div data-cd="checkout-confirmation" className={`min-h-dvh bg-gradient-to-b from-neutral-50 to-white print:bg-white ${cdClasses}`} style={{ ...buildComponentStyle("checkout.confirmation", cdStyle) }}>
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
				<header className="mt-8 rounded-xl border border-success-200 bg-gradient-to-r from-success-50 to-success-100 p-6 print:hidden">
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-success-100">
							<svg
								className="h-6 w-6 text-success-600"
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
								className="text-sm font-medium text-success-700"
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
					{accountCreated && (
						<div className="mt-4 flex items-start gap-3 rounded-lg border border-success-200 bg-success-50 px-4 py-3">
							<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-success-100">
								<svg className="h-4 w-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							</div>
							<div className="flex-1">
								<p className="text-sm font-semibold text-success-900">
									{t.accountCreatedTitle ?? "Account Created"}
								</p>
								<p className="mt-0.5 text-sm text-success-700">
									{t.accountCreatedDescription ?? "Your account has been set up with your shipping address saved. Sign in anytime with your email and password."}
								</p>
							</div>
						</div>
					)}
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
