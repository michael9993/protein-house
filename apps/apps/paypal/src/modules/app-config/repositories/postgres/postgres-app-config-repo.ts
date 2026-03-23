import { Encryptor } from "@saleor/apps-shared/encryptor";
import { err, ok, Result } from "neverthrow";

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
import { getPostgresClient } from "@/modules/postgres/postgres-client";
import { SaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { createPayPalClientId } from "@/modules/paypal/paypal-client-id";
import { createPayPalClientSecret } from "@/modules/paypal/paypal-client-secret";

const logger = createLogger("PostgresAppConfigRepo");

interface PayPalConfigRow {
  id: number;
  saleor_api_url: string;
  app_id: string;
  config_id: string;
  config_name: string;
  client_id: string;
  client_secret: string;
  environment: string;
  webhook_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ChannelMappingRow {
  id: number;
  saleor_api_url: string;
  app_id: string;
  channel_id: string;
  config_id: string | null;
  created_at: Date;
  updated_at: Date;
}

let tablesInitialized = false;

async function ensureTables(): Promise<void> {
  if (tablesInitialized) return;

  const sql = getPostgresClient();

  await sql`
    CREATE TABLE IF NOT EXISTS paypal_configs (
      id SERIAL PRIMARY KEY,
      saleor_api_url TEXT NOT NULL,
      app_id TEXT NOT NULL,
      config_id TEXT NOT NULL,
      config_name TEXT NOT NULL,
      client_id TEXT NOT NULL,
      client_secret TEXT NOT NULL,
      environment TEXT NOT NULL DEFAULT 'SANDBOX',
      webhook_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(saleor_api_url, app_id, config_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS paypal_channel_mappings (
      id SERIAL PRIMARY KEY,
      saleor_api_url TEXT NOT NULL,
      app_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      config_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(saleor_api_url, app_id, channel_id)
    )
  `;

  tablesInitialized = true;
  logger.info("PostgreSQL tables initialized (paypal_configs, paypal_channel_mappings)");
}

export class PostgresAppConfigRepo implements AppConfigRepo {
  private encryptor: Encryptor;

  constructor(encryptor?: Encryptor) {
    this.encryptor = encryptor || new Encryptor(env.SECRET_KEY);
  }

  async getRootConfig(
    access: BaseAccessPattern,
  ): Promise<Result<AppRootConfig, InstanceType<typeof BaseError>>> {
    try {
      await ensureTables();
      const sql = getPostgresClient();
      const saleorApiUrlStr = access.saleorApiUrl.toString();

      logger.debug("Fetching root config from PostgreSQL", {
        saleorApiUrl: saleorApiUrlStr,
        appId: access.appId,
      });

      const configRows = await sql<PayPalConfigRow[]>`
        SELECT * FROM paypal_configs
        WHERE saleor_api_url = ${saleorApiUrlStr}
          AND app_id = ${access.appId}
      `;

      const mappingRows = await sql<ChannelMappingRow[]>`
        SELECT * FROM paypal_channel_mappings
        WHERE saleor_api_url = ${saleorApiUrlStr}
          AND app_id = ${access.appId}
      `;

      logger.debug("Fetched data from PostgreSQL", {
        configsCount: configRows.length,
        mappingsCount: mappingRows.length,
      });

      // Parse configs
      const configs: Record<string, PayPalConfig> = {};
      for (const row of configRows) {
        try {
          const decryptedSecret = this.encryptor.decrypt(row.client_secret);

          const clientIdResult = createPayPalClientId(row.client_id);
          const clientSecretResult = createPayPalClientSecret(decryptedSecret);

          if (clientIdResult.isErr() || clientSecretResult.isErr()) {
            logger.error("Failed to create PayPal key objects from database data", {
              configId: row.config_id,
              clientIdError: clientIdResult.isErr() ? clientIdResult.error : undefined,
              clientSecretError: clientSecretResult.isErr() ? clientSecretResult.error : undefined,
            });
            continue;
          }

          const configResult = PayPalConfig.create({
            name: row.config_name,
            id: row.config_id,
            clientId: clientIdResult.value,
            clientSecret: clientSecretResult.value,
            environment: (row.environment as "SANDBOX" | "LIVE") ?? "SANDBOX",
            webhookId: row.webhook_id ?? undefined,
          });

          if (configResult.isOk()) {
            configs[row.config_id] = configResult.value;
          } else {
            logger.error("Failed to create PayPalConfig from database data", {
              configId: row.config_id,
              error: configResult.error,
            });
          }
        } catch (error) {
          logger.error("Failed to decrypt config", { configId: row.config_id, cause: error });
        }
      }

      // Parse mappings
      const mappings: Record<string, string> = {};
      for (const row of mappingRows) {
        if (row.config_id) {
          mappings[row.channel_id] = row.config_id;
        }
      }

      const rootConfig = new AppRootConfig(mappings, configs);

      logger.debug("Created root config from PostgreSQL", {
        configsCount: Object.keys(configs).length,
        mappingsCount: Object.keys(mappings).length,
      });

      return ok(rootConfig);
    } catch (error) {
      logger.error("Failed to fetch RootConfig from PostgreSQL", { cause: error });
      return err(
        new AppConfigRepoError.FailureFetchingConfig("Failed to fetch config from PostgreSQL", {
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
      if (rootConfigResult.isErr()) {
        return err(rootConfigResult.error);
      }

      const rootConfig = rootConfigResult.value;

      if ("channelId" in access) {
        const configId = rootConfig.channelConfigMapping[access.channelId];
        if (!configId) {
          return ok(null);
        }
        return ok(rootConfig.paypalConfigsById[configId] || null);
      }

      if ("configId" in access) {
        return ok(rootConfig.paypalConfigsById[access.configId] || null);
      }

      return ok(null);
    } catch (error) {
      logger.error("Failed to get PayPal config from PostgreSQL", { cause: error });
      return err(
        new AppConfigRepoError.FailureFetchingConfig("Failed to get config from PostgreSQL", {
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
      await ensureTables();
      const sql = getPostgresClient();
      const saleorApiUrlStr = args.saleorApiUrl.toString();

      logger.debug("Saving PayPal config to PostgreSQL", {
        configId: args.config.id,
        saleorApiUrl: saleorApiUrlStr,
        appId: args.appId,
      });

      const encryptedSecret = this.encryptor.encrypt(String(args.config.clientSecret));

      await sql`
        INSERT INTO paypal_configs (
          saleor_api_url,
          app_id,
          config_id,
          config_name,
          client_id,
          client_secret,
          environment,
          webhook_id
        ) VALUES (
          ${saleorApiUrlStr},
          ${args.appId},
          ${args.config.id},
          ${args.config.name},
          ${String(args.config.clientId)},
          ${encryptedSecret},
          ${args.config.environment},
          ${args.config.webhookId ?? null}
        )
        ON CONFLICT (saleor_api_url, app_id, config_id)
        DO UPDATE SET
          config_name = EXCLUDED.config_name,
          client_id = EXCLUDED.client_id,
          client_secret = EXCLUDED.client_secret,
          environment = EXCLUDED.environment,
          webhook_id = EXCLUDED.webhook_id,
          updated_at = NOW()
      `;

      logger.debug("Successfully saved PayPal config to PostgreSQL", {
        configId: args.config.id,
      });

      return ok(null);
    } catch (error) {
      logger.error("Failed to save PayPal config to PostgreSQL", { cause: error });
      return err(
        new AppConfigRepoError.FailureSavingConfig("Failed to save config to PostgreSQL", {
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
      await ensureTables();
      const sql = getPostgresClient();
      const saleorApiUrlStr = access.saleorApiUrl.toString();

      logger.debug("Removing config from PostgreSQL", {
        configId: data.configId,
        saleorApiUrl: saleorApiUrlStr,
        appId: access.appId,
      });

      // Remove channel mappings first
      await sql`
        DELETE FROM paypal_channel_mappings
        WHERE saleor_api_url = ${saleorApiUrlStr}
          AND app_id = ${access.appId}
          AND config_id = ${data.configId}
      `;

      // Remove config
      await sql`
        DELETE FROM paypal_configs
        WHERE saleor_api_url = ${saleorApiUrlStr}
          AND app_id = ${access.appId}
          AND config_id = ${data.configId}
      `;

      logger.debug("Successfully removed config from PostgreSQL", {
        configId: data.configId,
      });

      return ok(null);
    } catch (error) {
      logger.error("Failed to remove config from PostgreSQL", { cause: error });
      return err(
        new AppConfigRepoError.FailureRemovingConfig("Failed to remove config from PostgreSQL", {
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
      await ensureTables();
      const sql = getPostgresClient();
      const saleorApiUrlStr = access.saleorApiUrl.toString();

      logger.debug("Updating channel mapping in PostgreSQL", {
        channelId: data.channelId,
        configId: data.configId,
        saleorApiUrl: saleorApiUrlStr,
        appId: access.appId,
      });

      if (data.configId === null) {
        await sql`
          DELETE FROM paypal_channel_mappings
          WHERE saleor_api_url = ${saleorApiUrlStr}
            AND app_id = ${access.appId}
            AND channel_id = ${data.channelId}
        `;
      } else {
        await sql`
          INSERT INTO paypal_channel_mappings (
            saleor_api_url,
            app_id,
            channel_id,
            config_id
          ) VALUES (
            ${saleorApiUrlStr},
            ${access.appId},
            ${data.channelId},
            ${data.configId}
          )
          ON CONFLICT (saleor_api_url, app_id, channel_id)
          DO UPDATE SET
            config_id = EXCLUDED.config_id,
            updated_at = NOW()
        `;
      }

      logger.debug("Successfully updated channel mapping in PostgreSQL", {
        channelId: data.channelId,
        configId: data.configId,
      });

      return ok(null);
    } catch (error) {
      logger.error("Failed to update mapping in PostgreSQL", { cause: error });
      return err(
        new AppConfigRepoError.FailureSavingConfig("Failed to update mapping in PostgreSQL", {
          cause: error,
        }),
      );
    }
  }
}
