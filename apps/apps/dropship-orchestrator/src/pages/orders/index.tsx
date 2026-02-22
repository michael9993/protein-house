import { useAppBridge } from "@saleor/app-sdk/app-bridge";
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
  const [statusFilter, setStatusFilter] = useState<DropshipStatus | "all">("all");
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilter | "all">("all");
  const [cursor, setCursor] = useState<string | null>(null);

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

      {/* Orders Table */}
      <div className="flex flex-col gap-1">
        {/* Header */}
        <div
          className="grid gap-2 px-4 py-2 bg-gray-50 rounded-lg"
          style={{ gridTemplateColumns: "80px 1fr 120px 100px 100px 140px 120px" }}
        >
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
            style={{ gridTemplateColumns: "80px 1fr 120px 100px 100px 140px 120px" }}
          >
            <span className="font-semibold">#{order.number}</span>
            <span className="text-sm">{order.supplier === "aliexpress" ? "AliExpress" : "CJ"}</span>
            <div>
              <span className={`inline-block px-2 py-1 rounded-lg text-xs ${statusBadgeCls(order.dropshipStatus)}`}>
                {order.dropshipStatus.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <span className="text-xs">
              {order.supplierCost != null
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
              {order.dropshipStatus === "failed" && (
                <button
                  className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  disabled={retryMutation.isLoading}
                  onClick={() => retryMutation.mutate({ orderId: order.id })}
                >
                  Retry
                </button>
              )}
              {order.trackingNumber && (
                <span className="text-xs text-text-muted" title={order.trackingNumber}>
                  Tracked
                </span>
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
