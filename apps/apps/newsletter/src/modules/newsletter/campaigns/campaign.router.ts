import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Client } from "urql";

import { createLogger } from "../../../logger";
import { protectedClientProcedure } from "../../trpc/protected-client-procedure";
import { router } from "../../trpc/trpc-server";
import { NewsletterService } from "../newsletter.service";
import { CampaignService } from "./campaign.service";
import { addCampaignJob, removeCampaignJob } from "./campaign-queue";
import { createCampaignInputSchema, updateCampaignInputSchema, campaignStatusSchema } from "./campaign-schema";

const logger = createLogger("campaign-router");

/** Saleor apps act as system — no individual user context available in tRPC */
const SYSTEM_ACTOR = "system" as const;

interface RecipientFilter {
  isActive?: boolean;
  sources?: string[];
  selectionType?: "all" | "selected" | "random" | "newest" | "oldest";
  selectedSubscriberIds?: string[];
  limit?: number;
}

/**
 * Calculate recipient count based on campaign filter criteria.
 * For "selected" type, returns the count of selected IDs.
 * For other types, queries the newsletter service and applies limit.
 */
async function calculateRecipientCount(
  apiClient: Client,
  recipientFilter: RecipientFilter,
  channelSlug: string,
  context: string,
): Promise<number> {
  if (recipientFilter.selectionType === "selected" && recipientFilter.selectedSubscriberIds) {
    return recipientFilter.selectedSubscriberIds.length;
  }

  const newsletterService = new NewsletterService(apiClient);
  const subscriptionsResult = await newsletterService.getSubscriptions({
    first: 1,
    filter: {
      isActive: recipientFilter.isActive,
      source: recipientFilter.sources?.[0],
      channel: channelSlug,
    },
  });

  let count = subscriptionsResult.totalCount || 0;

  if (recipientFilter.limit && count > recipientFilter.limit) {
    count = recipientFilter.limit;
  }

  logger.info("Calculated recipient count", {
    context,
    channelSlug,
    recipientCount: count,
    limit: recipientFilter.limit,
  });

  return count;
}

