import { Card, Title, BarList, Flex, Text, Bold, Badge } from "@tremor/react";

import type { TopProduct } from "../../analytics/domain/kpi-types";
import { formatCurrency, formatCompactNumber } from "../../analytics/domain/money";

interface TopProductsProps {
  data: TopProduct[];
  currency: string;
  isLoading?: boolean;
}

export function TopProductsList({ data, currency, isLoading }: TopProductsProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Title>Top Products</Title>
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Title>Top Products</Title>
        <Flex justifyContent="center" alignItems="center" className="h-48">
          <Text color="gray">No products sold in this period</Text>
        </Flex>
      </Card>
    );
  }

  const barListData = data.map((product) => ({
    name: product.name,
    value: product.revenue,
  }));

  return (
    <Card className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <Title>Top Products by Revenue</Title>
      
      <div className="mt-4">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 mb-2 pb-2 border-b border-gray-200">
          <Text>
            <Bold>Product</Bold>
          </Text>
          <Text className="text-center">
            <Bold>Items Sold</Bold>
          </Text>
          <Text className="text-right">
            <Bold>Revenue</Bold>
          </Text>
        </div>

        {/* Table Rows */}
        <div className="space-y-3">
          {data.map((product) => (
            <div
              key={product.name}
              className="grid grid-cols-[1fr_auto_auto] gap-4 items-center"
            >
              <Text className="truncate">{product.name}</Text>
              <div className="flex justify-center">
                <Badge size="xs" color="gray">
                  {formatCompactNumber(product.quantity)} sold
                </Badge>
              </div>
              <Text className="text-right font-medium">
                {formatCurrency(product.revenue, currency)}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
