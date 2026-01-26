import { Card, Title, AreaChart, Text, Flex, TabGroup, TabList, Tab } from "@tremor/react";
import { useState } from "react";

import type { RevenueDataPoint } from "../../analytics/domain/kpi-types";
import { formatCurrency } from "../../analytics/domain/money";

interface RevenueChartProps {
  data: RevenueDataPoint[];
  currency: string;
  isLoading?: boolean;
}

export function RevenueChart({ data, currency, isLoading }: RevenueChartProps) {
  const [showOrders, setShowOrders] = useState(false);

  if (isLoading) {
    return (
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
        <div className="h-72 bg-gray-100 rounded animate-pulse" />
      </Card>
    );
  }

  const categories = showOrders ? ["orders"] : ["revenue"];
  const colors = showOrders ? ["emerald"] : ["blue"];

  const valueFormatter = (value: number) => {
    if (showOrders) {
      return `${value} orders`;
    }
    return formatCurrency(value, currency);
  };

  return (
    <Card className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <Title>Revenue Over Time</Title>
        <TabGroup
          index={showOrders ? 1 : 0}
          onIndexChange={(index) => setShowOrders(index === 1)}
        >
          <TabList variant="solid" className="w-fit">
            <Tab>Revenue</Tab>
            <Tab>Orders</Tab>
          </TabList>
        </TabGroup>
      </Flex>

      {data.length === 0 ? (
        <Flex justifyContent="center" alignItems="center" className="h-72">
          <Text color="gray">No data available for the selected period</Text>
        </Flex>
      ) : (
        <AreaChart
          className="h-72"
          data={data}
          index="date"
          categories={categories}
          colors={colors}
          valueFormatter={valueFormatter}
          showLegend={false}
          showAnimation={true}
          curveType="monotone"
        />
      )}
    </Card>
  );
}
