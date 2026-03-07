# Analytics: Dropship Filter + Clean Revenue

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a global "order type" filter (All/Dropship/Non-Dropship) to the sales analytics app, and add clean revenue / profitability analytics showing COGS, gross profit, margins, and a P&L breakdown.

**Architecture:** Expand the GraphQL fragment to include shipping, discounts, cost data, and product metadata. Add a post-fetch filtering layer for dropship detection. Create a new profitability calculator. Add profit KPI cards to the main dashboard and a new "Profitability" tab page. All changes are isolated to the `apps/apps/sales-analytics/` app.

**Tech Stack:** Next.js (Pages Router), tRPC, React, Tailwind CSS, neverthrow, Zod, recharts

---

## Context

The sales analytics app currently tracks GMV, orders, AOV, items sold, and unique customers. It has no concept of costs or margins. Dropshipped products (AliExpress, CJ) have cost data stored in Saleor product metadata (`dropship.costPrice`, `dropship.supplier`). Saleor also has native `costPrice` on `ProductVariant.channelListings`. The user wants to see "clean revenue" (revenue minus costs) and filter analytics by dropship vs non-dropship orders.

**Key existing files:**
- Fragment: `graphql/fragments/order-analytics.graphql`
- Types: `src/modules/analytics/domain/kpi-types.ts`
- Calculator: `src/modules/analytics/domain/analytics-calculator.ts`
- Money utils: `src/modules/analytics/domain/money.ts`
- Router: `src/modules/trpc/router.ts` (uses `resolveCurrency()` helper, `createLogger`)
- Main page: `src/pages/index.tsx`
- Nav tabs: `src/modules/ui/components/nav-tabs.tsx` (overview, products, funnel)
- Channel selector: `src/modules/ui/components/channel-selector.tsx` (pattern to follow for order type selector)
- KPI cards: `src/modules/ui/components/kpi-cards.tsx`
- Dashboard layout: `src/modules/ui/layout/dashboard-shell.tsx`

**Reusable patterns:**
- `resolveCurrency()` in router.ts — currency detection helper
- `filterOrdersByCurrency()` in analytics-calculator.ts — post-fetch filtering pattern
- `ChannelSelector` component — dropdown pattern to clone for OrderTypeSelector
- `calculateFunnelData()` in funnel-calculator.ts — example of a domain calculator returning `Result<T, E>`
- `formatCurrency()`, `formatCompactNumber()` in money.ts — formatting utils

---

## Task 1: Expand GraphQL Fragment

**Files:**
- Modify: `apps/apps/sales-analytics/graphql/fragments/order-analytics.graphql`

**Change:** Add shipping price, discounts, line cost data, and product metadata to the existing fragment.

```graphql
fragment OrderAnalytics on Order {
  id
  number
  created
  status
  total {
    gross { ...Money }
    net { ...Money }
  }
  shippingPrice {
    gross { ...Money }
  }
  discounts {
    id
    type
    name
    amount { ...Money }
  }
  channel {
    slug
    name
    currencyCode
  }
  lines {
    id
    productName
    productSku
    quantity
    totalPrice {
      gross { ...Money }
    }
    unitDiscount { ...Money }
    variant {
      channelListings {
        costPrice { ...Money }
        channel { slug }
      }
      product {
        id
        name
        category {
          id
          name
        }
        metadata { key value }
        privateMetadata { key value }
      }
    }
  }
  user {
    id
    email
  }
}
```

After modifying, regenerate types. Note: the app's `pnpm generate` may fail due to pre-existing `Hour` scalar issue — this is expected. The generated types file will still be updated by the codegen process up to the point of failure, OR we can add `Hour: string` to the scalars config. Check `codegen.ts` for the scalar mapping.

If codegen fails, manually check `generated/graphql.ts` — if the `OrderAnalyticsFragment` type was NOT updated, we need to fix the codegen config first.

**Fallback:** If codegen can't be fixed easily, add the scalar mapping `Hour: string` to the codegen config file.