export const campaignRouter = router({
  list: protectedClientProcedure.query(async ({ ctx }) => {
    const service = new CampaignService(
      ctx.apiClient,
      ctx.saleorApiUrl!,
      ctx.appId!,
    );

    try {
      const campaigns = await service.getCampaigns();
      return { campaigns };
    } catch (error) {
      logger.error("Error listing campaigns", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to list campaigns",
      });
    }
  }),

  get: protectedClientProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = new CampaignService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
      );

      try {
        const campaign = await service.getCampaign(input.id);
        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }
        return { campaign };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("Error getting campaign", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to get campaign",
        });
      }
    }),

  create: protectedClientProcedure
    .input(createCampaignInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new CampaignService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
      );

      try {
        // Calculate recipient count based on selection type
        let recipientCount = 0;

        try {
          recipientCount = await calculateRecipientCount(
            ctx.apiClient,
            input.recipientFilter,
            input.channelSlug,
            `create:${input.name}`,
          );
        } catch (countError) {
          logger.warn("Failed to calculate recipient count during creation", {
            error: countError,
            campaignName: input.name,
          });
        }

        const campaign = await service.createCampaign(input, SYSTEM_ACTOR);
        
        // Update recipient count if calculated
        if (recipientCount > 0) {
          await service.updateCampaign(
            { id: campaign.id, recipientCount },
            SYSTEM_ACTOR
          );
          // Refetch to get updated campaign
          const updatedCampaign = await service.getCampaign(campaign.id);
          if (updatedCampaign) {
            return { campaign: updatedCampaign };
          }
        }

        // For immediate campaigns (no scheduledAt), user can start them manually via the "Start Campaign" button
        // The campaign is created as "draft" and can be started from the detail page

        return { campaign };
      } catch (error) {
        logger.error("Error creating campaign", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create campaign",
        });
      }
    }),

  update: protectedClientProcedure
    .input(updateCampaignInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new CampaignService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
      );

      try {
        // Get existing campaign to get channelSlug
        const existingCampaign = await service.getCampaign(input.id);
        const channelSlug = input.channelSlug || existingCampaign?.channelSlug;
        
        // Calculate recipient count if recipient filter changed
        let recipientCount: number | undefined = undefined;

        if (input.recipientFilter && channelSlug) {
          try {
            recipientCount = await calculateRecipientCount(
              ctx.apiClient,
              input.recipientFilter,
              channelSlug,
              `update:${input.id}`,
            );
          } catch (countError) {
            logger.warn("Failed to calculate recipient count during update", {
              error: countError,
              campaignId: input.id,
            });
          }
        }

        const updateInput = recipientCount !== undefined
          ? { ...input, recipientCount }
          : input;
        const campaign = await service.updateCampaign(updateInput, SYSTEM_ACTOR);
        return { campaign };
      } catch (error) {
        logger.error("Error updating campaign", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update campaign",
        });
      }
    }),

  delete: protectedClientProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new CampaignService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
      );

      try {
        // Get campaign to check status before deleting
        const campaign = await service.getCampaign(input.id);
        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        // If sending, cancel it first
        if (campaign.status === "sending") {
          try {
            await service.updateCampaignStatus(input.id, "cancelled");
            logger.info("Campaign cancelled before deletion", { campaignId: campaign.id });
          } catch (cancelError) {
            logger.warn("Failed to cancel campaign before deletion", {
              error: cancelError,
              campaignId: campaign.id,
            });
            // Continue with deletion anyway
          }
        }

        // Remove from queue if it exists (for scheduled/sending campaigns)
        if (campaign.status === "scheduled" || campaign.status === "sending") {
          try {
            await removeCampaignJob(campaign.id);
            logger.info("Campaign job removed from queue before deletion", { campaignId: campaign.id });
          } catch (queueError) {
            logger.warn("Failed to remove campaign job from queue (may not exist)", {
              error: queueError,
              campaignId: campaign.id,
            });
            // Don't fail deletion if queue removal fails
          }
        }

        await service.deleteCampaign(input.id);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("Error deleting campaign", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to delete campaign",
        });
      }
    }),

  updateStatus: protectedClientProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: campaignStatusSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = new CampaignService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
      );

      try {
        // Get campaign before updating to check current status
        const currentCampaign = await service.getCampaign(input.id);
        if (!currentCampaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        // Handle queue operations based on status BEFORE updating status
        let recipientCount: number | undefined = undefined;
        
        if (input.status === "sending") {
          // Calculate recipient count before starting
          try {
            recipientCount = await calculateRecipientCount(
              ctx.apiClient,
              currentCampaign.recipientFilter,
              currentCampaign.channelSlug,
              `sending:${currentCampaign.id}`,
            );

            if (recipientCount === 0) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "No subscribers match the selected filters for this channel. Please adjust your recipient filter.",
              });
            }
          } catch (countError) {
            if (countError instanceof TRPCError) {
              throw countError;
            }
            logger.error("Failed to calculate recipient count", { error: countError, campaignId: currentCampaign.id });
          }
          
          // Add to queue immediately for sending campaigns BEFORE updating status
          try {
            await addCampaignJob(
              currentCampaign.id,
              {
                saleorApiUrl: ctx.saleorApiUrl!,
                appId: ctx.appId!,
                channelSlug: currentCampaign.channelSlug,
                templateId: currentCampaign.templateId,
                recipientFilter: {
                  ...currentCampaign.recipientFilter,
                  isActive: currentCampaign.recipientFilter?.isActive ?? true,
                } as { isActive: boolean; sources?: string[]; subscribedAfter?: string; subscribedBefore?: string; selectionType?: "all" | "selected" | "random" | "newest" | "oldest"; limit?: number; selectedSubscriberIds?: string[] },
                batchSize: currentCampaign.batchSize,
                rateLimitPerMinute: currentCampaign.rateLimitPerMinute,
                maxRetries: currentCampaign.maxRetries,
              },
            );
            
            logger.info("Campaign added to queue for sending", { campaignId: currentCampaign.id, recipientCount });
          } catch (queueError) {
            logger.error("Failed to add campaign job to queue", { 
              error: queueError, 
              campaignId: currentCampaign.id,
              errorMessage: queueError instanceof Error ? queueError.message : String(queueError),
              errorStack: queueError instanceof Error ? queueError.stack : undefined,
            });
            // Don't update status if queue add fails
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to start campaign: ${queueError instanceof Error ? queueError.message : "Unknown error"}. Please check Redis connection and try again.`,
            });
          }
        } else if (input.status === "scheduled" && currentCampaign.scheduledAt) {
          // Schedule for future
          try {
            await addCampaignJob(
              currentCampaign.id,
              {
                saleorApiUrl: ctx.saleorApiUrl!,
                appId: ctx.appId!,
                channelSlug: currentCampaign.channelSlug,
                templateId: currentCampaign.templateId,
                recipientFilter: {
                  ...currentCampaign.recipientFilter,
                  isActive: currentCampaign.recipientFilter?.isActive ?? true,
                } as { isActive: boolean; sources?: string[]; subscribedAfter?: string; subscribedBefore?: string; selectionType?: "all" | "selected" | "random" | "newest" | "oldest"; limit?: number; selectedSubscriberIds?: string[] },
                batchSize: currentCampaign.batchSize,
                rateLimitPerMinute: currentCampaign.rateLimitPerMinute,
                maxRetries: currentCampaign.maxRetries,
              },
              new Date(currentCampaign.scheduledAt),
            );
            logger.info("Campaign scheduled", { campaignId: currentCampaign.id, scheduledAt: currentCampaign.scheduledAt });
          } catch (queueError) {
            logger.error("Failed to schedule campaign job", { error: queueError, campaignId: currentCampaign.id });
          }
        } else if (input.status === "cancelled") {
          // Remove from queue
          try {
            await removeCampaignJob(currentCampaign.id);
            logger.info("Campaign job removed from queue", { campaignId: currentCampaign.id });
          } catch (queueError) {
            logger.error("Failed to remove campaign job", { error: queueError, campaignId: currentCampaign.id });
          }
        }
        
        // Update status AFTER queue operations succeed
        const campaign = await service.updateCampaignStatus(
          input.id, 
          input.status,
          recipientCount !== undefined ? { recipientCount } : undefined
        );

        return { campaign };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("Error updating campaign status", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update campaign status",
        });
      }
    }),

  duplicate: protectedClientProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new CampaignService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
      );

      try {
        // Check if original campaign exists
        const original = await service.getCampaign(input.id);
        if (!original) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        const campaign = await service.duplicateCampaign(input.id, SYSTEM_ACTOR);
        logger.info("Campaign duplicated", { originalId: input.id, newId: campaign.id });
        return { campaign };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("Error duplicating campaign", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to duplicate campaign",
        });
      }
    }),
});
