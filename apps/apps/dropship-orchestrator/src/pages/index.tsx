import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useRouter } from "next/router";

import { NavBar } from "@/components/ui/NavBar";
import { trpcClient } from "@/modules/trpc/trpc-client";

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
    case "pending":
      return "bg-yellow-50 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function supplierStatusCls(status: string): string {
  switch (status) {
    case "connected":
      return "bg-green-50 text-green-800";
    case "error":
      return "bg-red-50 text-red-800";
    case "token_expiring":
      return "bg-yellow-50 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function supplierLabel(id: string): string {
  switch (id) {
    case "aliexpress":
      return "AliExpress";
    case "cj":
      return "CJ Dropshipping";
    default:
      return id;
  }
}

function DashboardOverview() {
  const router = useRouter();
  const { data, isLoading, error } = trpcClient.dashboard.overview.useQuery();

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-text-primary">Loading dashboard...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-red-700">Error loading dashboard</h1>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <NavBar />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Dropship Orchestrator</h1>
          <p className="text-sm text-text-muted">Multi-supplier dropshipping management</p>
        </div>
        <span
          className={`px-3 py-1 rounded-lg text-xs ${
            data.config.enabled ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {data.config.enabled ? "ENABLED" : "DISABLED"}
        </span>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg flex justify-between items-center ${
                alert.type === "error" ? "bg-red-50 text-red-800" : "bg-yellow-50 text-yellow-800"
              }`}
            >
              <span className="text-sm">{alert.message}</span>
              {alert.type === "warning" && alert.message.includes("exceptions") && (
                <button
                  className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  onClick={() => router.push("/exceptions")}
                >
                  Review
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        <div className="p-4 rounded-lg border border-border">
          <span className="block text-xs text-text-muted">Total Orders</span>
          <h2 className="text-base font-semibold text-text-primary">{data.stats.totalDropshipOrders}</h2>
        </div>
        <div className="p-4 rounded-lg border border-border">
          <span className="block text-xs text-text-muted">Today</span>
          <h2 className="text-base font-semibold text-text-primary">{data.stats.todayOrders}</h2>
        </div>
        <div className="p-4 rounded-lg border border-border">
          <span className="block text-xs text-text-muted">Pending Exceptions</span>
          <h2
            className={`text-base font-semibold ${
              data.stats.pendingExceptions > 0 ? "text-red-700" : "text-text-primary"
            }`}
          >
            {data.stats.pendingExceptions}
          </h2>
        </div>
        <div className="p-4 rounded-lg border border-border">
          <span className="block text-xs text-text-muted">Errors (24h)</span>
          <h2
            className={`text-base font-semibold ${
              data.stats.recentErrors > 0 ? "text-red-700" : "text-text-primary"
            }`}
          >
            {data.stats.recentErrors}
          </h2>
        </div>
        <div className="p-4 rounded-lg border border-border">
          <span className="block text-xs text-text-muted">Active Suppliers</span>
          <h2 className="text-base font-semibold text-text-primary">{data.stats.activeSuppliers}</h2>
        </div>
      </div>

      {/* Suppliers + Status Distribution */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Suppliers */}
        <div className="p-5 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-text-primary">Suppliers</h2>
            <button
              className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              onClick={() => router.push("/suppliers")}
            >
              Manage
            </button>
          </div>
          {data.suppliers.length > 0 ? (
            <div className="flex flex-col gap-2">
              {data.suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex justify-between items-center p-3 rounded-lg border border-border"
                >
                  <span className="font-semibold">{supplier.name}</span>
                  <div className="flex gap-2 items-center">
                    <span className={`px-2 py-1 rounded-lg text-xs ${supplierStatusCls(supplier.status)}`}>
                      {supplier.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs ${
                        supplier.enabled ? "bg-green-50 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {supplier.enabled ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No suppliers configured yet.</p>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="p-5 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-text-primary">Order Status</h2>
            <button
              className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              onClick={() => router.push("/orders")}
            >
              View All
            </button>
          </div>
          {Object.keys(data.statusDistribution).length > 0 ? (
            <div className="flex flex-col gap-2">
              {Object.entries(data.statusDistribution).map(([status, count]) => (
                <div
                  key={status}
                  className="flex justify-between items-center p-3 rounded-lg border border-border"
                >
                  <div className="flex gap-2 items-center">
                    <span className={`px-2 py-1 rounded-lg text-xs ${statusBadgeCls(status)}`}>
                      {status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No dropship orders yet.</p>
          )}
        </div>
      </div>

      {/* Revenue by Supplier */}
      {Object.keys(data.revenueBySupplier).length > 0 && (
        <div className="p-5 rounded-lg border border-border">
          <h2 className="block text-base font-semibold text-text-primary mb-4">Revenue by Supplier</h2>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(data.revenueBySupplier).map(([supplier, revenue]) => (
              <div key={supplier} className="flex-1 p-4 rounded-lg border border-border">
                <span className="block text-xs text-text-muted">{supplierLabel(supplier)}</span>
                <h2 className="text-base font-semibold text-text-primary">
                  ${(revenue as number).toFixed(2)}
                </h2>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="p-5 rounded-lg border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-text-primary">Recent Orders</h2>
          <button
            className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            onClick={() => router.push("/orders")}
          >
            View All
          </button>
        </div>

        {data.recentOrders.length > 0 ? (
          <div className="flex flex-col gap-1">
            {/* Header */}
            <div
              className="grid gap-2 px-4 py-2 bg-gray-50 rounded-lg"
              style={{ gridTemplateColumns: "80px 120px 120px 100px 140px" }}
            >
              <span className="text-xs text-text-muted">Order #</span>
              <span className="text-xs text-text-muted">Supplier</span>
              <span className="text-xs text-text-muted">Status</span>
              <span className="text-xs text-text-muted">Total</span>
              <span className="text-xs text-text-muted">Date</span>
            </div>

            {/* Rows */}
            {data.recentOrders.map((order: any) => (
              <div
                key={order.id}
                className="grid gap-2 px-4 py-3 border border-border rounded-lg items-center"
                style={{ gridTemplateColumns: "80px 120px 120px 100px 140px" }}
              >
                <span className="font-semibold">#{order.number}</span>
                <span className="text-xs">
                  {order.supplier === "aliexpress" ? "AliExpress" : order.supplier === "cj" ? "CJ" : order.supplier}
                </span>
                <div>
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs ${statusBadgeCls(order.status)}`}>
                    {order.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <span className="text-xs">
                  {order.currency} {order.total.toFixed(2)}
                </span>
                <span className="text-xs">
                  {new Date(order.created).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 flex justify-center">
            <p className="text-sm text-text-muted">
              No dropship orders yet. Orders will appear here once products with dropship metadata are purchased.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IndexPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8">
        <p className="text-sm">Connecting to Saleor Dashboard...</p>
      </div>
    );
  }

  return <DashboardOverview />;
}