```bash
docker exec saleor-sales-analytics-app-dev sh -c "cd /app/apps/sales-analytics && pnpm generate"
```

---

## Task 2: Add Profitability Types

**Files:**
- Modify: `apps/apps/sales-analytics/src/modules/analytics/domain/kpi-types.ts`

**Add these types** after the existing `CurrencyInfo` type:

```typescript
/**
 * Order type filter for dropship vs non-dropship analytics
 */
export const OrderTypeFilterSchema = z.enum(["all", "dropship", "non-dropship"]);
export type OrderTypeFilter = z.infer<typeof OrderTypeFilterSchema>;

/**
 * Profitability P&L breakdown
 */
export const ProfitabilityDataSchema = z.object({
  grossRevenue: z.number(),
  shippingRevenue: z.number(),
  cogs: z.number(),
  cogsAvailable: z.boolean(), // false if no cost data found
  discounts: z.number(),
  grossProfit: z.number(),
  netRevenue: z.number(),
  marginPercent: z.number(),
  orderCount: z.number(),
  linesWithCost: z.number(),
  linesTotal: z.number(),
});
export type ProfitabilityData = z.infer<typeof ProfitabilityDataSchema>;

/**
 * Profitability data point for charts
 */
export const ProfitabilityDataPointSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  cogs: z.number(),
  profit: z.number(),
});
export type ProfitabilityDataPoint = z.infer<typeof ProfitabilityDataPointSchema>;
```

---

## Task 3: Create Dropship Detection + Order Filtering Helpers

**Files:**
- Modify: `apps/apps/sales-analytics/src/modules/analytics/domain/analytics-calculator.ts`

**Add** two new exported functions after the existing `filterOrdersByCurrency`:

```typescript
/**
 * Check if an order line is a dropship item.
 * Looks for `dropship.supplier` key in product metadata.
 */
export function isDropshipLine(line: OrderAnalyticsFragment["lines"][number]): boolean {
  const metadata = line.variant?.product?.metadata ?? [];
  return metadata.some((m) => m.key === "dropship.supplier");
}

/**
 * Check if an order contains any dropship line items.
 */
export function isDropshipOrder(order: OrderAnalyticsFragment): boolean {
  return order.lines.some(isDropshipLine);
}

/**
 * Filter orders by order type (all, dropship, non-dropship).
 */
export function filterOrdersByType(
  orders: OrderAnalyticsFragment[],
  orderType: OrderTypeFilter
): OrderAnalyticsFragment[] {
  if (orderType === "all") return orders;
  if (orderType === "dropship") return orders.filter(isDropshipOrder);
  return orders.filter((o) => !isDropshipOrder(o));
}
```

Import `OrderTypeFilter` from `./kpi-types`.

---

## Task 4: Create Profitability Calculator

**Files:**
- Create: `apps/apps/sales-analytics/src/modules/analytics/domain/profitability-calculator.ts`

**This is the core business logic.** The calculator resolves cost per line and computes the P&L.

