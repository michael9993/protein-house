import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button } from "@saleor/macaw-ui";
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

function statusColor(status: string): "success1" | "critical1" | "warning1" | "default2" {
  switch (status) {
    case "delivered":
    case "shipped":
      return "success1";
    case "failed":
    case "cancelled":
    case "supplier_cancelled":
      return "critical1";
    case "exception":
      return "warning1";
    default:
      return "default2";
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
      <Box padding={8}>
        <Text variant="heading" size="large">Loading orders...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={8}>
        <Text variant="heading" size="large" color="critical1">Error loading orders</Text>
        <Text>{error.message}</Text>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <NavBar />

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Text variant="heading" size="large">Dropship Orders</Text>
          <Text color="default2">
            {data?.totalCount ?? 0} total orders
          </Text>
        </Box>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={3} flexWrap="wrap">
        <Box display="flex" flexDirection="column" gap={1}>
          <Text variant="caption" color="default2">Status</Text>
          <Box display="flex" gap={1} flexWrap="wrap">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={statusFilter === opt.value ? "primary" : "tertiary"}
                size="small"
                onClick={() => {
                  setStatusFilter(opt.value as DropshipStatus | "all");
                  setCursor(null);
                }}
              >
                {opt.label}
              </Button>
            ))}
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={1}>
          <Text variant="caption" color="default2">Supplier</Text>
          <Box display="flex" gap={1}>
            {SUPPLIER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={supplierFilter === opt.value ? "primary" : "tertiary"}
                size="small"
                onClick={() => {
                  setSupplierFilter(opt.value as SupplierFilter | "all");
                  setCursor(null);
                }}
              >
                {opt.label}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Orders Table */}
      <Box display="flex" flexDirection="column" gap={1}>
        {/* Header */}
        <Box
          display="grid"
          __gridTemplateColumns="80px 1fr 120px 100px 100px 140px 120px"
          gap={2}
          paddingX={4}
          paddingY={2}
          backgroundColor="default1"
          borderRadius={4}
        >
          <Text variant="caption" color="default2">Order #</Text>
          <Text variant="caption" color="default2">Supplier</Text>
          <Text variant="caption" color="default2">Status</Text>
          <Text variant="caption" color="default2">Cost</Text>
          <Text variant="caption" color="default2">Total</Text>
          <Text variant="caption" color="default2">Date</Text>
          <Text variant="caption" color="default2">Actions</Text>
        </Box>

        {/* Rows */}
        {data?.orders.map((order: any) => (
          <Box
            key={order.id}
            display="grid"
            __gridTemplateColumns="80px 1fr 120px 100px 100px 140px 120px"
            gap={2}
            paddingX={4}
            paddingY={3}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
            borderRadius={4}
            alignItems="center"
          >
            <Text variant="bodyStrong">#{order.number}</Text>
            <Text>{order.supplier === "aliexpress" ? "AliExpress" : "CJ"}</Text>
            <Box>
              <Box
                paddingX={2}
                paddingY={1}
                borderRadius={4}
                backgroundColor={statusColor(order.dropshipStatus)}
                __display="inline-block"
              >
                <Text variant="caption">
                  {order.dropshipStatus.replace("_", " ").toUpperCase()}
                </Text>
              </Box>
            </Box>
            <Text variant="caption">
              {order.supplierCost != null
                ? `$${order.supplierCost.toFixed(2)}`
                : "--"}
            </Text>
            <Text variant="caption">
              {order.total.currency} {order.total.amount.toFixed(2)}
            </Text>
            <Text variant="caption">
              {new Date(order.created).toLocaleDateString()}
            </Text>
            <Box display="flex" gap={1}>
              {order.dropshipStatus === "failed" && (
                <Button
                  variant="secondary"
                  size="small"
                  disabled={retryMutation.isLoading}
                  onClick={() => retryMutation.mutate({ orderId: order.id })}
                >
                  Retry
                </Button>
              )}
              {order.trackingNumber && (
                <Text variant="caption" color="default2" title={order.trackingNumber}>
                  Tracked
                </Text>
              )}
            </Box>
          </Box>
        ))}

        {data?.orders.length === 0 && (
          <Box padding={8} display="flex" justifyContent="center">
            <Text color="default2">No dropship orders found matching the current filters.</Text>
          </Box>
        )}
      </Box>

      {/* Pagination */}
      {data?.pageInfo.hasNextPage && (
        <Box display="flex" justifyContent="center">
          <Button
            variant="secondary"
            onClick={() => setCursor(data.pageInfo.endCursor)}
          >
            Load More
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default function OrdersPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <Box padding={8}>
        <Text>Connecting to Saleor Dashboard...</Text>
      </Box>
    );
  }

  return <OrdersList />;
}
