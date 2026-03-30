import type { NextApiRequest, NextApiResponse } from "next";
import { gql } from "urql";
import { z } from "zod";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { withCJWebhookAuth } from "@/modules/webhooks/cj/shared";

const logger = createLogger("webhook:cj:stock");

// ---------------------------------------------------------------------------
// DISABLED: CJ sends stock webhooks every second, flooding the system.
// Stock sync is handled by the background polling job (every 4 hours).
// To re-enable, remove this handler override and the early return below.
// ---------------------------------------------------------------------------

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Acknowledge immediately without processing — stock is synced via polling job
  res.status(200).json({ success: true, message: "Stock webhook disabled — using polling" });
}

// ---------------------------------------------------------------------------
// Original handler below (kept for reference, not exported)
// ---------------------------------------------------------------------------

// SKU miss cache — avoids repeated GraphQL lookups for CJ SKUs not in Saleor.
// CJ sends stock webhooks for every product in the account, most of which
// aren't imported. Without this cache, each miss triggers 2 GraphQL queries.
// ---------------------------------------------------------------------------

const MISS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const skuMissCache = new Map<string, number>(); // sku -> timestamp

function isKnownMiss(sku: string): boolean {
  const ts = skuMissCache.get(sku);
  if (!ts) return false;
  if (Date.now() - ts > MISS_CACHE_TTL) {
    skuMissCache.delete(sku);
    return false;
  }
  return true;
}

function recordMiss(sku: string): void {
  skuMissCache.set(sku, Date.now());
  // Evict oldest entries if cache grows too large
  if (skuMissCache.size > 5000) {
    const oldest = skuMissCache.keys().next().value;
    if (oldest) skuMissCache.delete(oldest);
  }
}

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

const CJStockEntrySchema = z.object({
  vid: z.string(),
  pid: z.string().optional(),
  storageNum: z.number(),
  areaEn: z.string().optional(),
  areaId: z.string().optional(),
  countryCode: z.string().optional(),
});

const CJStockWebhookPayloadSchema = z.object({
  messageId: z.string().min(1),
  type: z.literal("STOCK"),
  messageType: z.string().optional(),
  openId: z.number().optional(),
  params: z.record(z.string(), z.array(CJStockEntrySchema)).optional().default({}),
});

type CJStockWebhookPayload = z.infer<typeof CJStockWebhookPayloadSchema>;

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FIND_VARIANT_BY_SKU = gql`
  query FindVariantBySku($sku: String!) {
    productVariants(first: 1, filter: { sku: $sku }) {
      edges {
        node {
          id
          sku
          product {
            id
            name
          }
          stocks {
            id
            warehouse {
              id
              name
            }
            quantity
          }
        }
      }
    }
  }
`;

const FIND_VARIANT_BY_METADATA = gql`
  query FindVariantByMetadata($first: Int!) {
    productVariants(first: $first) {
      edges {
        node {
          id
          sku
          product {
            id
            name
            metadata {
              key
              value
            }
          }
          stocks {
            id
            warehouse {
              id
            }
            quantity
          }
        }
      }
    }
  }
`;

