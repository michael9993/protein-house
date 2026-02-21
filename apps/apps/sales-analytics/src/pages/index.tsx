import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { GetServerSideProps } from "next";
import { useState, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import {
  DashboardShell,
  DashboardHeader,
  DashboardSection,
  TwoColumnGrid,
} from "@/modules/ui/layout/dashboard-shell";
import { KPICardsGrid } from "@/modules/ui/components/kpi-cards";
import { RevenueChart } from "@/modules/ui/components/revenue-chart";
import { TopProductsList } from "@/modules/ui/components/top-products";
import { CategoryDonutChart } from "@/modules/ui/components/category-chart";
import { RecentOrdersTable } from "@/modules/ui/components/orders-table";
import { DateRangePicker, QuickDateSelect } from "@/modules/ui/components/date-range-picker";
import { ChannelSelector } from "@/modules/ui/components/channel-selector";
import { ExportButton } from "@/modules/ui/components/export-button";
import { AutoRefreshToggle, useAutoRefresh } from "@/modules/ui/components/auto-refresh-toggle";
import { getTimeRangeFromPreset, type TimeRange } from "@/modules/analytics/domain/time-range";
import { exportAnalyticsToExcel } from "@/modules/ui/utils/export-analytics";

const REFRESH_INTERVAL = 30_000;

/**
 * Force dynamic rendering to avoid static prerender issues with _document/Html in Next.js 15
 * when NODE_ENV is non-standard during build.
 */
export const getServerSideProps: GetServerSideProps = async () => ({
  props: {},
});

/**
 * Main Analytics Dashboard page
 * This is the APP_PAGE target for the NAVIGATION_ORDERS extension
 */
export default function IndexPage() {
  const { appBridgeState } = useAppBridge();
  const utils = trpcClient.useUtils();
  const autoRefresh = useAutoRefresh();

  // State for filters
  const [dateRange, setDateRange] = useState<TimeRange>(() => getTimeRangeFromPreset("last30days"));
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
    return channelsQuery.data?.[0]?.currencyCode ?? "USD";
  }, [channelSlug, channelsQuery.data]);

  // Get effective channel slug (use first active channel if none selected)
  const effectiveChannelSlug = useMemo(() => {
    if (channelSlug) return channelSlug;
    return channelsQuery.data?.find((c) => c.isActive)?.slug;
  }, [channelSlug, channelsQuery.data]);

  // Common query input with currency - require channelSlug
  const queryInput = useMemo(
    () => ({
      channelSlug: effectiveChannelSlug!,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      currency,
    }),
    [effectiveChannelSlug, dateRange.from, dateRange.to, currency],
  );

  // Shared query options with auto-refresh
  const refetchInterval = autoRefresh.enabled ? REFRESH_INTERVAL : false;

  // Fetch analytics data
  const kpisQuery = trpcClient.analytics.getKPIs.useQuery(queryInput, {
    enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
    refetchInterval,
    keepPreviousData: true,
  });

  const revenueQuery = trpcClient.analytics.getRevenueOverTime.useQuery(queryInput, {
    enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
    refetchInterval,
    keepPreviousData: true,
  });

  const topProductsQuery = trpcClient.analytics.getTopProducts.useQuery(
    { ...queryInput, limit: 10 },
    {
      enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
      refetchInterval,
      keepPreviousData: true,
    },
  );

  const categoriesQuery = trpcClient.analytics.getTopCategories.useQuery(
    { ...queryInput, limit: 8 },
    {
      enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
      refetchInterval,
      keepPreviousData: true,
    },
  );

  const recentOrdersQuery = trpcClient.analytics.getRecentOrders.useQuery(
    { ...queryInput, limit: 10 },
    {
      enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
      refetchInterval,
      keepPreviousData: true,
    },
  );

  // Track last updated time
  useEffect(() => {
    if (kpisQuery.dataUpdatedAt > 0) {
      autoRefresh.markUpdated();
    }
  }, [kpisQuery.dataUpdatedAt]);

  // Extract currency info from KPIs query
  const currencyInfo = kpisQuery.data?.currencyInfo;
  const isMultiCurrency = currencyInfo?.isMultiCurrency ?? false;

  // Detect if any query is refetching (background refresh)
  const isRefreshing =
    kpisQuery.isFetching && !kpisQuery.isLoading;

  if (!appBridgeState?.ready) {
    return (
      <div className="flex items-center justify-center h-screen gap-3">
        <Loader2 size={24} className="animate-spin text-brand" />
        <span className="text-text-muted">Loading Sales Analytics...</span>
      </div>
    );
  }

  return (
    <DashboardShell activeTab="overview">
      {/* Header with filters */}
      <DashboardHeader
        title="Sales Analytics"
        subtitle="Track your store's performance with real-time insights"
        actions={
          <>
            <AutoRefreshToggle
              enabled={autoRefresh.enabled}
              onToggle={autoRefresh.toggle}
              lastUpdated={autoRefresh.lastUpdated}
            />
            <ChannelSelector
              channels={channelsQuery.data ?? []}
              value={channelSlug}
              onChange={setChannelSlug}
              isLoading={channelsQuery.isLoading}
            />
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <ExportButton
              disabled={
                !kpisQuery.data ||
                kpisQuery.isLoading ||
                !appBridgeState?.ready ||
                !effectiveChannelSlug
              }
              onClick={async () => {
                const channelName = channelsQuery.data?.find((c) => c.slug === channelSlug)?.name;
                const [allOrders, productPerformance] = await Promise.all([
                  utils.analytics.getAllOrders.fetch({
                    channelSlug: effectiveChannelSlug,
                    dateFrom: dateRange.from,
                    dateTo: dateRange.to,
                  }),
                  utils.analytics.getProductPerformance.fetch({
                    channelSlug: effectiveChannelSlug!,
                    dateFrom: dateRange.from,
                    dateTo: dateRange.to,
                    currency,
                  }),
                ]);
                await exportAnalyticsToExcel({
                  kpis: kpisQuery.data?.kpis,
                  revenueOverTime: revenueQuery.data,
                  topProducts: topProductsQuery.data,
                  topCategories: categoriesQuery.data,
                  allOrders,
                  productPerformance,
                  currency,
                  dateFrom: dateRange.from,
                  dateTo: dateRange.to,
                  channelName,
                });
              }}
            />
          </>
        }
      />

      {/* Quick date presets */}
      <QuickDateSelect currentPreset={dateRange.preset} onChange={setDateRange} />

      {/* Multi-currency warning */}
      {isMultiCurrency && currencyInfo && (
        <DashboardSection>
          <div className="rounded-xl border-2 border-warning/30 bg-warning/5 p-4">
            <p className="font-semibold text-warning mb-1">Multiple Currencies Detected</p>
            <p className="text-sm text-text-muted">
              Orders contain multiple currencies ({currencyInfo.currencies.join(", ")}). Analytics
              are shown for <strong>{currency}</strong> only. Select a specific channel to view
              analytics for other currencies.
            </p>
          </div>
        </DashboardSection>
      )}

      {/* KPI Cards */}
      <DashboardSection>
        <div className={isRefreshing ? "opacity-80 transition-opacity" : ""}>
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
        </div>
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
