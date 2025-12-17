import { Encryptor } from "@saleor/apps-shared/encryptor";
import { err, ok, Result } from "neverthrow";

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
import { getPostgresClient } from "@/modules/postgres/postgres-client";
import { SaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { createStripePublishableKey } from "@/modules/stripe/stripe-publishable-key";
import { createStripeRestrictedKey } from "@/modules/stripe/stripe-restricted-key";
import { createStripeWebhookSecret } from "@/modules/stripe/stripe-webhook-secret";

const logger = createLogger("PostgresAppConfigRepo");

interface StripeConfigRow {
  id: number;
  saleor_api_url: string;
  app_id: string;
  config_id: string;
  config_name: string;
  stripe_pk: string;
  stripe_rk: string;
  stripe_wh_secret: string;
  stripe_wh_id: string;
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

export class PostgresAppConfigRepo implements AppConfigRepo {
  private encryptor: Encryptor;

  constructor(encryptor?: Encryptor) {
    this.encryptor = encryptor || new Encryptor(env.SECRET_KEY);
  }

  async getRootConfig(
    access: BaseAccessPattern,
  ): Promise<Result<AppRootConfig, InstanceType<typeof BaseError>>> {
    try {
      const sql = getPostgresClient();
      const saleorApiUrlStr = access.saleorApiUrl.toString();

      logger.debug("Fetching root config from PostgreSQL", {
        saleorApiUrl: saleorApiUrlStr,
        appId: access.appId,
      });

      // Fetch all configs for this installation
      const configRows = await sql<StripeConfigRow[]>`
        SELECT * FROM stripe_configs
        WHERE saleor_api_url = ${saleorApiUrlStr}
          AND app_id = ${access.appId}
      `;

      // Fetch all channel mappings for this installation
      const mappingRows = await sql<ChannelMappingRow[]>`
        SELECT * FROM channel_config_mappings
        WHERE saleor_api_url = ${saleorApiUrlStr}
          AND app_id = ${access.appId}
      `;

      logger.debug("Fetched data from PostgreSQL", {
        configsCount: configRows.length,
        mappingsCount: mappingRows.length,
      });

      // Parse configs
      const configs: Record<string, StripeConfig> = {};
      for (const row of configRows) {
        try {
          const restrictedKey = this.encryptor.decrypt(row.stripe_rk);
          const webhookSecret = this.encryptor.decrypt(row.stripe_wh_secret);

          const publishableKeyResult = createStripePublishableKey(row.stripe_pk);
          const restrictedKeyResult = createStripeRestrictedKey(restrictedKey);
          const webhookSecretResult = createStripeWebhookSecret(webhookSecret);

          if (publishableKeyResult.isErr() || restrictedKeyResult.isErr() || webhookSecretResult.isErr()) {
            logger.error("Failed to create key objects from database data", {
              configId: row.config_id,
              publishableKeyError: publishableKeyResult.isErr() ? publishableKeyResult.error : undefined,
              restrictedKeyError: restrictedKeyResult.isErr() ? restrictedKeyResult.error : undefined,
              webhookSecretError: webhookSecretResult.isErr() ? webhookSecretResult.error : undefined,
            });
            continue;
          }

          const configResult = StripeConfig.create({
            name: row.config_name,
            id: row.config_id,
            publishableKey: publishableKeyResult.value,
            restrictedKey: restrictedKeyResult.value,
            webhookId: row.stripe_wh_id,
            webhookSecret: webhookSecretResult.value,
          });

          if (configResult.isOk()) {
            configs[row.config_id] = configResult.value;
          } else {
            logger.error("Failed to create StripeConfig from database data", {
              configId: row.config_id,
              error: configResult.error,
            });
          }
        } catch (error) {
          logger.error("Failed to decrypt config", { configId: row.config_id, cause: error });
          // Skip invalid configs
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
      logger.error("Failed to get Stripe config from PostgreSQL", { cause: error });
      return err(
        new AppConfigRepoError.FailureFetchingConfig("Failed to get config from PostgreSQL", {
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
      const sql = getPostgresClient();
      const saleorApiUrlStr = args.saleorApiUrl.toString();

      logger.debug("Saving Stripe config to PostgreSQL", {
        configId: args.config.id,
        saleorApiUrl: saleorApiUrlStr,
        appId: args.appId,
      });

      const encryptedRk = this.encryptor.encrypt(String(args.config.restrictedKey));
      const encryptedWhSecret = this.encryptor.encrypt(String(args.config.webhookSecret));

      await sql`
        INSERT INTO stripe_configs (
          saleor_api_url,
          app_id,
          config_id,
          config_name,
          stripe_pk,
          stripe_rk,
          stripe_wh_secret,
          stripe_wh_id
        ) VALUES (
          ${saleorApiUrlStr},
          ${args.appId},
          ${args.config.id},
          ${args.config.name},
          ${String(args.config.publishableKey)},
          ${encryptedRk},
          ${encryptedWhSecret},
          ${args.config.webhookId}
        )
        ON CONFLICT (saleor_api_url, app_id, config_id)
        DO UPDATE SET
          config_name = EXCLUDED.config_name,
          stripe_pk = EXCLUDED.stripe_pk,
          stripe_rk = EXCLUDED.stripe_rk,
          stripe_wh_secret = EXCLUDED.stripe_wh_secret,
          stripe_wh_id = EXCLUDED.stripe_wh_id,
          updated_at = NOW()
      `;

      logger.debug("Successfully saved Stripe config to PostgreSQL", {
        configId: args.config.id,
      });

      return ok(null);
    } catch (error) {
      logger.error("Failed to save Stripe config to PostgreSQL", { cause: error });
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
      const sql = getPostgresClient();
      const saleorApiUrlStr = access.saleorApiUrl.toString();

      logger.debug("Removing config from PostgreSQL", {
        configId: data.configId,
        saleorApiUrl: saleorApiUrlStr,
        appId: access.appId,
      });

      // Remove channel mappings first (foreign key constraint)
      await sql`
        DELETE FROM channel_config_mappings
        WHERE saleor_api_url = ${saleorApiUrlStr}
          AND app_id = ${access.appId}
          AND config_id = ${data.configId}
      `;

      // Remove config
      await sql`
        DELETE FROM stripe_configs
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
      const sql = getPostgresClient();
      const saleorApiUrlStr = access.saleorApiUrl.toString();

      logger.debug("Updating channel mapping in PostgreSQL", {
        channelId: data.channelId,
        configId: data.configId,
        saleorApiUrl: saleorApiUrlStr,
        appId: access.appId,
      });

      if (data.configId === null) {
        // Remove mapping
        await sql`
          DELETE FROM channel_config_mappings
          WHERE saleor_api_url = ${saleorApiUrlStr}
            AND app_id = ${access.appId}
            AND channel_id = ${data.channelId}
        `;
      } else {
        // Upsert mapping
        await sql`
          INSERT INTO channel_config_mappings (
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
