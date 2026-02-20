import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useRouter } from "next/router";

import { Box, Text, Button } from "@/components/ui/primitives";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

function statusColor(status: string): string {
  switch (status) {
    case "delivered":
    case "shipped":
      return "success1";
    case "failed":
    case "cancelled":
    case "supplier_cancelled":
      return "critical1";
    case "exception":
    case "pending":
      return "warning1";
    default:
      return "default2";
  }
}

function DashboardOverview() {
  const router = useRouter();
  const { data, isLoading, error } = trpcClient.dashboard.overview.useQuery();

  if (isLoading) {
    return (
      <Box padding={8}>
        <Text variant="heading" size="large">Loading dashboard...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={8}>
        <Text variant="heading" size="large" color="critical1">Error loading dashboard</Text>
        <Text>{error.message}</Text>
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <NavBar />

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Text variant="heading" size="large">Dropship Orchestrator</Text>
          <Text color="default2">Multi-supplier dropshipping management</Text>
        </Box>
        <Box
          paddingX={3}
          paddingY={1}
          borderRadius={4}
          backgroundColor={data.config.enabled ? "success1" : "critical1"}
        >
          <Text variant="caption">
            {data.config.enabled ? "ENABLED" : "DISABLED"}
          </Text>
        </Box>
      </Box>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Box display="flex" flexDirection="column" gap={2}>
          {data.alerts.map((alert, idx) => (
            <Box
              key={idx}
              padding={3}
              borderRadius={4}
              backgroundColor={alert.type === "error" ? "critical1" : "warning1"}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text>{alert.message}</Text>
              {alert.type === "warning" && alert.message.includes("exceptions") && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => router.push("/exceptions")}
                >
                  Review
                </Button>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Stats Grid */}
      <Box display="grid" __gridTemplateColumns="repeat(5, 1fr)" gap={3}>
        <Box
          padding={4}
          borderRadius={4}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Text color="default2" variant="caption" __display="block">Total Orders</Text>
          <Text variant="heading" size="medium">{data.stats.totalDropshipOrders}</Text>
        </Box>
        <Box
          padding={4}
          borderRadius={4}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Text color="default2" variant="caption" __display="block">Today</Text>
          <Text variant="heading" size="medium">{data.stats.todayOrders}</Text>
        </Box>
        <Box
          padding={4}
          borderRadius={4}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Text color="default2" variant="caption" __display="block">Pending Exceptions</Text>
          <Text
            variant="heading"
            size="medium"
            color={data.stats.pendingExceptions > 0 ? "critical1" : undefined}
          >
            {data.stats.pendingExceptions}
          </Text>
        </Box>
        <Box
          padding={4}
          borderRadius={4}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Text color="default2" variant="caption" __display="block">Errors (24h)</Text>
          <Text
            variant="heading"
            size="medium"
            color={data.stats.recentErrors > 0 ? "critical1" : undefined}
          >
            {data.stats.recentErrors}
          </Text>
        </Box>
        <Box
          padding={4}
          borderRadius={4}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Text color="default2" variant="caption" __display="block">Active Suppliers</Text>
          <Text variant="heading" size="medium">{data.stats.activeSuppliers}</Text>
        </Box>
      </Box>

      {/* Suppliers + Status Distribution */}
      <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
        {/* Suppliers */}
        <Box
          padding={5}
          borderRadius={4}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
            <Text variant="heading" size="medium">Suppliers</Text>
            <Button
              variant="secondary"
              size="small"
              onClick={() => router.push("/suppliers")}
            >
              Manage
            </Button>
          </Box>
          {data.suppliers.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={2}>
              {data.suppliers.map((supplier) => (
                <Box
                  key={supplier.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  padding={3}
                  borderRadius={4}
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="default1"
                >
                  <Text variant="bodyStrong">{supplier.name}</Text>
                  <Box display="flex" gap={2} alignItems="center">
                    <Box
                      paddingX={2}
                      paddingY={1}
                      borderRadius={4}
                      backgroundColor={
                        supplier.status === "connected" ? "success1" :
                        supplier.status === "error" ? "critical1" :
                        supplier.status === "token_expiring" ? "warning1" : "default2"
                      }
                    >
                      <Text variant="caption">
                        {supplier.status.replace("_", " ").toUpperCase()}
                      </Text>
                    </Box>
                    <Box
                      paddingX={2}
                      paddingY={1}
                      borderRadius={4}
                      backgroundColor={supplier.enabled ? "success1" : "default1"}
                    >
                      <Text variant="caption">
                        {supplier.enabled ? "ON" : "OFF"}
                      </Text>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Text color="default2">No suppliers configured yet.</Text>
          )}
        </Box>

        {/* Order Status Distribution */}
        <Box
          padding={5}
          borderRadius={4}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
            <Text variant="heading" size="medium">Order Status</Text>
            <Button
              variant="secondary"
              size="small"
              onClick={() => router.push("/orders")}
            >
              View All
            </Button>
          </Box>
          {Object.keys(data.statusDistribution).length > 0 ? (
            <Box display="flex" flexDirection="column" gap={2}>
              {Object.entries(data.statusDistribution).map(([status, count]) => (
                <Box
                  key={status}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  padding={3}
                  borderRadius={4}
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="default1"
                >
                  <Box display="flex" gap={2} alignItems="center">
                    <Box
                      paddingX={2}
                      paddingY={1}
                      borderRadius={4}
                      backgroundColor={statusColor(status)}
                    >
                      <Text variant="caption">
                        {status.replace("_", " ").toUpperCase()}
                      </Text>
                    </Box>
                  </Box>
                  <Text variant="bodyStrong">{count}</Text>
                </Box>
              ))}
            </Box>
          ) : (
            <Text color="default2">No dropship orders yet.</Text>
          )}
        </Box>
      </Box>

      {/* Revenue by Supplier */}
      {Object.keys(data.revenueBySupplier).length > 0 && (
        <Box
          padding={5}
          borderRadius={4}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Text variant="heading" size="medium" __display="block" marginBottom={4}>
            Revenue by Supplier
          </Text>
          <Box display="flex" gap={4} flexWrap="wrap">
            {Object.entries(data.revenueBySupplier).map(([supplier, revenue]) => (
              <Box
                key={supplier}
                padding={4}
                borderRadius={4}
                borderWidth={1}
                borderStyle="solid"
                borderColor="default1"
                __flex="1"
              >
                <Text color="default2" variant="caption" __display="block">
                  {supplier === "aliexpress" ? "AliExpress" : supplier === "cj" ? "CJ Dropshipping" : supplier}
                </Text>
                <Text variant="heading" size="medium">
                  ${(revenue as number).toFixed(2)}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Recent Orders */}
      <Box
        padding={5}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
          <Text variant="heading" size="medium">Recent Orders</Text>
          <Button
            variant="secondary"
            size="small"
            onClick={() => router.push("/orders")}
          >
            View All
          </Button>
        </Box>

        {data.recentOrders.length > 0 ? (
          <Box display="flex" flexDirection="column" gap={1}>
            {/* Header */}
            <Box
              display="grid"
              __gridTemplateColumns="80px 120px 120px 100px 140px"
              gap={2}
              paddingX={4}
              paddingY={2}
              backgroundColor="default1"
              borderRadius={4}
            >
              <Text variant="caption" color="default2">Order #</Text>
              <Text variant="caption" color="default2">Supplier</Text>
              <Text variant="caption" color="default2">Status</Text>
              <Text variant="caption" color="default2">Total</Text>
              <Text variant="caption" color="default2">Date</Text>
            </Box>

            {/* Rows */}
            {data.recentOrders.map((order: any) => (
              <Box
                key={order.id}
                display="grid"
                __gridTemplateColumns="80px 120px 120px 100px 140px"
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
                <Text variant="caption">
                  {order.supplier === "aliexpress" ? "AliExpress" : order.supplier === "cj" ? "CJ" : order.supplier}
                </Text>
                <Box>
                  <Box
                    paddingX={2}
                    paddingY={1}
                    borderRadius={4}
                    backgroundColor={statusColor(order.status)}
                    __display="inline-block"
                  >
                    <Text variant="caption">
                      {order.status.replace("_", " ").toUpperCase()}
                    </Text>
                  </Box>
                </Box>
                <Text variant="caption">
                  {order.currency} {order.total.toFixed(2)}
                </Text>
                <Text variant="caption">
                  {new Date(order.created).toLocaleDateString()}
                </Text>
              </Box>
            ))}
          </Box>
        ) : (
          <Box padding={6} display="flex" justifyContent="center">
            <Text color="default2">No dropship orders yet. Orders will appear here once products with dropship metadata are purchased.</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function IndexPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <Box padding={8}>
        <Text>Connecting to Saleor Dashboard...</Text>
      </Box>
    );
  }

  return <DashboardOverview />;
}
