import { Worker, Job } from "bullmq";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { gql } from "urql";
import { v4 as uuidv4 } from "uuid";

import { createLogger } from "@/logger";
import { logAuditEvent } from "@/modules/audit/audit-logger";
import { fetchAppId, getSupplierCredentials } from "@/modules/lib/metadata-manager";
import { supplierRegistry } from "@/modules/suppliers/registry";
import type { AuthToken } from "@/modules/suppliers/types";

import type { ReconciliationJobData } from "../job-types";
import { QUEUE_NAMES, getRedisConnection } from "../queues";

const logger = createLogger("worker:reconciliation");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Orders older than this threshold without a terminal status are flagged. */
const STALE_ORDER_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours

/** Terminal statuses — orders in these states are not reconciled. */
const TERMINAL_STATUSES = new Set(["shipped", "delivered", "cancelled", "supplier_cancelled"]);

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FETCH_DROPSHIP_ORDERS = gql`
  query FetchDropshipOrdersForReconciliation($first: Int!) {
    orders(
      first: $first
      filter: { metadata: [{ key: "dropship" }] }
      sortBy: { field: CREATED_AT, direction: DESC }
    ) {
      edges {
        node {
          id
          number
          created
          metadata {
            key
            value
          }
        }
      }
    }
  }
`;

const UPDATE_ORDER_METADATA = gql`
  mutation UpdateOrderMetadataFromReconciliation($id: ID!, $input: [MetadataInput!]!) {
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

const FETCH_APP_METADATA = gql`
  query FetchAppMetadataForReconciliation {
    app {
      id
      privateMetadata {
        key
        value
      }
    }
  }
