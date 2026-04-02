/**
 * Config text interpolation — replaces placeholders like {freeShippingThreshold}
 * with actual values from the store config. This ensures ONE source of truth
 * for values like the free shipping threshold, instead of hardcoding amounts
 * in every text string across the config.
 *
 * Supported placeholders:
 *   {freeShippingThreshold} — formatted free shipping minimum (e.g., "₪200", "$100")
 *
 * Usage in config text strings:
 *   "Free shipping over {freeShippingThreshold}" → "Free shipping over $100"
 *   "משלוח חינם מעל {freeShippingThreshold}"    → "משלוח חינם מעל ₪200"
 */

import { formatMoney } from "@/lib/utils";

/**
 * Replace {placeholder} tokens in a config text string with actual values.
 */
export function interpolateConfigText(
  text: string,
  vars: Record<string, string>,
): string {
  if (!text || !text.includes("{")) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return key in vars ? vars[key] : match;
  });
}

/**
 * Build the standard config variable map from ecommerce settings.
 * Call this once per component, then pass to interpolateConfigText.
 */
export function buildConfigVars(ecommerce: {
  shipping?: {
    freeShippingThreshold?: number | null;
    freeShippingRule?: { enabled?: boolean; cartMinimum?: number | null };
  };
  currency?: { default?: string };
}): Record<string, string> {
  const currency = ecommerce?.currency?.default ?? "USD";

  // Effective threshold: prefer the rule if enabled, fall back to legacy field
  const threshold = ecommerce?.shipping?.freeShippingRule?.enabled
    ? ecommerce.shipping.freeShippingRule.cartMinimum
    : ecommerce?.shipping?.freeShippingThreshold;

  return {
    freeShippingThreshold: threshold ? formatMoney(threshold, currency) : "",
  };
}
