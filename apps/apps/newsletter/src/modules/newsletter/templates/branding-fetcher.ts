import { createLogger } from "../../../logger";

const logger = createLogger("BrandingFetcher");

/**
 * Storefront branding configuration
 */
export interface StoreBranding {
  store: {
    name: string;
    tagline: string;
    email: string;
    phone: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  branding: {
    logo: string;
    logoAlt: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
      textMuted: string;
    };
    typography: {
      fontHeading: string;
      fontBody: string;
    };
  };
}

/**
 * Default branding when storefront control is not available
 */
export const DEFAULT_BRANDING: StoreBranding = {
  store: {
    name: "Your Store",
    tagline: "Quality products for everyone",
    email: "support@yourstore.com",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  },
  branding: {
    logo: "https://placehold.co/180x44/2563EB/FFFFFF?text=YOUR+LOGO",
    logoAlt: "Store Logo",
    colors: {
      primary: "#2563EB",
      secondary: "#1F2937",
      accent: "#E0A55A",
      background: "#FFFFFF",
      text: "#111827",
      textMuted: "#6B7280",
    },
    typography: {
      fontHeading: "Inter",
      fontBody: "Inter",
    },
  },
};

/**
 * Fetch branding from storefront control app
 * @param saleorApiUrl - The Saleor API URL
 * @param channelSlug - The channel slug to get branding for
 */
export async function fetchStoreBranding(
  saleorApiUrl: string,
  channelSlug: string
): Promise<StoreBranding> {
  try {
    // Determine the storefront control app URL using established env var patterns
    // Priority: internal Docker URL > explicit URL > tunnel URL > default
    // In Docker, use the internal service name for direct container-to-container communication
    const storefrontControlUrl = 
      process.env.STOREFRONT_CONTROL_APP_INTERNAL_URL ||  // Docker internal: http://saleor-storefront-control-app:3000
      process.env.STOREFRONT_CONTROL_URL || 
      process.env.STOREFRONT_CONTROL_APP_TUNNEL_URL ||    // Tunnel URL for external access
      process.env.STOREFRONT_CONTROL_APP_URL ||           // Public URL
      (process.env.NODE_ENV === "development" 
        ? "http://localhost:3004" 
        : null);

    // Log which URL source is being used for debugging
    const urlSource = 
      process.env.STOREFRONT_CONTROL_APP_INTERNAL_URL ? "INTERNAL_URL (Docker)" :
      process.env.STOREFRONT_CONTROL_URL ? "STOREFRONT_CONTROL_URL" :
      process.env.STOREFRONT_CONTROL_APP_TUNNEL_URL ? "TUNNEL_URL" :
      process.env.STOREFRONT_CONTROL_APP_URL ? "APP_URL" :
      "default localhost:3004";

    if (!storefrontControlUrl) {
      logger.debug("Storefront control URL not configured, using defaults");
      return DEFAULT_BRANDING;
    }

    const configUrl = `${storefrontControlUrl}/api/config/${channelSlug}?saleorApiUrl=${encodeURIComponent(saleorApiUrl)}`;
    
    logger.debug("Fetching storefront config", { configUrl, channelSlug, urlSource });

    // Add timeout to avoid hanging if storefront control is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(configUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-saleor-api-url": saleorApiUrl,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.debug("Storefront control returned non-OK status, using defaults", { 
          status: response.status, 
          channelSlug 
        });
        return DEFAULT_BRANDING;
      }

      const data = await response.json();
      const config = data.config;

      if (!config) {
        logger.debug("No config in response, using defaults");
        return DEFAULT_BRANDING;
      }

      logger.info("Successfully fetched storefront branding", { 
        storeName: config.store?.name,
        channelSlug 
      });

      return {
        store: {
          name: config.store?.name || DEFAULT_BRANDING.store.name,
          tagline: config.store?.tagline || DEFAULT_BRANDING.store.tagline,
          email: config.store?.email || DEFAULT_BRANDING.store.email,
          phone: config.store?.phone || DEFAULT_BRANDING.store.phone,
          address: config.store?.address || DEFAULT_BRANDING.store.address,
        },
        branding: {
          logo: config.branding?.logo || DEFAULT_BRANDING.branding.logo,
          logoAlt: config.branding?.logoAlt || DEFAULT_BRANDING.branding.logoAlt,
          colors: {
            primary: config.branding?.colors?.primary || DEFAULT_BRANDING.branding.colors.primary,
            secondary: config.branding?.colors?.secondary || DEFAULT_BRANDING.branding.colors.secondary,
            accent: config.branding?.colors?.accent || DEFAULT_BRANDING.branding.colors.accent,
            background: config.branding?.colors?.background || DEFAULT_BRANDING.branding.colors.background,
            text: config.branding?.colors?.text || DEFAULT_BRANDING.branding.colors.text,
            textMuted: config.branding?.colors?.textMuted || DEFAULT_BRANDING.branding.colors.textMuted,
          },
          typography: {
            fontHeading: config.branding?.typography?.fontHeading || DEFAULT_BRANDING.branding.typography.fontHeading,
            fontBody: config.branding?.typography?.fontBody || DEFAULT_BRANDING.branding.typography.fontBody,
          },
        },
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Check if it's a connection error or timeout - these are expected when storefront control isn't running
      const isConnectionError = 
        fetchError?.cause?.code === 'ECONNREFUSED' || 
        fetchError?.name === 'AbortError' ||
        fetchError?.message?.includes('ECONNREFUSED');
      
      if (isConnectionError) {
        logger.debug("Storefront control not available, using default branding", { channelSlug });
      } else {
        logger.warn("Error fetching storefront branding", { 
          error: fetchError?.message || fetchError, 
          channelSlug 
        });
      }
      return DEFAULT_BRANDING;
    }
  } catch (error) {
    // Catch any unexpected errors
    logger.debug("Unexpected error in fetchStoreBranding, using defaults", { channelSlug });
    return DEFAULT_BRANDING;
  }
}
