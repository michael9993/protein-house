import type { TooltipProps } from "recharts";

import { formatCurrency } from "../../analytics/domain/money";

interface ChartTooltipPayload {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
}

interface ChartTooltipProps extends TooltipProps<number, string> {
  currency?: string;
  valueFormatter?: (value: number) => string;
}

export function ChartTooltip({ active, payload, label, currency, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const format = valueFormatter ?? (currency ? (v: number) => formatCurrency(v, currency) : (v: number) => v.toLocaleString());

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-lg">
      {label && <p className="text-xs font-medium text-text-muted mb-1">{label}</p>}
      {(payload as ChartTooltipPayload[]).map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-muted">{entry.name}:</span>
          <span className="font-semibold text-text-primary">
            {entry.value != null ? format(entry.value) : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
