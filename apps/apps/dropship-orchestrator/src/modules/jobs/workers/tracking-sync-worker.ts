import { Worker, Job } from "bullmq";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { gql } from "urql";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { fetchAppId, getSupplierCredentials } from "@/modules/lib/metadata-manager";
import { supplierRegistry } from "@/modules/suppliers/registry";
import type { AuthToken, TrackingInfo } from "@/modules/suppliers/types";

import type { TrackingSyncJobData } from "../job-types";
import { QUEUE_NAMES, getRedisConnection } from "../queues";

const logger = createLogger("worker:tracking-sync");

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FETCH_FORWARDED_ORDERS = gql`
  query FetchForwardedOrders($first: Int!) {
    orders(
      first: $first
      filter: { metadata: [{ key: "dropship" }] }
      sortBy: { field: CREATED_AT, direction: DESC }
    ) {
      edges {
        node {
          id
          number
          metadata {
            key
            value
          }
          fulfillments {
            id
            status
          }
          lines {
            id
            quantity
            variant {
              id
            }
          }
        }
      }
    }
  }
`;

const UPDATE_ORDER_METADATA = gql`
  mutation UpdateOrderMetadataFromSync($id: ID!, $input: [MetadataInput!]!) {
    updateMetadata(id: $id, input: $input) {
      item {
        metadata {
          key
          value
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

const CREATE_FULFILLMENT = gql`
  mutation CreateFulfillmentFromSync($orderId: ID!, $input: FulfillmentCreateInput!) {
    orderFulfill(order: $orderId, input: $input) {
      fulfillments {
        id
        status
        trackingNumber
      }
      errors {
        field
        message
        code
        orderLines
        warehouse
      }
    }
  }
