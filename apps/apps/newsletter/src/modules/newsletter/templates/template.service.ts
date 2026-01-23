import { randomUUID } from "crypto";
import { Client } from "urql";

import { createLogger } from "../../../logger";
import { createSettingsManager } from "../../../lib/metadata-manager";
import type { CreateTemplateInput, Template, UpdateTemplateInput } from "./template-schema";

const logger = createLogger("TemplateService");

const METADATA_KEY = "newsletter-templates";

export class TemplateService {
  private settingsManager;

  constructor(
    private apiClient: Client,
    private saleorApiUrl: string,
    private appId: string,
  ) {
    this.settingsManager = createSettingsManager(apiClient, appId);
  }

  async createTemplate(input: CreateTemplateInput, createdBy: string): Promise<Template> {
    logger.debug("Creating template", { name: input.name });

    const templates = await this.getTemplates();
    const now = new Date().toISOString();

    const template: Template = {
      id: randomUUID(),
      name: input.name,
      subject: input.subject,
      body: input.body,
      variables: input.variables || [],
      images: input.images || [],
      version: 1,
      isLocked: false,
      lockedByCampaigns: [],
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    templates.push(template);
    await this.saveTemplates(templates);

    logger.info("Template created", { id: template.id, name: template.name });
    return template;
  }

  async getTemplate(id: string): Promise<Template | null> {
    const templates = await this.getTemplates();
    return templates.find((t) => t.id === id) || null;
  }

  async getTemplates(): Promise<Template[]> {
    try {
      const value = await this.settingsManager.get(METADATA_KEY);
      if (!value) {
        return [];
      }
      return JSON.parse(value) as Template[];
    } catch (error) {
      logger.error("Error fetching templates", { error });
      return [];
    }
  }

  async updateTemplate(input: UpdateTemplateInput, updatedBy: string): Promise<Template> {
    logger.debug("Updating template", { id: input.id });

    const templates = await this.getTemplates();
    const index = templates.findIndex((t) => t.id === input.id);

    if (index === -1) {
      throw new Error(`Template with id ${input.id} not found`);
    }

    const existing = templates[index];

    if (existing.isLocked) {
      throw new Error(`Template is locked and cannot be edited. It is being used by campaigns: ${existing.lockedByCampaigns.join(", ")}`);
    }

    const updated: Template = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
      version: (existing.version || 1) + 1,
    };

    templates[index] = updated;
    await this.saveTemplates(templates);

    logger.info("Template updated", { id: updated.id, name: updated.name });
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    logger.debug("Deleting template", { id });

    const templates = await this.getTemplates();
    const template = templates.find((t) => t.id === id);

    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }

    if (template.isLocked) {
      throw new Error(`Template is locked and cannot be deleted. It is being used by campaigns: ${template.lockedByCampaigns.join(", ")}`);
    }

    const filtered = templates.filter((t) => t.id !== id);
    await this.saveTemplates(filtered);

    logger.info("Template deleted", { id });
  }

  async duplicateTemplate(id: string, createdBy: string): Promise<Template> {
    logger.debug("Duplicating template", { id });

    const template = await this.getTemplate(id);
    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }

    const now = new Date().toISOString();
    const duplicated: Template = {
      ...template,
      id: randomUUID(),
      name: `${template.name} (Copy)`,
      version: 1,
      isLocked: false,
      lockedByCampaigns: [],
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    const templates = await this.getTemplates();
    templates.push(duplicated);
    await this.saveTemplates(templates);

    logger.info("Template duplicated", { originalId: id, newId: duplicated.id });
    return duplicated;
  }

  async lockTemplate(id: string, campaignId: string): Promise<void> {
    const templates = await this.getTemplates();
    const template = templates.find((t) => t.id === id);

    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }

    if (!template.lockedByCampaigns.includes(campaignId)) {
      template.lockedByCampaigns.push(campaignId);
      template.isLocked = true;
      template.updatedAt = new Date().toISOString();
      await this.saveTemplates(templates);
    }
  }

  async unlockTemplate(id: string, campaignId: string): Promise<void> {
    const templates = await this.getTemplates();
    const template = templates.find((t) => t.id === id);

    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }

    template.lockedByCampaigns = template.lockedByCampaigns.filter((cid) => cid !== campaignId);
    template.isLocked = template.lockedByCampaigns.length > 0;
    template.updatedAt = new Date().toISOString();
    await this.saveTemplates(templates);
  }

  private async saveTemplates(templates: Template[]): Promise<void> {
    await this.settingsManager.set({
      key: METADATA_KEY,
      value: JSON.stringify(templates),
    });
  }
}
