import type { TopProduct } from "../../analytics/domain/kpi-types";
import { formatCurrency, formatCompactNumber } from "../../analytics/domain/money";
import { ChartCard } from "./chart-card";

interface TopProductsProps {
  data: TopProduct[];
  currency: string;
  isLoading?: boolean;
  onProductClick?: (productName: string) => void;
}

export function TopProductsList({ data, currency, isLoading, onProductClick }: TopProductsProps) {
  if (isLoading) {
    return (
      <ChartCard title="Top Products by Revenue">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </ChartCard>
    );
  }

  if (data.length === 0) {
    return (
      <ChartCard title="Top Products by Revenue">
        <div className="flex justify-center items-center h-48 text-text-muted">
          No products sold in this period
        </div>
      </ChartCard>
    );
  }

  const maxRevenue = Math.max(...data.map((p) => p.revenue));

  return (
    <ChartCard title="Top Products by Revenue">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-2 text-left font-semibold text-text-muted w-8">#</th>
            <th className="pb-2 text-left font-semibold text-text-muted">Product</th>
            <th className="pb-2 text-center font-semibold text-text-muted">Qty</th>
            <th className="pb-2 text-right font-semibold text-text-muted">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((product, index) => (
            <tr
              key={product.name}
              className={`border-b border-gray-50 hover:bg-surface transition-colors ${
                onProductClick ? "cursor-pointer" : ""
              }`}
              onClick={() => onProductClick?.(product.name)}
            >
              <td className="py-2.5 text-text-muted font-medium">{index + 1}</td>
              <td className="py-2.5">
                <div className="flex flex-col gap-1">
                  <span className="truncate font-medium text-text-primary max-w-[180px]">
                    {product.name}
                  </span>
                  {/* Revenue bar */}
                  <div className="h-1 rounded-full bg-gray-100 w-full">
                    <div
                      className="h-1 rounded-full bg-brand"
                      style={{ width: `${maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="py-2.5 text-center">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-muted">
                  {formatCompactNumber(product.quantity)}
                </span>
              </td>
              <td className="py-2.5 text-right font-semibold text-text-primary">
                {formatCurrency(product.revenue, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartCard>
  );
}
