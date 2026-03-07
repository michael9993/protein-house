import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createLogger } from "../../logger";
import { router } from "./trpc-server";
import { protectedClientProcedure } from "./protected-client-procedure";
import {
  fetchOrdersForAnalytics,
  fetchChannels,
} from "../analytics/repositories/orders-data-fetcher";
import {
  calculateKPIs,
  calculateTopProducts,
  calculateTopCategories,
  calculateRevenueOverTime,
  calculateProductPerformance,
  formatRecentOrders,
  detectCurrencies,
  filterOrdersByType,
} from "../analytics/domain/analytics-calculator";
import { getPreviousPeriod, getOptimalGranularity } from "../analytics/domain/time-range";
import type { Granularity } from "../analytics/domain/time-range";
import { calculateFunnelData } from "../analytics/domain/funnel-calculator";
import { calculateProfitability, calculateProfitabilityOverTime } from "../analytics/domain/profitability-calculator";
import { OrderTypeFilterSchema } from "../analytics/domain/kpi-types";
import type { OrderAnalyticsFragment } from "../../../generated/graphql";

const logger = createLogger("analytics-router");

function resolveCurrency(orders: OrderAnalyticsFragment[], inputCurrency?: string) {
  const currencyInfo = detectCurrencies(orders);
  const currency = inputCurrency || currencyInfo.primaryCurrency || "USD";
  return { currency, currencyInfo };
}

/**
 * Analytics router - provides KPIs, charts, and data for the dashboard
 */
