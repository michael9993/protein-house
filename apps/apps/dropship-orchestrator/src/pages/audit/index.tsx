import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useCallback, useState } from "react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

type AuditType = "order_forward" | "order_cancel" | "tracking_sync" | "stock_sync" | "token_refresh" | "fraud_check" | "exception_create" | "api_call";
type AuditStatus = "success" | "failure" | "error";

const TYPE_OPTIONS: Array<{ value: AuditType | "all"; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "order_forward", label: "Order Forward" },
  { value: "order_cancel", label: "Order Cancel" },
  { value: "tracking_sync", label: "Tracking Sync" },
  { value: "stock_sync", label: "Stock Sync" },
  { value: "token_refresh", label: "Token Refresh" },
  { value: "fraud_check", label: "Fraud Check" },
  { value: "exception_create", label: "Exception Create" },
  { value: "api_call", label: "API Call" },
];

const STATUS_OPTIONS: Array<{ value: AuditStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
  { value: "error", label: "Error" },
];

const SUPPLIER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Suppliers" },
  { value: "aliexpress", label: "AliExpress" },
  { value: "cj", label: "CJ" },
];

function statusBadgeCls(status: string): string {
  switch (status) {
    case "success":
      return "bg-green-50 text-green-800";
    case "failure":
      return "bg-yellow-50 text-yellow-800";
    case "error":
      return "bg-red-50 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function AuditLog() {
  const [typeFilter, setTypeFilter] = useState<AuditType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AuditStatus | "all">("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [clearDays, setClearDays] = useState(30);

  const { data, isLoading, error, refetch } = trpcClient.audit.list.useQuery({
    limit: 100,
    offset: 0,
    type: typeFilter === "all" ? undefined : typeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    supplierId: supplierFilter === "all" ? undefined : supplierFilter,
    orderId: orderIdSearch.trim() || undefined,
  });

  const clearMutation = trpcClient.audit.clear.useMutation({
    onSuccess: (result) => {
      setClearMessage(`Cleared ${result.removed} entries. ${result.remaining} remaining.`);
      refetch();
      setTimeout(() => setClearMessage(null), 5000);
    },
    onError: (err) => {
      setClearMessage(`Error: ${err.message}`);
    },
  });

  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const utils = trpcClient.useContext();

  const handleExportCsv = useCallback(async () => {
    setIsExporting(true);
    try {
      const csv = await utils.audit.exportCsv.fetch({
        type: typeFilter === "all" ? undefined : typeFilter,
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setClearMessage(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  }, [typeFilter]);

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-text-primary">Loading audit log...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-red-600">Error loading audit log</h1>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <NavBar />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Audit Log</h1>
          <p className="text-sm text-text-muted">
            {data?.totalCount ?? 0} events matching filters
          </p>
        </div>
        <button
          className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          disabled={isExporting}
          onClick={handleExportCsv}
        >
          {isExporting ? "Exporting..." : "Download CSV"}
        </button>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border">
            <span className="text-xs text-text-muted block">Total Events</span>
            <span className="text-base font-semibold text-text-primary">{data.stats.total}</span>
          </div>
          <div className="p-3 rounded-lg border border-border">
            <span className="text-xs text-text-muted block">Success</span>
            <span className="text-base font-semibold text-text-primary">{data.stats.success}</span>
          </div>
          <div className="p-3 rounded-lg border border-border">
            <span className="text-xs text-text-muted block">Failures</span>
            <span className={`text-base font-semibold ${data.stats.failure > 0 ? "text-red-600" : "text-text-primary"}`}>
              {data.stats.failure}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-border">
            <span className="text-xs text-text-muted block">Errors</span>
            <span className={`text-base font-semibold ${data.stats.error > 0 ? "text-red-600" : "text-text-primary"}`}>
              {data.stats.error}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-4 flex-wrap items-end">
          {/* Type filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Type</span>
            <div className="flex gap-1 flex-wrap">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
                    typeFilter === opt.value
                      ? "text-white bg-brand hover:bg-brand-light"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                  onClick={() => setTypeFilter(opt.value as AuditType | "all")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap items-end">
          {/* Status filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Status</span>
            <div className="flex gap-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
                    statusFilter === opt.value
                      ? "text-white bg-brand hover:bg-brand-light"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                  onClick={() => setStatusFilter(opt.value as AuditStatus | "all")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Supplier filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Supplier</span>
            <div className="flex gap-1">
              {SUPPLIER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
                    supplierFilter === opt.value
                      ? "text-white bg-brand hover:bg-brand-light"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                  onClick={() => setSupplierFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Order ID search */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Order ID</span>
            <input
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              value={orderIdSearch}
              onChange={(e) => setOrderIdSearch(e.target.value)}
              placeholder="Search by Order ID"
            />
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="flex flex-col gap-1">
        {/* Header */}
        <div
          className="grid gap-2 px-4 py-2 bg-gray-50 rounded-lg"
          style={{ gridTemplateColumns: "160px 130px 100px 100px 1fr 80px" }}
        >
          <span className="text-xs text-text-muted">Timestamp</span>
          <span className="text-xs text-text-muted">Type</span>
          <span className="text-xs text-text-muted">Supplier</span>
          <span className="text-xs text-text-muted">Status</span>
          <span className="text-xs text-text-muted">Action</span>
          <span className="text-xs text-text-muted">Duration</span>
        </div>

        {/* Rows */}
        {data?.events.map((event) => (
          <div
            key={event.id}
            className="grid gap-2 px-4 py-3 border border-border rounded-lg items-center"
            style={{ gridTemplateColumns: "160px 130px 100px 100px 1fr 80px" }}
          >
            <span className="text-xs">
              {new Date(event.timestamp).toLocaleString()}
            </span>
            <span className="text-xs">
              {event.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
            <span className="text-xs">
              {event.supplierId === "aliexpress" ? "AliExpress" : event.supplierId === "cj" ? "CJ" : event.supplierId}
            </span>
            <div>
              <span className={`inline-block px-2 py-1 rounded-lg text-xs ${statusBadgeCls(event.status)}`}>
                {event.status.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-xs">{event.action}</span>
              {event.orderId && (
                <span className="text-xs text-text-muted block">
                  Order: {event.orderId}
                </span>
              )}
              {event.error && (
                <span className="text-xs text-red-600 block">
                  {event.error}
                </span>
              )}
            </div>
            <span className="text-xs text-text-muted">
              {event.duration != null ? `${event.duration}ms` : "--"}
            </span>
          </div>
        ))}

        {data?.events.length === 0 && (
          <div className="p-8 flex justify-center">
            <span className="text-sm text-text-muted">No audit events found matching the current filters.</span>
          </div>
        )}
      </div>

      {/* Clear old entries */}
      <div className="p-4 rounded-lg border border-border flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-3 items-center">
          <span className="font-semibold">Clear Old Entries</span>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-text-muted">Older than</span>
            <input
              type="number"
              className="px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              style={{ width: "80px" }}
              value={String(clearDays)}
              onChange={(e) => setClearDays(Number(e.target.value))}
            />
            <span className="text-xs text-text-muted">days</span>
          </div>
        </div>
        <button
          className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          disabled={clearMutation.isLoading}
          onClick={() => clearMutation.mutate({ olderThanDays: clearDays })}
        >
          {clearMutation.isLoading ? "Clearing..." : "Clear"}
        </button>
      </div>

      {clearMessage && (
        <div className="p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          {clearMessage}
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8">
        <p className="text-sm">Connecting to Saleor Dashboard...</p>
      </div>
    );
  }

  return <AuditLog />;
}
