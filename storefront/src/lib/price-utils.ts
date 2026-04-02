/**
 * Price Utilities
 * 
 * Utilities for computing and rounding price ranges from product data.
 */

/**
 * Round a price value to a "nice" step based on magnitude
 * 
 * Professional e-commerce rounding strategy:
 * - For values < 10: round to nearest 1
 * - For values 10-100: round to nearest 5
 * - For values 100-1000: round to nearest 10
 * - For values 1000-10000: round to nearest 50
 * - For values >= 10000: round to nearest 100
 * 
 * @param value - Price value to round
 * @param direction - "floor" for min (round down), "ceil" for max (round up)
 * @returns Rounded value
 */
export function roundToNiceStep(value: number, direction: "floor" | "ceil" | "round" = "round"): number {
  if (value <= 0) return 0;

  let step: number;
  const roundFn = direction === "round" ? Math.round : direction === "floor" ? Math.floor : Math.ceil;
  if (value < 10) {
    step = 1;
  } else if (value < 100) {
    step = 5;
  } else if (value < 1000) {
    step = 10;
  } else if (value < 10000) {
    step = 50;
  } else {
    step = 100;
  }

  return roundFn(value / step) * step;
}

/**
 * Compute min and max prices from product list, and extract currency
 * 
 * Extracts price range from product pricing data and rounds to nice steps.
 * Also extracts currency code from product pricing (more reliable than API call).
 * 
 * @param products - Array of products with pricing data
 * @returns Object with minAvailablePrice, maxAvailablePrice (rounded), and currencyCode
 */
export function computePriceRange(products: Array<{
  pricing?: {
    priceRange?: {
      start?: { gross?: { amount?: number | null; currency?: string | null } | null } | null;
      stop?: { gross?: { amount?: number | null; currency?: string | null } | null } | null;
    } | null;
  } | null;
}>): { minAvailablePrice: number; maxAvailablePrice: number; currencyCode: string } {
  let minPrice: number | null = null;
  let maxPrice: number | null = null;
  let currencyCode: string | null = null;

  // Extract all price values and currency from products
  for (const product of products) {
    const priceRange = product.pricing?.priceRange;
    if (!priceRange) continue;

    // Extract currency from first product with pricing (all products in same channel have same currency)
    // Normalize to handle any case variations (Saleor typically returns uppercase codes like "ILS")
    if (!currencyCode) {
      const startCurrency = priceRange.start?.gross?.currency;
      const stopCurrency = priceRange.stop?.gross?.currency;
      currencyCode = (startCurrency || stopCurrency || null);
      // Normalize: trim and ensure we have a valid value
      if (currencyCode) {
        currencyCode = currencyCode.trim();
        console.log("[computePriceRange] Extracted currency from product:", currencyCode);
      } else {
        console.warn("[computePriceRange] No currency found in product pricing:", {
          startCurrency,
          stopCurrency,
          priceRange: priceRange.start?.gross,
        });
      }
    }

    // Check start price (minimum variant price)
    const startAmount = priceRange.start?.gross?.amount;
    if (startAmount !== null && startAmount !== undefined) {
      if (minPrice === null || startAmount < minPrice) {
        minPrice = startAmount;
      }
      if (maxPrice === null || startAmount > maxPrice) {
        maxPrice = startAmount;
      }
    }

    // Check stop price (maximum variant price)
    const stopAmount = priceRange.stop?.gross?.amount;
    if (stopAmount !== null && stopAmount !== undefined) {
      if (minPrice === null || stopAmount < minPrice) {
        minPrice = stopAmount;
      }
      if (maxPrice === null || stopAmount > maxPrice) {
        maxPrice = stopAmount;
      }
    }
  }

  // Default values if no products or no prices found
  const defaultMin = 0;
  const defaultMax = 1000;

  // Round to nice steps
  const roundedMin = minPrice !== null 
    ? Math.max(0, roundToNiceStep(minPrice, "floor"))
    : defaultMin;
  
  const roundedMax = maxPrice !== null
    ? roundToNiceStep(maxPrice, "ceil")
    : defaultMax;

  // Ensure max is at least min + 1
  const finalMax = Math.max(roundedMax, roundedMin + 1);

  return {
    minAvailablePrice: roundedMin,
    maxAvailablePrice: finalMax,
    currencyCode: currencyCode || "", // Return empty string if no currency found (no USD fallback)
  };
}

