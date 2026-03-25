import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { GetServerSideProps } from "next";
import { useState, useMemo, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

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
import { AutoRefreshToggle, useAutoRefresh } from "@/modules/ui/components/auto-refresh-toggle";
import { ChartCard } from "@/modules/ui/components/chart-card";
import { ChartTooltip } from "@/modules/ui/components/chart-tooltip";
import { getTimeRangeFromPreset, type TimeRange } from "@/modules/analytics/domain/time-range";
import { formatCurrency, formatCompactNumber } from "@/modules/analytics/domain/money";
import type { OrderTypeFilter } from "@/modules/analytics/domain/kpi-types";
import { DEFAULT_INCLUDED_STATUSES } from "@/modules/analytics/domain/kpi-types";
import { OrderStatus, OrderChargeStatusEnum } from "../../generated/graphql";

const REFRESH_INTERVAL = 30_000;

export const getServerSideProps: GetServerSideProps = async () => ({
  props: {},
});

function PnlRow({
  label,
  value,
  currency,
  isPercent,
  negative,
  bold,
  indent,
}: {
  label: string;
  value: number;
  currency?: string;
  isPercent?: boolean;
  negative?: boolean;
  bold?: boolean;
  indent?: boolean;
}) {
  const formattedValue = isPercent
    ? `${value.toFixed(1)}%`
    : currency
      ? formatCurrency(value, currency)
      : value.toFixed(2);

  return (
    <tr className={`border-b border-border/50 ${bold ? "font-semibold" : ""}`}>
      <td className={`py-2.5 text-text-primary ${indent ? "pl-6" : ""}`}>{label}</td>
      <td className={`py-2.5 text-right ${negative ? "text-red-600" : bold ? "text-text-primary" : "text-text-muted"}`}>
        {formattedValue}
      </td>
    </tr>
  );
}

export default function ProfitabilityPage() {
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

  const profitabilityQuery = trpcClient.analytics.getProfitability.useQuery(queryInput, {
    enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
    refetchInterval,
    keepPreviousData: true,
  });

  const chartQuery = trpcClient.analytics.getProfitabilityOverTime.useQuery(queryInput, {
    enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
    refetchInterval,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (profitabilityQuery.dataUpdatedAt > 0) autoRefresh.markUpdated();
  }, [profitabilityQuery.dataUpdatedAt]);

  if (!appBridgeState?.ready) {
    return (
      <div className="flex items-center justify-center h-screen gap-3">
        <Loader2 size={24} className="animate-spin text-brand" />
        <span className="text-text-muted">Loading Profitability Analytics...</span>
      </div>
    );
  }

  const data = profitabilityQuery.data?.profitability;
  const resolvedCurrency = profitabilityQuery.data?.currency ?? currency;

  return (
    <DashboardShell activeTab="profitability">
      <DashboardHeader
        title="Profitability"
        subtitle="Revenue, costs, and margin analysis"
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

      {/* P&L Summary Cards */}
      <DashboardSection>
        {profitabilityQuery.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-white p-4 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-7 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <SummaryCard label="Gross Revenue" value={formatCurrency(data.grossRevenue, resolvedCurrency)} />
            <SummaryCard label="Refunds" value={formatCurrency(data.refunds, resolvedCurrency)} negative />
            <SummaryCard label="Net Revenue" value={formatCurrency(data.netRevenue, resolvedCurrency)} />
            <SummaryCard label="COGS" value={formatCurrency(data.cogs, resolvedCurrency)} negative />
            <SummaryCard label="Gross Profit" value={formatCurrency(data.grossProfit, resolvedCurrency)} highlight />
            <SummaryCard label="Margin" value={`${data.marginPercent.toFixed(1)}%`} highlight />
          </div>
        ) : null}
      </DashboardSection>

      {/* Cost Coverage Warning */}
      {data && data.linesWithCost < data.linesTotal && (
        <DashboardSection>
          <div className="flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
            <AlertTriangle size={20} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              Cost data available for <strong>{data.linesWithCost}</strong> of{" "}
              <strong>{data.linesTotal}</strong> line items.
              Profitability metrics are based on available cost data only.
            </p>
          </div>
        </DashboardSection>
      )}

      {/* Profitability Over Time Chart */}
      <DashboardSection>
        <ChartCard title="Profitability Over Time">
          {chartQuery.isLoading ? (
            <div className="h-72 bg-gray-100 rounded animate-pulse" />
          ) : chartQuery.data && chartQuery.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartQuery.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCompactNumber(v)} />
                <Tooltip
                  content={
                    <ChartTooltip
                      valueFormatter={(value) => formatCurrency(value, resolvedCurrency)}
                    />
                  }
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} name="Revenue" />
                <Area type="monotone" dataKey="cogs" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="COGS" />
                <Area type="monotone" dataKey="refunds" stroke="#f97316" fill="#f97316" fillOpacity={0.1} name="Refunds" />
                <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-text-muted">
              No data available for the selected period
            </div>
          )}
        </ChartCard>
      </DashboardSection>

      {/* P&L Table */}
      {data && (
        <DashboardSection>
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Profit & Loss</h3>
            <table className="w-full text-sm">
              <tbody>
                <PnlRow label="Gross Revenue" value={data.grossRevenue} currency={resolvedCurrency} />
                <PnlRow label="Shipping Revenue" value={data.shippingRevenue} currency={resolvedCurrency} indent />
                <PnlRow label="Refunds" value={-data.refunds} currency={resolvedCurrency} negative />
                <PnlRow label="Net Revenue" value={data.netRevenue} currency={resolvedCurrency} bold />
                <PnlRow label="Cost of Goods (COGS)" value={-data.cogs} currency={resolvedCurrency} negative />
                <PnlRow label="Discounts" value={-data.discounts} currency={resolvedCurrency} negative />
                <PnlRow label="Gross Profit" value={data.grossProfit} currency={resolvedCurrency} bold />
                <PnlRow label="Margin" value={data.marginPercent} isPercent bold />
              </tbody>
            </table>
            <div className="mt-4 text-xs text-text-muted">
              Based on {data.orderCount} orders | {data.linesWithCost} of {data.linesTotal} line items have cost data
            </div>
          </div>
        </DashboardSection>
      )}
    </DashboardShell>
  );
}

function SummaryCard({
  label,
  value,
  negative,
  highlight,
}: {
  label: string;
  value: string;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <p className={`mt-1 text-lg sm:text-2xl font-bold ${
        negative ? "text-red-600" : highlight ? "text-emerald-600" : "text-text-primary"
      }`}>
        {value}
      </p>
    </div>
  );
}