```typescript
import { Result, ok, err } from "neverthrow";
import { format, parseISO, startOfDay, startOfWeek, startOfMonth } from "date-fns";

import type { OrderAnalyticsFragment } from "../../../../generated/graphql";
import { AnalyticsCalculationError } from "./analytics-calculator";
import type { ProfitabilityData, ProfitabilityDataPoint } from "./kpi-types";
import type { Granularity } from "./time-range";

/**
 * Resolve cost price for a single order line.
 * Priority: 1) variant.channelListings costPrice (matching channel)
 *           2) product privateMetadata dropship.costPrice
 *           3) null (no cost data)
 */
function resolveLineCost(
  line: OrderAnalyticsFragment["lines"][number],
  channelSlug: string | undefined
): number | null {
  // 1. Try Saleor native costPrice from channel listings
  const listings = line.variant?.channelListings ?? [];
  if (channelSlug) {
    const channelListing = listings.find((l) => l.channel.slug === channelSlug);
    if (channelListing?.costPrice) {
      return channelListing.costPrice.amount;
    }
  }
  // Fallback: first listing with a costPrice
  const anyListing = listings.find((l) => l.costPrice);
  if (anyListing?.costPrice) {
    return anyListing.costPrice.amount;
  }

  // 2. Try dropship.costPrice from product privateMetadata
  const privateMeta = line.variant?.product?.privateMetadata ?? [];
  const costMeta = privateMeta.find((m) => m.key === "dropship.costPrice");
  if (costMeta?.value) {
    const parsed = parseFloat(costMeta.value);
    if (!isNaN(parsed)) return parsed;
  }

  // Also check public metadata (CSV import puts it there)
  const publicMeta = line.variant?.product?.metadata ?? [];
  const publicCostMeta = publicMeta.find((m) => m.key === "dropship.costPrice");
  if (publicCostMeta?.value) {
    const parsed = parseFloat(publicCostMeta.value);
    if (!isNaN(parsed)) return parsed;
  }

  return null;
}

/**
 * Calculate profitability P&L from orders.
 */
export function calculateProfitability(
  orders: OrderAnalyticsFragment[],
  currency: string,
  channelSlug?: string
): Result<ProfitabilityData, AnalyticsCalculationError> {
  try {
    const filtered = orders.filter((o) => o.total.gross.currency === currency);

    let grossRevenue = 0;
    let shippingRevenue = 0;
    let cogs = 0;
    let discountsTotal = 0;
    let linesWithCost = 0;
    let linesTotal = 0;

    for (const order of filtered) {
      grossRevenue += order.total.gross.amount;
      shippingRevenue += order.shippingPrice?.gross?.amount ?? 0;

      // Sum discounts
      for (const discount of (order.discounts ?? [])) {
        discountsTotal += discount.amount.amount;
      }

      // Sum line costs
      for (const line of order.lines) {
        linesTotal += 1;
        const unitCost = resolveLineCost(line, channelSlug);
        if (unitCost !== null) {
          cogs += unitCost * line.quantity;
          linesWithCost += 1;
        }
      }
    }

    const grossProfit = grossRevenue - cogs;
    const netRevenue = grossRevenue - cogs - discountsTotal;
    const marginPercent = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

    return ok({
      grossRevenue,
      shippingRevenue,
      cogs,
      cogsAvailable: linesWithCost > 0,
      discounts: discountsTotal,
      grossProfit,
      netRevenue,
      marginPercent,
      orderCount: filtered.length,
      linesWithCost,
      linesTotal,
    });
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate profitability", error));
  }
}

/**
 * Calculate profitability over time for charts.
 */
export function calculateProfitabilityOverTime(
  orders: OrderAnalyticsFragment[],
  currency: string,
  granularity: Granularity,
  channelSlug?: string
): Result<ProfitabilityDataPoint[], AnalyticsCalculationError> {
  try {
    const filtered = orders.filter((o) => o.total.gross.currency === currency);

    const dataMap = new Map<string, { revenue: number; cogs: number }>();

    for (const order of filtered) {
      const orderDate = parseISO(order.created);
      let dateKey: string;

      switch (granularity) {
        case "day":
          dateKey = format(startOfDay(orderDate), "yyyy-MM-dd");
          break;
        case "week":
          dateKey = format(startOfWeek(orderDate), "yyyy-MM-dd");
          break;
        case "month":
          dateKey = format(startOfMonth(orderDate), "yyyy-MM");
          break;
      }

      const existing = dataMap.get(dateKey) || { revenue: 0, cogs: 0 };
      existing.revenue += order.total.gross.amount;

      for (const line of order.lines) {
        const unitCost = resolveLineCost(line, channelSlug);
        if (unitCost !== null) {
          existing.cogs += unitCost * line.quantity;
        }
      }

      dataMap.set(dateKey, existing);
    }

    const result = Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        cogs: data.cogs,
        profit: data.revenue - data.cogs,
      }));

    return ok(result);
  } catch (error) {
    return err(new AnalyticsCalculationError("Failed to calculate profitability over time", error));
  }
}
```

