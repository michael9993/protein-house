import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { GetServerSideProps } from "next";
import { useState, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import {
  DashboardShell,
  DashboardHeader,
  DashboardSection,
} from "@/modules/ui/layout/dashboard-shell";
import { DateRangePicker, QuickDateSelect } from "@/modules/ui/components/date-range-picker";
import { ChannelSelector } from "@/modules/ui/components/channel-selector";
import { OrderTypeSelector } from "@/modules/ui/components/order-type-selector";
import { StatusFilter } from "@/modules/ui/components/status-filter";
import { ChargeStatusFilter } from "@/modules/ui/components/charge-status-filter";
import { ProductPerformanceTable } from "@/modules/ui/components/product-performance-table";
import { AutoRefreshToggle, useAutoRefresh } from "@/modules/ui/components/auto-refresh-toggle";
import { getTimeRangeFromPreset, type TimeRange } from "@/modules/analytics/domain/time-range";
import type { OrderTypeFilter } from "@/modules/analytics/domain/kpi-types";
import { DEFAULT_INCLUDED_STATUSES } from "@/modules/analytics/domain/kpi-types";
import { OrderStatus, OrderChargeStatusEnum } from "../../generated/graphql";

const REFRESH_INTERVAL = 30_000;

export const getServerSideProps: GetServerSideProps = async () => ({
  props: {},
});

export default function ProductsPage() {
  const { appBridgeState } = useAppBridge();
  const autoRefresh = useAutoRefresh();

  const [dateRange, setDateRange] = useState<TimeRange>(() => getTimeRangeFromPreset("last30days"));
  const [channelSlug, setChannelSlug] = useState<string | undefined>(undefined);
  const [orderType, setOrderType] = useState<OrderTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([...DEFAULT_INCLUDED_STATUSES]);
  const [chargeStatusFilter, setChargeStatusFilter] = useState<OrderChargeStatusEnum[]>([]);

  const channelsQuery = trpcClient.channels.list.useQuery(undefined, {
    enabled: !!appBridgeState?.ready,
  });

  useEffect(() => {
    if (channelsQuery.data && !channelSlug) {
      const firstActiveChannel = channelsQuery.data.find((c) => c.isActive);
      if (firstActiveChannel) setChannelSlug(firstActiveChannel.slug);
    }
  }, [channelsQuery.data, channelSlug]);

  const currency = useMemo(() => {
    if (channelSlug && channelsQuery.data) {
      const channel = channelsQuery.data.find((c) => c.slug === channelSlug);
      return channel?.currencyCode ?? "USD";
    }
    return channelsQuery.data?.[0]?.currencyCode ?? "USD";
  }, [channelSlug, channelsQuery.data]);

  const effectiveChannelSlug = useMemo(() => {
    if (channelSlug) return channelSlug;
    return channelsQuery.data?.find((c) => c.isActive)?.slug;
  }, [channelSlug, channelsQuery.data]);

  const queryInput = useMemo(
    () => ({
      channelSlug: effectiveChannelSlug!,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      currency,
      orderType,
      statusFilter,
      chargeStatusFilter: chargeStatusFilter.length > 0 ? chargeStatusFilter : undefined,
    }),
    [effectiveChannelSlug, dateRange.from, dateRange.to, currency, orderType, statusFilter, chargeStatusFilter],
  );

  const refetchInterval = autoRefresh.enabled ? REFRESH_INTERVAL : false;

  const productPerfQuery = trpcClient.analytics.getProductPerformance.useQuery(queryInput, {
    enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
    refetchInterval,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (productPerfQuery.dataUpdatedAt > 0) autoRefresh.markUpdated();
  }, [productPerfQuery.dataUpdatedAt]);

  if (!appBridgeState?.ready) {
    return (
      <div className="flex items-center justify-center h-screen gap-3">
        <Loader2 size={24} className="animate-spin text-brand" />
        <span className="text-text-muted">Loading Product Analytics...</span>
      </div>
    );
  }

  return (
    <DashboardShell activeTab="products">
      <DashboardHeader
        title="Product Performance"
        subtitle="Revenue, quantity, and trend analysis for all products"
        actions={
          <>
            <AutoRefreshToggle
              enabled={autoRefresh.enabled}
              onToggle={autoRefresh.toggle}
              lastUpdated={autoRefresh.lastUpdated}
            />
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
            <ChargeStatusFilter value={chargeStatusFilter} onChange={setChargeStatusFilter} />
            <OrderTypeSelector value={orderType} onChange={setOrderType} />
            <ChannelSelector
              channels={channelsQuery.data ?? []}
              value={channelSlug}
              onChange={setChannelSlug}
              isLoading={channelsQuery.isLoading}
            />
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </>
        }
      />

      <QuickDateSelect currentPreset={dateRange.preset} onChange={setDateRange} />

      <DashboardSection>
        <ProductPerformanceTable
          data={productPerfQuery.data ?? []}
          currency={currency}
          isLoading={productPerfQuery.isLoading}
        />
      </DashboardSection>
    </DashboardShell>
  );
}
