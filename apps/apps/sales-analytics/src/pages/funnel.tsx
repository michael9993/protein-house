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
import { FunnelChart } from "@/modules/ui/components/funnel-chart";
import { AutoRefreshToggle, useAutoRefresh } from "@/modules/ui/components/auto-refresh-toggle";
import { getTimeRangeFromPreset, type TimeRange } from "@/modules/analytics/domain/time-range";

const REFRESH_INTERVAL = 30_000;

export const getServerSideProps: GetServerSideProps = async () => ({
  props: {},
});

export default function FunnelPage() {
  const { appBridgeState } = useAppBridge();
  const autoRefresh = useAutoRefresh();

  const [dateRange, setDateRange] = useState<TimeRange>(() => getTimeRangeFromPreset("last30days"));
  const [channelSlug, setChannelSlug] = useState<string | undefined>(undefined);

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
    }),
    [effectiveChannelSlug, dateRange.from, dateRange.to, currency],
  );

  const refetchInterval = autoRefresh.enabled ? REFRESH_INTERVAL : false;

  const funnelQuery = trpcClient.analytics.getFunnelData.useQuery(queryInput, {
    enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
    refetchInterval,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (funnelQuery.dataUpdatedAt > 0) autoRefresh.markUpdated();
  }, [funnelQuery.dataUpdatedAt]);

  if (!appBridgeState?.ready) {
    return (
      <div className="flex items-center justify-center h-screen gap-3">
        <Loader2 size={24} className="animate-spin text-brand" />
        <span className="text-text-muted">Loading Funnel Analytics...</span>
      </div>
    );
  }

  return (
    <DashboardShell activeTab="funnel">
      <DashboardHeader
        title="Order Funnel"
        subtitle="Track order progression from placement to fulfillment"
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
          </>
        }
      />

      <QuickDateSelect currentPreset={dateRange.preset} onChange={setDateRange} />

      <DashboardSection>
        <FunnelChart data={funnelQuery.data} isLoading={funnelQuery.isLoading} />
      </DashboardSection>
    </DashboardShell>
  );
}
