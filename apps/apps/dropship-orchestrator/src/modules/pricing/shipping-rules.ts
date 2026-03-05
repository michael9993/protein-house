import { createLogger } from "@/logger";
import { calculateMargin } from "./margin-calculator";

const logger = createLogger("pricing:shipping-rules");

// ---------------------------------------------------------------------------
// Types (mirror storefront/src/checkout-v2/utils/adjustShippingPrice.ts)
// ---------------------------------------------------------------------------

export interface ShippingPriceAdjustment {
  enabled: boolean;
  type: "round_down" | "round_up" | "flat_discount" | "flat_markup" | "percentage_discount" | "percentage_markup";
  value: number;
  minPrice: number;
}

export interface ShippingFreeRule {
  enabled: boolean;
  cartMinimum: number;
  maxMethodPrice: number;
  methodNameFilter?: string;
}

export interface ShippingDiscountRule {
  enabled: boolean;
  cartMinimum: number;
  type: "flat" | "percentage";
  value: number;
  maxMethodPrice: number;
  minPrice: number;
  methodNameFilter?: string;
}

export interface ShippingRulesConfig {
  freeShippingRule?: ShippingFreeRule | null;
  discountRule?: ShippingDiscountRule | null;
  priceAdjustment?: ShippingPriceAdjustment | null;
}

export interface AdjustedPrice {
  amount: number;
  originalAmount: number;
  wasFreeByRule: boolean;
  wasDiscounted: boolean;
}

export interface MarginAwareResult extends AdjustedPrice {
  marginBlocked: boolean;
  calculatedMarginPercent: number;
}

// ---------------------------------------------------------------------------
// Core rule functions (ported from client-side adjustShippingPrice.ts)
// ---------------------------------------------------------------------------

/**
 * Apply a price adjustment to a shipping method price.
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

/** Case-insensitive check: does methodName match any comma-separated filter term? */
function matchesNameFilter(methodName: string, filter?: string): boolean {
  if (!filter) return true;
  const name = methodName.toLowerCase();
  return filter.split(",").some((term) => {
    const trimmed = term.trim().toLowerCase();
    return trimmed.length > 0 && name.includes(trimmed);
  });
}

/**
 * Apply shipping rules in order: free → discount → priceAdjustment.
 * Never adjusts already-free methods (rawPrice === 0).
 */
export function applyShippingRules(
  rawPrice: number,
  cartSubtotal: number,
  config: ShippingRulesConfig,
  methodName?: string,
): AdjustedPrice {
  const result: AdjustedPrice = {
    amount: rawPrice,
    originalAmount: rawPrice,
    wasFreeByRule: false,
    wasDiscounted: false,
  };

  if (rawPrice === 0) return result;

  // 1. Free shipping rule
  const free = config.freeShippingRule;
  if (free?.enabled && cartSubtotal >= free.cartMinimum && matchesNameFilter(methodName ?? "", free.methodNameFilter)) {
    const withinPriceCap = free.maxMethodPrice <= 0 || rawPrice <= free.maxMethodPrice;
    if (withinPriceCap) {
      result.amount = 0;
      result.wasFreeByRule = true;
      return result;
    }
  }

  // 2. Discount rule
  const discount = config.discountRule;
  if (discount?.enabled && cartSubtotal >= discount.cartMinimum && matchesNameFilter(methodName ?? "", discount.methodNameFilter)) {
    const withinPriceCap = discount.maxMethodPrice <= 0 || rawPrice <= discount.maxMethodPrice;
    if (withinPriceCap) {
      let discounted = rawPrice;
      if (discount.type === "flat") {
        discounted = rawPrice - discount.value;
      } else {
        discounted = rawPrice * (1 - discount.value / 100);
      }
      result.amount = Math.max(discount.minPrice, Math.round(discounted * 100) / 100);
      result.wasDiscounted = result.amount !== rawPrice;
    }
  }

  // 3. Price adjustment (rounding/markup — applied on top)
  if (config.priceAdjustment?.enabled && result.amount > 0) {
    result.amount = adjustShippingPrice(result.amount, config.priceAdjustment);
    if (!result.wasDiscounted && result.amount !== rawPrice) {
      result.wasDiscounted = true;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Margin-aware wrapper
// ---------------------------------------------------------------------------

/**
 * Apply shipping rules with margin protection.
 *
 * If applying free/discounted shipping would push the order margin below
 * the given threshold, the adjustment is blocked and the raw price is returned.
 *
 * @param rawPrice        - Original shipping price from CJ
 * @param cartSubtotal    - Cart subtotal in checkout currency
 * @param totalProductCost - Total supplier product cost in checkout currency
 * @param config          - Shipping rules config
 * @param marginThreshold - Minimum acceptable margin percentage (0-100)
 * @param methodName      - Shipping method name for filter matching
 */
export function applyShippingRulesWithMargin(
  rawPrice: number,
  cartSubtotal: number,
  totalProductCost: number,
  config: ShippingRulesConfig,
  marginThreshold: number,
  methodName?: string,
): MarginAwareResult {
  // 1. Apply normal rules
  const result = applyShippingRules(rawPrice, cartSubtotal, config, methodName);

  // 2. Check margin if result would be free or discounted
  if (result.wasFreeByRule || result.wasDiscounted) {
    const shippingCostAbsorbed = rawPrice - result.amount;
    const { marginPercent } = calculateMargin(cartSubtotal, totalProductCost, shippingCostAbsorbed);

    if (marginPercent < marginThreshold) {
      logger.info("Margin protection blocked shipping adjustment", {
        methodName,
        rawPrice,
        wouldBe: result.amount,
        marginPercent: marginPercent.toFixed(2),
        threshold: marginThreshold,
      });

      return {
        amount: rawPrice,
        originalAmount: rawPrice,
        wasFreeByRule: false,
        wasDiscounted: false,
        marginBlocked: true,
        calculatedMarginPercent: marginPercent,
      };
    }

    return { ...result, marginBlocked: false, calculatedMarginPercent: marginPercent };
  }

  // No adjustment applied, no margin concern
  const { marginPercent } = calculateMargin(cartSubtotal, totalProductCost, rawPrice);
  return { ...result, marginBlocked: false, calculatedMarginPercent: marginPercent };
}
