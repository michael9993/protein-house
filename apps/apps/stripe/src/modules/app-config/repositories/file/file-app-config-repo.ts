import { Encryptor } from "@saleor/apps-shared/encryptor";
import { err, ok, Result } from "neverthrow";
import * as fs from "fs/promises";
import * as path from "path";

import { env } from "@/lib/env";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { AppRootConfig } from "@/modules/app-config/domain/app-root-config";
import { StripeConfig } from "@/modules/app-config/domain/stripe-config";
import {
  AppConfigRepo,
  AppConfigRepoError,
  BaseAccessPattern,
  GetStripeConfigAccessPattern,
} from "@/modules/app-config/repositories/app-config-repo";
import { SaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { createStripePublishableKey } from "@/modules/stripe/stripe-publishable-key";
import { createStripeRestrictedKey } from "@/modules/stripe/stripe-restricted-key";
import { createStripeWebhookSecret } from "@/modules/stripe/stripe-webhook-secret";

const logger = createLogger("FileAppConfigRepo");

interface FileConfigData {
  configs: Record<string, FileStripeConfig>;
  mappings: Record<string, string>; // channelId -> configId
}

interface FileStripeConfig {
  configId: string;
  publishableKey: string;
  restrictedKey: string; // encrypted
  webhookId: string;
  webhookSecret: string; // encrypted
  label: string;
}

export class FileAppConfigRepo implements AppConfigRepo {
  private encryptor: Encryptor;
  private storagePath: string;

  constructor(encryptor?: Encryptor, storagePath?: string) {
    this.encryptor = encryptor || new Encryptor(env.SECRET_KEY);
    this.storagePath = storagePath || path.join(process.cwd(), ".saleor-app-config.json");
  }

  private getStorageKey(saleorApiUrl: SaleorApiUrl, appId: string): string {
    return `${saleorApiUrl.toString()}:${appId}`;
  }

  private async readConfigFile(): Promise<Record<string, FileConfigData>> {
    try {
      const data = await fs.readFile(this.storagePath, "utf-8");
      const parsed: Record<string, FileConfigData> = JSON.parse(data) as Record<string, FileConfigData>;
      logger.warn("Successfully read config file", {
        storagePath: this.storagePath,
        storageKeys: Object.keys(parsed),
        fileSize: data.length,
      });
      return parsed;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File doesn't exist yet, return empty object
        logger.warn("Config file does not exist", {
          storagePath: this.storagePath,
          message: "File will be created when first config is saved",
        });
        return {};
      }
      logger.error("Failed to read config file", { cause: error, storagePath: this.storagePath });
      throw error;
    }
  }

  private async writeConfigFile(data: Record<string, FileConfigData>): Promise<void> {
    try {
      await fs.writeFile(this.storagePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
      logger.error("Failed to write config file", { cause: error });
      throw error;
    }
  }

  async getRootConfig(
    access: BaseAccessPattern,
  ): Promise<Result<AppRootConfig, InstanceType<typeof BaseError>>> {
    try {
      const storageKey = this.getStorageKey(access.saleorApiUrl, access.appId);
      logger.warn("Reading root config from file", {
        storagePath: this.storagePath,
        storageKey,
        appId: access.appId,
        saleorApiUrl: access.saleorApiUrl.toString(),
      });
      
      const allData = await this.readConfigFile();
      
      logger.warn("File data loaded", {
        storageKeys: Object.keys(allData),
        storageKeysDetailed: Object.keys(allData).map(key => ({
          key,
          keyLength: key.length,
          keyParts: key.split(':'),
        })),
        lookingForStorageKey: storageKey,
        lookingForStorageKeyLength: storageKey.length,
        hasDataForStorageKey: !!allData[storageKey],
        dataForStorageKey: allData[storageKey] ? {
          configsCount: Object.keys(allData[storageKey].configs || {}).length,
          mappingsCount: Object.keys(allData[storageKey].mappings || {}).length,
          configIds: Object.keys(allData[storageKey].configs || {}),
          mappings: allData[storageKey].mappings,
        } : null,
        // Show first few characters of each key for comparison
        storageKeysPreview: Object.keys(allData).map(key => key.substring(0, 100)),
      });
      
      // Try exact match first
      let data = allData[storageKey];
      
      // Fallback 1: If exact match not found, try to find any storage key with same saleorApiUrl
      if (!data) {
        const saleorApiUrlStr = access.saleorApiUrl.toString();
        logger.warn("Exact storage key not found, trying fallback by saleorApiUrl", {
          saleorApiUrl: saleorApiUrlStr,
          availableStorageKeys: Object.keys(allData),
        });
        
        // Find any storage key that starts with the same saleorApiUrl
        const matchingKey = Object.keys(allData).find(key => key.startsWith(saleorApiUrlStr + ':'));
        
        if (matchingKey) {
          logger.warn("Found matching storage key by saleorApiUrl", {
            foundKey: matchingKey,
            expectedKey: storageKey,
            appIdMismatch: true,
          });
          data = allData[matchingKey];
        }
      }
      
      // Fallback 2: If still not found, try to find any storage key with same appId
      // This handles cases where saleorApiUrl differs (e.g., localhost vs tunnel URL)
      if (!data) {
        logger.warn("No match by saleorApiUrl, trying fallback by appId", {
          appId: access.appId,
          availableStorageKeys: Object.keys(allData),
        });
        
        // Find any storage key that ends with the same appId
        // Storage key format is: "saleorApiUrl:appId"
        const matchingKey = Object.keys(allData).find(key => key.endsWith(':' + access.appId));
        
        if (matchingKey) {
          logger.warn("Found matching storage key by appId", {
            foundKey: matchingKey,
            expectedKey: storageKey,
            saleorApiUrlMismatch: true,
            note: "Using config despite saleorApiUrl mismatch (localhost vs tunnel URL)",
          });
          data = allData[matchingKey];
        } else {
          logger.warn("No storage key found matching appId", {
            appId: access.appId,
            availableKeys: Object.keys(allData),
            availableAppIds: Object.keys(allData).map(k => {
              const parts = k.split(':');
              return parts[parts.length - 1]; // Get last part after last colon
            }),
          });
        }
      }
      
      // Fallback 3: If still not found and there's only one storage key, use it
      // This is a last resort for local development where there's typically one config
      if (!data && Object.keys(allData).length === 1) {
        const singleKey = Object.keys(allData)[0];
        logger.warn("Using single available storage key as last resort", {
          foundKey: singleKey,
          expectedKey: storageKey,
          note: "Only one config exists, using it despite key mismatch",
        });
        data = allData[singleKey];
      }
      
      // Final fallback: empty data
      data = data || { configs: {}, mappings: {} };

      const configs: Record<string, StripeConfig> = {};
      for (const [configId, fileConfig] of Object.entries(data.configs)) {
        try {
          const restrictedKey = this.encryptor.decrypt(fileConfig.restrictedKey);
          const webhookSecret = this.encryptor.decrypt(fileConfig.webhookSecret);

          const publishableKeyResult = createStripePublishableKey(fileConfig.publishableKey);
          const restrictedKeyResult = createStripeRestrictedKey(restrictedKey);
          const webhookSecretResult = createStripeWebhookSecret(webhookSecret);

          if (publishableKeyResult.isErr() || restrictedKeyResult.isErr() || webhookSecretResult.isErr()) {
            logger.error("Failed to create key objects from file data", {
              configId,
              publishableKeyError: publishableKeyResult.isErr() ? publishableKeyResult.error : undefined,
              restrictedKeyError: restrictedKeyResult.isErr() ? restrictedKeyResult.error : undefined,
              webhookSecretError: webhookSecretResult.isErr() ? webhookSecretResult.error : undefined,
            });
            continue;
          }

          const configResult = StripeConfig.create({
            name: fileConfig.label,
            id: fileConfig.configId,
            publishableKey: publishableKeyResult.value,
            restrictedKey: restrictedKeyResult.value,
            webhookId: fileConfig.webhookId,
            webhookSecret: webhookSecretResult.value,
          });

          if (configResult.isOk()) {
            configs[configId] = configResult.value;
          } else {
            logger.error("Failed to create StripeConfig from file data", {
              configId,
              error: configResult.error,
            });
          }
        } catch (error) {
          logger.error("Failed to decrypt config", { configId, cause: error });
          // Skip invalid configs
        }
      }

      const rootConfig = new AppRootConfig(data.mappings, configs);
      
      logger.warn("Created root config from file", {
        configsCount: Object.keys(configs).length,
        mappingsCount: Object.keys(data.mappings).length,
        configIds: Object.keys(configs),
        mappings: data.mappings,
      });
      
      return ok(rootConfig);
    } catch (error) {
      logger.error("Failed to fetch RootConfig from file", { cause: error });
      return err(
        new AppConfigRepoError.FailureFetchingConfig("Failed to fetch config from file", {
          cause: error,
        }),
      );
    }
  }

  async getStripeConfig(
    access: GetStripeConfigAccessPattern,
  ): Promise<Result<StripeConfig | null, InstanceType<typeof AppConfigRepoError.FailureFetchingConfig>>> {
    try {
      const rootConfigResult = await this.getRootConfig(access);
      if (rootConfigResult.isErr()) {
        return err(rootConfigResult.error);
      }

      const rootConfig = rootConfigResult.value;

      if ("channelId" in access) {
        const configId = rootConfig.chanelConfigMapping[access.channelId];
        if (!configId) {
          return ok(null);
        }
        const config = rootConfig.stripeConfigsById[configId];
        return ok(config || null);
      }

      if ("configId" in access) {
        const config = rootConfig.stripeConfigsById[access.configId];
        return ok(config || null);
      }

      return ok(null);
    } catch (error) {
      logger.error("Failed to get Stripe config from file", { cause: error });
      return err(
        new AppConfigRepoError.FailureFetchingConfig("Failed to get config from file", {
          cause: error,
        }),
      );
    }
  }

  async saveStripeConfig(args: {
    config: StripeConfig;
    saleorApiUrl: SaleorApiUrl;
    appId: string;
  }): Promise<Result<null | void, InstanceType<typeof AppConfigRepoError.FailureSavingConfig>>> {
    try {
      const storageKey = this.getStorageKey(args.saleorApiUrl, args.appId);
      const allData = await this.readConfigFile();
      const data = allData[storageKey] || { configs: {}, mappings: {} };

      data.configs[args.config.id] = {
        configId: args.config.id,
        publishableKey: String(args.config.publishableKey),
        restrictedKey: this.encryptor.encrypt(String(args.config.restrictedKey)),
        webhookId: args.config.webhookId,
        webhookSecret: this.encryptor.encrypt(String(args.config.webhookSecret)),
        label: args.config.name,
      };

      allData[storageKey] = data;
      await this.writeConfigFile(allData);

      return ok(null);
    } catch (error) {
      logger.error("Failed to save Stripe config to file", { cause: error });
      return err(
        new AppConfigRepoError.FailureSavingConfig("Failed to save config to file", {
          cause: error,
        }),
      );
    }
  }

  async removeConfig(
    access: BaseAccessPattern,
    data: { configId: string },
  ): Promise<Result<null, InstanceType<typeof AppConfigRepoError.FailureRemovingConfig>>> {
    try {
      const storageKey = this.getStorageKey(access.saleorApiUrl, access.appId);
      const allData = await this.readConfigFile();
      const fileData = allData[storageKey] || { configs: {}, mappings: {} };

      // Remove config
      delete fileData.configs[data.configId];

      // Remove mappings that reference this config
      for (const [channelId, configId] of Object.entries(fileData.mappings)) {
        if (configId === data.configId) {
          delete fileData.mappings[channelId];
        }
      }

      allData[storageKey] = fileData;
      await this.writeConfigFile(allData);

      return ok(null);
    } catch (error) {
      logger.error("Failed to remove config from file", { cause: error });
      return err(
        new AppConfigRepoError.FailureRemovingConfig("Failed to remove config from file", {
          cause: error,
        }),
      );
    }
  }

  async updateMapping(
    access: BaseAccessPattern,
    data: { configId: string | null; channelId: string },
  ): Promise<Result<void | null, InstanceType<typeof AppConfigRepoError.FailureSavingConfig>>> {
    try {
      const storageKey = this.getStorageKey(access.saleorApiUrl, access.appId);
      const allData = await this.readConfigFile();
      const fileData = allData[storageKey] || { configs: {}, mappings: {} };

      if (data.configId === null) {
        delete fileData.mappings[data.channelId];
      } else {
        fileData.mappings[data.channelId] = data.configId;
      }

      allData[storageKey] = fileData;
      await this.writeConfigFile(allData);

      return ok(null);
    } catch (error) {
      logger.error("Failed to update mapping in file", { cause: error });
      return err(
        new AppConfigRepoError.FailureSavingConfig("Failed to update mapping in file", {
          cause: error,
        }),
      );
    }
  }
}
