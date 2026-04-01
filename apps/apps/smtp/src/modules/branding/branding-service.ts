import { createLogger } from "../../logger";

const logger = createLogger("BrandingService");

export interface BrandingConfig {
  companyName: string;
  companyEmail: string;
  companyWebsite?: string;
  companyTagline?: string;
  storefrontUrl?: string;
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

      // Resolve the storefront base URL for absolute paths
      const storefrontBaseUrl = process.env.STOREFRONT_URL
        || config.store.website
        || undefined;

      // Use email-specific logo (white variant for dark headers), fall back to regular logo
      let logoPath = config.branding.emailLogo || config.branding.logo || undefined;

      // If no email logo configured, try the -white variant of the regular logo
      if (!config.branding.emailLogo && logoPath) {
        const ext = logoPath.lastIndexOf(".");
        if (ext > 0) {
          const whitePath = `${logoPath.substring(0, ext)}-white${logoPath.substring(ext)}`;
          logoPath = whitePath;
          logger.debug("Using white logo variant for email", { logoPath });
        }
      }

      // Resolve logo to absolute URL (email clients can't handle relative paths)
      let logoUrl = logoPath;
      if (logoUrl && logoUrl.startsWith("/") && storefrontBaseUrl) {
        logoUrl = `${storefrontBaseUrl.replace(/\/$/, "")}${logoUrl}`;
        logger.debug("Resolved relative logo URL to absolute", { logoUrl });
      }

      // Extract branding from storefront-control config
      const branding: BrandingConfig = {
        companyName: config.store.name || "Your Store",
        companyEmail: config.store.email || "support@yourstore.com",
        companyWebsite: config.store.website || undefined,
        companyTagline: config.store.tagline || undefined,
        storefrontUrl: storefrontBaseUrl,
        primaryColor: config.branding.colors?.primary || "#2563EB",
        secondaryColor: config.branding.colors?.secondary || "#1F2937",
        logo: logoUrl,
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
      companyName: process.env.STORE_NAME || process.env.VITE_STORE_NAME || "My Store",
      companyEmail: process.env.STORE_EMAIL || process.env.CONTACT_EMAIL || process.env.DEFAULT_FROM_EMAIL || "support@example.com",
      companyWebsite: process.env.STOREFRONT_URL || undefined,
      companyTagline: process.env.STORE_TAGLINE || undefined,
      storefrontUrl: process.env.STOREFRONT_URL || undefined,
      primaryColor: process.env.STORE_PRIMARY_COLOR || "#1B2838",
      secondaryColor: process.env.STORE_SECONDARY_COLOR || "#C9A962",
      logo: process.env.STORE_LOGO_URL || undefined,
    };
  }
}
