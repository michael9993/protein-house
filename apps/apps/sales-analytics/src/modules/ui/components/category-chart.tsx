import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import type { CategoryData } from "../../analytics/domain/kpi-types";
import { formatCurrency } from "../../analytics/domain/money";
import { CHART_COLORS, getChartColor } from "../utils/color-utils";
import { ChartCard } from "./chart-card";

interface CategoryChartProps {
  data: CategoryData[];
  currency: string;
  isLoading?: boolean;
}

function CategoryTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: entry.payload.fill }}
        />
        <span className="text-text-muted">{entry.name}:</span>
        <span className="font-semibold text-text-primary">
          {formatCurrency(entry.value, currency)}
        </span>
      </div>
    </div>
  );
}

export function CategoryDonutChart({ data, currency, isLoading }: CategoryChartProps) {
  if (isLoading) {
    return (
      <ChartCard title="Sales by Category">
        <div className="flex justify-center items-center h-48">
          <div className="w-32 h-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </ChartCard>
    );
  }

  if (data.length === 0) {
    return (
      <ChartCard title="Sales by Category">
        <div className="flex justify-center items-center h-48 text-text-muted">
          No category data available
        </div>
      </ChartCard>
    );
  }

  const sortedData = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);

  const total = useMemo(() => sortedData.reduce((sum, d) => sum + d.value, 0), [sortedData]);

  return (
    <ChartCard title="Sales by Category">
      <ResponsiveContainer width="100%" height={192}>
        <PieChart>
          <Pie
            data={sortedData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            animationDuration={500}
          >
            {sortedData.map((_, index) => (
              <Cell
                key={index}
                fill={getChartColor(index)}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CategoryTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {sortedData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-1.5 text-sm">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: getChartColor(index) }}
            />
            <span className="text-text-muted">{item.name}</span>
            {total > 0 && (
              <span className="text-text-muted text-xs">
                ({((item.value / total) * 100).toFixed(0)}%)
              </span>
            )}
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
