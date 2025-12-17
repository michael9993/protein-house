import postgres from "postgres";
import { createLogger } from "@/lib/logger";
import { env } from "@/lib/env";

const logger = createLogger("PostgresClient");

let sql: ReturnType<typeof postgres> | null = null;

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
    max: 10, // Maximum number of connections
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout
    onnotice: () => {}, // Suppress notices
    transform: {
      undefined: null, // Transform undefined to null
    },
  });

  return sql;
}

export async function closePostgresClient(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
    logger.info("PostgreSQL connection closed");
  }
}
