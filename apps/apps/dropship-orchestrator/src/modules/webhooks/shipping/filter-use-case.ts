import { createLogger } from "@/logger";

import { classifyCheckout, type CheckoutLine } from "./checkout-classifier";

const logger = createLogger("ShippingFilterUseCase");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AvailableShippingMethod {
  id: string;
  name?: string;
}

export interface FilterResult {
  excluded_methods: Array<{ id: string; reason?: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Decode a base64-encoded Saleor shipping method ID.
 * Built-in methods decode to `"ShippingMethod:<id>"`.
 * App-provided methods decode to `"app:<appId>:<methodId>"`.
 */
function decodeMethodId(encodedId: string): string {
  try {
    return Buffer.from(encodedId, "base64").toString("utf-8");
  } catch {
    return encodedId;
  }
}

// ---------------------------------------------------------------------------
// Use Case
// ---------------------------------------------------------------------------

/**
 * Handle CHECKOUT_FILTER_SHIPPING_METHODS:
 * - If ALL checkout items are dropship → exclude built-in ShippingMethod IDs
 * - Otherwise → exclude nothing (let all methods through)
 */
export function handleShippingFilter(
  lines: CheckoutLine[],
  availableMethods: AvailableShippingMethod[],
): FilterResult {
  const classification = classifyCheckout(lines);

  if (classification.type !== "all_dropship") {
    logger.info("Checkout not all-dropship — no methods excluded", {
      type: classification.type,
    });
    return { excluded_methods: [] };
  }

  // Exclude all built-in shipping methods for all-dropship checkouts.
  // The SHIPPING_LIST_METHODS_FOR_CHECKOUT webhook provides CJ carrier methods.
  // Note: Saleor's filter payload only includes built-in methods, not app-provided ones.
  const excluded: Array<{ id: string }> = [];

  for (const method of availableMethods) {
    const decoded = decodeMethodId(method.id);

    if (decoded.startsWith("ShippingMethod:")) {
      excluded.push({ id: method.id, reason: "Dropship items use supplier shipping" });
    }
  }

  logger.info("Filtering shipping methods for all-dropship checkout", {
    totalMethods: availableMethods.length,
    excludedCount: excluded.length,
  });

  return { excluded_methods: excluded };
}
