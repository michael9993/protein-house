"use client";

import { useCheckoutState } from "../CheckoutStateProvider";
import { useCheckoutText, formatText } from "../hooks/useCheckoutText";
import { useEcommerceSettings } from "@/providers/StoreConfigProvider";
import { applyShippingRules, type ShippingRulesConfig } from "../utils/adjustShippingPrice";

export function SummaryTotals() {
	const { state } = useCheckoutState();
	const t = useCheckoutText();
	const checkout = state.checkout;

	if (!checkout) {
		return (
			<div className="space-y-2 border-t border-neutral-100 pt-4">
				<div className="h-4 animate-pulse rounded bg-neutral-100" />
				<div className="h-4 animate-pulse rounded bg-neutral-100" />
				<div className="h-5 animate-pulse rounded bg-neutral-100" />
			</div>
		);
	}

	const ecommerce = useEcommerceSettings();
	const rulesConfig: ShippingRulesConfig = {
		freeShippingRule: ecommerce?.shipping?.freeShippingRule ?? undefined,
		discountRule: ecommerce?.shipping?.discountRule ?? undefined,
		priceAdjustment: ecommerce?.shipping?.priceAdjustment ?? undefined,
	};

	const subtotal = checkout.subtotalPrice?.gross;
	const shipping = checkout.shippingPrice?.gross;
	const subtotalAmount = subtotal?.amount ?? 0;

	// Resolve the selected method's name for the name filter
	const selectedMethodId = (checkout.deliveryMethod as { id: string } | null)?.id;
	const selectedMethodName = selectedMethodId
		? checkout.shippingMethods?.find((m) => m.id === selectedMethodId)?.name
		: undefined;

	// Check if this is a dropship method with server-side adjusted prices
	const dropshipOriginalEntry = checkout.metadata
		?.find((m: { key: string }) => m.key === "dropship.shippingOriginalPrices");
	const dropshipPrices = dropshipOriginalEntry
		? (() => { try { return JSON.parse(dropshipOriginalEntry.value) as Record<string, number>; } catch { return null; } })()
		: null;
	const isDropshipAdjusted = !!(selectedMethodName && dropshipPrices?.[selectedMethodName] != null);

	// For dropship methods, the server already set the correct price — no client-side adjustment
	const shippingResult = shipping
		? isDropshipAdjusted
			? {
				amount: shipping.amount,
				originalAmount: dropshipPrices![selectedMethodName!],
				wasFreeByRule: shipping.amount === 0 && dropshipPrices![selectedMethodName!] > 0,
				wasDiscounted: shipping.amount !== dropshipPrices![selectedMethodName!],
			}
			: applyShippingRules(shipping.amount, subtotalAmount, rulesConfig, selectedMethodName)
		: null;
	const displayShipping = shippingResult
		? { amount: shippingResult.amount, currency: shipping!.currency }
		: null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const hasDeliveryMethod = !!(checkout.deliveryMethod as any)?.id;
	const tax = checkout.totalPrice?.tax;
	const rawTotal = checkout.totalPrice?.gross;
	// Correct total by the shipping adjustment delta (only for non-dropship methods)
	const shippingDelta = shippingResult && shipping
		? shippingResult.amount - shipping.amount
		: 0;
	const total = rawTotal
		? { amount: Math.max(0, rawTotal.amount + shippingDelta), currency: rawTotal.currency }
		: null;
	const discount = checkout.discount;

	function fmt(amount: number, currency: string): string {
		return `${amount.toFixed(2)} ${currency}`;
	}

	return (
		<div className="space-y-2 border-t border-neutral-100 pt-4 text-sm">
			{subtotal && (
				<div className="flex justify-between text-neutral-600">
					<span>{t.subtotalLabel ?? "Subtotal"}</span>
					<span>{fmt(subtotal.amount, subtotal.currency)}</span>
				</div>
			)}

			{displayShipping && (
				<div className="flex justify-between text-neutral-600">
					<span>{t.shippingLabel ?? "Shipping"}</span>
					<span>
						{!hasDeliveryMethod ? (
							<span className="text-neutral-400">—</span>
						) : displayShipping.amount === 0 ? (
							<span className="flex items-center gap-1.5">
								{shippingResult?.originalAmount != null && shippingResult.originalAmount > 0 && (
									<span className="text-xs text-neutral-400 line-through">
										{fmt(shippingResult.originalAmount, displayShipping.currency)}
									</span>
								)}
								<span className="font-medium text-success-600">{t.freeShippingLabel ?? "Free"}</span>
							</span>
						) : shippingResult?.wasDiscounted && shippingResult.originalAmount !== shippingResult.amount ? (
							<span className="flex items-center gap-1.5">
								<span className="text-xs text-neutral-400 line-through">
									{fmt(shippingResult.originalAmount, displayShipping.currency)}
								</span>
								<span className="font-medium text-success-600">
									{fmt(displayShipping.amount, displayShipping.currency)}
								</span>
							</span>
						) : (
							fmt(displayShipping.amount, displayShipping.currency)
						)}
					</span>
				</div>
			)}

			{shippingResult && hasDeliveryMethod &&
			 (shippingResult.wasFreeByRule || shippingResult.wasDiscounted) &&
			 shippingResult.originalAmount > shippingResult.amount && (
				<div className="text-xs text-success-600">
					{formatText(t.shippingSavingsMessage ?? "You saved {amount} on shipping!", {
						amount: fmt(shippingResult.originalAmount - shippingResult.amount, displayShipping!.currency),
					})}
				</div>
			)}

			{discount && discount.amount > 0 && (
				<div className="flex justify-between text-success-600">
					<span>{checkout.discountName ?? "Discount"}</span>
					<span>−{fmt(discount.amount, discount.currency)}</span>
				</div>
			)}

			{tax && tax.amount > 0 && (
				<div className="flex justify-between text-neutral-500 text-xs">
					<span>{t.taxLabel ?? "Tax"}</span>
					<span>{fmt(tax.amount, tax.currency)}</span>
				</div>
			)}

			{total && (
				<div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900">
					<span>{t.totalLabel ?? "Total"}</span>
					<span>{fmt(total.amount, total.currency)}</span>
				</div>
			)}
		</div>
	);
}
