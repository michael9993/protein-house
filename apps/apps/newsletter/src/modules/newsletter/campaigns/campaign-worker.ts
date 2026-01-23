import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { Client } from "urql";
import { gql } from "urql";

import { createLogger } from "../../../logger";
import { createSimpleGraphQLClient } from "../../../lib/create-graphql-client";
import { saleorApp } from "../../../saleor-app";
import { CampaignService } from "./campaign.service";
import { TemplateService } from "../templates/template.service";
import { TemplateCompiler } from "../templates/template-compiler";
import { NewsletterService } from "../newsletter.service";
import { generateUnsubscribeUrl } from "./unsubscribe-url-generator";
import type { CampaignJobData } from "./campaign-queue";

const logger = createLogger("CampaignWorker");

const NEWSLETTER_SUBSCRIPTIONS_QUERY = gql`
  query NewsletterSubscriptions($first: Int!, $after: String, $filter: NewsletterSubscriptionFilterInput) {
    newsletterSubscriptions(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          email
          user {
            id
            firstName
            lastName
          }
          isActive
          subscribedAt
          source
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

interface NewsletterSubscription {
  id: string;
  email: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
  isActive: boolean;
  subscribedAt: string;
  source: string | null;
}

let worker: Worker<CampaignJobData> | null = null;

export function createCampaignWorker(): Worker<CampaignJobData> {
  if (worker) {
    return worker;
  }

  const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  worker = new Worker<CampaignJobData>(
    "newsletter-campaigns",
    async (job: Job<CampaignJobData>) => {
      await processCampaignJob(job);
    },
    {
      connection,
      concurrency: 1, // Process one campaign at a time
      limiter: {
        max: 1,
        duration: 1000, // 1 job per second max
      },
    },
  );

  worker.on("completed", (job) => {
    logger.info("Campaign job completed", { campaignId: job.data.campaignId });
  });

  worker.on("failed", (job, error) => {
    logger.error("Campaign job failed", {
      campaignId: job?.data.campaignId,
      error: error.message,
    });
  });

  logger.info("Campaign worker started");

  return worker;
}

async function processCampaignJob(job: Job<CampaignJobData>): Promise<void> {
  const {
    campaignId,
    saleorApiUrl,
    appId,
    channelSlug,
    templateId,
    recipientFilter,
    batchSize,
    rateLimitPerMinute,
  } = job.data;

  // Get auth data from APL
  const authData = await saleorApp.apl.get(saleorApiUrl);
  if (!authData) {
    throw new Error(`No auth data found for Saleor instance: ${saleorApiUrl}`);
  }

  const token = authData.token;

  logger.info("Processing campaign job", { campaignId });

  // Create services
  const apiClient = createSimpleGraphQLClient({
    saleorApiUrl,
    token,
  });

  const campaignService = new CampaignService(apiClient, saleorApiUrl, appId);
  const templateService = new TemplateService(apiClient, saleorApiUrl, appId);
  const newsletterService = new NewsletterService(apiClient);

  // Get campaign
  const campaign = await campaignService.getCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  // Check if cancelled
  if (campaign.status === "cancelled") {
    logger.info("Campaign cancelled, skipping", { campaignId });
    return;
  }

  // Update status to sending
  await campaignService.updateCampaignStatus(campaignId, "sending");

  // Get template
  const template = await templateService.getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Get base URL for unsubscribe links
  const baseUrl = process.env.NEWSLETTER_APP_URL || process.env.APP_IFRAME_BASE_URL || "http://localhost:3000";

  try {
    // First, fetch all matching subscribers based on filter
    let allSubscribers: NewsletterSubscription[] = [];
    let after: string | undefined = undefined;
    let hasMore = true;

    logger.info("Fetching all matching subscribers", { 
      campaignId, 
      selectionType: recipientFilter.selectionType,
      limit: recipientFilter.limit 
    });

    // Fetch all subscribers matching the filter
    while (hasMore && !job.discarded) {
      // Check if campaign was cancelled
      const currentCampaign = await campaignService.getCampaign(campaignId);
      if (currentCampaign?.status === "cancelled") {
        logger.info("Campaign cancelled during processing", { campaignId });
        break;
      }

      // Build filter for GraphQL query
      const graphqlFilter: any = {};
      if (recipientFilter.isActive !== undefined) {
        graphqlFilter.isActive = recipientFilter.isActive;
      }
      if (recipientFilter.sources && recipientFilter.sources.length > 0) {
        graphqlFilter.source = recipientFilter.sources[0]; // GraphQL only supports single source
      }
      if (recipientFilter.subscribedAfter) {
        graphqlFilter.subscribedAt = { ...graphqlFilter.subscribedAt, gte: recipientFilter.subscribedAfter };
      }
      if (recipientFilter.subscribedBefore) {
        graphqlFilter.subscribedAt = { ...graphqlFilter.subscribedAt, lte: recipientFilter.subscribedBefore };
      }

      // Fetch batch of subscribers
      const result = await apiClient
        .query<{
          newsletterSubscriptions: {
            edges: Array<{ node: NewsletterSubscription }>;
            pageInfo: { hasNextPage: boolean; endCursor: string | null };
            totalCount: number | null;
          };
        }>(NEWSLETTER_SUBSCRIPTIONS_QUERY, {
          first: 100, // Fetch in larger batches
          after,
          filter: Object.keys(graphqlFilter).length > 0 ? graphqlFilter : undefined,
        })
        .toPromise();

      if (result.error) {
        throw new Error(`Failed to fetch subscribers: ${result.error.message}`);
      }

      const batchSubscribers = result.data?.newsletterSubscriptions.edges.map((e) => e.node) || [];
      const pageInfo = result.data?.newsletterSubscriptions.pageInfo;
      const totalCount = result.data?.newsletterSubscriptions.totalCount || 0;

      allSubscribers = [...allSubscribers, ...batchSubscribers];

      // Update recipient count if not set
      if (totalCount > 0 && campaign.recipientCount === 0) {
        await campaignService.updateCampaign({ id: campaignId, recipientCount: totalCount }, "system");
      }

      hasMore = pageInfo?.hasNextPage || false;
      after = pageInfo?.endCursor || undefined;

      // If we have a limit and reached it, stop fetching
      if (recipientFilter.limit && allSubscribers.length >= recipientFilter.limit) {
        hasMore = false;
      }
    }

    // Apply selection logic
    let selectedSubscribers: NewsletterSubscription[] = [];
    
    if (recipientFilter.selectionType === "selected" && recipientFilter.selectedSubscriberIds) {
      // Filter to only selected subscriber IDs
      selectedSubscribers = allSubscribers.filter((sub) =>
        recipientFilter.selectedSubscriberIds!.includes(sub.id)
      );
    } else if (recipientFilter.selectionType === "random" && recipientFilter.limit) {
      // Random selection
      const shuffled = [...allSubscribers].sort(() => 0.5 - Math.random());
      selectedSubscribers = shuffled.slice(0, recipientFilter.limit);
    } else if (recipientFilter.selectionType === "newest" && recipientFilter.limit) {
      // Newest subscribers (sort by subscribedAt descending)
      selectedSubscribers = [...allSubscribers]
        .sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime())
        .slice(0, recipientFilter.limit);
    } else if (recipientFilter.selectionType === "oldest" && recipientFilter.limit) {
      // Oldest subscribers (sort by subscribedAt ascending)
      selectedSubscribers = [...allSubscribers]
        .sort((a, b) => new Date(a.subscribedAt).getTime() - new Date(b.subscribedAt).getTime())
        .slice(0, recipientFilter.limit);
    } else {
      // All matching subscribers
      selectedSubscribers = allSubscribers;
    }

    logger.info("Subscribers selected for campaign", {
      campaignId,
      totalMatching: allSubscribers.length,
      selected: selectedSubscribers.length,
      selectionType: recipientFilter.selectionType,
    });

    if (selectedSubscribers.length === 0) {
      logger.warn("No subscribers selected for campaign", { campaignId });
      await campaignService.updateCampaignStatus(campaignId, "failed");
      const currentCampaign = await campaignService.getCampaign(campaignId);
      if (currentCampaign) {
        const errorLog = currentCampaign.errorLog || [];
        errorLog.push({
          subscriberId: "",
          email: "",
          error: "No subscribers match the selected filters",
          timestamp: new Date().toISOString(),
        });
        await campaignService.updateCampaign(
          {
            id: campaignId,
            errorLog,
          },
          "system"
        );
      }
      return;
    }

    // Update recipient count with actual selected count
    await campaignService.updateCampaign(
      { id: campaignId, recipientCount: selectedSubscribers.length },
      "system"
    );

    // Process selected subscribers in batches
    let processedCount = campaign.lastProcessedIndex || 0;
    
    while (processedCount < selectedSubscribers.length && !job.discarded) {
      // Check if campaign was cancelled
      const currentCampaign = await campaignService.getCampaign(campaignId);
      if (currentCampaign?.status === "cancelled") {
        logger.info("Campaign cancelled during processing", { campaignId });
        break;
      }

      // Get batch to process
      const batchSizeToProcess = Math.min(batchSize, selectedSubscribers.length - processedCount);
      const batchToProcess = selectedSubscribers.slice(processedCount, processedCount + batchSizeToProcess);

      for (const subscriber of batchToProcess) {
        if (job.discarded) {
          break;
        }

        try {
          // Generate unsubscribe URL
          const unsubscribeUrl = generateUnsubscribeUrl(
            baseUrl,
            campaignId,
            subscriber.id,
            subscriber.email,
          );

          // Prepare template data
          const templateData = {
            firstName: subscriber.user?.firstName || "",
            lastName: subscriber.user?.lastName || "",
            email: subscriber.email,
            unsubscribeUrl,
            companyName: "My Store", // TODO: Fetch from storefront-control
            companyEmail: "support@mystore.com", // TODO: Fetch from storefront-control
            companyWebsite: "https://mystore.com", // TODO: Fetch from storefront-control
            primaryColor: "#2563EB", // TODO: Fetch from storefront-control
            secondaryColor: "#1F2937", // TODO: Fetch from storefront-control
          };

          // Compile template
          const compiled = TemplateCompiler.compileTemplate(
            template.body,
            template.subject,
            templateData,
          );

          if (compiled.errors.length > 0) {
            throw new Error(`Template compilation errors: ${compiled.errors.join(", ")}`);
          }

          // TODO: Send email via SMTP app
          // Options:
          // 1. Call SMTP app's API endpoint (if it exposes one)
          // 2. Use Saleor's NOTIFY_USER event (if available)
          // 3. Direct SMTP sending using SMTP configuration from metadata
          // For now, just log - this needs to be implemented
          logger.debug("Would send email", {
            to: subscriber.email,
            subject: compiled.subject,
          });
          
          // TODO: Implement actual email sending
          // await sendEmailViaSMTP({
          //   to: subscriber.email,
          //   subject: compiled.subject,
          //   html: compiled.html,
          //   from: smtpConfig.fromEmail,
          // });

          processedCount++;
          
          // Increment sent count
          const currentCampaign = await campaignService.getCampaign(campaignId);
          if (currentCampaign) {
            await campaignService.updateCampaign(
              {
                id: campaignId,
                sentCount: (currentCampaign.sentCount || 0) + 1,
              },
              "system"
            );
          }

          // Update progress every 10 emails
          if (processedCount % 10 === 0) {
            await campaignService.updateCampaign(
              {
                id: campaignId,
                sentCount: processedCount,
                lastProcessedSubscriberId: subscriber.id,
                lastProcessedIndex: processedCount,
              },
              "system"
            );
          }

          // Rate limiting: wait between emails
          const delay = (60 / rateLimitPerMinute) * 1000; // Convert to milliseconds
          await new Promise((resolve) => setTimeout(resolve, delay));
        } catch (error) {
          logger.error("Error sending email to subscriber", {
            subscriberId: subscriber.id,
            email: subscriber.email,
            error: error instanceof Error ? error.message : String(error),
          });

          // Increment failed count and add to error log
          const currentCampaign = await campaignService.getCampaign(campaignId);
          if (currentCampaign) {
            const errorLog = currentCampaign.errorLog || [];
            errorLog.push({
              subscriberId: subscriber.id,
              email: subscriber.email,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString(),
            });

            // Keep only last 1000 errors
            if (errorLog.length > 1000) {
              errorLog.shift();
            }

            await campaignService.updateCampaign(
              {
                id: campaignId,
                failedCount: (currentCampaign.failedCount || 0) + 1,
                errorLog,
              },
              "system"
            );
          }
        }
      }

      // Update progress after batch
      await campaignService.updateCampaign(
        {
          id: campaignId,
          sentCount: processedCount,
          lastProcessedSubscriberId: batchToProcess[batchToProcess.length - 1]?.id,
          lastProcessedIndex: processedCount,
        },
        "system"
      );
    }

    // Mark as sent
    await campaignService.updateCampaignStatus(campaignId, "sent");
    await campaignService.updateCampaign(
      {
        id: campaignId,
        sentAt: new Date().toISOString(),
        sentCount: processedCount,
        lastProcessedSubscriberId: selectedSubscribers[selectedSubscribers.length - 1]?.id,
        lastProcessedIndex: processedCount,
      },
      "system"
    );

    logger.info("Campaign processing completed", {
      campaignId,
      sentCount: processedCount,
    });
  } catch (error) {
    logger.error("Campaign processing failed", {
      campaignId,
      error: error instanceof Error ? error.message : String(error),
    });

    await campaignService.updateCampaignStatus(campaignId, "failed", {
      retryCount: (campaign.retryCount || 0) + 1,
    });

    throw error;
  }
}

export async function closeCampaignWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
