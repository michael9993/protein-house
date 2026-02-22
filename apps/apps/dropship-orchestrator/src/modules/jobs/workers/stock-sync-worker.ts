import { Worker, Job } from "bullmq";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { gql } from "urql";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { getSupplierCredentials } from "@/modules/lib/metadata-manager";
import { supplierRegistry } from "@/modules/suppliers/registry";
import type { AuthToken } from "@/modules/suppliers/types";

import type { StockSyncJobData } from "../job-types";
import { QUEUE_NAMES, getRedisConnection } from "../queues";

const logger = createLogger("worker:stock-sync");

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FETCH_DROPSHIP_PRODUCTS = gql`
  query FetchDropshipProducts($first: Int!, $after: String) {
    products(
      first: $first
      after: $after
      filter: { metadata: [{ key: "dropship.supplier" }] }
    ) {
      edges {
        node {
          id
          name
          metadata {
            key
            value
          }
          variants {
            id
            sku
            metadata {
              key
              value
            }
            stocks {
              warehouse {
                id
                slug
              }
              quantity
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

const UPDATE_STOCK = gql`
  mutation UpdateVariantStock($variantId: ID!, $warehouseId: ID!, $quantity: Int!) {
    productVariantStocksUpdate(
      variantId: $variantId
      stocks: [{ warehouse: $warehouseId, quantity: $quantity }]
    ) {
      productVariant {
        id
      }
      errors {
        field
        message
      }
    }
  }