---

## Task 5: Add `orderType` Parameter to All Router Procedures + New Profitability Procedures

**Files:**
- Modify: `apps/apps/sales-analytics/src/modules/trpc/router.ts`

**Changes:**

1. Import new functions:
```typescript
import { filterOrdersByType, isDropshipLine } from "../analytics/domain/analytics-calculator";
import { calculateProfitability, calculateProfitabilityOverTime } from "../analytics/domain/profitability-calculator";
import { OrderTypeFilterSchema } from "../analytics/domain/kpi-types";
```

2. Add `orderType` to the Zod input of ALL existing procedures that accept `channelSlug`:
```typescript
orderType: OrderTypeFilterSchema.default("all"),
```

3. After each `fetchOrdersForAnalytics` call and `ordersResult.isErr()` check, add filtering:
```typescript
const orders = filterOrdersByType(ordersResult.value, input.orderType);
```
Then use `orders` instead of `ordersResult.value` for the rest of the procedure.

4. Add two new procedures to the `analyticsRouter`:

```typescript
getProfitability: protectedClientProcedure
  .input(z.object({
    channelSlug: z.string().optional(),
    dateFrom: z.string(),
    dateTo: z.string(),
    currency: z.string().optional(),
    orderType: OrderTypeFilterSchema.default("all"),
  }))
  .query(async ({ ctx, input }) => {
    logger.info("[getProfitability] Fetching profitability", { channelSlug: input.channelSlug, dateFrom: input.dateFrom, dateTo: input.dateTo, orderType: input.orderType });

    const ordersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
      channelSlug: input.channelSlug,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    });

    if (ordersResult.isErr()) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: ordersResult.error.message });
    }

    const orders = filterOrdersByType(ordersResult.value, input.orderType);
    const { currency } = resolveCurrency(orders, input.currency);

    const result = calculateProfitability(orders, currency, input.channelSlug);
    if (result.isErr()) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error.message });
    }

    return { profitability: result.value, currency };
  }),

getProfitabilityOverTime: protectedClientProcedure
  .input(z.object({
    channelSlug: z.string().optional(),
    dateFrom: z.string(),
    dateTo: z.string(),
    granularity: z.enum(["day", "week", "month"]).optional(),
    currency: z.string().optional(),
    orderType: OrderTypeFilterSchema.default("all"),
  }))
  .query(async ({ ctx, input }) => {
    logger.info("[getProfitabilityOverTime] Fetching profitability over time", { channelSlug: input.channelSlug, dateFrom: input.dateFrom, dateTo: input.dateTo });

    const ordersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
      channelSlug: input.channelSlug,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    });

    if (ordersResult.isErr()) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: ordersResult.error.message });
    }

    const orders = filterOrdersByType(ordersResult.value, input.orderType);
    const { currency } = resolveCurrency(orders, input.currency);
    const granularity = input.granularity ?? getOptimalGranularity({ from: input.dateFrom, to: input.dateTo });

    const result = calculateProfitabilityOverTime(orders, currency, granularity, input.channelSlug);
    if (result.isErr()) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error.message });
    }

    return result.value;
  }),
```

---

## Task 6: Create OrderTypeSelector UI Component

**Files:**
- Create: `apps/apps/sales-analytics/src/modules/ui/components/order-type-selector.tsx`

**Follow the same pattern as `ChannelSelector`** — a styled `<select>` dropdown:

```tsx
import { ChevronDown } from "lucide-react";
import type { OrderTypeFilter } from "../../analytics/domain/kpi-types";

const ORDER_TYPE_OPTIONS: { value: OrderTypeFilter; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "dropship", label: "Dropship Only" },
  { value: "non-dropship", label: "Non-Dropship Only" },
];

interface OrderTypeSelectorProps {
  value: OrderTypeFilter;
  onChange: (value: OrderTypeFilter) => void;
}

export function OrderTypeSelector({ value, onChange }: OrderTypeSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as OrderTypeFilter)}
        className="appearance-none w-44 px-3 py-2 pr-8 text-sm border border-border rounded-lg bg-white text-text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors cursor-pointer"
      >
        {ORDER_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  );
}
```

