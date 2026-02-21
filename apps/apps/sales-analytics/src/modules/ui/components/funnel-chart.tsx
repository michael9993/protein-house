import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

import type { FunnelData } from "../../analytics/domain/funnel-calculator";
import { ChartCard } from "./chart-card";

interface FunnelChartProps {
  data: FunnelData | undefined;
  isLoading?: boolean;
}

const FUNNEL_COLORS = ["#18181B", "#3F3F46", "#52525B", "#71717A", "#A1A1AA"];

function FunnelTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { name: string; conversionRate: number; dropoffRate: number; count: number };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-text-primary mb-1">{data.name}</p>
      <p className="text-sm text-text-muted">
        Count: <strong>{data.count.toLocaleString()}</strong>
      </p>
      <p className="text-sm text-text-muted">
        Overall: <strong>{data.conversionRate.toFixed(1)}%</strong>
      </p>
      {data.dropoffRate > 0 && (
        <p className="text-sm text-red-600">
          Drop-off: <strong>{data.dropoffRate.toFixed(1)}%</strong>
        </p>
      )}
    </div>
  );
}

export function FunnelChart({ data, isLoading }: FunnelChartProps) {
  if (isLoading) {
    return (
      <ChartCard title="Order Funnel">
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </ChartCard>
    );
  }

  if (!data || data.totalOrders === 0) {
    return (
      <ChartCard title="Order Funnel">
        <div className="flex justify-center items-center h-80 text-text-muted">
          No orders in this period to show funnel
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Order Funnel"
      subtitle={`${data.totalOrders.toLocaleString()} total orders`}
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data.stages}
          layout="vertical"
          margin={{ top: 8, right: 40, left: 20, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 13, fill: "#111827", fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip content={<FunnelTooltip />} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} animationDuration={500}>
            {data.stages.map((_, index) => (
              <Cell key={index} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stage breakdown table */}
      <div className="mt-4 border-t border-border pt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left font-semibold text-text-muted">Stage</th>
              <th className="pb-2 text-right font-semibold text-text-muted">Count</th>
              <th className="pb-2 text-right font-semibold text-text-muted">Conversion</th>
              <th className="pb-2 text-right font-semibold text-text-muted">Drop-off</th>
            </tr>
          </thead>
          <tbody>
            {data.stages.map((stage, index) => (
              <tr key={stage.name} className="border-b border-gray-50">
                <td className="py-2 flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length] }}
                  />
                  <span className="font-medium text-text-primary">{stage.name}</span>
                </td>
                <td className="py-2 text-right text-text-primary font-semibold">
                  {stage.count.toLocaleString()}
                </td>
                <td className="py-2 text-right text-text-muted">
                  {stage.conversionRate.toFixed(1)}%
                </td>
                <td className="py-2 text-right">
                  {stage.dropoffRate > 0 ? (
                    <span className="text-red-600">{stage.dropoffRate.toFixed(1)}%</span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
