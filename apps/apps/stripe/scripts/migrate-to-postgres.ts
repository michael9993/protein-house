#!/usr/bin/env tsx
/**
 * Migration script to migrate configs from File/DynamoDB to PostgreSQL
 * 
 * This script:
 * 1. Reads data from FileAppConfigRepo (if file-based) or DynamoDB (if available)
 * 2. Writes it to PostgreSQL
 * 
 * Usage:
 *   pnpm tsx scripts/migrate-to-postgres.ts
 */

import { DynamodbAppConfigRepo } from "@/modules/app-config/repositories/dynamodb/dynamodb-app-config-repo";
import { FileAppConfigRepo } from "@/modules/app-config/repositories/file/file-app-config-repo";
import { PostgresAppConfigRepo } from "@/modules/app-config/repositories/postgres/postgres-app-config-repo";
import { createLogger } from "@/lib/logger";
import { env } from "@/lib/env";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { readFileSync } from "fs";
import { join } from "path";

const logger = createLogger("MigrateToPostgres");

async function migrateConfigs() {
  const storageBackend = (env as { STORAGE_BACKEND?: string }).STORAGE_BACKEND ?? process.env.STORAGE_BACKEND;
  if (storageBackend !== "postgres") {
    logger.warn("STORAGE_BACKEND is not set to 'postgres'. Migration skipped.");
    return;
  }

  if (!env.DATABASE_URL) {
    logger.error("DATABASE_URL is required for PostgreSQL migration");
    process.exit(1);
  }

  logger.info("Starting migration to PostgreSQL");

  const sourceRepo = new FileAppConfigRepo();
  const targetRepo = new PostgresAppConfigRepo();

  try {
    // Read all configs from file
    logger.info("Reading configs from file...");
    const filePath = join(process.cwd(), ".saleor-app-config.json");
    
    let fileData: Record<string, unknown>;
    try {
      const data = readFileSync(filePath, "utf-8");
      fileData = JSON.parse(data) as Record<string, unknown>;
      logger.info(`Found ${Object.keys(fileData).length} storage keys in file`);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        logger.info("No file config found - nothing to migrate");
        return;
      }
      throw error;
    }
    
    // Migrate each storage key
    for (const [storageKey, configData] of Object.entries(fileData)) {
      const parts = storageKey.split(":");
      if (parts.length < 2) {
        logger.warn(`Skipping invalid storage key: ${storageKey}`);
        continue;
      }
      
      // Reconstruct saleorApiUrl (everything except last part)
      const appId = parts[parts.length - 1];
      const saleorApiUrlStr = parts.slice(0, -1).join(":");
      
      if (!saleorApiUrlStr || !appId) {
        logger.warn(`Skipping invalid storage key: ${storageKey}`);
        continue;
      }
      
      const saleorApiUrlResult = createSaleorApiUrl(saleorApiUrlStr);
      if (saleorApiUrlResult.isErr()) {
        logger.warn(`Invalid saleorApiUrl for key ${storageKey}`, { error: saleorApiUrlResult.error });
        continue;
      }
      const saleorApiUrl = saleorApiUrlResult.value as import("@/modules/saleor/saleor-api-url").SaleorApiUrl;

      logger.info(`Migrating storage key: ${storageKey}`);

      // Get root config to access all configs and mappings
      const rootConfigResult = await sourceRepo.getRootConfig({
        saleorApiUrl,
        appId,
      });
      
      if (rootConfigResult.isErr()) {
        logger.warn(`Failed to get root config for ${storageKey}`, {
          error: rootConfigResult.error,
        });
        continue;
      }
      
      const rootConfig = rootConfigResult.value;
      
      // Migrate each config
      for (const config of Object.values(rootConfig.stripeConfigsById)) {
        logger.info(`Migrating config ${config.id} (${config.name})...`);
        const saveResult = await targetRepo.saveStripeConfig({
          saleorApiUrl,
          appId,
          config,
        });
        
        if (saveResult.isErr()) {
          logger.error(`Failed to save config ${config.id}`, {
            error: saveResult.error,
          });
        } else {
          logger.info(`✅ Successfully migrated config ${config.id}`);
        }
      }
      
      // Migrate channel mappings
      for (const [channelId, configId] of Object.entries(rootConfig.chanelConfigMapping)) {
        logger.info(`Migrating channel mapping ${channelId} -> ${configId}...`);
        const mappingResult = await targetRepo.updateMapping(
          {
            saleorApiUrl,
            appId,
          },
          { channelId, configId }
        );
        
        if (mappingResult.isErr()) {
          logger.error(`Failed to update mapping ${channelId}`, {
            error: mappingResult.error,
          });
        } else {
          logger.info(`✅ Successfully migrated mapping ${channelId} -> ${configId}`);
        }
      }
    }
    
    logger.info("✅ Migration completed successfully");
  } catch (error) {
    logger.error("Migration failed", { cause: error });
    throw error;
  }
}

// Run if executed directly
migrateConfigs()
  .then(() => {
    logger.info("Migration completed");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Migration failed", { cause: error });
    process.exit(1);
  });