---

## Task 7: Add Profit KPI Cards to Main Dashboard

**Files:**
- Modify: `apps/apps/sales-analytics/src/modules/ui/components/kpi-cards.tsx`

**Change:** Update `KPICardsGrid` to accept optional profitability data and render 2 extra cards (Gross Profit + Margin %) when available.

```typescript
// Add to KPICardsGridProps:
interface KPICardsGridProps {
  kpis: DashboardKPIs;
  profitability?: { grossProfit: number; marginPercent: number; cogsAvailable: boolean; linesWithCost: number; linesTotal: number } | null;
  currency?: string;
  isLoading?: boolean;
}
```

In the component, after the existing 5 kpiCards, conditionally add:
```typescript
if (profitability && profitability.cogsAvailable && currency) {
  kpiCards.push(
    {
      key: "grossProfit",
      label: "Gross Profit",
      value: formatCurrency(profitability.grossProfit, currency),
    },
    {
      key: "margin",
      label: "Margin",
      value: `${profitability.marginPercent.toFixed(1)}%`,
    },
  );
}
```

Update grid: change `lg:grid-cols-5` to dynamic based on card count — or keep 5 and let the extra cards wrap. A simpler approach: use `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` so it auto-wraps naturally regardless of card count.

Import `formatCurrency` from `../../analytics/domain/money`.

---

## Task 8: Create Profitability Tab Page

**Files:**
- Create: `apps/apps/sales-analytics/src/pages/profitability.tsx`
- Modify: `apps/apps/sales-analytics/src/modules/ui/components/nav-tabs.tsx`

**nav-tabs.tsx change:** Add the new tab:
```typescript
import { BarChart3, Package, Filter, DollarSign } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", href: "/", icon: BarChart3 },
  { id: "products", label: "Products", href: "/products", icon: Package },
  { id: "profitability", label: "Profitability", href: "/profitability", icon: DollarSign },
  { id: "funnel", label: "Funnel", href: "/funnel", icon: Filter },
] as const;
```

**profitability.tsx:** New page with:
1. Same header pattern as index.tsx (channel selector, date picker, order type selector)
2. P&L summary cards at top (Revenue, COGS, Gross Profit, Net Revenue, Margin %)
3. Cost coverage warning if `linesWithCost < linesTotal` (e.g., "Cost data available for 42 of 78 line items")
4. Profitability over time chart (recharts `AreaChart` with revenue, cogs, profit lines)

Follow the same query pattern as `pages/funnel.tsx` — use `trpcClient.analytics.getProfitability.useQuery` and `trpcClient.analytics.getProfitabilityOverTime.useQuery`.

The P&L table:
```tsx
<div className="rounded-xl border border-border bg-white p-6">
  <h3 className="text-lg font-semibold mb-4">Profit & Loss</h3>
  <table className="w-full text-sm">
    <tbody>
      <PnlRow label="Gross Revenue" value={data.grossRevenue} currency={currency} />
      <PnlRow label="Shipping Revenue" value={data.shippingRevenue} currency={currency} indent />
      <PnlRow label="Cost of Goods (COGS)" value={-data.cogs} currency={currency} negative />
      <PnlRow label="Discounts" value={-data.discounts} currency={currency} negative />
      <PnlRow label="Gross Profit" value={data.grossProfit} currency={currency} bold />
      <PnlRow label="Net Revenue" value={data.netRevenue} currency={currency} bold />
      <PnlRow label="Margin" value={data.marginPercent} isPercent bold />
    </tbody>
  </table>
</div>
```

The profitability chart reuses the same recharts pattern as `RevenueChart`:
```tsx
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} name="Revenue" />
    <Area type="monotone" dataKey="cogs" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="COGS" />
    <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} name="Profit" />
  </AreaChart>
</ResponsiveContainer>
```

---

## Task 9: Wire OrderType Filter into Main Dashboard

