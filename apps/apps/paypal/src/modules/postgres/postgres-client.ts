import postgres from "postgres";
import { createLogger } from "@/lib/logger";
import { env } from "@/lib/env";

const logger = createLogger("PostgresClient");

let sql: ReturnType<typeof postgres> | null = null;
let schemaInitialized = false;

export function getPostgresClient(): ReturnType<typeof postgres> {
  if (sql) {
    return sql;
  }

  const connectionString = env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required for PostgreSQL");
  }

  logger.info("Initializing PostgreSQL connection", {
    connectionString: connectionString.replace(/:[^:@]+@/, ":****@"), // Hide password
  });

  sql = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
    transform: {
      undefined: null,
    },
  });

  // Auto-create auth_data table on first connection (fire-and-forget)
  if (!schemaInitialized) {
    schemaInitialized = true;
    sql`
      CREATE TABLE IF NOT EXISTS auth_data (
        saleor_api_url TEXT PRIMARY KEY,
        app_id TEXT NOT NULL,
        token TEXT NOT NULL,
        jwks TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `.then(() => {
      logger.info("PostgreSQL schema initialized (auth_data table)");
    }).catch((error) => {
      logger.error("Failed to initialize PostgreSQL schema", { cause: error });
      schemaInitialized = false; // Allow retry
    });
  }

  return sql;
}

export async function closePostgresClient(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
    logger.info("PostgreSQL connection closed");
  }
}
