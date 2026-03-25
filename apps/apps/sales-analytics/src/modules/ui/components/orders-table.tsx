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

function ChargeStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    FULL: "bg-emerald-50 text-emerald-700",
    PARTIAL: "bg-blue-50 text-blue-700",
    NONE: "bg-gray-100 text-gray-600",
    REFUNDED: "bg-red-50 text-red-700",
    PARTIALLY_REFUNDED: "bg-orange-50 text-orange-700",
    OVERCHARGED: "bg-yellow-50 text-yellow-700",
  };
  const labelMap: Record<string, string> = {
    FULL: "Fully Charged",
    PARTIAL: "Partially Charged",
    NONE: "Not Charged",
    REFUNDED: "Refunded",
    PARTIALLY_REFUNDED: "Partially Refunded",
    OVERCHARGED: "Overcharged",
  };
  const colors = colorMap[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
      {labelMap[status] || formatStatus(status)}
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
              <th className="pb-2 text-left font-semibold text-text-muted">Payment</th>
              <th className="pb-2 text-right font-semibold text-text-muted">Total</th>
              <th className="pb-2 text-right font-semibold text-text-muted">Refund</th>
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
                <td className="py-2.5">
                  <ChargeStatusBadge status={order.chargeStatus} />
                </td>
                <td className="py-2.5 text-right font-semibold text-text-primary">
                  {formatCurrency(order.total.amount, order.total.currency)}
                </td>
                <td className="py-2.5 text-right text-sm">
                  {order.refundAmount > 0 ? (
                    <span className="text-red-600 font-medium">
                      -{formatCurrency(order.refundAmount, order.total.currency)}
                    </span>
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
