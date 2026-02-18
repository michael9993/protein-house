import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text } from "@saleor/macaw-ui";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

function DashboardOverview() {
  const { data, isLoading, error } = trpcClient.dashboard.overview.useQuery();

  if (isLoading) {
    return (
      <Box padding={8}>
        <Text variant="heading" size="large">
          Loading dashboard...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={8}>
        <Text variant="heading" size="large" color="critical1">
          Error loading dashboard
        </Text>
        <Text>{error.message}</Text>
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Text variant="heading" size="large">
            Dropship Orchestrator
          </Text>
          <Text color="default2">
            Multi-supplier dropshipping management
          </Text>
        </Box>
        <Box
          paddingX={4}
          paddingY={2}
          borderRadius={4}
          backgroundColor={data.config.enabled ? "success1" : "default2"}
        >
          <Text color={data.config.enabled ? "success1" : "default2"} variant="bodyStrong">
            {data.config.enabled ? "Active" : "Disabled"}
          </Text>
        </Box>
      </Box>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Box display="flex" flexDirection="column" gap={2}>
          {data.alerts.map((alert, i) => (
            <Box
              key={i}
              padding={4}
              borderRadius={4}
              backgroundColor={alert.type === "error" ? "critical1" : "warning1"}
            >
              <Text variant="bodyStrong">{alert.message}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Stats Grid */}
      <Box display="grid" __gridTemplateColumns="repeat(4, 1fr)" gap={4}>
        <StatCard label="Today's Orders" value={data.stats.todayOrders} />
        <StatCard label="Total Dropship Orders" value={data.stats.totalDropshipOrders} />
        <StatCard label="Pending Exceptions" value={data.stats.pendingExceptions} highlight={data.stats.pendingExceptions > 0} />
        <StatCard label="Active Suppliers" value={data.stats.activeSuppliers} />
      </Box>

      {/* Suppliers */}
      <Box>
        <Text variant="heading" size="medium" marginBottom={3}>
          Suppliers
        </Text>
        <Box display="flex" flexDirection="column" gap={2}>
          {data.suppliers.map((supplier) => (
            <Box
              key={supplier.id}
              padding={4}
              borderRadius={4}
              borderWidth={1}
              borderStyle="solid"
              borderColor="default1"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Text variant="bodyStrong">{supplier.name}</Text>
                <Text color="default2" variant="caption">
                  Status: {supplier.status}
                </Text>
              </Box>
              <Box
                paddingX={3}
                paddingY={1}
                borderRadius={4}
                backgroundColor={supplier.enabled ? "success1" : "default2"}
              >
                <Text variant="caption">
                  {supplier.enabled ? "Enabled" : "Disabled"}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Recent Orders */}
      {data.recentOrders.length > 0 && (
        <Box>
          <Text variant="heading" size="medium" marginBottom={3}>
            Recent Dropship Orders
          </Text>
          <Box display="flex" flexDirection="column" gap={1}>
            {data.recentOrders.map((order: any) => (
              <Box
                key={order.id}
                padding={3}
                borderRadius={4}
                borderWidth={1}
                borderStyle="solid"
                borderColor="default1"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box display="flex" gap={4} alignItems="center">
                  <Text variant="bodyStrong">#{order.number}</Text>
                  <Text color="default2">{order.supplier}</Text>
                </Box>
                <Box display="flex" gap={4} alignItems="center">
                  <Text>
                    {order.currency} {order.total.toFixed(2)}
                  </Text>
                  <Box
                    paddingX={2}
                    paddingY={1}
                    borderRadius={4}
                    backgroundColor={
                      order.status === "shipped"
                        ? "success1"
                        : order.status === "failed"
                          ? "critical1"
                          : "default2"
                    }
                  >
                    <Text variant="caption">{order.status}</Text>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Box
      padding={4}
      borderRadius={4}
      borderWidth={1}
      borderStyle="solid"
      borderColor={highlight ? "critical1" : "default1"}
      display="flex"
      flexDirection="column"
      gap={1}
    >
      <Text color="default2" variant="caption">
        {label}
      </Text>
      <Text variant="heading" size="large" color={highlight ? "critical1" : undefined}>
        {value}
      </Text>
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

  return (
    <>
      <NavBar />
      <DashboardOverview />
    </>
  );
}