`;

const FETCH_WAREHOUSES = gql`
  query FetchWarehouses {
    warehouses(first: 10) {
      edges {
        node {
          id
          slug
          name
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DropshipProduct {
  id: string;
  name: string;
  supplier: string;
  variants: Array<{
    id: string;
    sku: string;
    supplierSku: string;
  }>;
}

interface StockSyncResult {
  totalProducts: number;
  totalVariants: number;
  updated: number;
  outOfStock: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// Worker logic
// ---------------------------------------------------------------------------

async function processStockSync(job: Job<StockSyncJobData>): Promise<void> {
  const { saleorApiUrl, appToken } = job.data;

  logger.info("Starting stock sync job");

  const client = createGraphQLClient({
    saleorApiUrl,
    token: appToken,
  });

  // 1. Fetch all warehouses to find the default one
  const whRes = await client.query(FETCH_WAREHOUSES, {}).toPromise();
  const warehouses = whRes.data?.warehouses?.edges?.map((e: any) => e.node) ?? [];
  const defaultWarehouse = warehouses[0];

  if (!defaultWarehouse) {
    logger.error("No warehouse found — cannot sync stock");
    return;
  }

  // 2. Paginate through all dropship products
  const allProducts: DropshipProduct[] = [];
  let hasNext = true;
  let cursor: string | null = null;

  while (hasNext) {
    const variables: any = { first: 100 };
    if (cursor) variables.after = cursor;

    const res = await client.query(FETCH_DROPSHIP_PRODUCTS, variables).toPromise();

    if (res.error || !res.data?.products) {
      logger.error("Failed to fetch dropship products", { error: res.error?.message });
      break;
    }

    const { edges, pageInfo } = res.data.products;

    for (const edge of edges) {
      const node = edge.node;
      const meta = Object.fromEntries(
        (node.metadata ?? []).map((m: any) => [m.key, m.value]),
      );

      const supplier = meta["dropship.supplier"];
      if (!supplier) continue;

      const variants = (node.variants ?? []).map((v: any) => {
        const vMeta = Object.fromEntries(
          (v.metadata ?? []).map((m: any) => [m.key, m.value]),
        );
        return {
          id: v.id,
          sku: v.sku || "",
          supplierSku: vMeta["dropship.supplierSku"] || "",
        };
      });

      allProducts.push({
        id: node.id,
        name: node.name,
        supplier,
        variants,
      });
    }

    hasNext = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }

  logger.info(`Found ${allProducts.length} dropship products to sync stock for`);

  if (allProducts.length === 0) {
    await logAuditEvent({
      eventType: "STOCK_SYNC_COMPLETE",
      details: { totalProducts: 0, message: "No dropship products found" },
      saleorApiUrl,
      appToken,
    });
    return;
  }

  // 3. Group by supplier
  const bySupplier = new Map<string, DropshipProduct[]>();
  for (const p of allProducts) {
    const existing = bySupplier.get(p.supplier) ?? [];
    existing.push(p);
    bySupplier.set(p.supplier, existing);
  }

  const result: StockSyncResult = {
    totalProducts: allProducts.length,
    totalVariants: allProducts.reduce((sum, p) => sum + p.variants.length, 0),
    updated: 0,
    outOfStock: 0,
    errors: 0,
  };

  // 4. For each supplier, batch-check stock
  for (const [supplierId, products] of bySupplier) {
    const adapter = supplierRegistry.get(supplierId);
    if (!adapter) {
      logger.warn(`No adapter for supplier "${supplierId}" — skipping ${products.length} products`);
      result.errors += products.length;
      continue;
    }

    // Get supplier credentials
    let credentials: AuthToken | null = null;
    try {
      credentials = await getSupplierCredentials(supplierId, client);
    } catch {
      logger.warn(`No credentials for supplier "${supplierId}" — skipping stock sync`);
      result.errors += products.length;
      continue;
    }

    if (!credentials) {
      logger.warn(`Null credentials for supplier "${supplierId}"`);
      result.errors += products.length;
      continue;
    }

    // Collect all supplier SKUs
    const skuMap = new Map<string, { variantId: string; productName: string }>();
    for (const p of products) {
      for (const v of p.variants) {
        if (v.supplierSku) {
          skuMap.set(v.supplierSku, { variantId: v.id, productName: p.name });
        }
      }
    }

    if (skuMap.size === 0) {
      logger.info(`No supplier SKUs for "${supplierId}" — skipping`);
      continue;
    }

    // Batch query stock from supplier
    const supplierSkus = Array.from(skuMap.keys());
    logger.info(`Checking stock for ${supplierSkus.length} SKUs from "${supplierId}"`);

    try {
      // Use adapter's getStockBatch if available, otherwise skip
      if (typeof (adapter as any).getStockBatch !== "function") {
        logger.info(`Adapter "${supplierId}" does not support getStockBatch — skipping`);
        continue;
      }

      const stockResults = await (adapter as any).getStockBatch(supplierSkus, credentials);

      // Process results
      for (const [sku, quantity] of Object.entries(stockResults as Record<string, number>)) {
        const mapping = skuMap.get(sku);
        if (!mapping) continue;

        try {
          await client
            .mutation(UPDATE_STOCK, {
              variantId: mapping.variantId,
              warehouseId: defaultWarehouse.id,
              quantity: Math.max(0, quantity),
            })
            .toPromise();

          result.updated++;

          if (quantity <= 0) {
            result.outOfStock++;
            logger.info(`Out of stock: ${mapping.productName} (SKU: ${sku})`);
          }
        } catch (err: any) {
          logger.error(`Failed to update stock for variant ${mapping.variantId}`, {
            error: err.message,
          });
          result.errors++;
        }
      }
    } catch (err: any) {
      logger.error(`Failed to fetch stock batch from "${supplierId}"`, {
        error: err.message,
      });
      result.errors += skuMap.size;
    }
  }

  // 5. Log result
  logger.info("Stock sync complete", result);

  await logAuditEvent({
    eventType: "STOCK_SYNC_COMPLETE",
    details: result,
    saleorApiUrl,
    appToken,
  });
}

// ---------------------------------------------------------------------------
// Worker factory
// ---------------------------------------------------------------------------

export function createStockSyncWorker(): Worker<StockSyncJobData> {
  const worker = new Worker<StockSyncJobData>(
    QUEUE_NAMES.STOCK_SYNC,
    processStockSync,
    {
      connection: getRedisConnection(),
      concurrency: 1, // One sync at a time
      limiter: {
        max: 1,
        duration: 1000,
      },
    },
  );

  worker.on("completed", (job) => {
    logger.info("Stock sync job completed", { jobId: job.id });
  });

  worker.on("failed", (job, err) => {
    logger.error("Stock sync job failed", {
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}
