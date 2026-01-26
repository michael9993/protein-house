import { Card, Metric, Text, Flex, BadgeDelta, Grid } from "@tremor/react";

import type { DashboardKPIs, KPICard as KPICardType } from "../../analytics/domain/kpi-types";

interface KPICardProps {
  title: string;
  value: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  cardKey?: string;
}

// Professional neutral styling for all cards
const getCardStyles = () => {
  return {
    borderColor: "border-gray-200",
    bgColor: "bg-white",
  };
};

export function KPICard({ title, value, trend, cardKey }: KPICardProps) {
  const getDeltaType = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "increase";
      case "down":
        return "decrease";
      default:
        return "unchanged";
    }
  };

  const styles = getCardStyles();

  return (
    <Card
      className={`max-w-xs mx-auto rounded-xl border ${styles.borderColor} ${styles.bgColor} shadow-sm hover:shadow-md transition-shadow duration-200`}
    >
      <Flex alignItems="start">
        <div className="truncate flex-1">
          <Text className="truncate text-gray-600 font-medium">{title}</Text>
          <Metric className="truncate text-gray-900 font-bold">{value}</Metric>
        </div>
        {trend && trend.direction !== "neutral" && (
          <BadgeDelta deltaType={getDeltaType(trend.direction)} size="xs">
            {trend.value.toFixed(1)}%
          </BadgeDelta>
        )}
      </Flex>
    </Card>
  );
}

interface KPICardsGridProps {
  kpis: DashboardKPIs;
  isLoading?: boolean;
}

export function KPICardsGrid({ kpis, isLoading }: KPICardsGridProps) {
  if (isLoading) {
    return (
      <Grid numItemsSm={2} numItemsLg={5} className="gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card
            key={i}
            className="max-w-xs mx-auto animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-24" />
          </Card>
        ))}
      </Grid>
    );
  }

  const kpiCards: (KPICardType & { key: string })[] = [
    { key: "gmv", ...kpis.gmv },
    { key: "totalOrders", ...kpis.totalOrders },
    { key: "aov", ...kpis.averageOrderValue },
    { key: "itemsSold", ...kpis.itemsSold },
    { key: "customers", ...kpis.uniqueCustomers },
  ];

  return (
    <Grid numItemsSm={2} numItemsLg={5} className="gap-4">
      {kpiCards.map((kpi) => (
        <KPICard
          key={kpi.key}
          cardKey={kpi.key}
          title={kpi.label}
          value={kpi.value}
          trend={kpi.trend}
        />
      ))}
    </Grid>
  );
}
