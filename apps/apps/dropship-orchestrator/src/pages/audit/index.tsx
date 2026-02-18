import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button, Input } from "@saleor/macaw-ui";
import { useState } from "react";

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

function statusColor(status: string): "success1" | "critical1" | "warning1" | "default2" {
  switch (status) {
    case "success":
      return "success1";
    case "failure":
      return "warning1";
    case "error":
      return "critical1";
    default:
      return "default2";
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

  if (isLoading) {
    return (
      <Box padding={8}>
        <Text variant="heading" size="large">Loading audit log...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={8}>
        <Text variant="heading" size="large" color="critical1">Error loading audit log</Text>
        <Text>{error.message}</Text>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <NavBar />

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Text variant="heading" size="large">Audit Log</Text>
          <Text color="default2">
            {data?.totalCount ?? 0} events matching filters
          </Text>
        </Box>
      </Box>

      {/* Stats */}
      {data?.stats && (
        <Box display="grid" __gridTemplateColumns="repeat(4, 1fr)" gap={3}>
          <Box
            padding={3}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
          >
            <Text color="default2" variant="caption" __display="block">Total Events</Text>
            <Text variant="heading" size="medium">{data.stats.total}</Text>
          </Box>
          <Box
            padding={3}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
          >
            <Text color="default2" variant="caption" __display="block">Success</Text>
            <Text variant="heading" size="medium">{data.stats.success}</Text>
          </Box>
          <Box
            padding={3}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
          >
            <Text color="default2" variant="caption" __display="block">Failures</Text>
            <Text variant="heading" size="medium" color={data.stats.failure > 0 ? "critical1" : undefined}>
              {data.stats.failure}
            </Text>
          </Box>
          <Box
            padding={3}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
          >
            <Text color="default2" variant="caption" __display="block">Errors</Text>
            <Text variant="heading" size="medium" color={data.stats.error > 0 ? "critical1" : undefined}>
              {data.stats.error}
            </Text>
          </Box>
        </Box>
      )}

      {/* Filters */}
      <Box display="flex" flexDirection="column" gap={3}>
        <Box display="flex" gap={4} flexWrap="wrap" alignItems="flex-end">
          {/* Type filter */}
          <Box display="flex" flexDirection="column" gap={1}>
            <Text variant="caption" color="default2">Type</Text>
            <Box display="flex" gap={1} flexWrap="wrap">
              {TYPE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={typeFilter === opt.value ? "primary" : "tertiary"}
                  size="small"
                  onClick={() => setTypeFilter(opt.value as AuditType | "all")}
                >
                  {opt.label}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>

        <Box display="flex" gap={4} flexWrap="wrap" alignItems="flex-end">
          {/* Status filter */}
          <Box display="flex" flexDirection="column" gap={1}>
            <Text variant="caption" color="default2">Status</Text>
            <Box display="flex" gap={1}>
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={statusFilter === opt.value ? "primary" : "tertiary"}
                  size="small"
                  onClick={() => setStatusFilter(opt.value as AuditStatus | "all")}
                >
                  {opt.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Supplier filter */}
          <Box display="flex" flexDirection="column" gap={1}>
            <Text variant="caption" color="default2">Supplier</Text>
            <Box display="flex" gap={1}>
              {SUPPLIER_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={supplierFilter === opt.value ? "primary" : "tertiary"}
                  size="small"
                  onClick={() => setSupplierFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Order ID search */}
          <Box display="flex" flexDirection="column" gap={1}>
            <Text variant="caption" color="default2">Order ID</Text>
            <Input
              value={orderIdSearch}
              onChange={(e) => setOrderIdSearch(e.target.value)}
              placeholder="Search by Order ID"
              size="small"
            />
          </Box>
        </Box>
      </Box>

      {/* Events Table */}
      <Box display="flex" flexDirection="column" gap={1}>
        {/* Header */}
        <Box
          display="grid"
          __gridTemplateColumns="160px 130px 100px 100px 1fr 80px"
          gap={2}
          paddingX={4}
          paddingY={2}
          backgroundColor="default1"
          borderRadius={4}
        >
          <Text variant="caption" color="default2">Timestamp</Text>
          <Text variant="caption" color="default2">Type</Text>
          <Text variant="caption" color="default2">Supplier</Text>
          <Text variant="caption" color="default2">Status</Text>
          <Text variant="caption" color="default2">Action</Text>
          <Text variant="caption" color="default2">Duration</Text>
        </Box>

        {/* Rows */}
        {data?.events.map((event) => (
          <Box
            key={event.id}
            display="grid"
            __gridTemplateColumns="160px 130px 100px 100px 1fr 80px"
            gap={2}
            paddingX={4}
            paddingY={3}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
            borderRadius={4}
            alignItems="center"
          >
            <Text variant="caption">
              {new Date(event.timestamp).toLocaleString()}
            </Text>
            <Text variant="caption">
              {event.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Text>
            <Text variant="caption">
              {event.supplierId === "aliexpress" ? "AliExpress" : event.supplierId === "cj" ? "CJ" : event.supplierId}
            </Text>
            <Box>
              <Box
                paddingX={2}
                paddingY={1}
                borderRadius={4}
                backgroundColor={statusColor(event.status)}
                __display="inline-block"
              >
                <Text variant="caption">{event.status.toUpperCase()}</Text>
              </Box>
            </Box>
            <Box>
              <Text variant="caption">{event.action}</Text>
              {event.orderId && (
                <Text variant="caption" color="default2" __display="block">
                  Order: {event.orderId}
                </Text>
              )}
              {event.error && (
                <Text variant="caption" color="critical1" __display="block">
                  {event.error}
                </Text>
              )}
            </Box>
            <Text variant="caption" color="default2">
              {event.duration != null ? `${event.duration}ms` : "--"}
            </Text>
          </Box>
        ))}

        {data?.events.length === 0 && (
          <Box padding={8} display="flex" justifyContent="center">
            <Text color="default2">No audit events found matching the current filters.</Text>
          </Box>
        )}
      </Box>

      {/* Clear old entries */}
      <Box
        padding={4}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={3}
      >
        <Box display="flex" gap={3} alignItems="center">
          <Text variant="bodyStrong">Clear Old Entries</Text>
          <Box display="flex" gap={2} alignItems="center">
            <Text variant="caption" color="default2">Older than</Text>
            <Input
              type="number"
              value={String(clearDays)}
              onChange={(e) => setClearDays(Number(e.target.value))}
              size="small"
              __width="80px"
            />
            <Text variant="caption" color="default2">days</Text>
          </Box>
        </Box>
        <Button
          variant="secondary"
          size="small"
          disabled={clearMutation.isLoading}
          onClick={() => clearMutation.mutate({ olderThanDays: clearDays })}
        >
          {clearMutation.isLoading ? "Clearing..." : "Clear"}
        </Button>
      </Box>

      {clearMessage && (
        <Box padding={3} borderRadius={4} backgroundColor="success1">
          <Text>{clearMessage}</Text>
        </Box>
      )}
    </Box>
  );
}

export default function AuditPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <Box padding={8}>
        <Text>Connecting to Saleor Dashboard...</Text>
      </Box>
    );
  }

  return <AuditLog />;
}
