export interface ShippingPriceAdjustment {
	enabled: boolean;
	type:
		| "round_down"
		| "round_up"
		| "flat_discount"
		| "flat_markup"
		| "percentage_discount"
		| "percentage_markup";
	value: number;
	minPrice: number;
}

/**
 * Apply a display-only price adjustment to a shipping method price.
 * Never adjusts free shipping (rawPrice === 0).
 */
export function adjustShippingPrice(
	rawPrice: number,
	config?: ShippingPriceAdjustment | null,
): number {
	if (!config?.enabled || rawPrice === 0) return rawPrice;

	let adjusted = rawPrice;
	switch (config.type) {
		case "round_down":
			adjusted = Math.floor(rawPrice / config.value) * config.value;
			break;
		case "round_up":
			adjusted = Math.ceil(rawPrice / config.value) * config.value;
			break;
		case "flat_discount":
			adjusted = rawPrice - config.value;
			break;
		case "flat_markup":
			adjusted = rawPrice + config.value;
			break;
		case "percentage_discount":
			adjusted = rawPrice * (1 - config.value / 100);
			break;
		case "percentage_markup":
			adjusted = rawPrice * (1 + config.value / 100);
			break;
	}

	return Math.max(config.minPrice, Math.round(adjusted * 100) / 100);
}
