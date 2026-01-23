import { randomUUID } from "crypto";
import { Client } from "urql";

import { createLogger } from "../../../logger";
import { createSettingsManager } from "../../../lib/metadata-manager";
import type {
  Campaign,
  CampaignStatus,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "./campaign-schema";

const logger = createLogger("CampaignService");

const METADATA_KEY = "newsletter-campaigns";

export class CampaignService {
  private settingsManager;

  constructor(
    private apiClient: Client,
    private saleorApiUrl: string,
    private appId: string,
  ) {
    this.settingsManager = createSettingsManager(apiClient, appId);
  }

  async createCampaign(input: CreateCampaignInput, createdBy: string): Promise<Campaign> {
    logger.debug("Creating campaign", { name: input.name });

    const campaigns = await this.getCampaigns();
    const now = new Date().toISOString();

    const campaign: Campaign = {
      id: randomUUID(),
      name: input.name,
      templateId: input.templateId,
      templateVersion: undefined,
      channelSlug: input.channelSlug,
      smtpConfigurationId: input.smtpConfigurationId,
      status: input.scheduledAt ? "scheduled" : "draft",
      scheduledAt: input.scheduledAt || null,
      timezone: input.timezone,
      sentAt: null,
      recipientFilter: input.recipientFilter,
      recipientCount: 0, // Will be calculated
      sentCount: 0,
      failedCount: 0,
      lastProcessedSubscriberId: undefined,
      lastProcessedIndex: undefined,
      errorLog: [],
      retryCount: 0,
      maxRetries: input.maxRetries || 3,
      batchSize: input.batchSize || 25,
      rateLimitPerMinute: input.rateLimitPerMinute || 60,
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    campaigns.push(campaign);
    await this.saveCampaigns(campaigns);

    logger.info("Campaign created", { id: campaign.id, name: campaign.name });
    return campaign;
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    const campaigns = await this.getCampaigns();
    return campaigns.find((c) => c.id === id) || null;
  }

  async getCampaigns(): Promise<Campaign[]> {
    try {
      const value = await this.settingsManager.get(METADATA_KEY);
      if (!value) {
        return [];
      }
      return JSON.parse(value) as Campaign[];
    } catch (error) {
      logger.error("Error fetching campaigns", { error });
      return [];
    }
  }

  async updateCampaign(input: UpdateCampaignInput, updatedBy: string): Promise<Campaign> {
    logger.debug("Updating campaign", { id: input.id });

    const campaigns = await this.getCampaigns();
    const index = campaigns.findIndex((c) => c.id === input.id);

    if (index === -1) {
      throw new Error(`Campaign with id ${input.id} not found`);
    }

    const existing = campaigns[index];

    // Allow editing all campaigns - reset progress if needed
    if (existing.status === "sending" || existing.status === "sent") {
      // Reset progress when editing a sent/sending campaign
      input.sentCount = 0;
      input.failedCount = 0;
      input.lastProcessedSubscriberId = undefined;
      input.lastProcessedIndex = undefined;
      input.errorLog = [];
    }

    const updated: Campaign = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
      // Update status if scheduledAt changed
      status:
        input.scheduledAt !== undefined
          ? input.scheduledAt
            ? "scheduled"
            : existing.status === "scheduled"
              ? "draft"
              : existing.status
          : existing.status,
    };

    campaigns[index] = updated;
    await this.saveCampaigns(campaigns);

    logger.info("Campaign updated", { id: updated.id, name: updated.name });
    return updated;
  }

  async deleteCampaign(id: string): Promise<void> {
    logger.debug("Deleting campaign", { id });

    const campaigns = await this.getCampaigns();
    const campaign = campaigns.find((c) => c.id === id);

    if (!campaign) {
      throw new Error(`Campaign with id ${id} not found`);
    }

    // Allow deleting all campaigns - if sending, cancel first
    if (campaign.status === "sending") {
      // Cancel the campaign first by updating status
      campaign.status = "cancelled";
      const campaigns = await this.getCampaigns();
      const index = campaigns.findIndex((c) => c.id === id);
      if (index !== -1) {
        campaigns[index] = { ...campaign, status: "cancelled", updatedAt: new Date().toISOString() };
        await this.saveCampaigns(campaigns);
      }
    }

    const filtered = campaigns.filter((c) => c.id !== id);
    await this.saveCampaigns(filtered);

    logger.info("Campaign deleted", { id });
  }

  async updateCampaignStatus(
    id: string,
    status: Campaign["status"],
    updates?: Partial<Campaign>,
  ): Promise<Campaign> {
    const campaigns = await this.getCampaigns();
    const index = campaigns.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error(`Campaign with id ${id} not found`);
    }

    const updated: Campaign = {
      ...campaigns[index],
      status,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    campaigns[index] = updated;
    await this.saveCampaigns(campaigns);

    logger.info("Campaign status updated", { id, status });
    return updated;
  }

  async duplicateCampaign(id: string, createdBy: string): Promise<Campaign> {
    logger.debug("Duplicating campaign", { id });

    const campaign = await this.getCampaign(id);
    if (!campaign) {
      throw new Error(`Campaign with id ${id} not found`);
    }

    const now = new Date().toISOString();
    const duplicated: Campaign = {
      ...campaign,
      id: randomUUID(),
      name: `${campaign.name} (Copy)`,
      status: "draft",
      scheduledAt: null,
      sentAt: null,
      sentCount: 0,
      failedCount: 0,
      recipientCount: 0,
      lastProcessedSubscriberId: undefined,
      lastProcessedIndex: undefined,
      errorLog: [],
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    const campaigns = await this.getCampaigns();
    campaigns.push(duplicated);
    await this.saveCampaigns(campaigns);

    logger.info("Campaign duplicated", { originalId: id, newId: duplicated.id });
    return duplicated;
  }

  private async saveCampaigns(campaigns: Campaign[]): Promise<void> {
    await this.settingsManager.set({
      key: METADATA_KEY,
      value: JSON.stringify(campaigns),
    });
  }
}
