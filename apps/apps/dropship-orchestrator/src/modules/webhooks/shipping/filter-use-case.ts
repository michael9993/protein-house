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
 * - If ALL checkout items are dropship AND app-provided (CJ) methods exist
 *   → exclude built-in ShippingMethod IDs
 * - Otherwise → exclude nothing (built-in methods serve as fallback)
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

  // Check if any app-provided (CJ) methods exist in the available methods.
  // Saleor calls SHIPPING_LIST_METHODS_FOR_CHECKOUT first, then passes all methods
  // (built-in + external) to this filter. App methods decode to "app:<appId>:<methodId>".
  const hasAppMethods = availableMethods.some((method) => {
    const decoded = decodeMethodId(method.id);
    return decoded.startsWith("app:");
  });

  if (!hasAppMethods) {
    // No supplier shipping methods were returned — keep built-in methods as fallback
    // so the customer can still complete checkout.
    logger.info("No app-provided shipping methods found — keeping built-in as fallback", {
      totalMethods: availableMethods.length,
    });
    return { excluded_methods: [] };
  }

  // CJ methods are available — exclude built-in methods so only supplier methods show.
  const excluded: Array<{ id: string; reason?: string }> = [];

  for (const method of availableMethods) {
    const decoded = decodeMethodId(method.id);

    if (decoded.startsWith("ShippingMethod:")) {
      excluded.push({ id: method.id, reason: "Dropship items use supplier shipping" });
    }
  }

  logger.info("Filtering shipping methods for all-dropship checkout", {
    totalMethods: availableMethods.length,
    excludedCount: excluded.length,
    appMethodCount: availableMethods.length - excluded.length,
  });

  return { excluded_methods: excluded };
}
