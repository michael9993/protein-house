"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useCheckoutState } from "../CheckoutStateProvider";
import { useCheckoutText } from "../hooks/useCheckoutText";
import { SummaryLineItem } from "./SummaryLineItem";
import { PromoCodeInput } from "./PromoCodeInput";
import { GiftCardRow } from "./GiftCardRow";
import { SummaryTotals } from "./SummaryTotals";
import { FreeShippingIndicator } from "../components/FreeShippingIndicator";
import { useAdjustedShippingMethods } from "../hooks/useAdjustedShippingMethods";
import { STEP_DELIVERY } from "../types";

interface CheckoutSummaryProps {
	channel: string;
}

export function CheckoutSummary({ channel: _channel }: CheckoutSummaryProps) {
	const { state, visibleLines, openStep } = useCheckoutState();
	const t = useCheckoutText();
	const checkout = state.checkout;
	const goToDeliveryStep = useCallback(() => openStep(STEP_DELIVERY), [openStep]);

	const [isMobileExpanded, setIsMobileExpanded] = useState(false);
	const bodyRef = useRef<HTMLDivElement>(null);
	const [bodyHeight, setBodyHeight] = useState(0);

	// Measure the content height for smooth animation
	useEffect(() => {
		if (!bodyRef.current) return;
		const el = bodyRef.current;
		const measure = () => setBodyHeight(el.scrollHeight);
		measure();
		// Re-measure when content changes (line items, promo codes, etc.)
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	}, [checkout?.lines?.length, checkout?.giftCards?.length]);

	const lineCount = visibleLines.length;
	const itemsLabel =
		lineCount === 1
			? (t.itemsCountSingular ?? "1 item")
			: (t.itemsCountPlural ?? "{count} items").replace("{count}", String(lineCount));

	const subtotal = checkout?.subtotalPrice?.gross?.amount ?? 0;
	const adjustedMethods = useAdjustedShippingMethods(
		(checkout?.shippingMethods ?? []).map((m) => ({
			id: m.id,
			name: m.name,
			price: { amount: m.price.amount, currency: m.price.currency },
		})),
		subtotal,
		checkout?.metadata,
	);

	const total = checkout?.totalPrice?.gross;
	const totalStr = total ? `${total.amount.toFixed(2)} ${total.currency}` : "";

	return (
		<aside
			data-cd="checkout-summary"
			aria-label={t.orderSummaryTitle ?? "Order Summary"}
			className="rounded-xl border border-neutral-200 bg-white shadow-sm"
			style={{ contain: "layout" }}
		>
			{/* Mobile toggle header */}
			<button
				type="button"
				onClick={() => setIsMobileExpanded((v) => !v)}
				aria-expanded={isMobileExpanded}
				aria-controls="checkout-summary-body"
				className="flex w-full items-center justify-between border-b border-neutral-100 px-4 py-4 text-sm font-medium text-neutral-900 lg:hidden"
			>
				<span className="flex items-center gap-2">
					<span>{t.orderSummaryTitle ?? "Order Summary"}</span>
					<span className="text-neutral-400">({itemsLabel})</span>
				</span>
				<span className="flex items-center gap-2">
					{totalStr && <span className="font-semibold">{totalStr}</span>}
					<svg
						className={["h-4 w-4 text-neutral-400 transition-transform duration-200", isMobileExpanded ? "rotate-180" : ""].join(" ")}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
						aria-hidden="true"
					>
						<path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
					</svg>
				</span>
			</button>

			{/* Summary body — smooth height transition on mobile, always visible on desktop */}
			<div
				id="checkout-summary-body"
				className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out lg:!max-h-none lg:!opacity-100"
				style={{
					maxHeight: isMobileExpanded ? `${bodyHeight}px` : "0px",
					opacity: isMobileExpanded ? 1 : 0,
				}}
			>
				<div ref={bodyRef} className="px-4 py-4">
					<h2 className="mb-4 hidden text-sm font-semibold text-neutral-900 lg:block">
						{t.orderSummaryTitle ?? "Order Summary"}
					</h2>

					{/* Line items */}
					{checkout ? (
						<div className="divide-y divide-neutral-50">
							{visibleLines.map((line) => (
								<SummaryLineItem
									key={line.id}
									line={line}
									checkoutId={checkout.id}
								/>
							))}

							{visibleLines.length === 0 && (
								<p className="py-4 text-center text-sm text-neutral-400">
									Your cart is empty
								</p>
							)}
						</div>
					) : (
						<div className="space-y-3">
							{[1, 2].map((i) => (
								<div key={i} className="flex gap-3">
									<div className="h-14 w-14 animate-pulse rounded-md bg-neutral-100" />
									<div className="flex-1 space-y-2 pt-1">
										<div className="h-3 animate-pulse rounded bg-neutral-100" />
										<div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
									</div>
								</div>
							))}
						</div>
					)}

					{/* Applied gift cards */}
					{checkout?.giftCards && checkout.giftCards.length > 0 && (
						<div className="border-t border-neutral-100 pt-3">
							{checkout.giftCards.map((card) => (
								<GiftCardRow key={card.id} card={card} checkoutId={checkout.id} />
							))}
						</div>
					)}

					{/* Promo code input */}
					{checkout && <PromoCodeInput checkoutId={checkout.id} />}

					{/* Free shipping indicator */}
					{checkout && (
						<div className="pt-3">
							<FreeShippingIndicator
								subtotalAmount={checkout.subtotalPrice?.gross?.amount ?? 0}
								currency={checkout.subtotalPrice?.gross?.currency ?? ""}
								methods={adjustedMethods}
								selectedMethodId={
									(checkout.deliveryMethod as { id: string } | null)?.id ?? null
								}
								onChangeMethod={goToDeliveryStep}
							/>
						</div>
					)}

					{/* Totals */}
					<SummaryTotals />
				</div>
			</div>
		</aside>
	);
}