`;

const UPDATE_APP_METADATA = gql`
  mutation UpdateExceptionFromReconciliation($id: ID!, $input: [MetadataInput!]!) {
    updatePrivateMetadata(id: $id, input: $input) {
      item {
        privateMetadata {
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DropshipMeta {
  status: string;
  suppliers?: Record<string, string>;
  forwardedAt?: string;
  [key: string]: unknown;
}

interface ExceptionRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Worker processor
// ---------------------------------------------------------------------------

async function processReconciliation(job: Job<ReconciliationJobData>): Promise<void> {
  const { saleorApiUrl, appToken } = job.data;

  logger.info("Reconciliation job started", { jobId: job.id });

  const client = createGraphQLClient({
    saleorApiUrl,
    token: appToken,
  });

  const appId = await fetchAppId(client);

  if (!appId) {
    logger.error("Cannot resolve app ID — aborting reconciliation");
    return;
  }

  // Fetch all dropship orders
  const { data: ordersData, error: ordersError } = await client
    .query(FETCH_DROPSHIP_ORDERS, { first: 100 })
    .toPromise();

  if (ordersError || !ordersData?.orders) {
    logger.error("Failed to fetch orders for reconciliation", { error: ordersError?.message });
    return;
  }

  const now = Date.now();
  let flaggedCount = 0;
  let checkedCount = 0;

  for (const edge of ordersData.orders.edges) {
    const dropshipEntry = (edge.node.metadata as Array<{ key: string; value: string }>)?.find(
      (m: { key: string }) => m.key === "dropship",
    );

    if (!dropshipEntry) continue;

    let meta: DropshipMeta;

    try {
      meta = JSON.parse(dropshipEntry.value);
    } catch {
      continue;
    }

    // Skip orders already in terminal status
    if (TERMINAL_STATUSES.has(meta.status)) {
      continue;
    }

    // Skip orders that are too new
    const forwardedAt = meta.forwardedAt
      ? new Date(meta.forwardedAt).getTime()
      : new Date(edge.node.created).getTime();

    if (now - forwardedAt < STALE_ORDER_THRESHOLD_MS) {
      continue;
    }

    checkedCount++;

    // Check supplier status for each supplier order
    const suppliers = meta.suppliers ?? {};

    for (const [supplierId, supplierOrderId] of Object.entries(suppliers)) {
      const adapter = supplierRegistry.getAdapter(supplierId);

      if (!adapter) {
        continue;
      }

      const creds = await getSupplierCredentials(client, appId, supplierId);

      if (!creds) {
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

      try {
        const statusResult = await adapter.getOrderStatus(supplierOrderId, authToken);

        if (statusResult.isErr()) {
          logger.warn("Cannot get supplier status during reconciliation", {
            supplierId,
            supplierOrderId,
            error: statusResult.error.message,
          });

          // Flag as discrepancy if order is old enough
          await flagDiscrepancy(client, {
            orderId: edge.node.id,
            orderNumber: edge.node.number,
            supplierId,
            supplierOrderId,
            saleorStatus: meta.status,
            supplierStatus: "unknown",
            reason: `Cannot fetch supplier status: ${statusResult.error.message}`,
          });
          flaggedCount++;
          continue;
        }

        const supplierStatus = statusResult.value;

        // Map supplier status to expected Saleor status
        const expectedSaleorStatus = mapSupplierToSaleorStatus(supplierStatus);

        if (expectedSaleorStatus && expectedSaleorStatus !== meta.status) {
          logger.warn("Status discrepancy detected", {
            saleorOrderId: edge.node.id,
            saleorStatus: meta.status,
            supplierStatus,
            expectedSaleorStatus,
          });

          // Update Saleor to match supplier
          await client
            .mutation(UPDATE_ORDER_METADATA, {
              id: edge.node.id,
              input: [
                {
                  key: "dropship",
                  value: JSON.stringify({
                    ...meta,
                    status: expectedSaleorStatus,
                    reconciledAt: new Date().toISOString(),
                  }),
                },
              ],
            })
            .toPromise();

          await flagDiscrepancy(client, {
            orderId: edge.node.id,
            orderNumber: edge.node.number,
            supplierId,
            supplierOrderId,
            saleorStatus: meta.status,
            supplierStatus,
            reason: `Auto-reconciled: Saleor status "${meta.status}" updated to "${expectedSaleorStatus}" to match supplier status "${supplierStatus}"`,
          });

          flaggedCount++;
        }
      } catch (e) {
        logger.error("Error during reconciliation for order", {
          saleorOrderId: edge.node.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  await logAuditEvent(client, {
    type: "reconciliation",
    action: `Reconciliation complete: checked ${checkedCount} stale orders, flagged ${flaggedCount} discrepancies`,
    status: flaggedCount > 0 ? "failure" : "success",
    response: { checkedCount, flaggedCount },
    timestamp: new Date().toISOString(),
  });

  logger.info("Reconciliation job completed", {
    jobId: job.id,
    checkedCount,
    flaggedCount,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapSupplierToSaleorStatus(supplierStatus: string): string | null {
  const map: Record<string, string> = {
    PENDING: "forwarded",
    PROCESSING: "forwarded",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "supplier_cancelled",
    FAILED: "failed",
  };

  return map[supplierStatus] ?? null;
}

async function flagDiscrepancy(
  client: ReturnType<typeof createGraphQLClient>,
  params: {
    orderId: string;
    orderNumber: string;
    supplierId: string;
    supplierOrderId: string;
    saleorStatus: string;
    supplierStatus: string;
    reason: string;
  },
): Promise<void> {
  // Load existing exceptions
  const { data: appData } = await client.query(FETCH_APP_METADATA, {}).toPromise();

  if (!appData?.app) return;

  const appId: string = appData.app.id;
  const exceptionsEntry = (appData.app.privateMetadata as Array<{ key: string; value: string }>)?.find(
    (m: { key: string }) => m.key === "dropship-exceptions",
  );

  let exceptions: ExceptionRecord[] = [];

  if (exceptionsEntry) {
    try {
      exceptions = JSON.parse(exceptionsEntry.value);
    } catch {
      exceptions = [];
    }
  }

  exceptions.push({
    id: uuidv4(),
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    reason: "supplier_error",
    details: `[Reconciliation] ${params.reason} | supplier=${params.supplierId}, supplierOrderId=${params.supplierOrderId}, saleorStatus=${params.saleorStatus}, supplierStatus=${params.supplierStatus}`,
    status: "pending_review",
    createdAt: new Date().toISOString(),
  });

  const trimmed = exceptions.slice(-500);

  await client
    .mutation(UPDATE_APP_METADATA, {
      id: appId,
      input: [{ key: "dropship-exceptions", value: JSON.stringify(trimmed) }],
    })
    .toPromise();
}

// ---------------------------------------------------------------------------
// Worker creation
// ---------------------------------------------------------------------------

/**
 * Create and return a BullMQ Worker for reconciliation jobs.
 */
export function createReconciliationWorker(): Worker<ReconciliationJobData> {
  const worker = new Worker<ReconciliationJobData>(
    QUEUE_NAMES.RECONCILIATION,
    processReconciliation,
    {
      connection: getRedisConnection(),
      concurrency: 1,
    },
  );

  worker.on("completed", (job) => {
    logger.info("Reconciliation job completed", { jobId: job?.id });
  });

  worker.on("failed", (job, err) => {
    logger.error("Reconciliation job failed", {
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}
