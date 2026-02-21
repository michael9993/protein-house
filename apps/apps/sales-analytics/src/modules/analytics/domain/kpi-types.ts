import { z } from "zod";

/**
 * Money schema for type-safe currency handling
 */
export const MoneySchema = z.object({
  amount: z.number(),
  currency: z.string(),
});
export type Money = z.infer<typeof MoneySchema>;

/**
 * Branded type for channel slugs
 */
export const ChannelSlugSchema = z.string().min(1).brand("ChannelSlug");
export type ChannelSlug = z.infer<typeof ChannelSlugSchema>;

/**
 * Trend direction for KPI comparison
 */
export const TrendDirectionSchema = z.enum(["up", "down", "neutral"]);
export type TrendDirection = z.infer<typeof TrendDirectionSchema>;

/**
 * KPI trend showing change from previous period
 */
export const KPITrendSchema = z.object({
  value: z.number(),
  direction: TrendDirectionSchema,
});
export type KPITrend = z.infer<typeof KPITrendSchema>;

/**
 * Single KPI card data
 */
export const KPICardSchema = z.object({
  label: z.string(),
  value: z.string(),
  trend: KPITrendSchema.optional(),
  previousValue: z.string().optional(),
});
export type KPICard = z.infer<typeof KPICardSchema>;

/**
 * All KPIs for the dashboard
 */
export const DashboardKPIsSchema = z.object({
  gmv: KPICardSchema,
  totalOrders: KPICardSchema,
  averageOrderValue: KPICardSchema,
  itemsSold: KPICardSchema,
  uniqueCustomers: KPICardSchema,
});
export type DashboardKPIs = z.infer<typeof DashboardKPIsSchema>;

/**
 * Revenue over time data point
 */
export const RevenueDataPointSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  orders: z.number(),
});
export type RevenueDataPoint = z.infer<typeof RevenueDataPointSchema>;

/**
 * Top product data
 */
export const TopProductSchema = z.object({
  name: z.string(),
  revenue: z.number(),
  quantity: z.number(),
});
export type TopProduct = z.infer<typeof TopProductSchema>;

/**
 * Category breakdown data
 */
export const CategoryDataSchema = z.object({
  name: z.string(),
  value: z.number(),
});
export type CategoryData = z.infer<typeof CategoryDataSchema>;

/**
 * Recent order for the table
 */
export const RecentOrderSchema = z.object({
  id: z.string(),
  number: z.string(),
  date: z.string(),
  customer: z.string(),
  total: MoneySchema,
  status: z.string(),
});
export type RecentOrder = z.infer<typeof RecentOrderSchema>;

/**
 * Complete analytics dashboard data
 */
export const AnalyticsDashboardDataSchema = z.object({
  kpis: DashboardKPIsSchema,
  revenueOverTime: z.array(RevenueDataPointSchema),
  topProducts: z.array(TopProductSchema),
  topCategories: z.array(CategoryDataSchema),
  recentOrders: z.array(RecentOrderSchema),
});
export type AnalyticsDashboardData = z.infer<typeof AnalyticsDashboardDataSchema>;

/**
 * Order status types
 */
export const OrderStatusSchema = z.enum([
  "DRAFT",
  "UNCONFIRMED",
  "UNFULFILLED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "PARTIALLY_RETURNED",
  "RETURNED",
  "CANCELED",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/**
 * Currency information for multi-currency handling
 */
export const CurrencyInfoSchema = z.object({
  currencies: z.array(z.string()),
  primaryCurrency: z.string(),
  isMultiCurrency: z.boolean(),
});
export type CurrencyInfo = z.infer<typeof CurrencyInfoSchema>;
