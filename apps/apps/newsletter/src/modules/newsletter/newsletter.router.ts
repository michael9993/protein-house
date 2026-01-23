import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createLogger } from "../../logger";
import { protectedClientProcedure } from "../trpc/protected-client-procedure";
import { router } from "../trpc/trpc-server";
import { NewsletterService } from "./newsletter.service";

const logger = createLogger("newsletter-router");

const newsletterSubscriptionsInputSchema = z.object({
  first: z.number().min(1).max(100).optional(),
  after: z.string().optional(),
  last: z.number().min(1).max(100).optional(),
  before: z.string().optional(),
  filter: z
    .object({
      isActive: z.boolean().optional(),
      source: z.string().optional(),
      subscribedAt: z
        .object({
          gte: z.string().optional(),
          lte: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  sortBy: z
    .object({
      direction: z.enum(["ASC", "DESC"]),
      field: z.enum(["SUBSCRIBED_AT", "EMAIL", "UNSUBSCRIBED_AT"]),
    })
    .optional(),
  search: z.string().optional(),
});

export const newsletterRouter = router({
  getSubscriptions: protectedClientProcedure
    .input(newsletterSubscriptionsInputSchema)
    .query(async ({ ctx, input }) => {
      logger.info("getSubscriptions query called", {
        hasApiClient: !!ctx.apiClient,
        hasSaleorApiUrl: !!ctx.saleorApiUrl,
        input: {
          first: input.first,
          after: input.after,
          filter: input.filter,
          search: input.search,
        },
      });

      const service = new NewsletterService(ctx.apiClient);

      try {
        const result = await service.getSubscriptions(input);
        logger.info("getSubscriptions query succeeded", {
          subscriptionCount: result.subscriptions.length,
          hasNextPage: result.pageInfo.hasNextPage,
        });
        return result;
      } catch (error) {
        logger.error("getSubscriptions query failed", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch newsletter subscriptions",
        });
      }
    }),

  getStats: protectedClientProcedure.query(async ({ ctx }) => {
    logger.info("getStats query called", {
      hasApiClient: !!ctx.apiClient,
      hasSaleorApiUrl: !!ctx.saleorApiUrl,
    });

    const service = new NewsletterService(ctx.apiClient);

    try {
      const result = await service.getStats();
      logger.info("getStats query succeeded", {
        total: result.total,
        active: result.active,
        inactive: result.inactive,
        sourcesCount: result.bySource ? Object.keys(result.bySource).length : 0,
      });
      return result;
    } catch (error) {
      logger.error("getStats query failed", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch newsletter statistics",
      });
    }
  }),

  exportToCSV: protectedClientProcedure
    .input(
      z
        .object({
          filter: z
            .object({
              isActive: z.boolean().optional(),
              source: z.string().optional(),
              subscribedAt: z
                .object({
                  gte: z.string().optional(),
                  lte: z.string().optional(),
                })
                .optional(),
            })
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const service = new NewsletterService(ctx.apiClient);

      try {
        const csv = await service.exportToCSV(input?.filter);
        return { csv };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to export newsletter subscriptions",
        });
      }
    }),
});
