import { Encryptor } from "@saleor/apps-shared/encryptor";
import { err, ok, Result } from "neverthrow";
import * as fs from "fs/promises";
import * as path from "path";

import { env } from "@/lib/env";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { AppRootConfig } from "@/modules/app-config/domain/app-root-config";
import { PayPalConfig } from "@/modules/app-config/domain/paypal-config";
import {
  AppConfigRepo,
  AppConfigRepoError,
  BaseAccessPattern,
  GetPayPalConfigAccessPattern,
} from "@/modules/app-config/repositories/app-config-repo";
import { SaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { createPayPalClientId } from "@/modules/paypal/paypal-client-id";
import { createPayPalClientSecret } from "@/modules/paypal/paypal-client-secret";

const logger = createLogger("FileAppConfigRepo");

interface FileConfigData {
  configs: Record<string, FilePayPalConfig>;
  mappings: Record<string, string>;
}

interface FilePayPalConfig {
  configId: string;
  clientId: string;
  clientSecret: string; // encrypted
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
      return JSON.parse(data) as Record<string, FileConfigData>;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return {};
      }
      logger.error("Failed to read config file", { cause: error });
      throw error;
    }
  }

  private async writeConfigFile(data: Record<string, FileConfigData>): Promise<void> {
    await fs.writeFile(this.storagePath, JSON.stringify(data, null, 2), "utf-8");
  }

  private findDataForAccess(
    allData: Record<string, FileConfigData>,
    storageKey: string,
    access: BaseAccessPattern,
  ): FileConfigData {
    let data = allData[storageKey];

    if (!data) {
      const saleorApiUrlStr = access.saleorApiUrl.toString();
      const matchingKey = Object.keys(allData).find((key) =>
        key.startsWith(saleorApiUrlStr + ":"),
      );
      if (matchingKey) data = allData[matchingKey];
    }

    if (!data) {
      const matchingKey = Object.keys(allData).find((key) =>
        key.endsWith(":" + access.appId),
      );
      if (matchingKey) data = allData[matchingKey];
    }

    if (!data && Object.keys(allData).length === 1) {
      data = allData[Object.keys(allData)[0]];
    }

    return data || { configs: {}, mappings: {} };
  }

  async getRootConfig(
    access: BaseAccessPattern,
  ): Promise<Result<AppRootConfig, InstanceType<typeof BaseError>>> {
    try {
      const storageKey = this.getStorageKey(access.saleorApiUrl, access.appId);
      const allData = await this.readConfigFile();
      const data = this.findDataForAccess(allData, storageKey, access);

      const configs: Record<string, PayPalConfig> = {};
      for (const [configId, fileConfig] of Object.entries(data.configs)) {
        try {
          const decryptedSecret = this.encryptor.decrypt(fileConfig.clientSecret);
          const clientIdResult = createPayPalClientId(fileConfig.clientId);
          const clientSecretResult = createPayPalClientSecret(decryptedSecret);

          if (clientIdResult.isErr() || clientSecretResult.isErr()) {
            logger.error("Failed to create PayPal config from file data", { configId });
            continue;
          }

          const configResult = PayPalConfig.create({
            name: fileConfig.label,
            id: fileConfig.configId,
            clientId: clientIdResult.value,
            clientSecret: clientSecretResult.value,
          });

          if (configResult.isOk()) {
            configs[configId] = configResult.value;
          }
        } catch (error) {
          logger.error("Failed to decrypt config", { configId, cause: error });
        }
      }

      return ok(new AppRootConfig(data.mappings, configs));
    } catch (error) {
      return err(
        new AppConfigRepoError.FailureFetchingConfig("Failed to fetch config from file", {
          cause: error,
        }),
      );
    }
  }

  async getPayPalConfig(
    access: GetPayPalConfigAccessPattern,
  ): Promise<
    Result<PayPalConfig | null, InstanceType<typeof AppConfigRepoError.FailureFetchingConfig>>
  > {
    try {
      const rootConfigResult = await this.getRootConfig(access);
      if (rootConfigResult.isErr()) return err(rootConfigResult.error);

      const rootConfig = rootConfigResult.value;

      if ("channelId" in access) {
        const configId = rootConfig.channelConfigMapping[access.channelId];
        if (!configId) return ok(null);
        return ok(rootConfig.paypalConfigsById[configId] || null);
      }

      if ("configId" in access) {
        return ok(rootConfig.paypalConfigsById[access.configId] || null);
      }

      return ok(null);
    } catch (error) {
      return err(
        new AppConfigRepoError.FailureFetchingConfig("Failed to get PayPal config", {
          cause: error,
        }),
      );
    }
  }

  async savePayPalConfig(args: {
    config: PayPalConfig;
    saleorApiUrl: SaleorApiUrl;
    appId: string;
  }): Promise<Result<null | void, InstanceType<typeof AppConfigRepoError.FailureSavingConfig>>> {
    try {
      const storageKey = this.getStorageKey(args.saleorApiUrl, args.appId);
      const allData = await this.readConfigFile();
      const data = allData[storageKey] || { configs: {}, mappings: {} };

      data.configs[args.config.id] = {
        configId: args.config.id,
        clientId: String(args.config.clientId),
        clientSecret: this.encryptor.encrypt(String(args.config.clientSecret)),
        label: args.config.name,
      };

      allData[storageKey] = data;
      await this.writeConfigFile(allData);
      return ok(null);
    } catch (error) {
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

      delete fileData.configs[data.configId];

      for (const [channelId, configId] of Object.entries(fileData.mappings)) {
        if (configId === data.configId) {
          delete fileData.mappings[channelId];
        }
      }

      allData[storageKey] = fileData;
      await this.writeConfigFile(allData);
      return ok(null);
    } catch (error) {
      return err(
        new AppConfigRepoError.FailureRemovingConfig("Failed to remove config", {
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
      return err(
        new AppConfigRepoError.FailureSavingConfig("Failed to update mapping", {
          cause: error,
        }),
      );
    }
  }
}
