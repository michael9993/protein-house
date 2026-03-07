# Analytics: Dropship Filter + Clean Revenue

**Date:** 2026-03-07
**Status:** Approved

## Decisions

1. **Cost model**: Use Saleor's `variant.channelListings.costPrice` as primary, fall back to `dropship.costPrice` from product metadata
2. **Dashboard scope**: KPI cards on main dashboard + dedicated Profitability tab with P&L breakdown
3. **Dropship filter**: Global dropdown ("All / Dropship / Non-Dropship") applied across all analytics
4. **Dropship detection**: Check `variant.product.metadata` for `dropship.supplier` key (existing source of truth)

## GraphQL Fragment Expansion

Add to `OrderAnalytics` fragment:
- `order.shippingPrice` (TaxedMoney)
- `order.discounts[]` (type, name, amount)
- `line.unitDiscount` (Money)
- `variant.channelListings[].costPrice` + `channel.slug` (for cost data)
- `variant.product.metadata[]` (for dropship.supplier detection)
- `variant.product.privateMetadata[]` (for dropship.costPrice fallback)

## Dropship Filter

- New `orderType` param: `"all" | "dropship" | "non-dropship"`
- Filtering is post-fetch (can't filter by product metadata in Saleor order query)
- A line is "dropship" if its `variant.product.metadata` contains `dropship.supplier`
- An order is "dropship" if ANY of its lines are dropship

## Clean Revenue / Profitability

### KPI Cards (main dashboard)
- **Gross Profit**: Revenue − COGS
- **Margin %**: Gross Profit / Revenue × 100

### Profitability Tab (P&L breakdown)

| Metric | Calculation |
|--------|-------------|
| Gross Revenue | Sum of order.total.gross |
| Shipping Revenue | Sum of order.shippingPrice.gross |
| COGS | Sum of (costPrice × qty) per line |
| Discounts | Sum of order.discounts[].amount |
| Gross Profit | Revenue − COGS |
| Net Revenue | Revenue − COGS − Discounts |
| Margin % | Gross Profit / Revenue × 100 |

Plus profitability-over-time chart (revenue vs COGS vs profit).

## Cost Resolution Per Line

```
1. variant.channelListings[matching channel].costPrice  (Saleor native)
2. variant.product.privateMetadata["dropship.costPrice"] (dropship fallback)
3. null (no cost data available — excluded from COGS)
```

## Files Changed

| Layer | File | Change |
|-------|------|--------|
| GraphQL | fragments/order-analytics.graphql | Expand fragment |
| Types | domain/kpi-types.ts | ProfitabilityData, ProfitabilityOverTime |
| Calculator | NEW domain/profitability-calculator.ts | COGS, margin, P&L |
| Calculator | domain/analytics-calculator.ts | Order type filtering helper |
| Router | trpc/router.ts | orderType param, getProfitability procedure |
| UI | NEW ui/components/profitability-tab.tsx | P&L table + chart |
| UI | ui/components/kpi-cards.tsx | Gross Profit + Margin cards |
| Page | pages/index.tsx | orderType dropdown, profitability tab |
| Page | NEW pages/profitability.tsx | Dedicated profitability page |
