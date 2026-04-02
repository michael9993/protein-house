import { APL, AuthData } from "@saleor/app-sdk/APL";
import { SaleorApp } from "@saleor/app-sdk/saleor-app";

import { PostgresAPL } from "@/modules/postgres/postgres-apl";

/* APL wrapper that handles URL fallback (localhost vs tunnel URL) */
class FallbackAPL implements APL {
  private baseApl: APL;

  constructor(baseApl: APL) {
    this.baseApl = baseApl;
  }

  async get(saleorApiUrl: string): Promise<AuthData | undefined> {
    let authData = await this.baseApl.get(saleorApiUrl);

    // If not found, try alternate URL patterns
    if (!authData) {
      // Get all stored auth data to find a match
      const allAuthData = await this.baseApl.getAll();

      // If URL is localhost, try to find any tunnel URL entry
      if (saleorApiUrl.includes("localhost:8000")) {
        const tunnelAuth = allAuthData.find((auth) =>
          auth.saleorApiUrl.includes("trycloudflare.com") ||
          auth.saleorApiUrl.includes("localhost:8000")
        );

        if (tunnelAuth) {
          // Use the found auth data but update the URL
          authData = {
            ...tunnelAuth,
            saleorApiUrl,
          };
          // Store it with the localhost URL for future lookups
          await this.baseApl.set(authData);
        }
      }
      // If URL is tunnel, try to find localhost entry
      else if (saleorApiUrl.includes("trycloudflare.com")) {
        const localhostAuth = allAuthData.find((auth) =>
          auth.saleorApiUrl.includes("localhost:8000")
        );

        if (localhostAuth) {
          // Use the found auth data but update the URL
          authData = {
            ...localhostAuth,
            saleorApiUrl,
          };
          // Store it with the tunnel URL for future lookups
          await this.baseApl.set(authData);
        }
      }
    }

    return authData;
  }

  async set(authData: AuthData): Promise<void> {
    await this.baseApl.set(authData);
  }

  async delete(saleorApiUrl: string): Promise<void> {
    await this.baseApl.delete(saleorApiUrl);
  }

  async getAll(): Promise<AuthData[]> {
    return this.baseApl.getAll();
  }
}

// Use PostgreSQL APL for all environments (dev and production)
const baseApl: APL = new PostgresAPL();

// Wrap with fallback APL to handle URL mismatches
export const apl = new FallbackAPL(baseApl);

export const saleorApp = new SaleorApp({
  apl,
});
