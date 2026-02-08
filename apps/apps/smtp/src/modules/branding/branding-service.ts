import { createLogger } from "../../logger";

const logger = createLogger("BrandingService");

export interface BrandingConfig {
  companyName: string;
  companyEmail: string;
  companyWebsite?: string;
  primaryColor: string;
  secondaryColor?: string;
  logo?: string;
}

/**
 * Service to fetch branding information from storefront-control app.
 * Falls back to defaults if storefront-control is not available.
 */
export class BrandingService {
  /**
   * Get the storefront-control app URL from environment or construct from Saleor URL
   */
  private static getStorefrontControlUrl(saleorApiUrl?: string): string | null {
    // Check if storefront-control URL is explicitly set
    const explicitUrl = process.env.STOREFRONT_CONTROL_URL || process.env.STOREFRONT_CONTROL_APP_INTERNAL_URL;

    if (explicitUrl) {
      return explicitUrl;
    }

    // In Docker, try internal service name
    if (process.env.NODE_ENV !== "production" || process.env.DOCKER_ENV) {
      const dockerInternalUrl = "http://saleor-storefront-control-app:3000";

      logger.debug("Using Docker internal URL for storefront-control", { url: dockerInternalUrl });

      return dockerInternalUrl;
    }

    // Try to construct from Saleor URL (assuming same domain/port pattern)
    if (saleorApiUrl) {
      try {
        const url = new URL(saleorApiUrl);
        /*
         * Replace 'saleor-api' with 'storefront-control' or use same domain.
         * This is a heuristic - adjust based on your deployment.
         */
        const baseUrl = `${url.protocol}//${url.host}`;
        // Try common patterns
        const possibleUrls = [
          `${baseUrl.replace(/\/api\/graphql\/?$/, "")}/storefront-control`,
          `${baseUrl.replace(/\/graphql\/?$/, "")}/storefront-control`,
          `${baseUrl.replace(/:\d+/, ":3000")}/storefront-control`,
          `${baseUrl}/storefront-control`,
        ];

        return possibleUrls[0]; // Return first guess
      } catch (e) {
        logger.warn("Failed to construct storefront-control URL from Saleor URL", { error: e });
      }
    }

    return null;
  }

  /**
   * Fetch branding configuration from storefront-control for a specific channel
   */
  static async fetchBranding(
    channelSlug: string,
    saleorApiUrl?: string,
  ): Promise<BrandingConfig> {
    const storefrontControlUrl = this.getStorefrontControlUrl(saleorApiUrl);

    if (!storefrontControlUrl) {
      logger.info("Storefront-control URL not available, using default branding", {
        channelSlug,
      });

      return this.getDefaultBranding();
    }

    try {
      const configUrl = `${storefrontControlUrl}/api/config/${channelSlug}?saleorApiUrl=${encodeURIComponent(saleorApiUrl || "")}`;

      logger.debug("Fetching branding from storefront-control", {
        url: configUrl,
        channelSlug,
      });

      const response = await fetch(configUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        logger.warn("Failed to fetch branding from storefront-control", {
          status: response.status,
          statusText: response.statusText,
          channelSlug,
        });

        return this.getDefaultBranding();
      }

      const data = await response.json();

      const config = data.config;

      if (!config || !config.store || !config.branding) {
        logger.warn("Invalid branding config structure from storefront-control", {
          channelSlug,
        });

        return this.getDefaultBranding();
      }

      // Extract branding from storefront-control config
      const branding: BrandingConfig = {
        companyName: config.store.name || "Your Store",
        companyEmail: config.store.email || "support@yourstore.com",
        companyWebsite: config.store.website || undefined,
        primaryColor: config.branding.colors?.primary || "#2563EB",
        secondaryColor: config.branding.colors?.secondary || "#1F2937",
        logo: config.branding.logo || undefined,
      };

      logger.info("Successfully fetched branding from storefront-control", {
        channelSlug,
        companyName: branding.companyName,
        primaryColor: branding.primaryColor,
      });

      return branding;
    } catch (error) {
      logger.warn("Error fetching branding from storefront-control, using defaults", {
        error: error instanceof Error ? error.message : String(error),
        channelSlug,
      });

      return this.getDefaultBranding();
    }
  }

  /**
   * Get default branding configuration
   */
  static getDefaultBranding(): BrandingConfig {
    return {
      companyName: "Mansour Shoes",
      companyEmail: "support@mansourshoes.com",
      companyWebsite: "https://www.mansourshoes.com",
      primaryColor: "#3b3d3f",
      secondaryColor: "#0A0707",
      logo: "https://media.easy.co.il/images/UserThumbs/10035528_1752326685636_0.jpg",
    };
  }
}
