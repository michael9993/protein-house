import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useRouter } from "next/router";
import { useState } from "react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

type DropshipStatus = "pending" | "forwarded" | "shipped" | "delivered" | "cancelled" | "supplier_cancelled" | "failed" | "exception";
type SupplierFilter = "aliexpress" | "cj";

const STATUS_OPTIONS: Array<{ value: DropshipStatus | "all"; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "forwarded", label: "Forwarded" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "supplier_cancelled", label: "Supplier Cancelled" },
  { value: "failed", label: "Failed" },
  { value: "exception", label: "Exception" },
];

const SUPPLIER_OPTIONS: Array<{ value: SupplierFilter | "all"; label: string }> = [
  { value: "all", label: "All Suppliers" },
  { value: "aliexpress", label: "AliExpress" },
  { value: "cj", label: "CJ Dropshipping" },
];

function statusBadgeCls(status: string): string {
  switch (status) {
    case "delivered":
    case "shipped":
      return "bg-green-50 text-green-800";
    case "failed":
    case "cancelled":
    case "supplier_cancelled":
      return "bg-red-50 text-red-800";
    case "exception":
      return "bg-yellow-50 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function OrdersList() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<DropshipStatus | "all">("all");
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilter | "all">("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch } = trpcClient.orders.list.useQuery({
    first: 20,
    after: cursor,
    status: statusFilter === "all" ? undefined : statusFilter,
    supplierId: supplierFilter === "all" ? undefined : supplierFilter,
  });

  const retryMutation = trpcClient.orders.retryForward.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const cancelMutation = trpcClient.orders.cancelOrder.useMutation({
    onSuccess: (result) => {
      if (result.errors.length > 0) {
        alert(`Order cancelled locally but supplier cancel had issues:\n${result.errors.join("\n")}`);
      }
      refetch();
    },
  });

  const bulkCancelMutation = trpcClient.orders.bulkCancel.useMutation({
    onSuccess: (result) => {
      const failed = result.results.filter((r) => !r.success);
      if (failed.length > 0) {
        alert(`${result.results.length - failed.length} cancelled, ${failed.length} failed.`);
      }
      setSelectedIds(new Set());
      refetch();
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const cancellableStatuses = ["forwarded", "pending", "failed"];
  const cancellableOrders = data?.orders.filter((o: any) => cancellableStatuses.includes(o.dropshipStatus)) ?? [];

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-text-primary">Loading orders...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-red-600">Error loading orders</h1>
        <p className="text-sm text-text-primary">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <NavBar />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Dropship Orders</h1>
          <p className="text-sm text-text-muted">
            {data?.totalCount ?? 0} total orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Status</span>
          <div className="flex gap-1 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={
                  statusFilter === opt.value
                    ? "px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light transition-colors"
                    : "px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                }
                onClick={() => {
                  setStatusFilter(opt.value as DropshipStatus | "all");
                  setCursor(null);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Supplier</span>
          <div className="flex gap-1">
            {SUPPLIER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={
                  supplierFilter === opt.value
                    ? "px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light transition-colors"
                    : "px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                }
                onClick={() => {
                  setSupplierFilter(opt.value as SupplierFilter | "all");
                  setCursor(null);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-yellow-50 rounded-lg flex justify-between items-center">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              disabled={bulkCancelMutation.isLoading}
              onClick={() => {
                if (confirm(`Cancel ${selectedIds.size} order(s)?`)) {
                  bulkCancelMutation.mutate({ orderIds: Array.from(selectedIds) });
                }
              }}
            >
              {bulkCancelMutation.isLoading ? "Cancelling..." : "Cancel Selected"}
            </button>
            <button
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="flex flex-col gap-1">
        {/* Header */}
        <div
          className="grid gap-2 px-4 py-2 bg-gray-50 rounded-lg items-center"
          style={{ gridTemplateColumns: "32px 80px 1fr 120px 100px 100px 140px 120px" }}
        >
          <div>
            <input
              type="checkbox"
              checked={cancellableOrders.length > 0 && cancellableOrders.every((o: any) => selectedIds.has(o.id))}
              onChange={() => {
                if (cancellableOrders.every((o: any) => selectedIds.has(o.id))) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(cancellableOrders.map((o: any) => o.id)));
                }
              }}
              className="w-4 h-4"
            />
          </div>
          <span className="text-xs text-text-muted">Order #</span>
          <span className="text-xs text-text-muted">Supplier</span>
          <span className="text-xs text-text-muted">Status</span>
          <span className="text-xs text-text-muted">Cost</span>
          <span className="text-xs text-text-muted">Total</span>
          <span className="text-xs text-text-muted">Date</span>
          <span className="text-xs text-text-muted">Actions</span>
        </div>

        {/* Rows */}
        {data?.orders.map((order: any) => (
          <div
            key={order.id}
            className="grid gap-2 px-4 py-3 border border-border rounded-lg items-center"
            style={{ gridTemplateColumns: "32px 80px 1fr 120px 100px 100px 140px 120px" }}
          >
            <div>
              {cancellableStatuses.includes(order.dropshipStatus) ? (
                <input
                  type="checkbox"
                  checked={selectedIds.has(order.id)}
                  onChange={() => toggleSelect(order.id)}
                  className="w-4 h-4"
                />
              ) : (
                <span />
              )}
            </div>
            <button
              className="font-semibold text-left hover:text-brand transition-colors"
              onClick={() => router.push(`/orders/${order.id}`)}
            >
              #{order.number}
            </button>
            <div className="flex flex-col">
              <span className="text-sm">{order.supplier === "aliexpress" ? "AliExpress" : order.supplier === "cj" ? "CJ" : order.supplier || "—"}</span>
              {order.supplierOrderId && (
                <span className="text-xs text-text-muted truncate" title={order.supplierOrderId}>{order.supplierOrderId}</span>
              )}
            </div>
            <div>
              <span className={`inline-block px-2 py-1 rounded-lg text-xs ${statusBadgeCls(order.dropshipStatus)}`}>
                {order.dropshipStatus.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <span className="text-xs">
              {order.supplierCost != null && order.supplierCost > 0
                ? `$${order.supplierCost.toFixed(2)}`
                : "--"}
            </span>
            <span className="text-xs">
              {order.total.currency} {order.total.amount.toFixed(2)}
            </span>
            <span className="text-xs">
              {new Date(order.created).toLocaleDateString()}
            </span>
            <div className="flex gap-1">
              <button
                className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                View
              </button>
              {order.dropshipStatus === "failed" && (
                <button
                  className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  disabled={retryMutation.isLoading}
                  onClick={() => retryMutation.mutate({ orderId: order.id })}
                >
                  Retry
                </button>
              )}
              {(order.dropshipStatus === "forwarded" || order.dropshipStatus === "pending" || order.dropshipStatus === "failed") && (
                <button
                  className="px-2.5 py-1 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                  disabled={cancelMutation.isLoading}
                  onClick={() => {
                    if (confirm(`Cancel order #${order.number}? This will attempt to cancel at the supplier too.`)) {
                      cancelMutation.mutate({ orderId: order.id });
                    }
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}

        {data?.orders.length === 0 && (
          <div className="p-8 flex justify-center">
            <p className="text-sm text-text-muted">No dropship orders found matching the current filters.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.pageInfo.hasNextPage && (
        <div className="flex justify-center">
          <button
            className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            onClick={() => setCursor(data.pageInfo.endCursor)}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8">
        <p className="text-sm text-text-primary">Connecting to Saleor Dashboard...</p>
      </div>
    );
  }

  return <OrdersList />;
}
