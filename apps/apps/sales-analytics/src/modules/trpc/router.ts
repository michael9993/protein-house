import { z } from "zod";
import { TRPCError } from "@trpc/server";

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
  formatRecentOrders,
  detectCurrencies,
} from "../analytics/domain/analytics-calculator";
import { getPreviousPeriod, getOptimalGranularity } from "../analytics/domain/time-range";
import type { Granularity } from "../analytics/domain/time-range";

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
        currency: z.string().optional(), // Optional currency from frontend
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[getKPIs] Fetching KPIs for", input);

      // Fetch current period orders
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

      // Detect currencies in the orders
      const currencyInfo = detectCurrencies(ordersResult.value);

      // Use provided currency, detected primary currency, or default to USD
      const currency =
        input.currency || currencyInfo.primaryCurrency || "USD";

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

      const previousOrders = previousOrdersResult.isOk() ? previousOrdersResult.value : [];

      // Calculate KPIs (only for the specified currency)
      const kpisResult = calculateKPIs(ordersResult.value, previousOrders, currency);

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
        currency: z.string().optional(), // Optional currency from frontend
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[getTopProducts] Fetching top products for", input);

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

      // Detect currencies and use provided currency or primary currency
      const currencyInfo = detectCurrencies(ordersResult.value);
      const currency = input.currency || currencyInfo.primaryCurrency || "USD";

      const productsResult = calculateTopProducts(ordersResult.value, currency, input.limit);

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
        currency: z.string().optional(), // Optional currency from frontend
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[getRevenueOverTime] Fetching revenue over time for", input);

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

      // Detect currencies and use provided currency or primary currency
      const currencyInfo = detectCurrencies(ordersResult.value);
      const currency = input.currency || currencyInfo.primaryCurrency || "USD";

      // Use provided granularity or determine optimal one
      const granularity: Granularity =
        input.granularity ?? getOptimalGranularity({ from: input.dateFrom, to: input.dateTo });

      const revenueResult = calculateRevenueOverTime(ordersResult.value, currency, granularity);

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
        currency: z.string().optional(), // Optional currency from frontend
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[getTopCategories] Fetching top categories for", input);

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

      // Detect currencies and use provided currency or primary currency
      const currencyInfo = detectCurrencies(ordersResult.value);
      const currency = input.currency || currencyInfo.primaryCurrency || "USD";

      const categoriesResult = calculateTopCategories(ordersResult.value, currency, input.limit);

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
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[getRecentOrders] Fetching recent orders for", input);

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

      const recentOrdersResult = formatRecentOrders(ordersResult.value, input.limit);

      if (recentOrdersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: recentOrdersResult.error.message,
        });
      }

      return recentOrdersResult.value;
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
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[getAllOrders] Fetching all orders for export", input);

      // Fetch all orders without limit
      const ordersResult = await fetchOrdersForAnalytics(ctx.apiClient, {
        channelSlug: input.channelSlug,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        // No limit - fetch all orders in the period
      });

      if (ordersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ordersResult.error.message,
        });
      }

      // Format all orders (no limit)
      const allOrdersResult = formatRecentOrders(ordersResult.value, ordersResult.value.length);

      if (allOrdersResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: allOrdersResult.error.message,
        });
      }

      return allOrdersResult.value;
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
    console.log("[channels.list] Fetching channels");

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