const UPDATE_VARIANT_STOCKS = gql`
  mutation UpdateVariantStocks($variantId: ID!, $stocks: [StockInput!]!) {
    productVariantStocksUpdate(variantId: $variantId, stocks: $stocks) {
      productVariant {
        id
        sku
        stocks {
          warehouse {
            id
            name
          }
          quantity
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

const FETCH_WAREHOUSES = gql`
  query FetchWarehousesForStock($first: Int!) {
    warehouses(first: $first) {
      edges {
        node {
          id
          name
          slug
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function _originalHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const parseResult = CJStockWebhookPayloadSchema.safeParse(req.body);

  if (req.method === "POST" && !parseResult.success) {
    logger.warn("CJ stock webhook: invalid payload", {
      errors: parseResult.error?.flatten().fieldErrors,
    });
    res.status(200).json({ success: true, message: "Invalid payload — acknowledged" });
    return;
  }

  const payload: CJStockWebhookPayload | undefined = parseResult.success ? parseResult.data : undefined;

  // Stock entries use 1-hour dedup TTL (more frequent updates expected)
  await withCJWebhookAuth(
    req,
    res,
    { messageId: payload?.messageId ?? "", dedupTtl: 3600, loggerName: "webhook:cj:stock" },
    async ({ client, startTime }) => {
      if (!payload) return;

      // Flatten params map: { "<vid>": [{ vid, storageNum, ... }] } -> array of stock entries
      const stockEntries = Object.entries(payload.params).flatMap(([_vid, entries]) => entries);

      if (stockEntries.length === 0) {
        // CJ sends frequent empty heartbeats — debug level to reduce noise
        logger.debug("CJ stock webhook: no stock entries in payload", { messageId: payload.messageId });
        res.status(200).json({ success: true, message: "No stock entries — acknowledged" });
        return;
      }

      // Check if all entries are known misses — if so, skip the detailed "received" log
      const allCached = stockEntries.every((e) => isKnownMiss(e.vid));
      if (!allCached) {
        logger.info("CJ stock webhook received", {
          messageId: payload.messageId,
          entryCount: stockEntries.length,
          vids: stockEntries.map((e) => e.vid),
        });
      }

      // --- Process each stock entry ---
      let updatedCount = 0;

      let skippedCount = 0;

      for (const entry of stockEntries) {
        const variantSku = entry.vid;
        const stockQuantity = entry.storageNum;

        // Skip SKUs we already know aren't in Saleor (avoids 2 GraphQL queries per miss)
        if (isKnownMiss(variantSku)) {
          skippedCount++;
          continue;
        }

        // --- Find the Saleor variant ---
        const { data: variantData } = await client
          .query(FIND_VARIANT_BY_SKU, { sku: variantSku })
          .toPromise();

        let variantId: string | null = null;
        let existingStocks: Array<{ warehouse: { id: string }; quantity: number }> = [];

        if (variantData?.productVariants?.edges?.length > 0) {
          const variant = variantData.productVariants.edges[0].node;
          variantId = variant.id;
          existingStocks = variant.stocks ?? [];
        } else {
          // Fallback: search by product metadata for the supplierSku
          const { data: metaData } = await client
            .query(FIND_VARIANT_BY_METADATA, { first: 100 })
            .toPromise();

          if (metaData?.productVariants?.edges) {
            for (const edge of metaData.productVariants.edges) {
              const variantMeta = (edge.node.product.metadata as Array<{ key: string; value: string }>)?.find(
                (m: { key: string }) => m.key === "dropship.supplierSku",
              );
              const dropshipMeta = (edge.node.product.metadata as Array<{ key: string; value: string }>)?.find(
                (m: { key: string }) => m.key === "dropship",
              );

              if (variantMeta?.value === variantSku) {
                variantId = edge.node.id;
                existingStocks = edge.node.stocks ?? [];
                break;
              }

              if (dropshipMeta) {
                try {
                  const parsed = JSON.parse(dropshipMeta.value);
                  if (parsed.supplierSku === variantSku) {
                    variantId = edge.node.id;
                    existingStocks = edge.node.stocks ?? [];
                    break;
                  }
                } catch {
                  // Skip malformed
                }
              }
            }
          }
        }

        if (!variantId) {
          recordMiss(variantSku);
          logger.debug("CJ stock webhook: no matching variant found", { sku: variantSku });
          continue;
        }

        // --- Determine warehouse and update stock ---
        let warehouseId: string;

        if (existingStocks.length > 0) {
          warehouseId = existingStocks[0].warehouse.id;
        } else {
          const { data: warehouseData } = await client
            .query(FETCH_WAREHOUSES, { first: 1 })
            .toPromise();

          warehouseId = warehouseData?.warehouses?.edges?.[0]?.node?.id;

          if (!warehouseId) {
            logger.error("No warehouses found — cannot update stock");
            continue;
          }
        }

        const { data: updateData, error: updateError } = await client
          .mutation(UPDATE_VARIANT_STOCKS, {
            variantId,
            stocks: [{ warehouse: warehouseId, quantity: stockQuantity }],
          })
          .toPromise();

        if (updateError || (updateData?.productVariantStocksUpdate?.errors?.length > 0)) {
          const errors = updateData?.productVariantStocksUpdate?.errors ?? [];
          logger.error("Failed to update variant stock", {
            variantId,
            sku: variantSku,
            error: updateError?.message ?? JSON.stringify(errors),
          });

          await logAuditEvent(client, {
            type: "stock_updated",
            supplierId: "cj",
            action: `Failed to update stock for SKU ${variantSku}`,
            request: { sku: variantSku, quantity: stockQuantity },
            status: "failure",
            error: updateError?.message ?? JSON.stringify(errors),
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          });
          continue;
        }

        updatedCount++;

        await logAuditEvent(client, {
          type: "stock_updated",
          supplierId: "cj",
          action: `Updated stock for SKU ${variantSku}: quantity=${stockQuantity}`,
          request: { sku: variantSku, quantity: stockQuantity },
          status: "success",
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });

        logger.info("CJ stock entry processed", {
          variantId,
          sku: variantSku,
          newQuantity: stockQuantity,
        });
      }

      // Only log completion at info level if something was actually updated
      const logLevel = updatedCount > 0 ? "info" : "debug";
      logger[logLevel]("CJ stock webhook complete", {
        messageId: payload.messageId,
        totalEntries: stockEntries.length,
        updatedCount,
        skippedCount,
        duration: Date.now() - startTime,
      });

      res.status(200).json({ success: true, updated: updatedCount });
    },
  );
}
