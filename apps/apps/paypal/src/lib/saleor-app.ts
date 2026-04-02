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

    // If not found, try alternate URL patterns.
    // In dev, the Site domain (e.g., pawzen.co) may differ from the tunnel URL
    // (e.g., api.pawzenpets.shop) or localhost. Use any stored auth data as fallback
    // since there's typically only one Saleor instance per app.
    if (!authData) {
      const allAuthData = await this.baseApl.getAll();

      if (allAuthData.length > 0) {
        // Use the most recently stored auth data
        const fallback = allAuthData[0];
        authData = { ...fallback, saleorApiUrl };
        // Cache it for future lookups with this URL
        await this.baseApl.set(authData);
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

export const saleorApp = new SaleorApp({ apl });
