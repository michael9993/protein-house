import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Spinner, Button } from "@saleor/macaw-ui";
import { useState, useMemo, useEffect } from "react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import {
  DashboardShell,
  DashboardHeader,
  DashboardSection,
  TwoColumnGrid,
  FullWidthColumn,
} from "@/modules/ui/layout/dashboard-shell";
import { KPICardsGrid } from "@/modules/ui/components/kpi-cards";
import { RevenueChart } from "@/modules/ui/components/revenue-chart";
import { TopProductsList } from "@/modules/ui/components/top-products";
import { CategoryDonutChart } from "@/modules/ui/components/category-chart";
import { RecentOrdersTable } from "@/modules/ui/components/orders-table";
import { DateRangePicker, QuickDateSelect } from "@/modules/ui/components/date-range-picker";
import { ChannelSelector } from "@/modules/ui/components/channel-selector";
import { getTimeRangeFromPreset, type TimeRange } from "@/modules/analytics/domain/time-range";
import { exportAnalyticsToExcel } from "@/modules/ui/utils/export-analytics";

/**
 * Main Analytics Dashboard page
 * This is the APP_PAGE target for the NAVIGATION_ORDERS extension
 */
export default function IndexPage() {
  const { appBridgeState } = useAppBridge();
  const utils = trpcClient.useUtils();

  // State for filters
  const [dateRange, setDateRange] = useState<TimeRange>(() =>
    getTimeRangeFromPreset("last30days")
  );
  const [channelSlug, setChannelSlug] = useState<string | undefined>(undefined);

  // Fetch channels
  const channelsQuery = trpcClient.channels.list.useQuery(undefined, {
    enabled: !!appBridgeState?.ready,
  });

  // Set default channel to first active channel when channels load
  useEffect(() => {
    if (channelsQuery.data && !channelSlug) {
      const firstActiveChannel = channelsQuery.data.find((c) => c.isActive);
      if (firstActiveChannel) {
        setChannelSlug(firstActiveChannel.slug);
      }
    }
  }, [channelsQuery.data, channelSlug]);

  // Determine currency from selected channel or default
  const currency = useMemo(() => {
    if (channelSlug && channelsQuery.data) {
      const channel = channelsQuery.data.find((c) => c.slug === channelSlug);
      return channel?.currencyCode ?? "USD";
    }
    // Use first channel's currency or default
    return channelsQuery.data?.[0]?.currencyCode ?? "USD";
  }, [channelSlug, channelsQuery.data]);

  // Get effective channel slug (use first active channel if none selected)
  const effectiveChannelSlug = useMemo(() => {
    if (channelSlug) return channelSlug;
    return channelsQuery.data?.find((c) => c.isActive)?.slug;
  }, [channelSlug, channelsQuery.data]);

  // Common query input with currency - require channelSlug
  const queryInput = useMemo(() => ({
    channelSlug: effectiveChannelSlug!,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    currency, // Pass currency to all queries
  }), [effectiveChannelSlug, dateRange.from, dateRange.to, currency]);

  // Fetch analytics data
  const kpisQuery = trpcClient.analytics.getKPIs.useQuery(queryInput, {
    enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
  });

  const revenueQuery = trpcClient.analytics.getRevenueOverTime.useQuery(queryInput, {
    enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
  });

  const topProductsQuery = trpcClient.analytics.getTopProducts.useQuery(
    { ...queryInput, limit: 10 },
    { enabled: !!appBridgeState?.ready && !!effectiveChannelSlug }
  );

  const categoriesQuery = trpcClient.analytics.getTopCategories.useQuery(
    { ...queryInput, limit: 8 },
    { enabled: !!appBridgeState?.ready && !!effectiveChannelSlug }
  );

  const recentOrdersQuery = trpcClient.analytics.getRecentOrders.useQuery(
    { ...queryInput, limit: 10 },
    { enabled: !!appBridgeState?.ready && !!effectiveChannelSlug }
  );

  // Extract currency info from KPIs query
  const currencyInfo = kpisQuery.data?.currencyInfo;
  const isMultiCurrency = currencyInfo?.isMultiCurrency ?? false;

  if (!appBridgeState?.ready) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        gap={4}
      >
        <Spinner />
        <Text>Loading Sales Analytics...</Text>
      </Box>
    );
  }

  return (
    <DashboardShell>
      {/* Header with filters */}
      <DashboardHeader
        title="Sales Analytics"
        subtitle="Track your store's performance with real-time insights"
        actions={
          <>
            <ChannelSelector
              channels={channelsQuery.data ?? []}
              value={channelSlug}
              onChange={setChannelSlug}
              isLoading={channelsQuery.isLoading}
            />
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  const channelName = channelsQuery.data?.find(c => c.slug === channelSlug)?.name;
                  
                  // Fetch all orders for export using tRPC utils
                  const allOrders = await utils.analytics.getAllOrders.fetch({
                    channelSlug: effectiveChannelSlug,
                    dateFrom: dateRange.from,
                    dateTo: dateRange.to,
                  });
                  
                  await exportAnalyticsToExcel({
                    kpis: kpisQuery.data?.kpis,
                    revenueOverTime: revenueQuery.data,
                    topProducts: topProductsQuery.data,
                    topCategories: categoriesQuery.data,
                    allOrders,
                    currency,
                    dateFrom: dateRange.from,
                    dateTo: dateRange.to,
                    channelName,
                  });
                } catch (error) {
                  console.error("Failed to export analytics:", error);
                  alert("Failed to export analytics. Please try again.");
                }
              }}
              disabled={
                !kpisQuery.data ||
                kpisQuery.isLoading ||
                !appBridgeState?.ready ||
                !effectiveChannelSlug
              }
            >
              Export to Excel
            </Button>
          </>
        }
      />

      {/* Quick date presets */}
      <QuickDateSelect
        currentPreset={dateRange.preset}
        onChange={setDateRange}
      />

      {/* Multi-currency warning */}
      {isMultiCurrency && currencyInfo && (
        <DashboardSection>
          <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4 shadow-sm">
            <Text className="font-bold text-yellow-800 mb-2 block">
              ⚠️ Multiple Currencies Detected
            </Text>
            <Text className="text-sm text-yellow-700">
              Orders contain multiple currencies ({currencyInfo.currencies.join(", ")}). 
              Analytics are shown for <strong>{currency}</strong> only. Select a specific channel 
              to view analytics for other currencies.
            </Text>
          </div>
        </DashboardSection>
      )}

      {/* KPI Cards */}
      <DashboardSection>
        {kpisQuery.data?.kpis ? (
          <KPICardsGrid kpis={kpisQuery.data.kpis} isLoading={kpisQuery.isLoading} />
        ) : (
          <KPICardsGrid
            kpis={{
              gmv: { label: "Gross Revenue", value: "$0.00" },
              totalOrders: { label: "Total Orders", value: "0" },
              averageOrderValue: { label: "Avg Order Value", value: "$0.00" },
              itemsSold: { label: "Items Sold", value: "0" },
              uniqueCustomers: { label: "Unique Customers", value: "0" },
            }}
            isLoading={kpisQuery.isLoading}
          />
        )}
      </DashboardSection>

      {/* Revenue Chart - Full Width */}
      <DashboardSection>
        <RevenueChart
          data={revenueQuery.data ?? []}
          currency={currency}
          isLoading={revenueQuery.isLoading}
        />
      </DashboardSection>

      {/* Top Products and Categories - Two Column */}
      <TwoColumnGrid>
        <TopProductsList
          data={topProductsQuery.data ?? []}
          currency={currency}
          isLoading={topProductsQuery.isLoading}
        />
        <CategoryDonutChart
          data={categoriesQuery.data ?? []}
          currency={currency}
          isLoading={categoriesQuery.isLoading}
        />
      </TwoColumnGrid>

      {/* Recent Orders Table - Full Width */}
      <DashboardSection>
        <RecentOrdersTable
          orders={recentOrdersQuery.data ?? []}
          isLoading={recentOrdersQuery.isLoading}
        />
      </DashboardSection>
    </DashboardShell>
  );
}
