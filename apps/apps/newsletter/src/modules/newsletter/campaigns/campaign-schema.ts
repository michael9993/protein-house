import { z } from "zod";

export const campaignStatusSchema = z.enum([
  "draft",
  "scheduled",
  "sending",
  "sent",
  "cancelled",
  "failed",
  "paused",
]);

export const campaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  templateId: z.string().uuid(),
  templateVersion: z.number().int().positive().optional(),
  channelSlug: z.string(),
  smtpConfigurationId: z.string().optional(),
  status: campaignStatusSchema,
  scheduledAt: z.string().datetime().nullable(),
  timezone: z.string().optional(),
  sentAt: z.string().datetime().nullable(),
  recipientFilter: z.object({
    isActive: z.boolean().optional(),
    sources: z.array(z.string()).optional(),
    subscribedAfter: z.string().datetime().optional(),
    subscribedBefore: z.string().datetime().optional(),
    selectionType: z.enum(["all", "random", "selected", "newest", "oldest"]).optional(),
    limit: z.number().int().positive().optional(), // Limit number of recipients
    selectedSubscriberIds: z.array(z.string().min(1)).optional(), // For "selected" type - accepts Global IDs (base64)
  }),
  recipientCount: z.number().int().nonnegative(),
  sentCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  lastProcessedSubscriberId: z.string().optional(),
  lastProcessedIndex: z.number().int().nonnegative().optional(),
  errorLog: z
    .array(
      z.object({
        subscriberId: z.string(),
        email: z.string(),
        error: z.string(),
        timestamp: z.string().datetime(),
      }),
    )
    .optional(),
  retryCount: z.number().int().nonnegative(),
  maxRetries: z.number().int().positive(),
  batchSize: z.number().int().positive(),
  rateLimitPerMinute: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),
});

export type Campaign = z.infer<typeof campaignSchema>;
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

export const createCampaignInputSchema = z.object({
  name: z.string().min(1).max(255),
  templateId: z.string().uuid(),
  channelSlug: z.string(),
  smtpConfigurationId: z.string().optional(),
  scheduledAt: z.preprocess(
    (val) => {
      // Convert empty string to undefined (which becomes null after nullable())
      if (typeof val === "string" && val.trim() === "") {
        return undefined;
      }
      // If it's datetime-local format (YYYY-MM-DDTHH:mm), convert to ISO
      if (typeof val === "string" && val.includes("T") && !val.includes("Z") && !val.includes("+")) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      return val;
    },
    z.string().datetime().nullable().optional(),
  ),
  timezone: z.string().optional(),
  recipientFilter: z.object({
    isActive: z.boolean().optional(),
    sources: z.array(z.string()).optional(),
    subscribedAfter: z.string().datetime().optional(),
    subscribedBefore: z.string().datetime().optional(),
    selectionType: z.enum(["all", "random", "selected", "newest", "oldest"]).optional(),
    limit: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        const num = typeof val === "string" ? parseInt(val, 10) : val;
        return isNaN(num) ? undefined : num;
      },
      z.number().int().positive().optional()
    ), // Limit number of recipients
    selectedSubscriberIds: z.array(z.string().min(1)).optional(), // For "selected" type - accepts Global IDs (base64)
  }),
  batchSize: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      return isNaN(num) ? undefined : num;
    },
    z.number().int().positive().optional()
  ),
  rateLimitPerMinute: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      return isNaN(num) ? undefined : num;
    },
    z.number().int().positive().optional()
  ),
  maxRetries: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      return isNaN(num) ? undefined : num;
    },
    z.number().int().min(0).max(10).optional()
  ),
});

export const updateCampaignInputSchema = createCampaignInputSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignInputSchema>;
