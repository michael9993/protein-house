import { Queue } from "bullmq";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { QUEUE_NAMES, getRedisConnection, stockSyncQueue } from "@/modules/jobs/queues";
import { ensureSchedulerStarted } from "@/modules/jobs/scheduler-init";

const FETCH_APP_METADATA = gql`
  query FetchDashboardMetadata {
    app {
      id
      privateMetadata {
        key
        value
      }
    }
  }
`;

const RECENT_ORDERS = gql`
  query RecentOrders($first: Int!) {
    orders(first: $first, sortBy: { field: CREATED_AT, direction: DESC }) {
      edges {
        node {
          id
          number
          created
          status
          total {
            gross {
              amount
              currency
            }
          }
          metadata {
            key
            value
          }
        }
      }
    }
  }
`;

function parseMetadataValue<T>(metadata: Array<{ key: string; value: string }>, key: string, fallback: T): T {
  const entry = metadata.find((m) => m.key === key);
  if (!entry) return fallback;
  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return fallback;
  }
}

export const dashboardRouter = router({
  getJobStats: protectedClientProcedure.query(async () => {
    const stats: Record<string, { completed: number; failed: number; active: number; waiting: number; lastRun?: string }> = {};

    for (const [name, queueName] of Object.entries(QUEUE_NAMES)) {
      try {
        const queue = new Queue(queueName, { connection: getRedisConnection() });
        const [completed, failed, active, waiting] = await Promise.all([
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getActiveCount(),
          queue.getWaitingCount(),
        ]);

        const completedJobs = await queue.getCompleted(0, 0);
        const lastRun = completedJobs[0]?.finishedOn
          ? new Date(completedJobs[0].finishedOn).toISOString()
          : undefined;

        stats[name] = { completed, failed, active, waiting, lastRun };
        await queue.close();
      } catch {
        stats[name] = { completed: 0, failed: 0, active: 0, waiting: 0 };
      }
    }

    return stats;
  }),

  overview: protectedClientProcedure.query(async ({ ctx }) => {
    const [appResult, ordersResult] = await Promise.all([
      ctx.apiClient.query(FETCH_APP_METADATA, {}).toPromise(),
      ctx.apiClient.query(RECENT_ORDERS, { first: 50 }).toPromise(),
    ]);

    if (appResult.error || !appResult.data?.app) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch dashboard data" });
    }

    const appMetadata = appResult.data.app.privateMetadata || [];
    const suppliers = parseMetadataValue(appMetadata, "dropship-suppliers", []);
    const exceptions = parseMetadataValue(appMetadata, "dropship-exceptions", []);
    const config = parseMetadataValue(appMetadata, "dropship-config", { enabled: false });
    const auditLog = parseMetadataValue(appMetadata, "dropship-audit-log", []);

    // Parse dropship orders from recent orders
    const orders = (ordersResult.data?.orders?.edges || [])
      .map((edge: any) => {
        const meta = (edge.node.metadata || []).find((m: any) => m.key === "dropship");
        if (!meta) return null;
        try {
          const dropship = JSON.parse(meta.value);
          // Resolve supplier: use-case stores `suppliers` map, exception approval stores flat `supplier`
          let supplier = dropship.supplier ?? "";
          if (!supplier && dropship.suppliers && typeof dropship.suppliers === "object") {
            const keys = Object.keys(dropship.suppliers);
            if (keys.length > 0) supplier = keys[0];
          }
          return {
            id: edge.node.id,
            number: edge.node.number,
            created: edge.node.created,
            status: dropship.status,
            supplier,
            total: edge.node.total.gross.amount,
            currency: edge.node.total.gross.currency,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calculate stats
    const todayOrders = orders.filter((o: any) => o.created >= today);
    const pendingExceptions = (exceptions as any[]).filter((e) => e.status === "pending_review");
    const recentErrors = (auditLog as any[]).filter(
      (e) => e.status === "error" && new Date(e.timestamp) > last24h,
    );

    // Revenue by supplier (exclude cancelled orders)
    const cancelledStatuses = new Set(["cancelled", "supplier_cancelled", "refunded"]);
    const revenueBySupplier: Record<string, number> = {};
    for (const order of orders as any[]) {
      if (cancelledStatuses.has(order.status)) continue;
      revenueBySupplier[order.supplier] = (revenueBySupplier[order.supplier] || 0) + order.total;
    }

    // Order status distribution
    const statusDistribution: Record<string, number> = {};
    for (const order of orders as any[]) {
      statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;
    }

    return {
      config,
      suppliers: (suppliers as any[]).map((s) => ({
        id: s.id,
        name: s.name,
        enabled: s.enabled,
        status: s.status,
      })),
      stats: {
        totalDropshipOrders: orders.length,
        todayOrders: todayOrders.length,
        pendingExceptions: pendingExceptions.length,
        recentErrors: recentErrors.length,
        activeSuppliers: (suppliers as any[]).filter((s) => s.enabled).length,
      },
      revenueBySupplier,
      statusDistribution,
      recentOrders: (orders as any[]).slice(0, 10),
      alerts: [
        ...(pendingExceptions.length > 0
          ? [{ type: "warning" as const, message: `${pendingExceptions.length} exceptions need review` }]
          : []),
        ...(recentErrors.length > 0
          ? [{ type: "error" as const, message: `${recentErrors.length} errors in last 24h` }]
          : []),
        ...(suppliers as any[])
          .filter((s) => s.status === "token_expiring")
          .map((s) => ({ type: "warning" as const, message: `${s.name} token expiring soon` })),
      ],
    };
  }),

  triggerStockSync: protectedClientProcedure.mutation(async ({ ctx }) => {
    // Ensure workers are running (they only start on app register or ORDER_PAID webhook)
    await ensureSchedulerStarted();

    const activeCount = await stockSyncQueue.getActiveCount();
    const waitingCount = await stockSyncQueue.getWaitingCount();

    if (activeCount > 0 || waitingCount > 0) {
      return { success: false, message: "Stock sync is already running or queued" };
    }

    await stockSyncQueue.add("manual-stock-sync", {
      saleorApiUrl: ctx.saleorApiUrl,
      appToken: ctx.appToken,
    });

    return { success: true, message: "Stock sync job queued" };
  }),
});