`;

const FETCH_WAREHOUSES = gql`
  query FetchWarehousesForSync($first: Int!) {
    warehouses(first: $first) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DropshipMeta {
  status: string;
  suppliers?: Record<string, string>;
  [key: string]: unknown;
}

interface ForwardedOrder {
  saleorOrderId: string;
  orderNumber: string;
  dropshipMeta: DropshipMeta;
  hasFulfillment: boolean;
  lines: Array<{ id: string; quantity: number; variant: { id: string } | null }>;
}

// ---------------------------------------------------------------------------
// Worker processor
// ---------------------------------------------------------------------------

async function processTrackingSync(job: Job<TrackingSyncJobData>): Promise<void> {
  const { saleorApiUrl, appToken } = job.data;

  logger.info("Tracking sync job started", { jobId: job.id });

  const client = createGraphQLClient({
    saleorApiUrl,
    token: appToken,
  });

  // Resolve app ID
  const appId = await fetchAppId(client);

  if (!appId) {
    logger.error("Cannot resolve app ID — aborting tracking sync");
    return;
  }

  // Fetch orders with dropship metadata
  const { data: ordersData, error: ordersError } = await client
    .query(FETCH_FORWARDED_ORDERS, { first: 100 })
    .toPromise();

  if (ordersError || !ordersData?.orders) {
    logger.error("Failed to fetch orders", { error: ordersError?.message });
    return;
  }

  // Filter to orders with status "forwarded" and no fulfillment
  const forwardedOrders: ForwardedOrder[] = [];

  for (const edge of ordersData.orders.edges) {
    const dropshipEntry = (edge.node.metadata as Array<{ key: string; value: string }>)?.find(
      (m: { key: string }) => m.key === "dropship",
    );

    if (!dropshipEntry) continue;

    try {
      const meta: DropshipMeta = JSON.parse(dropshipEntry.value);

      if (meta.status === "forwarded") {
        forwardedOrders.push({
          saleorOrderId: edge.node.id,
          orderNumber: edge.node.number,
          dropshipMeta: meta,
          hasFulfillment: (edge.node.fulfillments ?? []).length > 0,
          lines: edge.node.lines,
        });
      }
    } catch {
      // Skip malformed
    }
  }

  logger.info("Found forwarded orders for tracking sync", {
    count: forwardedOrders.length,
  });

  if (forwardedOrders.length === 0) {
    return;
  }

  // Group by supplier
  const bySupplier = new Map<string, Array<{ order: ForwardedOrder; supplierOrderId: string }>>();

  for (const order of forwardedOrders) {
    const suppliers = order.dropshipMeta.suppliers ?? {};

    for (const [supplierId, supplierOrderId] of Object.entries(suppliers)) {
      const existing = bySupplier.get(supplierId) ?? [];
      existing.push({ order, supplierOrderId });
      bySupplier.set(supplierId, existing);
    }
  }

  // Get warehouse for fulfillment creation
  const { data: whData } = await client.query(FETCH_WAREHOUSES, { first: 1 }).toPromise();
  const warehouseId: string | null = whData?.warehouses?.edges?.[0]?.node?.id ?? null;

  // Process each supplier group
  for (const [supplierId, orders] of bySupplier.entries()) {
    const adapter = supplierRegistry.getAdapter(supplierId);

    if (!adapter) {
      logger.warn("No adapter registered for supplier — skipping", { supplierId });
      continue;
    }

    const creds = await getSupplierCredentials(client, appId, supplierId);

    if (!creds) {
      logger.warn("No credentials for supplier — skipping", { supplierId });
      continue;
    }

    const authToken: AuthToken = {
      accessToken: creds.accessToken ?? "",
      expiresAt: creds.tokenExpiresAt
        ? new Date(creds.tokenExpiresAt)
        : new Date(Date.now() + 86400_000),
      refreshToken: ("refreshToken" in creds ? creds.refreshToken : undefined) as
        | string
        | undefined,
    };

    for (const { order, supplierOrderId } of orders) {
      try {
        // Check order status
        const statusResult = await adapter.getOrderStatus(supplierOrderId, authToken);

        if (statusResult.isErr()) {
          logger.warn("Failed to get order status", {
            supplierId,
            supplierOrderId,
            error: statusResult.error.message,
          });
          continue;
        }

        const status = statusResult.value;

        // Handle cancelled by supplier
        if (status === "CANCELLED") {
          await client
            .mutation(UPDATE_ORDER_METADATA, {
              id: order.saleorOrderId,
              input: [
                {
                  key: "dropship",
                  value: JSON.stringify({
                    ...order.dropshipMeta,
                    status: "supplier_cancelled",
                    cancelledAt: new Date().toISOString(),
                  }),
                },
              ],
            })
            .toPromise();

          await logAuditEvent(client, {
            type: "tracking_synced",
            supplierId,
            orderId: order.saleorOrderId,
            action: `Supplier cancelled order ${supplierOrderId}`,
            status: "success",
            timestamp: new Date().toISOString(),
          });

          logger.info("Order marked as supplier_cancelled", {
            saleorOrderId: order.saleorOrderId,
            supplierOrderId,
          });
          continue;
        }

        // Try to get tracking info
        if (status === "SHIPPED" || status === "DELIVERED") {
          const trackingResult = await adapter.getTrackingInfo(supplierOrderId, authToken);

          if (trackingResult.isOk()) {
            const tracking: TrackingInfo = trackingResult.value;

            // Create Saleor fulfillment if we have a tracking number and no existing fulfillment
            if (tracking.trackingNumber && !order.hasFulfillment && warehouseId) {
              const fulfillmentLines = order.lines
                .filter((l) => l.variant !== null)
                .map((l) => ({
                  orderLineId: l.id,
                  stocks: [{ warehouse: warehouseId, quantity: l.quantity }],
                }));

              if (fulfillmentLines.length > 0) {
                const { error: fulfillError } = await client
                  .mutation(CREATE_FULFILLMENT, {
                    orderId: order.saleorOrderId,
                    input: {
                      lines: fulfillmentLines,
                      trackingNumber: tracking.trackingNumber,
                      notifyCustomer: true,
                    },
                  })
                  .toPromise();

                if (fulfillError) {
                  logger.error("Failed to create fulfillment during sync", {
                    saleorOrderId: order.saleorOrderId,
                    error: fulfillError.message,
                  });
                } else {
                  logger.info("Fulfillment created during tracking sync", {
                    saleorOrderId: order.saleorOrderId,
                    trackingNumber: tracking.trackingNumber,
                  });
                }
              }
            }

            // Update metadata
            const newStatus = status === "DELIVERED" ? "delivered" : "shipped";

            await client
              .mutation(UPDATE_ORDER_METADATA, {
                id: order.saleorOrderId,
                input: [
                  {
                    key: "dropship",
                    value: JSON.stringify({
                      ...order.dropshipMeta,
                      status: newStatus,
                      trackingNumber: tracking.trackingNumber,
                      trackingUrl: tracking.trackingUrl ?? "",
                      carrier: tracking.carrier,
                      shippedAt: new Date().toISOString(),
                    }),
                  },
                ],
              })
              .toPromise();

            await logAuditEvent(client, {
              type: "tracking_synced",
              supplierId,
              orderId: order.saleorOrderId,
              action: `Tracking synced: ${tracking.trackingNumber} (${tracking.carrier})`,
              response: {
                trackingNumber: tracking.trackingNumber,
                carrier: tracking.carrier,
                status: newStatus,
              },
              status: "success",
              timestamp: new Date().toISOString(),
            });

            logger.info("Tracking synced", {
              saleorOrderId: order.saleorOrderId,
              trackingNumber: tracking.trackingNumber,
              newStatus,
            });
          } else {
            logger.warn("Tracking info not yet available", {
              supplierId,
              supplierOrderId,
              error: trackingResult.error.message,
            });
          }
        }
      } catch (e) {
        logger.error("Error processing order in tracking sync", {
          saleorOrderId: order.saleorOrderId,
          supplierOrderId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  logger.info("Tracking sync job completed", {
    jobId: job.id,
    processedOrders: forwardedOrders.length,
  });
}

// ---------------------------------------------------------------------------
// Worker creation
// ---------------------------------------------------------------------------

/**
 * Create and return a BullMQ Worker for tracking sync jobs.
 * The worker should be started on app startup.
 */
export function createTrackingSyncWorker(): Worker<TrackingSyncJobData> {
  const worker = new Worker<TrackingSyncJobData>(
    QUEUE_NAMES.TRACKING_SYNC,
    processTrackingSync,
    {
      connection: getRedisConnection(),
      concurrency: 1, // Process one sync job at a time
      limiter: {
        max: 1,
        duration: 60_000, // At most 1 job per minute
      },
    },
  );

  worker.on("completed", (job) => {
    logger.info("Tracking sync job completed", { jobId: job?.id });
  });

  worker.on("failed", (job, err) => {
    logger.error("Tracking sync job failed", {
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}
