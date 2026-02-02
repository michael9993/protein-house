import { Worker, Job } from "bullmq";
import type { ConnectionOptions } from "bullmq";
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
import { sendEmail, getDefaultSmtpConfig } from "./email-sender";
import {
    fetchSmtpConfigurationFromApp,
    convertSmtpConfigToEmailSenderFormat,
} from "./smtp-config-fetcher";

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
          channel {
            id
            slug
            name
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
    channel: {
        id: string;
        slug: string;
        name: string;
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
    }) as unknown as ConnectionOptions;

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

    // Check if cancelled - but also check if status is "sending" (which means it was just started)
    // The router updates status to "sending" after queuing, so there's a small window where
    // the status might not be updated yet. If status is "draft" or "scheduled", proceed.
    if (campaign.status === "cancelled") {
        logger.info("Campaign cancelled, skipping", { campaignId });
        return;
    }

    // If status is not "sending" yet but we're processing, update it to "sending"
    // This handles the race condition where the job is picked up before status update completes
    if (campaign.status !== "sending" && campaign.status !== "sent") {
        logger.info("Updating campaign status to 'sending' at worker start", {
            campaignId,
            currentStatus: campaign.status,
        });
        await campaignService.updateCampaignStatus(campaignId, "sending");
    }

    // Fetch SMTP configuration from SMTP app
    let smtpConfig = null;
    try {
        const smtpAppConfig = await fetchSmtpConfigurationFromApp(
            apiClient,
            saleorApiUrl,
            campaign.smtpConfigurationId,
        );

        if (smtpAppConfig) {
            smtpConfig = convertSmtpConfigToEmailSenderFormat(smtpAppConfig);
            logger.info("Using SMTP configuration from SMTP app", {
                configId: smtpAppConfig.id,
                configName: smtpAppConfig.name,
            });
        }
    } catch (smtpError) {
        logger.warn("Failed to fetch SMTP config from SMTP app, will try default", {
            error: smtpError,
        });
    }

    // Fallback to default SMTP config from environment if SMTP app config not found
    if (!smtpConfig) {
        smtpConfig = getDefaultSmtpConfig();
        if (smtpConfig) {
            logger.info("Using default SMTP configuration from environment variables");
        }
    }

    if (!smtpConfig) {
        throw new Error(
            "SMTP configuration not found. Please configure the SMTP app or set SMTP environment variables (SMTP_HOST, SMTP_PORT, SMTP_FROM_EMAIL)."
        );
    }

    // Status should already be "sending" (updated above), but ensure it is before proceeding
    // Re-check campaign status after SMTP config fetch to ensure it wasn't cancelled
    const currentCampaignCheck = await campaignService.getCampaign(campaignId);
    if (currentCampaignCheck?.status === "cancelled") {
        logger.info("Campaign was cancelled while fetching SMTP config, aborting", { campaignId });
        return;
    }

    // Get template
    const template = await templateService.getTemplate(templateId);
    if (!template) {
        throw new Error(`Template ${templateId} not found`);
    }

    // Get base URL for unsubscribe links
    const baseUrl = process.env.NEWSLETTER_APP_URL || process.env.APP_IFRAME_BASE_URL || "http://localhost:3000";

    // Declare in outer scope so catch block can use them for final counts
    let selectedSubscribers: NewsletterSubscription[] = [];
    let actualSentCount = 0;
    let actualFailedCount = 0;

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
        while (hasMore && !(job as unknown as { discarded?: boolean }).discarded) {
            // Check if campaign was cancelled
            const currentCampaign = await campaignService.getCampaign(campaignId);
            if (currentCampaign?.status === "cancelled") {
                logger.info("Campaign cancelled during subscriber fetch", {
                    campaignId,
                    channelSlug,
                });
                // If cancelled early, ensure counts are set to 0
                await campaignService.updateCampaign(
                    {
                        id: campaignId,
                        recipientCount: 0,
                        sentCount: 0,
                        failedCount: 0,
                    },
                    "system"
                );
                return;
            }

            // Build filter for GraphQL query
            const graphqlFilter: any = {};
            if (recipientFilter.isActive !== undefined) {
                graphqlFilter.isActive = recipientFilter.isActive;
            }
            if (recipientFilter.sources && recipientFilter.sources.length > 0) {
                graphqlFilter.source = recipientFilter.sources[0]; // GraphQL only supports single source
            }
            // Filter by channel if specified - this ensures we only get subscribers from the campaign's channel
            if (channelSlug) {
                graphqlFilter.channel = channelSlug;
            }
            if (recipientFilter.subscribedAfter) {
                graphqlFilter.subscribedAt = { ...graphqlFilter.subscribedAt, gte: recipientFilter.subscribedAfter };
            }
            if (recipientFilter.subscribedBefore) {
                graphqlFilter.subscribedAt = { ...graphqlFilter.subscribedAt, lte: recipientFilter.subscribedBefore };
            }

            // Fetch batch of subscribers
            type SubscriptionsResponse = {
                newsletterSubscriptions: {
                    edges: Array<{ node: NewsletterSubscription }>;
                    pageInfo: { hasNextPage: boolean; endCursor: string | null };
                    totalCount: number | null;
                };
            };
            const result = await apiClient
                .query<SubscriptionsResponse>(NEWSLETTER_SUBSCRIPTIONS_QUERY, {
                    first: 100, // Fetch in larger batches
                    after,
                    filter: Object.keys(graphqlFilter).length > 0 ? graphqlFilter : undefined,
                })
                .toPromise();

            if (result.error) {
                throw new Error(`Failed to fetch subscribers: ${result.error.message}`);
            }

            const batchSubscribers = result.data?.newsletterSubscriptions.edges.map((e: { node: NewsletterSubscription }) => e.node) || [];
            const pageInfo: { hasNextPage: boolean; endCursor: string | null } | undefined = result.data?.newsletterSubscriptions.pageInfo;
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

        // Apply additional channel filtering (defensive check - GraphQL should already filter, but we verify)
        // This ensures we only process subscribers that match the campaign's channel
        const channelFilteredSubscribers = channelSlug
            ? allSubscribers.filter((sub) => {
                // Include subscribers that match the channel slug, or have no channel (legacy subscribers)
                // For strict filtering, uncomment the next line and remove the || !sub.channel part
                // return sub.channel?.slug === channelSlug;
                // For now, we allow subscribers without a channel to be included (backward compatibility)
                return !sub.channel || sub.channel.slug === channelSlug;
            })
            : allSubscribers;

        // Apply selection logic (selectedSubscribers declared above for catch scope)
        if (recipientFilter.selectionType === "selected" && recipientFilter.selectedSubscriberIds) {
            // Filter to only selected subscriber IDs
            selectedSubscribers = channelFilteredSubscribers.filter((sub) =>
                recipientFilter.selectedSubscriberIds!.includes(sub.id)
            );
        } else if (recipientFilter.selectionType === "random" && recipientFilter.limit) {
            // Random selection
            const shuffled = [...channelFilteredSubscribers].sort(() => 0.5 - Math.random());
            selectedSubscribers = shuffled.slice(0, recipientFilter.limit);
        } else if (recipientFilter.selectionType === "newest" && recipientFilter.limit) {
            // Newest subscribers (sort by subscribedAt descending)
            selectedSubscribers = [...channelFilteredSubscribers]
                .sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime())
                .slice(0, recipientFilter.limit);
        } else if (recipientFilter.selectionType === "oldest" && recipientFilter.limit) {
            // Oldest subscribers (sort by subscribedAt ascending)
            selectedSubscribers = [...channelFilteredSubscribers]
                .sort((a, b) => new Date(a.subscribedAt).getTime() - new Date(b.subscribedAt).getTime())
                .slice(0, recipientFilter.limit);
        } else {
            // All matching subscribers
            selectedSubscribers = channelFilteredSubscribers;
        }

        logger.info("Subscribers selected for campaign", {
            campaignId,
            channelSlug,
            totalMatching: allSubscribers.length,
            channelFiltered: channelFilteredSubscribers.length,
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

        // Track actual sent/failed counts for recipients that match the channel
        // This ensures counts reflect only subscribers that should have received emails
        actualSentCount = 0;
        actualFailedCount = 0;
        const processedSubscriberIds: string[] = [];

        // Process selected subscribers in batches
        let processedCount = campaign.lastProcessedIndex || 0;

        while (processedCount < selectedSubscribers.length && !(job as unknown as { discarded?: boolean }).discarded) {
            // Check if campaign was cancelled
            const currentCampaign = await campaignService.getCampaign(campaignId);
            if (currentCampaign?.status === "cancelled") {
                logger.info("Campaign cancelled during processing - finalizing counts", {
                    campaignId,
                    channelSlug,
                });

                // Recalculate final counts before breaking
                const finalRecipientCount = selectedSubscribers?.length || currentCampaign.recipientCount || 0;
                const finalSentCount = actualSentCount || currentCampaign.sentCount || 0;
                const finalFailedCount = actualFailedCount || currentCampaign.failedCount || 0;

                await campaignService.updateCampaign(
                    {
                        id: campaignId,
                        recipientCount: finalRecipientCount,
                        sentCount: finalSentCount,
                        failedCount: finalFailedCount,
                    },
                    "system"
                );

                logger.info("Campaign cancelled - counts finalized", {
                    campaignId,
                    channelSlug,
                    recipientCount: finalRecipientCount,
                    sentCount: finalSentCount,
                    failedCount: finalFailedCount,
                });

                break;
            }

            // Get batch to process
            const batchSizeToProcess = Math.min(batchSize, selectedSubscribers.length - processedCount);
            const batchToProcess = selectedSubscribers.slice(processedCount, processedCount + batchSizeToProcess);

            for (const subscriber of batchToProcess) {
                if ((job as unknown as { discarded?: boolean }).discarded) {
                    break;
                }

                try {
                    // Generate unsubscribe URL with channel and saleorApiUrl for proper redirection
                    const unsubscribeUrl = generateUnsubscribeUrl(
                        baseUrl,
                        campaignId,
                        subscriber.id,
                        subscriber.email,
                        channelSlug,
                        saleorApiUrl,
                    );

                    // Parse template's saved preview data for branding values
                    let savedPreviewData: Record<string, unknown> = {};
                    if (template.previewData) {
                        try {
                            savedPreviewData = JSON.parse(template.previewData);
                        } catch (e) {
                            logger.warn("Failed to parse template previewData, using defaults", {
                                campaignId,
                                templateId: template.id,
                            });
                        }
                    }

                    // Prepare template data - merge saved preview data with subscriber-specific data
                    // Subscriber data (firstName, lastName, email, unsubscribeUrl) override saved data
                    const templateData = {
                        // Default values (fallback)
                        companyName: "My Store",
                        companyEmail: "support@mystore.com",
                        companyWebsite: "https://mystore.com",
                        companyLogo: "",
                        companyAddress: "",
                        primaryColor: "#2563EB",
                        secondaryColor: "#1F2937",
                        subject: template.subject,
                        // Default products section
                        productsTitle: "Top Picks",
                        productsSubtitle: "Hand-picked deals we think you'll love.",
                        products: [],
                        // Merge ALL saved preview data (branding, products, etc.)
                        ...savedPreviewData,
                        // Override with actual subscriber data (these MUST use real values)
                        firstName: subscriber.user?.firstName || (savedPreviewData.firstName as string) || "",
                        lastName: subscriber.user?.lastName || (savedPreviewData.lastName as string) || "",
                        email: subscriber.email,
                        unsubscribeUrl, // Always use generated unsubscribe URL
                    };

                    logger.debug("Template data prepared for subscriber", {
                        campaignId,
                        subscriberId: subscriber.id,
                        hasProducts: Array.isArray(templateData.products) && templateData.products.length > 0,
                        productsCount: Array.isArray(templateData.products) ? templateData.products.length : 0,
                    });

                    // Compile template
                    const compiled = TemplateCompiler.compileTemplate(
                        template.body,
                        template.subject,
                        templateData,
                    );

                    // Only throw if HTML is empty (actual compilation failure)
                    // Warnings are logged but don't prevent sending if HTML was generated
                    if (!compiled.html || compiled.html.trim().length === 0) {
                        throw new Error(
                            compiled.errors.length > 0
                                ? `Template compilation failed: ${compiled.errors.join(", ")}`
                                : "Template compilation failed: No HTML output generated"
                        );
                    }

                    // Log warnings but continue sending if HTML was generated
                    if (compiled.errors.length > 0) {
                        logger.warn("Template compilation warnings (continuing anyway)", {
                            campaignId,
                            subscriberId: subscriber.id,
                            email: subscriber.email,
                            errors: compiled.errors,
                        });
                    }

                    // smtpConfig is already fetched at the start of the job
                    if (!smtpConfig) {
                        throw new Error(
                            "SMTP configuration not available. This should not happen as it's checked at job start."
                        );
                    }

                    // Send email
                    try {
                        await sendEmail({
                            to: subscriber.email,
                            subject: compiled.subject,
                            html: compiled.html,
                            smtpConfig,
                        });

                        logger.info("Email sent successfully", {
                            campaignId,
                            subscriberId: subscriber.id,
                            email: subscriber.email,
                            subject: compiled.subject,
                            channel: subscriber.channel?.slug || "none",
                        });

                        // Increment sent count only after successful send
                        processedCount++;
                        actualSentCount++;
                        processedSubscriberIds.push(subscriber.id);

                        const currentCampaign = await campaignService.getCampaign(campaignId);
                        if (currentCampaign) {
                            await campaignService.updateCampaign(
                                {
                                    id: campaignId,
                                    sentCount: actualSentCount,
                                    lastProcessedSubscriberId: subscriber.id,
                                    lastProcessedIndex: processedCount,
                                },
                                "system"
                            );
                        }
                    } catch (sendError) {
                        logger.error("Failed to send email", {
                            campaignId,
                            subscriberId: subscriber.id,
                            email: subscriber.email,
                            error: sendError,
                        });

                        // Increment failed count and log error
                        processedCount++;
                        actualFailedCount++;
                        processedSubscriberIds.push(subscriber.id);

                        const currentCampaign = await campaignService.getCampaign(campaignId);
                        if (currentCampaign) {
                            const errorLog = currentCampaign.errorLog || [];
                            errorLog.push({
                                subscriberId: subscriber.id,
                                email: subscriber.email,
                                error: sendError instanceof Error ? sendError.message : String(sendError),
                                timestamp: new Date().toISOString(),
                            });

                            await campaignService.updateCampaign(
                                {
                                    id: campaignId,
                                    failedCount: actualFailedCount,
                                    errorLog,
                                    lastProcessedSubscriberId: subscriber.id,
                                    lastProcessedIndex: processedCount,
                                },
                                "system"
                            );
                        }

                        // Continue processing other subscribers even if one fails
                        // Don't throw - we want to process all subscribers
                    }

                    // Rate limiting: wait between emails
                    if (rateLimitPerMinute > 0) {
                        const delayMs = Math.floor((60 / rateLimitPerMinute) * 1000);
                        await new Promise((resolve) => setTimeout(resolve, delayMs));
                    }
                } catch (error) {
                    logger.error("Error sending email to subscriber", {
                        subscriberId: subscriber.id,
                        email: subscriber.email,
                        error: error instanceof Error ? error.message : String(error),
                    });

                    // Increment failed count and add to error log
                    processedCount++;
                    actualFailedCount++;
                    processedSubscriberIds.push(subscriber.id);

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
                                failedCount: actualFailedCount,
                                errorLog,
                                lastProcessedIndex: processedCount,
                            },
                            "system"
                        );
                    }
                }
            }

            // Update progress after batch (use actual counts, not processedCount)
            await campaignService.updateCampaign(
                {
                    id: campaignId,
                    sentCount: actualSentCount,
                    failedCount: actualFailedCount,
                    lastProcessedSubscriberId: batchToProcess[batchToProcess.length - 1]?.id,
                    lastProcessedIndex: processedCount,
                },
                "system"
            );
        }

        // Final recalculation: ensure counts reflect only subscribers that match the channel
        // This is a defensive check to ensure accuracy even if something went wrong during processing
        const finalRecipientCount = selectedSubscribers.length;
        const finalSentCount = actualSentCount;
        const finalFailedCount = actualFailedCount;

        logger.info("Campaign processing completed - finalizing counts", {
            campaignId,
            channelSlug,
            totalRecipients: finalRecipientCount,
            sentCount: finalSentCount,
            failedCount: finalFailedCount,
            processedSubscriberIds: processedSubscriberIds.length,
        });

        // Mark as sent and update with final accurate counts
        await campaignService.updateCampaignStatus(campaignId, "sent");
        await campaignService.updateCampaign(
            {
                id: campaignId,
                sentAt: new Date().toISOString(),
                recipientCount: finalRecipientCount,
                sentCount: finalSentCount,
                failedCount: finalFailedCount,
                lastProcessedSubscriberId: selectedSubscribers[selectedSubscribers.length - 1]?.id,
                lastProcessedIndex: processedCount,
            },
            "system"
        );

        logger.info("Campaign processing completed", {
            campaignId,
            channelSlug,
            recipientCount: finalRecipientCount,
            sentCount: finalSentCount,
            failedCount: finalFailedCount,
        });
    } catch (error) {
        logger.error("Campaign processing failed", {
            campaignId,
            channelSlug,
            error: error instanceof Error ? error.message : String(error),
        });

        // Recalculate final counts before marking as failed
        // This ensures we have accurate counts even if the campaign failed
        const finalCampaign = await campaignService.getCampaign(campaignId);
        if (finalCampaign) {
            // Use the counts we tracked during processing, or fall back to current counts
            const finalSentCount = actualSentCount || finalCampaign.sentCount || 0;
            const finalFailedCount = actualFailedCount || finalCampaign.failedCount || 0;
            const finalRecipientCount = selectedSubscribers?.length || finalCampaign.recipientCount || 0;

            await campaignService.updateCampaign(
                {
                    id: campaignId,
                    recipientCount: finalRecipientCount,
                    sentCount: finalSentCount,
                    failedCount: finalFailedCount,
                    retryCount: (campaign.retryCount || 0) + 1,
                },
                "system"
            );
        }

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
