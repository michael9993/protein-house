import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import type { RevenueDataPoint } from "../../analytics/domain/kpi-types";
import { formatCurrency, formatCompactNumber } from "../../analytics/domain/money";
import { ChartCard } from "./chart-card";
import { ChartTooltip } from "./chart-tooltip";

interface RevenueChartProps {
  data: RevenueDataPoint[];
  currency: string;
  isLoading?: boolean;
}

export function RevenueChart({ data, currency, isLoading }: RevenueChartProps) {
  const [showOrders, setShowOrders] = useState(false);

  if (isLoading) {
    return (
      <ChartCard title="Revenue Over Time">
        <div className="h-72 bg-gray-100 rounded animate-pulse" />
      </ChartCard>
    );
  }

  const dataKey = showOrders ? "orders" : "revenue";
  const strokeColor = showOrders ? "#059669" : "#18181B";
  const fillColor = showOrders ? "#059669" : "#18181B";

  return (
    <ChartCard
      title="Revenue Over Time"
      actions={
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          <button
            onClick={() => setShowOrders(false)}
            className={`px-3 py-1.5 font-medium transition-colors ${
              !showOrders
                ? "bg-brand text-white"
                : "bg-white text-text-muted hover:bg-gray-50"
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setShowOrders(true)}
            className={`px-3 py-1.5 font-medium transition-colors ${
              showOrders
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
      ) : (
        <ResponsiveContainer width="100%" height={288}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={fillColor} stopOpacity={0.02} />
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
              tickFormatter={(v) =>
                showOrders ? v.toLocaleString() : formatCompactNumber(v)
              }
              width={60}
            />
            <Tooltip
              content={
                <ChartTooltip
                  currency={showOrders ? undefined : currency}
                  valueFormatter={
                    showOrders ? (v) => `${v.toLocaleString()} orders` : undefined
                  }
                />
              }
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={strokeColor}
              strokeWidth={2}
              fill="url(#areaGradient)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
