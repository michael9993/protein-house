import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

import type { ProductPerformance } from "../../analytics/domain/analytics-calculator";
import { formatCurrency, formatCompactNumber } from "../../analytics/domain/money";
import { ChartCard } from "./chart-card";
import { Sparkline } from "./sparkline";

interface ProductPerformanceTableProps {
  data: ProductPerformance[];
  currency: string;
  isLoading?: boolean;
}

type SortKey = "name" | "revenue" | "quantity" | "percentOfTotal";
type SortDir = "asc" | "desc";

export function ProductPerformanceTable({
  data,
  currency,
  isLoading,
}: ProductPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...data].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") return mul * a.name.localeCompare(b.name);
    return mul * (a[sortKey] - b[sortKey]);
  });

  if (isLoading) {
    return (
      <ChartCard title="Product Performance">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </ChartCard>
    );
  }

  if (data.length === 0) {
    return (
      <ChartCard title="Product Performance">
        <div className="flex justify-center items-center h-48 text-text-muted">
          No product data available
        </div>
      </ChartCard>
    );
  }

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th
      className="pb-2 text-left font-semibold text-text-muted cursor-pointer select-none hover:text-text-primary transition-colors"
      onClick={() => handleSort(sortKeyName)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          size={12}
          className={sortKey === sortKeyName ? "text-brand" : "text-gray-300"}
        />
      </span>
    </th>
  );

  return (
    <ChartCard
      title="Product Performance"
      subtitle={`${data.length} products`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left font-semibold text-text-muted w-8">#</th>
              <SortHeader label="Product" sortKeyName="name" />
              <SortHeader label="Revenue" sortKeyName="revenue" />
              <SortHeader label="Qty" sortKeyName="quantity" />
              <SortHeader label="% of Total" sortKeyName="percentOfTotal" />
              <th className="pb-2 text-center font-semibold text-text-muted">Trend</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product, index) => (
              <tr
                key={product.name}
                className="border-b border-gray-50 hover:bg-surface transition-colors"
              >
                <td className="py-2.5 text-text-muted">{index + 1}</td>
                <td className="py-2.5 font-medium text-text-primary truncate max-w-[200px]">
                  {product.name}
                </td>
                <td className="py-2.5 font-semibold text-text-primary">
                  {formatCurrency(product.revenue, currency)}
                </td>
                <td className="py-2.5 text-text-muted">
                  {formatCompactNumber(product.quantity)}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-gray-100 flex-1 max-w-[80px]">
                      <div
                        className="h-1.5 rounded-full bg-brand"
                        style={{ width: `${Math.min(product.percentOfTotal, 100)}%` }}
                      />
                    </div>
                    <span className="text-text-muted text-xs w-10 text-right">
                      {product.percentOfTotal.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="py-2.5">
                  <div className="flex justify-center">
                    <Sparkline data={product.dailyRevenue} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
