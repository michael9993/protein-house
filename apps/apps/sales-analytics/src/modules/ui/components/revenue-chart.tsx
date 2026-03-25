import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
} from "recharts";

import type { RevenueDataPoint } from "../../analytics/domain/kpi-types";
import { formatCurrency, formatCompactNumber } from "../../analytics/domain/money";
import { ChartCard } from "./chart-card";
import { ChartTooltip } from "./chart-tooltip";

type ViewMode = "revenue" | "orders";

interface RevenueChartProps {
  data: RevenueDataPoint[];
  currency: string;
  isLoading?: boolean;
}

export function RevenueChart({ data, currency, isLoading }: RevenueChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("revenue");

  if (isLoading) {
    return (
      <ChartCard title="Revenue Over Time">
        <div className="h-72 bg-gray-100 rounded animate-pulse" />
      </ChartCard>
    );
  }

  const showOrders = viewMode === "orders";

  return (
    <ChartCard
      title="Revenue Over Time"
      actions={
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          <button
            onClick={() => setViewMode("revenue")}
            className={`px-3 py-1.5 font-medium transition-colors ${
              viewMode === "revenue"
                ? "bg-brand text-white"
                : "bg-white text-text-muted hover:bg-gray-50"
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setViewMode("orders")}
            className={`px-3 py-1.5 font-medium transition-colors ${
              viewMode === "orders"
                ? "bg-brand text-white"
                : "bg-white text-text-muted hover:bg-gray-50"
            }`}
          >
            Orders
          </button>
        </div>
      }
    >
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-72 text-text-muted">
          No data available for the selected period
        </div>
      ) : showOrders ? (
        <ResponsiveContainer width="100%" height={288}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toLocaleString()}
              width={60}
            />
            <Tooltip
              content={
                <ChartTooltip valueFormatter={(v) => `${v.toLocaleString()} orders`} />
              }
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#ordersGradient)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={288}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#18181B" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#18181B" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactNumber(v)}
              width={60}
            />
            <Tooltip
              content={<ChartTooltip currency={currency} />}
            />
            {/* GMV area */}
            <Area
              type="monotone"
              dataKey="revenue"
              name="Gross Revenue"
              stroke="#18181B"
              strokeWidth={2}
              fill="url(#gmvGradient)"
              animationDuration={500}
            />
            {/* Net Revenue dashed line */}
            <Line
              type="monotone"
              dataKey="netRevenue"
              name="Net Revenue"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              animationDuration={500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
