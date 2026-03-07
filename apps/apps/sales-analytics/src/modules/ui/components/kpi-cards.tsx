import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import type { DashboardKPIs, KPICard as KPICardType } from "../../analytics/domain/kpi-types";
import { formatCurrency } from "../../analytics/domain/money";

interface KPICardProps {
  title: string;
  value: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  previousValue?: string;
}

function TrendBadge({ trend }: { trend: { value: number; direction: "up" | "down" | "neutral" } }) {
  if (trend.direction === "neutral") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        <Minus size={12} />
        {trend.value.toFixed(1)}%
      </span>
    );
  }

  const isUp = trend.direction === "up";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {trend.value.toFixed(1)}%
    </span>
  );
}

export function KPICard({ title, value, trend, previousValue }: KPICardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm hover:shadow-md hover:border-brand/40 transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="whitespace-nowrap text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-1 whitespace-nowrap text-lg sm:text-2xl font-bold text-text-primary">{value}</p>
          {previousValue && (
            <p className="mt-1 text-xs text-text-muted">
              vs {previousValue} last period
            </p>
          )}
        </div>
        {trend && <TrendBadge trend={trend} />}
      </div>
    </div>
  );
}

interface ProfitabilityInfo {
  grossProfit: number;
  marginPercent: number;
  cogsAvailable: boolean;
  linesWithCost: number;
  linesTotal: number;
}

interface KPICardsGridProps {
  kpis: DashboardKPIs;
  profitability?: ProfitabilityInfo | null;
  currency?: string;
  isLoading?: boolean;
}

export function KPICardsGrid({ kpis, profitability, currency, isLoading }: KPICardsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-border bg-white p-4 shadow-sm"
          >
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-7 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  const kpiCards: (KPICardType & { key: string })[] = [
    { key: "gmv", ...kpis.gmv },
    { key: "totalOrders", ...kpis.totalOrders },
    { key: "aov", ...kpis.averageOrderValue },
    { key: "itemsSold", ...kpis.itemsSold },
    { key: "customers", ...kpis.uniqueCustomers },
  ];

  if (profitability && profitability.cogsAvailable && currency) {
    kpiCards.push(
      {
        key: "grossProfit",
        label: "Gross Profit",
        value: formatCurrency(profitability.grossProfit, currency),
      },
      {
        key: "margin",
        label: "Margin",
        value: `${profitability.marginPercent.toFixed(1)}%`,
      },
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {kpiCards.map((kpi) => (
        <KPICard
          key={kpi.key}
          title={kpi.label}
          value={kpi.value}
          trend={kpi.trend}
          previousValue={kpi.previousValue}
        />
      ))}
    </div>
  );
}
