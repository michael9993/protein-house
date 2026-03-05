"use client";

import { useMemo } from "react";
import { useEcommerceSettings } from "@/providers/StoreConfigProvider";
import { applyShippingRules, type ShippingRulesConfig } from "../utils/adjustShippingPrice";

interface ShippingMethod {
	id: string;
	name: string;
	price: { amount: number; currency: string };
}

/**
 * Wraps shipping methods with display-adjusted prices using the rule pipeline:
 * free → discount → priceAdjustment.
 * Preserves `originalPrice` and flags for strikethrough display.
 *
 * For dropship methods (CJ/DHL), the server already applied rules — original
 * prices are read from checkout metadata instead of re-applying client-side rules.
 */
export function useAdjustedShippingMethods<T extends ShippingMethod>(
	methods: T[],
	cartSubtotal?: number,
	checkoutMetadata?: Array<{ key: string; value: string }> | null,
): (T & {
	originalPrice: { amount: number; currency: string };
	wasFreeByRule: boolean;
	wasDiscounted: boolean;
})[] {
	const ecommerce = useEcommerceSettings();
	const shipping = ecommerce?.shipping;
	const subtotal = cartSubtotal ?? 0;

	const rulesConfig: ShippingRulesConfig = useMemo(
		() => ({
			freeShippingRule: shipping?.freeShippingRule ?? undefined,
			discountRule: shipping?.discountRule ?? undefined,
			priceAdjustment: shipping?.priceAdjustment ?? undefined,
		}),
		[shipping?.freeShippingRule, shipping?.discountRule, shipping?.priceAdjustment],
	);

	// Parse dropship original prices from checkout metadata
	const dropshipOriginalPrices = useMemo(() => {
		if (!checkoutMetadata) return null;
		const entry = checkoutMetadata.find((m) => m.key === "dropship.shippingOriginalPrices");
		if (!entry) return null;
		try {
			return JSON.parse(entry.value) as Record<string, number>;
		} catch {
			return null;
		}
	}, [checkoutMetadata]);

	return useMemo(
		() =>
			methods.map((m) => {
				const dropshipOriginal = dropshipOriginalPrices?.[m.name];

				if (dropshipOriginal != null && dropshipOriginal !== m.price.amount) {
					// Dropship method — server already adjusted the price
					return {
						...m,
						originalPrice: { amount: dropshipOriginal, currency: m.price.currency },
						wasFreeByRule: m.price.amount === 0 && dropshipOriginal > 0,
						wasDiscounted: m.price.amount !== dropshipOriginal,
					};
				}

				// Non-dropship method — apply client-side rules
				const result = applyShippingRules(m.price.amount, subtotal, rulesConfig, m.name);
				return {
					...m,
					originalPrice: { amount: result.originalAmount, currency: m.price.currency },
					price: { ...m.price, amount: result.amount },
					wasFreeByRule: result.wasFreeByRule,
					wasDiscounted: result.wasDiscounted,
				};
			}),
		[methods, subtotal, rulesConfig, dropshipOriginalPrices],
	);
}