**Files:**
- Modify: `apps/apps/sales-analytics/src/pages/index.tsx`

**Changes:**

1. Add state:
```typescript
import type { OrderTypeFilter } from "@/modules/analytics/domain/kpi-types";
import { OrderTypeSelector } from "@/modules/ui/components/order-type-selector";

const [orderType, setOrderType] = useState<OrderTypeFilter>("all");
```

2. Add `orderType` to `queryInput`:
```typescript
const queryInput = useMemo(() => ({
  channelSlug: effectiveChannelSlug!,
  dateFrom: dateRange.from,
  dateTo: dateRange.to,
  currency,
  orderType,
}), [effectiveChannelSlug, dateRange.from, dateRange.to, currency, orderType]);
```

3. Add profitability query:
```typescript
const profitabilityQuery = trpcClient.analytics.getProfitability.useQuery(queryInput, {
  enabled: !!appBridgeState?.ready && !!effectiveChannelSlug,
  refetchInterval,
  keepPreviousData: true,
});
```

4. Add `<OrderTypeSelector>` to the header actions (next to ChannelSelector):
```tsx
<OrderTypeSelector value={orderType} onChange={setOrderType} />
```

5. Pass profitability data to KPICardsGrid:
```tsx
<KPICardsGrid
  kpis={kpisQuery.data.kpis}
  profitability={profitabilityQuery.data?.profitability}
  currency={currency}
  isLoading={kpisQuery.isLoading}
/>
```

---

## Task 10: Wire OrderType Filter into Products and Funnel Pages

**Files:**
- Modify: `apps/apps/sales-analytics/src/pages/products.tsx`
- Modify: `apps/apps/sales-analytics/src/pages/funnel.tsx`

**Same pattern for both:** Add `orderType` state, `OrderTypeSelector` in header, and pass `orderType` in query input. Follow the exact same changes as Task 9 but for these pages.

---

## Verification

```bash
# 1. Regenerate GraphQL types
docker exec saleor-sales-analytics-app-dev sh -c "cd /app/apps/sales-analytics && pnpm generate"

# 2. Build to verify no type errors
docker exec saleor-sales-analytics-app-dev sh -c "cd /app/apps/sales-analytics && pnpm build"

# 3. Restart container
docker compose -f infra/docker-compose.dev.yml restart saleor-sales-analytics-app-dev

# 4. Check logs
docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-sales-analytics-app-dev

# 5. Visual verification in Dashboard:
#    - OrderType dropdown appears in header (All/Dropship/Non-Dropship)
#    - Switching to "Dropship Only" filters KPIs, charts, tables
#    - Gross Profit + Margin KPI cards appear when cost data exists
#    - New "Profitability" tab shows P&L breakdown
#    - Profitability chart shows revenue vs COGS vs profit over time
#    - Cost coverage warning shows when not all lines have cost data
```

---

## Summary

| # | Type | File(s) | Change |
|---|------|---------|--------|
| 1 | Data | `order-analytics.graphql` | Expand fragment (shipping, discounts, costs, metadata) |
| 2 | Types | `kpi-types.ts` | Add OrderTypeFilter, ProfitabilityData, ProfitabilityDataPoint |
| 3 | Logic | `analytics-calculator.ts` | Add isDropshipLine, isDropshipOrder, filterOrdersByType |
| 4 | Logic | NEW `profitability-calculator.ts` | Cost resolution, P&L, profitability over time |
| 5 | API | `router.ts` | Add orderType to all procedures, new getProfitability procedures |
| 6 | UI | NEW `order-type-selector.tsx` | Dropdown component |
| 7 | UI | `kpi-cards.tsx` | Add Gross Profit + Margin cards |
| 8 | Page | NEW `profitability.tsx` + `nav-tabs.tsx` | Profitability tab with P&L + chart |
| 9 | Page | `index.tsx` | Wire orderType filter + profitability query |
| 10 | Page | `products.tsx`, `funnel.tsx` | Wire orderType filter |
