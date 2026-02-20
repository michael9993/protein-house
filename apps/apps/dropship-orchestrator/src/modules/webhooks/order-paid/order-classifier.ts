import { z } from "zod";

import { createLogger } from "@/logger";

const logger = createLogger("OrderClassifier");

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const DropshipMetadataSchema = z.object({
  supplier: z.enum(["aliexpress", "cj"]),
  supplierSku: z.string().min(1),
  /** AliExpress variant attribute string, e.g. "14:350853#Black;5:361386#M". Not used by CJ. */
  supplierSkuAttr: z.string().optional(),
  costPrice: z.number().nonnegative(),
});

export type DropshipMetadata = z.infer<typeof DropshipMetadataSchema>;

export interface OrderLine {
  id: string;
  productName: string;
  variantName: string;
  productSku: string | null;
  quantity: number;
  unitPrice: {
    gross: {
      amount: number;
      currency: string;
    };
  };
  totalPrice: {
    gross: {
      amount: number;
      currency: string;
    };
  };
  /** Product-level metadata — Saleor includes this when the line's variant is fetched with metadata. */
  variant: {
    id: string;
    product: {
      metadata: Array<{ key: string; value: string }>;
    };
  } | null;
}

export interface ClassifiedOrder {
  /** Lines that are fulfilled normally (no dropship metadata). */
  concrete: OrderLine[];

  /**
   * Lines grouped by supplier ID. Each key is a supplier identifier
   * (e.g. "aliexpress", "cj") and the value is the list of order lines
   * that should be forwarded to that supplier.
   */
  dropship: Map<string, { lines: OrderLine[]; metadata: DropshipMetadata[] }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to extract and validate the `dropship` metadata object from a
 * product's metadata array.
 *
 * Returns `null` when the product does not carry dropship metadata or if the
 * metadata is malformed.
 */
function extractDropshipMetadata(
  productMetadata: Array<{ key: string; value: string }>,
): DropshipMetadata | null {
  const entry = productMetadata.find((m) => m.key === "dropship");

  if (!entry) {
    return null;
  }

  try {
    const parsed = JSON.parse(entry.value);
    const result = DropshipMetadataSchema.safeParse(parsed);

    if (!result.success) {
      logger.warn("Invalid dropship metadata — skipping line", {
        errors: result.error.flatten().fieldErrors,
        raw: entry.value,
      });

      return null;
    }

    return result.data;
  } catch {
    logger.warn("Failed to parse dropship metadata JSON — skipping line", {
      raw: entry.value,
    });

    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify order lines into concrete (normal fulfillment) and dropship
 * (forwarded to suppliers) groups.
 *
 * The classification is based on the `dropship` metadata entry on each line's
 * product:
 *
 * ```json
 * {
 *   "dropship": {
 *     "supplier": "aliexpress",
 *     "supplierSku": "4000123456789",
 *     "costPrice": 12.50
 *   }
 * }
 * ```
 *
 * Lines without this metadata — or with invalid metadata — are placed in the
 * `concrete` bucket.
 */
export function classifyOrderLines(orderLines: OrderLine[]): ClassifiedOrder {
  const concrete: OrderLine[] = [];
  const dropship = new Map<string, { lines: OrderLine[]; metadata: DropshipMetadata[] }>();

  for (const line of orderLines) {
    const productMeta = line.variant?.product?.metadata ?? [];
    const dropshipMeta = extractDropshipMetadata(productMeta);

    if (!dropshipMeta) {
      concrete.push(line);
      continue;
    }

    const supplierId = dropshipMeta.supplier;
    const existing = dropship.get(supplierId);

    if (existing) {
      existing.lines.push(line);
      existing.metadata.push(dropshipMeta);
    } else {
      dropship.set(supplierId, {
        lines: [line],
        metadata: [dropshipMeta],
      });
    }
  }

  logger.info("Order lines classified", {
    concreteCount: concrete.length,
    dropshipSuppliers: Array.from(dropship.keys()),
    dropshipLineCount: Array.from(dropship.values()).reduce((sum, g) => sum + g.lines.length, 0),
  });

  return { concrete, dropship };
}
