import { format, parseISO } from "date-fns";

import type { RecentOrder } from "../../analytics/domain/kpi-types";
import { formatCurrency } from "../../analytics/domain/money";
import { getStatusColors } from "../utils/color-utils";
import { ChartCard } from "./chart-card";

interface OrdersTableProps {
  orders: RecentOrder[];
  isLoading?: boolean;
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function StatusBadge({ status }: { status: string }) {
  const colors = getStatusColors(status.toUpperCase());
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
      {formatStatus(status)}
    </span>
  );
}

export function RecentOrdersTable({ orders, isLoading }: OrdersTableProps) {
  if (isLoading) {
    return (
      <ChartCard title="Recent Orders">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </ChartCard>
    );
  }

  if (orders.length === 0) {
    return (
      <ChartCard title="Recent Orders">
        <div className="flex justify-center items-center h-48 text-text-muted">
          No orders in this period
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Recent Orders">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left font-semibold text-text-muted">Order</th>
              <th className="pb-2 text-left font-semibold text-text-muted">Date</th>
              <th className="pb-2 text-left font-semibold text-text-muted">Customer</th>
              <th className="pb-2 text-left font-semibold text-text-muted">Status</th>
              <th className="pb-2 text-right font-semibold text-text-muted">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-gray-50 hover:bg-surface transition-colors"
              >
                <td className="py-2.5 font-medium text-text-primary">#{order.number}</td>
                <td className="py-2.5 text-text-muted">
                  {format(parseISO(order.date), "MMM d, yyyy")}
                </td>
                <td className="py-2.5 text-text-primary truncate max-w-[150px]">
                  {order.customer}
                </td>
                <td className="py-2.5">
                  <StatusBadge status={order.status} />
                </td>
                <td className="py-2.5 text-right font-semibold text-text-primary">
                  {formatCurrency(order.total.amount, order.total.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
