import Money from "@dashboard/components/Money";
import { Box } from "@saleor/macaw-ui-next";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useIntl } from "react-intl";

import { type DashboardData } from "../hooks/useDashboardData";
import { KpiCard } from "./KpiCard";

interface KpiGridProps {
  data: DashboardData;
  hasPermissionToManageOrders: boolean;
  hasPermissionToManageUsers: boolean;
}

export const KpiGrid = ({
  data,
  hasPermissionToManageOrders,
  hasPermissionToManageUsers,
}: KpiGridProps) => {
  const intl = useIntl();
  const loading = data.loading.analytics || data.loading.stats;

  return (
    <Box
      display="grid"
      gap={5}
      __gridTemplateColumns="repeat(auto-fill, minmax(min(100%, 200px), 1fr))"
    >
      {hasPermissionToManageOrders && (
        <KpiCard
          title={intl.formatMessage({
            defaultMessage: "Revenue Today",
            id: "kpi-revenue-today",
          })}
          value={
            data.revenueToday ? (
              <Money money={data.revenueToday.gross} />
            ) : (
              "—"
            )
          }
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
          testId="kpi-revenue-today"
        />
      )}

      {hasPermissionToManageOrders && (
        <KpiCard
          title={intl.formatMessage({
            defaultMessage: "Orders Today",
            id: "kpi-orders-today",
          })}
          value={data.ordersToday.toLocaleString()}
          icon={ShoppingCart}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading}
          testId="kpi-orders-today"
        />
      )}

      <KpiCard
        title={intl.formatMessage({
          defaultMessage: "Total Products",
          id: "kpi-products-total",
        })}
        value={data.productsTotal.toLocaleString()}
        icon={Package}
        iconBg="bg-violet-50"
        iconColor="text-violet-600"
        loading={loading}
        testId="kpi-products-total"
      />

      {hasPermissionToManageUsers && (
        <KpiCard
          title={intl.formatMessage({
            defaultMessage: "Total Customers",
            id: "kpi-customers-total",
          })}
          value={data.customersTotal.toLocaleString()}
          icon={Users}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          loading={loading}
          testId="kpi-customers-total"
        />
      )}

      {hasPermissionToManageOrders && (
        <KpiCard
          title={intl.formatMessage({
            defaultMessage: "Revenue This Month",
            id: "kpi-revenue-month",
          })}
          value={
            data.revenueThisMonth ? (
              <Money money={data.revenueThisMonth.gross} />
            ) : (
              "—"
            )
          }
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
          testId="kpi-revenue-month"
        />
      )}

      {hasPermissionToManageOrders && (
        <KpiCard
          title={intl.formatMessage({
            defaultMessage: "Awaiting Fulfillment",
            id: "kpi-orders-to-fulfill",
          })}
          value={data.ordersToFulfill.toLocaleString()}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          loading={loading}
          testId="kpi-orders-to-fulfill"
        />
      )}

      <KpiCard
        title={intl.formatMessage({
          defaultMessage: "Out of Stock",
          id: "kpi-out-of-stock",
        })}
        value={data.productsOutOfStock.toLocaleString()}
        icon={AlertTriangle}
        iconBg="bg-red-50"
        iconColor="text-red-500"
        loading={loading}
        testId="kpi-out-of-stock"
      />

      {hasPermissionToManageUsers && (
        <KpiCard
          title={intl.formatMessage({
            defaultMessage: "New Customers Today",
            id: "kpi-customers-today",
          })}
          value={data.customersToday.toLocaleString()}
          icon={UserPlus}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          loading={loading}
          testId="kpi-customers-today"
        />
      )}
    </Box>
  );
};
