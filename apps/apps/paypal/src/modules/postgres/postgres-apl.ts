import { APL, AuthData } from "@saleor/app-sdk/APL";
import { createLogger } from "@/lib/logger";
import { getPostgresClient } from "./postgres-client";

const logger = createLogger("PostgresAPL");

/**
 * PostgreSQL-based APL (Application Persistence Layer) implementation.
 * Stores authentication tokens in PostgreSQL instead of file.
 * Copied from Stripe app pattern for consistency.
 */
export class PostgresAPL implements APL {
  async get(saleorApiUrl: string): Promise<AuthData | undefined> {
    try {
      const sql = getPostgresClient();

      const result = await sql<Array<{
        saleor_api_url: string;
        app_id: string;
        token: string;
        jwks: string;
      }>>`
        SELECT saleor_api_url, app_id, token, jwks
        FROM auth_data
        WHERE saleor_api_url = ${saleorApiUrl}
        LIMIT 1
      `;

      if (result.length === 0) {
        logger.debug("Auth data not found", { saleorApiUrl });
        return undefined;
      }

      const row = result[0];
      return {
        saleorApiUrl: row.saleor_api_url,
        appId: row.app_id,
        token: row.token,
        jwks: row.jwks,
      };
    } catch (error) {
      logger.error("Failed to get auth data from PostgreSQL", {
        saleorApiUrl,
        cause: error,
      });
      throw error;
    }
  }

  async set(authData: AuthData): Promise<void> {
    try {
      const sql = getPostgresClient();

      await sql`
        INSERT INTO auth_data (saleor_api_url, app_id, token, jwks, updated_at)
        VALUES (${authData.saleorApiUrl}, ${authData.appId}, ${authData.token}, ${authData.jwks ?? null}, NOW())
        ON CONFLICT (saleor_api_url)
        DO UPDATE SET
          app_id = EXCLUDED.app_id,
          token = EXCLUDED.token,
          jwks = EXCLUDED.jwks,
          updated_at = NOW()
      `;

      logger.debug("Saved auth data to PostgreSQL", {
        saleorApiUrl: authData.saleorApiUrl,
        appId: authData.appId,
      });
    } catch (error) {
      logger.error("Failed to save auth data to PostgreSQL", {
        saleorApiUrl: authData.saleorApiUrl,
        appId: authData.appId,
        cause: error,
      });
      throw error;
    }
  }

  async delete(saleorApiUrl: string): Promise<void> {
    try {
      const sql = getPostgresClient();

      const result = await sql`
        DELETE FROM auth_data
        WHERE saleor_api_url = ${saleorApiUrl}
      `;

      logger.debug("Deleted auth data from PostgreSQL", {
        saleorApiUrl,
        rowsDeleted: result.count,
      });
    } catch (error) {
      logger.error("Failed to delete auth data from PostgreSQL", {
        saleorApiUrl,
        cause: error,
      });
      throw error;
    }
  }

  async getAll(): Promise<AuthData[]> {
    try {
      const sql = getPostgresClient();

      const result = await sql<Array<{
        saleor_api_url: string;
        app_id: string;
        token: string;
        jwks: string;
      }>>`
        SELECT saleor_api_url, app_id, token, jwks
        FROM auth_data
        ORDER BY updated_at DESC
      `;

      return result.map((row) => ({
        saleorApiUrl: row.saleor_api_url,
        appId: row.app_id,
        token: row.token,
        jwks: row.jwks,
      }));
    } catch (error) {
      logger.error("Failed to get all auth data from PostgreSQL", {
        cause: error,
      });
      throw error;
    }
  }
}
