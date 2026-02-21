import {
  useDashboardRecentOrdersQuery,
  useDashboardStatsQuery,
  useWelcomePageActivitiesQuery,
  useWelcomePageAnalyticsQuery,
} from "@dashboard/graphql";
import { ChannelFragment } from "@dashboard/graphql";
import { useMemo } from "react";

interface UseDashboardDataOptions {
  channel: ChannelFragment | undefined;
  hasPermissionToManageOrders: boolean;
  hasPermissionToManageUsers: boolean;
}

export function useDashboardData({
  channel,
  hasPermissionToManageOrders,
  hasPermissionToManageUsers,
}: UseDashboardDataOptions) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // Format as YYYY-MM-DD for the Date scalar
    return d.toISOString().split("T")[0];
  }, []);

  const analyticsResult = useWelcomePageAnalyticsQuery({
    variables: {
      channel: channel?.slug ?? "",
      hasPermissionToManageOrders,
    },
    skip: !channel,
  });

  const statsResult = useDashboardStatsQuery({
    variables: {
      channel: channel?.slug ?? "",
      today,
      hasPermissionToManageOrders,
      hasPermissionToManageUsers,
    },
    skip: !channel,
  });

  const recentOrdersResult = useDashboardRecentOrdersQuery({
    variables: {
      hasPermissionToManageOrders,
    },
  });

  const activitiesResult = useWelcomePageActivitiesQuery({
    variables: {
      hasPermissionToManageOrders,
    },
  });

  return {
    revenueToday: analyticsResult.data?.salesToday ?? null,
    revenueThisMonth: analyticsResult.data?.salesThisMonth ?? null,
    ordersToday: statsResult.data?.ordersToday?.totalCount ?? 0,
    ordersToFulfill: statsResult.data?.ordersToFulfill?.totalCount ?? 0,
    productsTotal: statsResult.data?.productsTotal?.totalCount ?? 0,
    productsOutOfStock: statsResult.data?.productsOutOfStock?.totalCount ?? 0,
    customersTotal: statsResult.data?.customersTotal?.totalCount ?? 0,
    customersToday: statsResult.data?.customersToday?.totalCount ?? 0,
    recentOrders: recentOrdersResult.data?.orders?.edges ?? [],
    activities: activitiesResult.data?.activities?.edges ?? [],
    loading: {
      analytics: analyticsResult.loading,
      stats: statsResult.loading,
      recentOrders: recentOrdersResult.loading,
      activities: activitiesResult.loading,
    },
  };
}

export type DashboardData = ReturnType<typeof useDashboardData>;
