import {
  Card,
  Title,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Text,
  Flex,
} from "@tremor/react";
import { format, parseISO } from "date-fns";

import type { RecentOrder } from "../../analytics/domain/kpi-types";
import { formatCurrency } from "../../analytics/domain/money";

interface OrdersTableProps {
  orders: RecentOrder[];
  isLoading?: boolean;
}

function getStatusColor(
  status: string
): "gray" | "emerald" | "yellow" | "red" | "blue" | "orange" {
  switch (status.toUpperCase()) {
    case "FULFILLED":
      return "emerald";
    case "UNFULFILLED":
      return "yellow";
    case "PARTIALLY_FULFILLED":
      return "orange";
    case "CANCELED":
      return "red";
    case "RETURNED":
    case "PARTIALLY_RETURNED":
      return "blue";
    default:
      return "gray";
  }
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function RecentOrdersTable({ orders, isLoading }: OrdersTableProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Title>Recent Orders</Title>
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Title>Recent Orders</Title>
        <Flex justifyContent="center" alignItems="center" className="h-48">
          <Text color="gray">No orders in this period</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <Title>Recent Orders</Title>
      
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Order</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Customer</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Total</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Text className="font-medium">#{order.number}</Text>
              </TableCell>
              <TableCell>
                <Text>{format(parseISO(order.date), "MMM d, yyyy")}</Text>
              </TableCell>
              <TableCell>
                <Text className="truncate max-w-[150px]">{order.customer}</Text>
              </TableCell>
              <TableCell>
                <Badge color={getStatusColor(order.status)} size="xs">
                  {formatStatus(order.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Text className="font-medium">
                  {formatCurrency(order.total.amount, order.total.currency)}
                </Text>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
