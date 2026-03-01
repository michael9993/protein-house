"use client";

import { useMemo } from "react";
import { useEcommerceSettings } from "@/providers/StoreConfigProvider";
import { adjustShippingPrice, type ShippingPriceAdjustment } from "../utils/adjustShippingPrice";

interface ShippingMethod {
	id: string;
	name: string;
	price: { amount: number; currency: string };
}

interface AdjustedShippingMethod extends ShippingMethod {
	originalPrice: { amount: number; currency: string };
}

/**
 * Wraps shipping methods with display-adjusted prices.
 * Preserves `originalPrice` so metadata can track the raw cost.
 */
export function useAdjustedShippingMethods<T extends ShippingMethod>(
	methods: T[],
): (T & { originalPrice: { amount: number; currency: string } })[] {
	const ecommerce = useEcommerceSettings();
	const adjustment = ecommerce?.shipping?.priceAdjustment as ShippingPriceAdjustment | undefined;

	return useMemo(
		() =>
			methods.map((m) => ({
				...m,
				originalPrice: { amount: m.price.amount, currency: m.price.currency },
				price: {
					...m.price,
					amount: adjustShippingPrice(m.price.amount, adjustment),
				},
			})),
		[methods, adjustment],
	);
}
