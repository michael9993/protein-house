import { DashboardCard } from "@dashboard/components/Card";
import { DateTime } from "@dashboard/components/Date";
import Money from "@dashboard/components/Money";
import { StatusDot, type DotStatus } from "@dashboard/components/StatusDot/StatusDot";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@dashboard/components/Table";
import TableRowLink from "@dashboard/components/TableRowLink";
import { type OrderStatus } from "@dashboard/graphql";
import { orderListUrl, orderUrl } from "@dashboard/orders/urls";
import { Box, Skeleton, Text } from "@saleor/macaw-ui-next";
import { FormattedMessage, useIntl } from "react-intl";
import { Link } from "react-router";

import { type DashboardData } from "../hooks/useDashboardData";

interface RecentOrdersProps {
  orders: DashboardData["recentOrders"];
  loading: boolean;
  hasPermission: boolean;
}

const statusDotMap: Record<string, DotStatus> = {
  UNFULFILLED: "warning",
  PARTIALLY_FULFILLED: "warning",
  FULFILLED: "success",
  CANCELED: "error",
  RETURNED: "error",
  UNCONFIRMED: "warning",
};

const getStatusDot = (status: OrderStatus): DotStatus =>
  statusDotMap[status] ?? "warning";

const statusLabels: Record<string, string> = {
  UNFULFILLED: "Unfulfilled",
  PARTIALLY_FULFILLED: "Partial",
  FULFILLED: "Fulfilled",
  CANCELED: "Canceled",
  RETURNED: "Returned",
  UNCONFIRMED: "Unconfirmed",
  PARTIALLY_RETURNED: "Partial return",
};

export const RecentOrders = ({
  orders,
  loading,
  hasPermission,
}: RecentOrdersProps) => {
  const intl = useIntl();

  if (!hasPermission) {
    return null;
  }

  return (
    <DashboardCard
      borderRadius={3}
      borderWidth={1}
      borderStyle="solid"
      borderColor="default1"
    >
      <DashboardCard.Header>
        <Text size={5} fontWeight="bold">
          <FormattedMessage
            defaultMessage="Recent Orders"
            id="dashboard-recent-orders-title"
          />
        </Text>
        <Link to={orderListUrl()}>
          <Text size={3} color="default2" textDecoration="none">
            <FormattedMessage
              defaultMessage="View All"
              id="dashboard-recent-orders-view-all"
            />
          </Text>
        </Link>
      </DashboardCard.Header>
      <DashboardCard.Content>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                {intl.formatMessage({
                  defaultMessage: "Order",
                  id: "recent-orders-col-order",
                })}
              </TableCell>
              <TableCell>
                {intl.formatMessage({
                  defaultMessage: "Customer",
                  id: "recent-orders-col-customer",
                })}
              </TableCell>
              <TableCell>
                {intl.formatMessage({
                  defaultMessage: "Status",
                  id: "recent-orders-col-status",
                })}
              </TableCell>
              <TableCell>
                {intl.formatMessage({
                  defaultMessage: "Date",
                  id: "recent-orders-col-date",
                })}
              </TableCell>
              <TableCell align="right">
                {intl.formatMessage({
                  defaultMessage: "Total",
                  id: "recent-orders-col-total",
                })}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton />
                    </TableCell>
                  </TableRow>
                ))
              : orders.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Box
                          display="flex"
                          justifyContent="center"
                          paddingY={4}
                        >
                          <Text color="default2">
                            <FormattedMessage
                              defaultMessage="No orders yet"
                              id="dashboard-recent-orders-empty"
                            />
                          </Text>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                : orders.map(({ node: order }) => {
                    const customerName = order.billingAddress
                      ? `${order.billingAddress.firstName} ${order.billingAddress.lastName}`.trim()
                      : order.userEmail ?? "—";

                    return (
                      <TableRowLink
                        key={order.id}
                        href={orderUrl(order.id)}
                      >
                        <TableCell>
                          <Text size={3} fontWeight="medium">
                            #{order.number}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Text size={3} className="max-w-[150px] truncate">
                            {customerName}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={2}
                          >
                            <StatusDot status={getStatusDot(order.status)} />
                            <Text size={3}>
                              {statusLabels[order.status] ?? order.status}
                            </Text>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Text size={3} color="default2">
                            <DateTime date={order.created} />
                          </Text>
                        </TableCell>
                        <TableCell align="right">
                          <Text size={3} fontWeight="medium">
                            <Money money={order.total.gross} />
                          </Text>
                        </TableCell>
                      </TableRowLink>
                    );
                  })}
          </TableBody>
        </Table>
      </DashboardCard.Content>
    </DashboardCard>
  );
};
