import { z } from "zod";

import { router } from "./trpc-server";
import { protectedClientProcedure } from "./protected-client-procedure";
import { StorefrontConfigManager, createSettingsManager } from "../config/config-manager";
import { StorefrontConfigSchema, StorefrontConfig } from "../config/schema";
import { getDefaultConfig } from "../config/defaults";
import { 
  validateImportFile, 
  diffConfigs, 
  CURRENT_SCHEMA_VERSION,
  type ImportValidationResult,
  type ConfigDiffEntry,
} from "../config/import-schema";
import { createExportFile } from "../config/export";

export const configRouter = router({
  /**
   * Get configuration for a specific channel
   */
  getConfig: protectedClientProcedure
    .input(z.object({ channelSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log(`[getConfig] Getting config for ${input.channelSlug}`);
      
      const settingsManager = createSettingsManager(ctx.apiClient, ctx.appId!);
      const configManager = new StorefrontConfigManager(settingsManager);
      
      const config = await configManager.getForChannelWithDefaults(input.channelSlug);
      
      console.log(`[getConfig] Returned filters:`, JSON.stringify(config.filters, null, 2));
      console.log(`[getConfig] Returned quickFilters:`, JSON.stringify(config.quickFilters, null, 2));
      
      return config;
    }),

  /**
   * Save configuration for a specific channel
   */
  saveConfig: protectedClientProcedure
    .input(z.object({
      channelSlug: z.string(),
      config: StorefrontConfigSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const settingsManager = createSettingsManager(ctx.apiClient, ctx.appId!);
      const configManager = new StorefrontConfigManager(settingsManager);
      
      await configManager.setForChannel(input.channelSlug, input.config);
      return { success: true };
    }),

  /**
   * Update a specific section of the configuration
   */
  updateSection: protectedClientProcedure
    .input(z.object({
      channelSlug: z.string(),
      section: z.enum([
        "store",
        "branding", 
        "features",
        "ecommerce",
        "header",
        "footer",
        "homepage",
        "pages",
        "integrations",
        "seo",
        "localization",
        "filters",
        "quickFilters",
        "promoPopup",
        "ui",
        "content",
        "darkMode",
      ]),
      data: z.unknown(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log(`[updateSection] Updating ${input.section} for ${input.channelSlug}`);
      console.log(`[updateSection] Input data:`, JSON.stringify(input.data, null, 2));
      
      const settingsManager = createSettingsManager(ctx.apiClient, ctx.appId!);
      const configManager = new StorefrontConfigManager(settingsManager);
      
      // Get current config
      const currentConfig = await configManager.getForChannelWithDefaults(input.channelSlug);
      
      // Update the specific section
      const updatedConfig: StorefrontConfig = {
        ...currentConfig,
        [input.section]: input.data,
      };
      
      console.log(`[updateSection] Updated ${input.section}:`, JSON.stringify(updatedConfig[input.section], null, 2));
      
      // Validate and save
      try {
        const validated = StorefrontConfigSchema.parse(updatedConfig);
        await configManager.setForChannel(input.channelSlug, validated);
        console.log(`[updateSection] Successfully saved ${input.section} for ${input.channelSlug}`);
        return { success: true };
      } catch (error) {
        console.error(`[updateSection] Error saving ${input.section} for ${input.channelSlug}:`, error);
        throw error;
      }
    }),

  /**
   * Update multiple sections at once (prevents race conditions)
   */
  updateMultipleSections: protectedClientProcedure
    .input(z.object({
      channelSlug: z.string(),
      updates: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log(`[updateMultipleSections] Updating sections for ${input.channelSlug}:`, Object.keys(input.updates));
      
      const settingsManager = createSettingsManager(ctx.apiClient, ctx.appId!);
      const configManager = new StorefrontConfigManager(settingsManager);
      
      // Get current config
      const currentConfig = await configManager.getForChannelWithDefaults(input.channelSlug);
      
      // Apply all updates
      let updatedConfig: StorefrontConfig = { ...currentConfig };
      for (const [section, data] of Object.entries(input.updates)) {
        console.log(`[updateMultipleSections] Applying ${section}:`, JSON.stringify(data, null, 2));
        updatedConfig = {
          ...updatedConfig,
          [section]: data,
        };
      }
      
      // Validate and save
      try {
        const validated = StorefrontConfigSchema.parse(updatedConfig);
        await configManager.setForChannel(input.channelSlug, validated);
        console.log(`[updateMultipleSections] Successfully saved ${Object.keys(input.updates).length} sections`);
        return { success: true };
      } catch (error) {
        console.error(`[updateMultipleSections] Error:`, error);
        throw error;
      }
    }),

  /**
   * Reset configuration to defaults for a channel
   */
  resetConfig: protectedClientProcedure
    .input(z.object({ channelSlug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const settingsManager = createSettingsManager(ctx.apiClient, ctx.appId!);
      const configManager = new StorefrontConfigManager(settingsManager);
      
      const defaultConfig = getDefaultConfig(input.channelSlug);
      await configManager.setForChannel(input.channelSlug, defaultConfig);
      
      return { success: true };
    }),

  /**
   * Delete configuration for a channel (will use defaults)
   */
  deleteConfig: protectedClientProcedure
    .input(z.object({ channelSlug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const settingsManager = createSettingsManager(ctx.apiClient, ctx.appId!);
      const configManager = new StorefrontConfigManager(settingsManager);
      
      await configManager.deleteForChannel(input.channelSlug);
      
      return { success: true };
    }),

  /**
   * Export configuration for a channel with metadata
   */
  exportConfig: protectedClientProcedure
    .input(z.object({ channelSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const settingsManager = createSettingsManager(ctx.apiClient, ctx.appId!);
      const configManager = new StorefrontConfigManager(settingsManager);
      
      const config = await configManager.getForChannelWithDefaults(input.channelSlug);
      const exportFile = createExportFile(config, input.channelSlug);
      
      return exportFile;
    }),

  /**
   * Validate an import file without applying it
   * Returns validation result and diff against current config
   */
  validateImport: protectedClientProcedure
    .input(z.object({
      channelSlug: z.string(),
      importData: z.unknown(),
    }))
    .mutation(async ({ ctx, input }): Promise<{
      validation: ImportValidationResult;
      diff: ConfigDiffEntry[];
      currentConfig: StorefrontConfig;
    }> => {
      const settingsManager = createSettingsManager(ctx.apiClient, ctx.appId!);
      const configManager = new StorefrontConfigManager(settingsManager);
      
      // Get current config for diff
      const currentConfig = await configManager.getForChannelWithDefaults(input.channelSlug);
      
      // Validate the import data
      const validation = validateImportFile(input.importData);
      
      // Calculate diff if validation passed
      let diff: ConfigDiffEntry[] = [];
      if (validation.valid && validation.config) {
        diff = diffConfigs(currentConfig, validation.config);
      }
      
      return {
        validation,
        diff,
        currentConfig,
      };
    }),

  /**
   * Import configuration from a validated file
   * This applies the config after validation
   */
  importConfig: protectedClientProcedure
    .input(z.object({
      channelSlug: z.string(),
      importData: z.unknown(),
    }))
    .mutation(async ({ ctx, input }) => {
      const settingsManager = createSettingsManager(ctx.apiClient, ctx.appId!);
      const configManager = new StorefrontConfigManager(settingsManager);
      
      // Validate first
      const validation = validateImportFile(input.importData);
      
      if (!validation.valid || !validation.config) {
        return {
          success: false,
          errors: validation.errors,
        };
      }
      
      // Update the config with the target channel slug
      const configToSave: StorefrontConfig = {
        ...validation.config,
        channelSlug: input.channelSlug,
      };
      
      // Save the imported config
      await configManager.setForChannel(input.channelSlug, configToSave);
      
      return {
        success: true,
        errors: [],
      };
    }),

  /**
   * Get current schema version for import compatibility check
   */
  getSchemaVersion: protectedClientProcedure
    .query(() => {
      return { version: CURRENT_SCHEMA_VERSION };
    }),
});

export const appRouter = router({
  config: configRouter,
});

export type AppRouter = typeof appRouter;
