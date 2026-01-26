import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Spinner } from "@saleor/macaw-ui";
import { Card, Metric, Flex, Badge } from "@tremor/react";
import { useRouter } from "next/router";
import { format, parseISO } from "date-fns";

import { formatCurrency } from "@/modules/analytics/domain/money";

/**
 * Order Stats Widget
 * This is the WIDGET target for the ORDER_DETAILS_WIDGETS extension
 * It receives orderId from the URL query parameters
 * 
 * Note: In a real implementation, this would fetch order-specific analytics
 * from the tRPC API. For now, it shows the order ID and a placeholder.
 */
export default function OrderStatsWidget() {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
  const { orderId } = router.query;

  if (!appBridgeState?.ready) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        padding={4}
      >
        <Spinner />
      </Box>
    );
  }

  if (!orderId) {
    return (
      <Box padding={4}>
        <Text size={2} color="default2">
          No order selected
        </Text>
      </Box>
    );
  }

  // In a full implementation, we'd fetch order data here
  // For now, show the order ID and helpful context

  return (
    <div className="p-3 space-y-3">
      <Flex justifyContent="between" alignItems="center">
        <Text variant="bodyStrong" as="h3">
          Order Analytics
        </Text>
        <Badge color="blue" size="xs">
          Widget
        </Badge>
      </Flex>

      <Card className="p-3">
        <Text className="text-xs text-gray-500 mb-1">Order ID</Text>
        <Text className="font-mono text-sm truncate">
          {typeof orderId === "string" ? orderId : orderId[0]}
        </Text>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Card className="p-2">
          <Text className="text-xs text-gray-500">Status</Text>
          <Badge color="emerald" size="xs" className="mt-1">
            View Details
          </Badge>
        </Card>
        <Card className="p-2">
          <Text className="text-xs text-gray-500">Analytics</Text>
          <Text className="text-sm font-medium mt-1">Available</Text>
        </Card>
      </div>

      <Text className="text-xs text-gray-400 text-center">
        Open Sales Analytics for full dashboard
      </Text>
    </div>
  );
}