export const analyticsRouter = router({
  /**
   * Get all KPIs for the dashboard
   */
  getKPIs: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string().optional(),
        dateFrom: z.string(),
        dateTo: z.string(),
        currency: z.string().optional(),
        orderType: OrderTypeFilterSchema.default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      logger.info("[getKPIs] Fetching KPIs", { channelSlug: input.channelSlug, dateFrom: input.dateFrom, dateTo: input.dateTo, orderType: input.orderType });

      const ordersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
        channelSlug: input.channelSlug,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      });

      if (ordersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ordersResult.error.message,
        });
      }

      const orders = filterOrdersByType(ordersResult.value, input.orderType);
      const { currency, currencyInfo } = resolveCurrency(orders, input.currency);

      // Fetch previous period for comparison
      const previousPeriod = getPreviousPeriod({
        from: input.dateFrom,
        to: input.dateTo,
      });

      const previousOrdersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
        channelSlug: input.channelSlug,
        dateFrom: previousPeriod.from,
        dateTo: previousPeriod.to,
      });

      const previousOrders = previousOrdersResult.isOk()
        ? filterOrdersByType(previousOrdersResult.value, input.orderType)
        : [];

      const kpisResult = calculateKPIs(orders, previousOrders, currency);

      if (kpisResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: kpisResult.error.message,
        });
      }

      return {
        kpis: kpisResult.value,
        currencyInfo,
        currency,
      };
    }),

  /**
   * Get top products by revenue
   */
  getTopProducts: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string().optional(),
        dateFrom: z.string(),
        dateTo: z.string(),
        limit: z.number().default(10),
        currency: z.string().optional(),
        orderType: OrderTypeFilterSchema.default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      logger.info("[getTopProducts] Fetching top products", { channelSlug: input.channelSlug, dateFrom: input.dateFrom, dateTo: input.dateTo });

      const ordersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
        channelSlug: input.channelSlug,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      });

      if (ordersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ordersResult.error.message,
        });
      }

      const orders = filterOrdersByType(ordersResult.value, input.orderType);
      const { currency } = resolveCurrency(orders, input.currency);

      const productsResult = calculateTopProducts(orders, currency, input.limit);

      if (productsResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: productsResult.error.message,
        });
      }

      return productsResult.value;
    }),

  /**
   * Get revenue over time for charts
   */
  getRevenueOverTime: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string().optional(),
        dateFrom: z.string(),
        dateTo: z.string(),
        granularity: z.enum(["day", "week", "month"]).optional(),
        currency: z.string().optional(),
        orderType: OrderTypeFilterSchema.default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      logger.info("[getRevenueOverTime] Fetching revenue over time", { channelSlug: input.channelSlug, dateFrom: input.dateFrom, dateTo: input.dateTo });

      const ordersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
        channelSlug: input.channelSlug,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      });

      if (ordersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ordersResult.error.message,
        });
      }

      const orders = filterOrdersByType(ordersResult.value, input.orderType);
      const { currency } = resolveCurrency(orders, input.currency);

      const granularity: Granularity =
        input.granularity ?? getOptimalGranularity({ from: input.dateFrom, to: input.dateTo });

      const revenueResult = calculateRevenueOverTime(orders, currency, granularity);

      if (revenueResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: revenueResult.error.message,
        });
      }

      return revenueResult.value;
    }),

  /**
   * Get top categories by revenue
   */
  getTopCategories: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string().optional(),
        dateFrom: z.string(),
        dateTo: z.string(),
        limit: z.number().default(10),
        currency: z.string().optional(),
        orderType: OrderTypeFilterSchema.default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      logger.info("[getTopCategories] Fetching top categories", { channelSlug: input.channelSlug, dateFrom: input.dateFrom, dateTo: input.dateTo });

      const ordersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
        channelSlug: input.channelSlug,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      });

      if (ordersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ordersResult.error.message,
        });
      }

      const orders = filterOrdersByType(ordersResult.value, input.orderType);
      const { currency } = resolveCurrency(orders, input.currency);

      const categoriesResult = calculateTopCategories(orders, currency, input.limit);

      if (categoriesResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: categoriesResult.error.message,
        });
      }

      return categoriesResult.value;
    }),

  /**
   * Get recent orders for the table
   */
  getRecentOrders: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string().optional(),
        dateFrom: z.string(),
        dateTo: z.string(),
        limit: z.number().default(10),
        orderType: OrderTypeFilterSchema.default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      logger.info("[getRecentOrders] Fetching recent orders", { channelSlug: input.channelSlug, dateFrom: input.dateFrom, dateTo: input.dateTo });

      const ordersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
        channelSlug: input.channelSlug,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        limit: input.limit,
      });

      if (ordersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ordersResult.error.message,
        });
      }

      const orders = filterOrdersByType(ordersResult.value, input.orderType);
      const recentOrdersResult = formatRecentOrders(orders, input.limit);

      if (recentOrdersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: recentOrdersResult.error.message,
        });
      }

      return recentOrdersResult.value;
    }),

  /**
   * Get product performance with daily revenue series for sparklines
   */
  getProductPerformance: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string().optional(),
        dateFrom: z.string(),
        dateTo: z.string(),
        currency: z.string().optional(),
        orderType: OrderTypeFilterSchema.default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const ordersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
        channelSlug: input.channelSlug,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      });

      if (ordersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ordersResult.error.message,
        });
      }

      const orders = filterOrdersByType(ordersResult.value, input.orderType);
      const { currency } = resolveCurrency(orders, input.currency);

      const performanceResult = calculateProductPerformance(orders, currency);

      if (performanceResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: performanceResult.error.message,
        });
      }

      return performanceResult.value;
    }),

  /**
   * Get all orders for export (no limit)
   */
  getAllOrders: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string().optional(),
        dateFrom: z.string(),
        dateTo: z.string(),
        orderType: OrderTypeFilterSchema.default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      logger.info("[getAllOrders] Fetching all orders for export", { channelSlug: input.channelSlug, dateFrom: input.dateFrom, dateTo: input.dateTo });

      const ordersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
        channelSlug: input.channelSlug,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      });

      if (ordersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ordersResult.error.message,
        });
      }

      const orders = filterOrdersByType(ordersResult.value, input.orderType);
      const allOrdersResult = formatRecentOrders(orders, orders.length);

      if (allOrdersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: allOrdersResult.error.message,
        });
      }

      return allOrdersResult.value;
    }),

  /**
   * Get order funnel data (status-based conversion)
   */
  getFunnelData: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string().optional(),
        dateFrom: z.string(),
        dateTo: z.string(),
        currency: z.string().optional(),
        orderType: OrderTypeFilterSchema.default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const ordersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
        channelSlug: input.channelSlug,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      });

      if (ordersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ordersResult.error.message,
        });
      }

      const orders = filterOrdersByType(ordersResult.value, input.orderType);
      const { currency } = resolveCurrency(orders, input.currency);

      const funnelResult = calculateFunnelData(orders, currency);

      if (funnelResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: funnelResult.error.message,
        });
      }

      return funnelResult.value;
    }),

  /**
   * Get profitability P&L breakdown
   */
  getProfitability: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string().optional(),
        dateFrom: z.string(),
        dateTo: z.string(),
        currency: z.string().optional(),
        orderType: OrderTypeFilterSchema.default("all"),
      })
    )
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

  /**
   * Get profitability over time for charts
   */
  getProfitabilityOverTime: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string().optional(),
        dateFrom: z.string(),
        dateTo: z.string(),
        granularity: z.enum(["day", "week", "month"]).optional(),
        currency: z.string().optional(),
        orderType: OrderTypeFilterSchema.default("all"),
      })
    )
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
      const granularity: Granularity = input.granularity ?? getOptimalGranularity({ from: input.dateFrom, to: input.dateTo });

      const result = calculateProfitabilityOverTime(orders, currency, granularity, input.channelSlug);
      if (result.isErr()) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error.message });
      }

      return result.value;
    }),
});

/**
 * Channels router - provides channel list
 */
export const channelsRouter = router({
  /**
   * List all available channels
   */
  list: protectedClientProcedure.query(async ({ ctx }) => {
    logger.info("[channels.list] Fetching channels");

    const channelsResult = await fetchChannels(ctx.apiClient);

    if (channelsResult.isErr()) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: channelsResult.error.message,
      });
    }

    return channelsResult.value;
  }),
});

export const appRouter = router({
  analytics: analyticsRouter,
  channels: channelsRouter,
});

export type AppRouter = typeof appRouter;
