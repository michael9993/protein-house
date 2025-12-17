#!/usr/bin/env tsx
/**
 * Setup script to create PostgreSQL schema
 * 
 * Usage:
 *   pnpm tsx scripts/setup-postgres.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { getPostgresClient } from "@/modules/postgres/postgres-client";
import { createLogger } from "@/lib/logger";
import { env } from "@/lib/env";

const logger = createLogger("SetupPostgres");

async function setupPostgres() {
  if (!env.DATABASE_URL) {
    logger.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  logger.info("Setting up PostgreSQL schema...");

  try {
    const sql = getPostgresClient();
    
    // Read and execute migration file
    const migrationPath = join(process.cwd(), "src/modules/postgres/migrations/001_initial_schema.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");
    
    // Execute migration (postgres.js supports multi-statement queries)
    await sql.unsafe(migrationSQL);
    
    logger.info("PostgreSQL schema created successfully");
    
    await sql.end();
  } catch (error) {
    logger.error("Failed to setup PostgreSQL schema", { cause: error });
    process.exit(1);
  }
}

// Run if executed directly
setupPostgres()
  .then(() => {
    logger.info("Setup completed");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Setup failed", { cause: error });
    process.exit(1);
  });
