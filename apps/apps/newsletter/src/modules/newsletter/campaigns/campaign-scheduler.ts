import { createLogger } from "../../../logger";
import { CampaignService } from "./campaign.service";
import { addCampaignJob } from "./campaign-queue";
import { createSimpleGraphQLClient } from "../../../lib/create-graphql-client";
import { saleorApp } from "../../../saleor-app";

const logger = createLogger("CampaignScheduler");

/**
 * Check for scheduled campaigns that should start and add them to the queue
 */
export async function checkAndStartScheduledCampaigns(): Promise<void> {
  logger.debug("Checking for scheduled campaigns");

  try {
    // Get all Saleor instances from APL
    const instances = await saleorApp.apl.getAll();

    for (const instance of instances) {
      const { saleorApiUrl, token } = instance;

      try {
        const apiClient = createSimpleGraphQLClient({
          saleorApiUrl,
          token,
        });

        // Get app ID by querying the Saleor API for the newsletter app
        // We need to find the app by identifier or name
        const { gql } = await import("urql");
        const FIND_APP_QUERY = gql`
          query FindNewsletterApp {
            apps(first: 10, filter: { search: "newsletter" }) {
              edges {
                node {
                  id
                  name
                  identifier
                }
              }
            }
          }
        `;

        const appResult = await apiClient.query<{
          apps: {
            edges: Array<{
              node: {
                id: string;
                name: string;
                identifier: string | null;
              };
            }>;
          } | null;
        }>(FIND_APP_QUERY, {}).toPromise();

        // Check for errors in the query result
        if (appResult.error) {
          logger.warn("Error querying apps for instance", { 
            saleorApiUrl, 
            error: appResult.error.message 
          });
          continue;
        }

        // Check if apps data is available
        const appsEdges = appResult.data?.apps?.edges;
        if (!appsEdges || appsEdges.length === 0) {
          logger.debug("No apps found for instance", { saleorApiUrl });
          continue;
        }

        const newsletterApp = appsEdges.find(
          (edge) =>
            edge.node.identifier === "saleor.app.newsletter" ||
            edge.node.name.toLowerCase().includes("newsletter"),
        )?.node;

        if (!newsletterApp) {
          logger.debug("Newsletter app not found for instance", { saleorApiUrl });
          continue;
        }

        const appId = newsletterApp.id;
        const campaignService = new CampaignService(apiClient, saleorApiUrl, appId);

        // Get all campaigns
        const campaigns = await campaignService.getCampaigns();

        // Filter for scheduled campaigns that should start now
        const now = new Date();
        const campaignsToStart = campaigns.filter((campaign) => {
          if (campaign.status !== "scheduled") {
            return false;
          }

          if (!campaign.scheduledAt) {
            return false;
          }

          const scheduledTime = new Date(campaign.scheduledAt);
          const timeUntilStart = scheduledTime.getTime() - now.getTime();

          // Start if scheduled time has passed or is within the next minute
          // (allows for some clock drift and processing time)
          return timeUntilStart <= 60000; // 1 minute window
        });

        if (campaignsToStart.length > 0) {
          logger.info("Found scheduled campaigns to start", {
            count: campaignsToStart.length,
            saleorApiUrl,
          });

          for (const campaign of campaignsToStart) {
            try {
              // Check if job already exists in queue
              const queue = await import("./campaign-queue").then((m) => m.getCampaignQueue());
              const existingJob = await queue.getJob(`campaign-${campaign.id}`);

              if (existingJob) {
                logger.debug("Campaign job already exists in queue", { campaignId: campaign.id });
                continue;
              }

              // Update campaign status to sending
              await campaignService.updateCampaignStatus(campaign.id, "sending");

              // Add to queue immediately (scheduled time has passed)
              await addCampaignJob(
                campaign.id,
                {
                  saleorApiUrl,
                  appId,
                  channelSlug: campaign.channelSlug,
                  templateId: campaign.templateId,
                  recipientFilter: campaign.recipientFilter,
                  batchSize: campaign.batchSize,
                  rateLimitPerMinute: campaign.rateLimitPerMinute,
                  maxRetries: campaign.maxRetries,
                },
              );

              logger.info("Scheduled campaign started", {
                campaignId: campaign.id,
                scheduledAt: campaign.scheduledAt,
              });
            } catch (error) {
              logger.error("Failed to start scheduled campaign", {
                campaignId: campaign.id,
                error,
              });
            }
          }
        }
      } catch (error) {
        logger.error("Error checking scheduled campaigns for instance", {
          saleorApiUrl,
          error,
        });
      }
    }
  } catch (error) {
    logger.error("Error in scheduled campaign check", { error });
  }
}

/**
 * Start the scheduler that checks for scheduled campaigns periodically
 */
export function startCampaignScheduler(intervalMs: number = 60000): NodeJS.Timeout {
  logger.info("Starting campaign scheduler", { intervalMs });

  // Run immediately on start
  checkAndStartScheduledCampaigns().catch((error) => {
    logger.error("Error in initial scheduled campaign check", { error });
  });

  // Then run periodically
  const interval = setInterval(() => {
    checkAndStartScheduledCampaigns().catch((error) => {
      logger.error("Error in scheduled campaign check", { error });
    });
  }, intervalMs);

  return interval;
}
