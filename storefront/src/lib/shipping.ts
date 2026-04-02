/**
 * Universal shipping metadata helpers.
 *
 * The storefront is store-type agnostic — these helpers read `shipping.*`
 * metadata that any fulfillment source (warehouse, dropship, 3PL) can set.
 *
 * Fallback chain: per-product metadata → global config defaults → null.
 */

export interface ShippingEstimate {
	minDays: number;
	maxDays: number;
	carrier?: string;
}

type MetadataItem = { key: string; value: string };

/**
 * Extract a per-product shipping estimate from `shipping.*` metadata.
 * Returns null if no metadata present (caller should fall back to config defaults).
 */
export function getProductShippingEstimate(
	metadata: MetadataItem[] | null | undefined,
): ShippingEstimate | null {
	if (!metadata?.length) return null;

	const min = metadata.find((m) => m.key === "shipping.estimatedMinDays")?.value;
	if (!min) return null;

	const max = metadata.find((m) => m.key === "shipping.estimatedMaxDays")?.value;
	const carrier = metadata.find((m) => m.key === "shipping.carrier")?.value;

	return {
		minDays: Number(min),
		maxDays: Number(max) || Number(min),
		carrier: carrier ?? undefined,
	};
}

/**
 * Format a shipping estimate as a human-readable string.
 *   "range" → "10-20"  or  "5" (when min === max)
 *   "max"   → "20"
 */
export function formatEstimate(est: ShippingEstimate, format: "range" | "max" = "range"): string {
	if (format === "max") return String(est.maxDays);
	return est.minDays === est.maxDays ? String(est.minDays) : `${est.minDays}-${est.maxDays}`;
}

/**
 * Detect if a product is fulfilled via dropshipping.
 * Checks for `dropship.supplier` in public metadata.
 */
export function isDropshipProduct(
	metadata: MetadataItem[] | null | undefined,
): boolean {
	if (!metadata?.length) return false;
	return metadata.some((m) => m.key === "dropship.supplier" && m.value);
}

/**
 * Read tracking data from ORDER metadata (written by fulfillment systems).
 * The `dropship` key holds a JSON blob with tracking info.
 */
export function getOrderTrackingData(metadata: MetadataItem[] | null | undefined) {
	if (!metadata?.length) return null;

	const dropshipJson = metadata.find((m) => m.key === "dropship")?.value;
	if (!dropshipJson) return null;

	try {
		const data = JSON.parse(dropshipJson) as {
			trackingUrl?: string;
			trackingNumber?: string;
			carrier?: string;
			estimatedDeliveryDate?: string;
			status?: string;
			shippedAt?: string;
			forwardedAt?: string;
		};
		return data;
	} catch {
		return null;
	}
}
