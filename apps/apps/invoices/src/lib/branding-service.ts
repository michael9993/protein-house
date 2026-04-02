import { createLogger } from "../logger";

const logger = createLogger("InvoiceBrandingService");

export interface InvoiceBranding {
  companyName: string;
  companyEmail: string;
  companyTagline: string;
  companyWebsite: string;
  companyPhone: string;
  companyAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  primaryColor: string;
  secondaryColor: string;
  logo: string;
}

const getDefaultBranding = (): InvoiceBranding => ({
  companyName: process.env.STORE_NAME || "Pawzen",
  companyEmail: process.env.STORE_EMAIL || "support@pawzenpets.shop",
  companyTagline: process.env.STORE_TAGLINE || "",
  companyWebsite: process.env.STOREFRONT_URL || "",
  companyPhone: "",
  companyAddress: null,
  primaryColor: process.env.STORE_PRIMARY_COLOR || "#1B2838",
  secondaryColor: process.env.STORE_SECONDARY_COLOR || "#C9A962",
  logo: process.env.STORE_LOGO_URL || "",
});

/**
 * Fetch branding from Storefront Control app for invoice generation.
 * Falls back to env-var-driven defaults if unavailable.
 */
export async function fetchInvoiceBranding(
  saleorApiUrl: string,
  channelSlug: string,
): Promise<InvoiceBranding> {
  const storefrontControlUrl =
    process.env.STOREFRONT_CONTROL_APP_INTERNAL_URL ||
    process.env.STOREFRONT_CONTROL_URL ||
    (process.env.NODE_ENV !== "production" ? "http://aura-storefront-control-app:3000" : null);

  if (!storefrontControlUrl) {
    logger.debug("Storefront control URL not configured, using defaults");
    return getDefaultBranding();
  }

  try {
    const configUrl = `${storefrontControlUrl}/api/config/${channelSlug}?saleorApiUrl=${encodeURIComponent(saleorApiUrl)}`;

    logger.debug("Fetching branding for invoice", { configUrl, channelSlug });

    const response = await fetch(configUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      logger.warn("Storefront control returned non-OK status", { status: response.status });
      return getDefaultBranding();
    }

    const data = await response.json();
    const config = data.config;

    if (!config?.store || !config?.branding) {
      logger.warn("Invalid config structure from storefront-control");
      return getDefaultBranding();
    }

    logger.info("Successfully fetched invoice branding", {
      storeName: config.store.name,
      channelSlug,
    });

    // Resolve logo to absolute URL (email clients / PDFs can't handle relative paths)
    const storefrontBaseUrl = process.env.STOREFRONT_URL || "";
    let logoUrl = config.branding.logo || "";
    if (logoUrl.startsWith("/") && storefrontBaseUrl) {
      logoUrl = `${storefrontBaseUrl.replace(/\/$/, "")}${logoUrl}`;
    }

    return {
      companyName: config.store.name || getDefaultBranding().companyName,
      companyEmail: config.store.email || getDefaultBranding().companyEmail,
      companyTagline: config.store.tagline || "",
      companyWebsite: storefrontBaseUrl,
      companyPhone: config.store.phone || "",
      companyAddress: config.store.address || null,
      primaryColor: config.branding.colors?.primary || getDefaultBranding().primaryColor,
      secondaryColor: config.branding.colors?.secondary || getDefaultBranding().secondaryColor,
      logo: logoUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isConnectionError = message.includes("ECONNREFUSED") || message.includes("AbortError");

    if (isConnectionError) {
      logger.debug("Storefront control not available, using default branding");
    } else {
      logger.warn("Error fetching invoice branding", { error: message });
    }

    return getDefaultBranding();
  }
}
