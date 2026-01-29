import { SettingsManager } from "@saleor/app-sdk/settings-manager";
import { EncryptedMetadataManagerFactory } from "@saleor/apps-shared/metadata-manager";
import { Client } from "urql";

import { StorefrontConfig, StorefrontConfigSchema } from "./schema";
import { getDefaultConfig } from "./defaults";

const KEY_PREFIX = "storefront-config-v1";

/**
 * Creates a SettingsManager for storing config in Saleor app metadata.
 * Uses encrypted metadata for security.
 */
export const createSettingsManager = (
  client: Pick<Client, "query" | "mutation">,
  appId: string
): SettingsManager => {
  const secretKey = process.env.SECRET_KEY || "dev-secret-key-change-in-production";
  const metadataManagerFactory = new EncryptedMetadataManagerFactory(secretKey);
  return metadataManagerFactory.create(client, appId);
};

/**
 * StorefrontConfigManager handles reading and writing storefront configuration
 * to Saleor app metadata, per channel.
 */
export class StorefrontConfigManager {
  constructor(private settingsManager: SettingsManager) {}

  /**
   * Get the metadata key for a specific channel
   */
  private getKey(channelSlug: string): string {
    return `${KEY_PREFIX}-${channelSlug}`;
  }

  /**
   * Get configuration for a specific channel.
   * Returns null if no config is stored.
   */
  async getForChannel(channelSlug: string): Promise<StorefrontConfig | null> {
    try {
      const key = this.getKey(channelSlug);
      console.log(`[StorefrontConfigManager] Getting config for key: ${key}`);
      
      const raw = await this.settingsManager.get(key);
      
      if (!raw) {
        console.log(`[StorefrontConfigManager] No stored config found for ${channelSlug}`);
        return null;
      }

      console.log(`[StorefrontConfigManager] Found raw config for ${channelSlug}, length: ${raw.length}`);
      
      const parsed = JSON.parse(raw);
      // Merge with defaults before validation so older stored configs (missing e.g. pages.forgotPassword,
      // content.account.forgotPasswordTitle, etc.) validate without logging errors every time.
      const defaults = getDefaultConfig(channelSlug);
      const merged = deepMerge(defaults, parsed as Partial<StorefrontConfig>) as StorefrontConfig;
      const validated = StorefrontConfigSchema.safeParse(merged);
      
      if (!validated.success) {
        // Only log when validation still fails after merge (e.g. wrong types, not just missing keys).
        const firstErrors = validated.error.errors.slice(0, 3).map((e) => `${e.path.join(".")}: ${e.message}`);
        console.warn(
          `[StorefrontConfigManager] Invalid config for ${channelSlug} after merging defaults (${validated.error.errors.length} error(s)):`,
          firstErrors.join("; ")
        );
        return null;
      }

      console.log(`[StorefrontConfigManager] Successfully loaded config for ${channelSlug}`);
      return validated.data;
    } catch (error) {
      console.error(`[StorefrontConfigManager] Error getting config for ${channelSlug}:`, error);
      return null;
    }
  }

  /**
   * Get configuration for a channel, with defaults merged in.
   * Always returns a valid config.
   */
  async getForChannelWithDefaults(channelSlug: string): Promise<StorefrontConfig> {
    const stored = await this.getForChannel(channelSlug);
    
    if (!stored) {
      console.log(`[StorefrontConfigManager] Using defaults for ${channelSlug}`);
      return getDefaultConfig(channelSlug);
    }

    // Merge stored config with defaults to fill any missing fields
    const defaults = getDefaultConfig(channelSlug);
    const merged = deepMerge(defaults, stored) as StorefrontConfig;
    console.log(`[StorefrontConfigManager] Merged stored config with defaults for ${channelSlug}`);
    return merged;
  }

  /**
   * Set configuration for a specific channel.
   * Automatically increments version and sets updatedAt timestamp.
   */
  async setForChannel(channelSlug: string, config: StorefrontConfig): Promise<void> {
    const key = this.getKey(channelSlug);
    
    console.log(`[StorefrontConfigManager] Saving config for key: ${key}`);
    
    // Get current config to increment version
    const current = await this.getForChannel(channelSlug);
    const currentVersion = current?.version ?? 0;
    const newVersion = currentVersion + 1;
    
    // Ensure updatedAt is set to current timestamp and version is incremented
    const configWithTimestamp: StorefrontConfig = {
      ...config,
      version: newVersion,
      updatedAt: new Date().toISOString(),
    };
    
    console.log(`[StorefrontConfigManager] Version: ${currentVersion} → ${newVersion}`);
    
    // Validate before saving
    const validated = StorefrontConfigSchema.parse(configWithTimestamp);
    const jsonValue = JSON.stringify(validated);
    
    console.log(`[StorefrontConfigManager] Config size: ${jsonValue.length} bytes`);
    
    try {
      await this.settingsManager.set({
        key,
        value: jsonValue,
      });
      console.log(`[StorefrontConfigManager] ✅ Successfully saved config for ${channelSlug} (version ${newVersion})`);
    } catch (error) {
      console.error(`[StorefrontConfigManager] Error saving config for ${channelSlug}:`, error);
      throw error; // Re-throw so caller knows it failed
    }
  }

  /**
   * Delete configuration for a specific channel.
   */
  async deleteForChannel(channelSlug: string): Promise<void> {
    const key = this.getKey(channelSlug);
    await this.settingsManager.delete(key);
  }

  /**
   * List all channels that have stored configuration.
   */
  async listConfiguredChannels(): Promise<string[]> {
    // Note: This requires fetching all metadata and filtering by prefix
    // The SettingsManager doesn't have a list method, so we'd need to
    // track this separately or use a different approach
    return [];
  }
}

/**
 * Deep merge utility for merging config objects.
 * Source values override target values.
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}
