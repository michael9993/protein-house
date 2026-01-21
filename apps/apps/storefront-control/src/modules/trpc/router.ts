import { z } from "zod";

import { router } from "./trpc-server";
import { protectedClientProcedure } from "./protected-client-procedure";
import { StorefrontConfigManager, createSettingsManager } from "../config/config-manager";
import { StorefrontConfigSchema, StorefrontConfig } from "../config/schema";
import { getDefaultConfig } from "../config/defaults";
import {
  validateImportFile,
  diffConfigs,
  applySelectedConfigChanges,
  CURRENT_SCHEMA_VERSION,
  type ImportValidationResult,
  type ConfigDiffEntry,
} from "../config/import-schema";
import { createExportFile, updateSampleConfigFile } from "../config/export";

/**
 * Trigger webhook to storefront to invalidate cache when config changes.
 * This is fire-and-forget - failures are logged but don't block the save operation.
 */
async function triggerConfigWebhook(
  channelSlug: string,
  version: number | undefined,
  updatedAt: string | undefined
): Promise<void> {
  // Prioritize tunnel URL (for tunneling setups), then internal URL, then public URL
  // Tunnel URL is needed when storefront-control and storefront are accessed via tunnels
  const storefrontUrl =
    process.env.STOREFRONT_TUNNEL_URL ||
    process.env.STOREFRONT_INTERNAL_URL ||
    process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    "http://saleor-storefront:3000";

  const webhookUrl = `${storefrontUrl}/api/config/refresh`;

  console.log(`[webhook] 🔔 Triggering webhook for channel "${channelSlug}"`);
  console.log(`[webhook]    URL: ${webhookUrl}`);
  console.log(`[webhook]    Version: ${version ?? 'N/A'}, Updated: ${updatedAt || new Date().toISOString()}`);

  // Create timeout signal (compatible with older Node.js versions)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s for tunnel connections

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelSlug,
        version,
        updatedAt: updatedAt || new Date().toISOString(),
      }),
      // Don't wait too long - this is non-critical
      signal: controller.signal,
    });

    // Clear timeout if request completes
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[webhook] ❌ Storefront returned ${response.status} for channel ${channelSlug}: ${errorText}`);
    } else {
      const result = await response.json().catch(() => ({}));
      console.log(`[webhook] ✅ Successfully invalidated cache for channel "${channelSlug}"`);
      console.log(`[webhook]    Response:`, result);
    }
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);

    // Webhook failures are non-critical - config is already saved
    // But log them prominently so we can debug
    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
      console.error(`[webhook] ⏱️  Webhook timeout for channel "${channelSlug}" after 10s`);
      console.error(`[webhook]    URL: ${webhookUrl}`);
      console.error(`[webhook]    This might indicate the storefront URL is incorrect or unreachable`);
    } else if (error instanceof Error) {
      console.error(`[webhook] ❌ Failed to notify storefront for channel "${channelSlug}":`, error.message);
      console.error(`[webhook]    URL: ${webhookUrl}`);
      console.error(`[webhook]    Error type: ${error.name}`);
      if (error.stack) {
        console.error(`[webhook]    Stack: ${error.stack}`);
      }
    } else {
      console.error(`[webhook] ❌ Unknown error notifying storefront for channel "${channelSlug}"`);
    }
  }
}

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

      // Get the saved config to get the incremented version
      const savedConfig = await configManager.getForChannel(input.channelSlug);
      const finalVersion = savedConfig?.version ?? input.config.version;
      const finalUpdatedAt = savedConfig?.updatedAt ?? input.config.updatedAt;

      console.log(`[saveConfig] ✅ Successfully saved config for ${input.channelSlug} (version ${finalVersion})`);

      // Trigger webhook to storefront to invalidate cache (use the final version after increment)
      triggerConfigWebhook(input.channelSlug, finalVersion, finalUpdatedAt).catch(
        (err) => console.error("[saveConfig] Webhook failed:", err)
      );

      // Optionally update sample config file (if enabled in settings)
      const shouldUpdateSample = process.env.AUTO_UPDATE_SAMPLE_CONFIG === "true";
      if (shouldUpdateSample && savedConfig) {
        try {
          const result = updateSampleConfigFile(savedConfig, input.channelSlug);
          if (!result.success) {
            console.error("[saveConfig] Failed to update sample config:", result.error);
          }
        } catch (err) {
          console.error("[saveConfig] Error updating sample config:", err);
        }
      }

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

      // Validate and save (this will increment version automatically)
      try {
        const validated = StorefrontConfigSchema.parse(updatedConfig);
        await configManager.setForChannel(input.channelSlug, validated);

        // Get the saved config to get the incremented version
        const savedConfig = await configManager.getForChannel(input.channelSlug);
        const finalVersion = savedConfig?.version ?? validated.version;
        const finalUpdatedAt = savedConfig?.updatedAt ?? validated.updatedAt;

        console.log(`[updateSection] ✅ Successfully saved ${input.section} for ${input.channelSlug} (version ${finalVersion})`);

        // Trigger webhook to storefront to invalidate cache (use the final version after increment)
        triggerConfigWebhook(input.channelSlug, finalVersion, finalUpdatedAt).catch(
          (err) => console.error("[updateSection] Webhook failed:", err)
        );

        // Optionally update sample config file (if enabled in settings)
        // This can be controlled via an environment variable or config setting
        const shouldUpdateSample = process.env.AUTO_UPDATE_SAMPLE_CONFIG === "true";
        if (shouldUpdateSample) {
          try {
            const result = updateSampleConfigFile(savedConfig, input.channelSlug);
            if (!result.success) {
              console.error("[updateSection] Failed to update sample config:", result.error);
            }
          } catch (err) {
            console.error("[updateSection] Error updating sample config:", err);
          }
        }

        return { success: true };
      } catch (error) {
        console.error(`[updateSection] ❌ Error saving ${input.section} for ${input.channelSlug}:`, error);
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
        
        // Get the saved config to get the incremented version
        const savedConfig = await configManager.getForChannel(input.channelSlug);
        const finalVersion = savedConfig?.version ?? validated.version;
        const finalUpdatedAt = savedConfig?.updatedAt ?? validated.updatedAt;

        console.log(`[updateMultipleSections] ✅ Successfully saved ${Object.keys(input.updates).length} sections for ${input.channelSlug} (version ${finalVersion})`);

        // Trigger webhook to storefront to invalidate cache (use the final version after increment)
        triggerConfigWebhook(input.channelSlug, finalVersion, finalUpdatedAt).catch(
          (err) => console.error("[updateMultipleSections] Webhook failed:", err)
        );

        return { success: true };
      } catch (error) {
        console.error(`[updateMultipleSections] ❌ Error:`, error);
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

      // Get the saved config to get the incremented version
      const savedConfig = await configManager.getForChannel(input.channelSlug);
      const finalVersion = savedConfig?.version ?? defaultConfig.version;
      const finalUpdatedAt = savedConfig?.updatedAt ?? defaultConfig.updatedAt;

      console.log(`[resetConfig] ✅ Successfully reset config for ${input.channelSlug} (version ${finalVersion})`);

      // Trigger webhook to storefront to invalidate cache (use the final version after increment)
      triggerConfigWebhook(input.channelSlug, finalVersion, finalUpdatedAt).catch(
        (err) => console.error("[resetConfig] Webhook failed:", err)
      );

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

      // Trigger webhook to storefront to invalidate cache
      // After deletion, defaults will be used, but we still want to refresh
      const defaultConfig = getDefaultConfig(input.channelSlug);
      triggerConfigWebhook(input.channelSlug, defaultConfig.version, defaultConfig.updatedAt).catch(
        (err) => console.error("[deleteConfig] Webhook failed:", err)
      );

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
      acceptedPaths: z.array(z.string()).optional(),
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

      const currentConfig = await configManager.getForChannelWithDefaults(input.channelSlug);
      const diffs = diffConfigs(currentConfig, validation.config);
      const acceptedPaths = input.acceptedPaths ?? diffs.map((entry) => entry.path);

      const mergedConfig = applySelectedConfigChanges(
        currentConfig,
        validation.config,
        acceptedPaths
      );

      // Update the config with the target channel slug
      const configToSave: StorefrontConfig = {
        ...mergedConfig,
        channelSlug: input.channelSlug,
      };

      // Save the imported config
      await configManager.setForChannel(input.channelSlug, configToSave);

      // Get the saved config to get the incremented version
      const savedConfig = await configManager.getForChannel(input.channelSlug);
      const finalVersion = savedConfig?.version ?? configToSave.version;
      const finalUpdatedAt = savedConfig?.updatedAt ?? configToSave.updatedAt;

      console.log(`[importConfig] ✅ Successfully imported config for ${input.channelSlug} (version ${finalVersion})`);

      // Trigger webhook to storefront to invalidate cache (use the final version after increment)
      triggerConfigWebhook(input.channelSlug, finalVersion, finalUpdatedAt).catch(
        (err) => console.error("[importConfig] Webhook failed:", err)
      );

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

  /**
   * Update the sample config file with the current configuration
   * This does NOT modify the actual config, only the sample file
   * Therefore, it does NOT trigger a webhook (no config change)
   */
  updateSampleConfig: protectedClientProcedure
    .input(z.object({
      channelSlug: z.string(),
      updateOnSave: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const settingsManager = createSettingsManager(ctx.apiClient, ctx.appId!);
      const configManager = new StorefrontConfigManager(settingsManager);

      // Get current config
      const currentConfig = await configManager.getForChannelWithDefaults(input.channelSlug);

      // Update sample config file
      const result = updateSampleConfigFile(currentConfig, input.channelSlug);

      if (result.success) {
        console.log(`[updateSampleConfig] ✅ Successfully updated sample config file for ${input.channelSlug}`);
        return { 
          success: true, 
          message: `Sample config file updated successfully${result.filePath ? `: ${result.filePath}` : ''}` 
        };
      } else {
        console.error(`[updateSampleConfig] ❌ Failed to update sample config file for ${input.channelSlug}: ${result.error}`);
        throw new Error(result.error || "Failed to update sample config file");
      }
    }),
});

export const appRouter = router({
  config: configRouter,
});

export type AppRouter = typeof appRouter;
