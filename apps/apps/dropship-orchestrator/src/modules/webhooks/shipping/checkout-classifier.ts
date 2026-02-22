import { createLogger } from "@/logger";

const logger = createLogger("CheckoutClassifier");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckoutClassification = "all_dropship" | "mixed" | "all_warehouse";

export interface CheckoutLine {
  quantity: number;
  variant: {
    id: string;
    product: {
      metadata: Array<{ key: string; value: string }>;
    };
  } | null;
}

export interface ClassificationResult {
  type: CheckoutClassification;
  /** Variant IDs for lines that carry dropship metadata. */
  dropshipVariantIds: string[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify checkout lines as all-dropship, mixed, or all-warehouse.
 *
 * Detection uses the same metadata convention as the order classifier:
 * a product is "dropship" when its metadata contains either
 * `dropship.supplier` (individual-key format) or `dropship` (legacy JSON).
 */
export function classifyCheckout(lines: CheckoutLine[]): ClassificationResult {
  if (lines.length === 0) {
    return { type: "all_warehouse", dropshipVariantIds: [] };
  }

  const dropshipVariantIds: string[] = [];

  for (const line of lines) {
    const meta = line.variant?.product?.metadata ?? [];
    const hasDropship =
      meta.some((m) => m.key === "dropship.supplier") ||
      meta.some((m) => m.key === "dropship");

    if (hasDropship && line.variant) {
      dropshipVariantIds.push(line.variant.id);
    }
  }

  let type: CheckoutClassification;

  if (dropshipVariantIds.length === 0) {
    type = "all_warehouse";
  } else if (dropshipVariantIds.length === lines.length) {
    type = "all_dropship";
  } else {
    type = "mixed";
  }

  logger.info("Checkout classified", {
    type,
    totalLines: lines.length,
    dropshipLines: dropshipVariantIds.length,
  });

  return { type, dropshipVariantIds };
}
