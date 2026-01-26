import { decrypt } from "@saleor/app-sdk/settings-manager";
import { gql } from "urql";

import { createLogger } from "../../../logger";
import type { Client } from "urql";

const logger = createLogger("SmtpConfigFetcher");

/**
 * SMTP Configuration schema matching the SMTP app's structure
 */
export interface SmtpConfiguration {
  id: string;
  active: boolean;
  name: string;
  senderName?: string;
  senderEmail?: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser?: string;
  smtpPassword?: string;
  encryption: "NONE" | "TLS" | "SSL";
  channels: {
    mode: "restrictive" | "allow";
    channels: string[];
    override: boolean;
  };
}

interface SmtpConfig {
  configurations: SmtpConfiguration[];
}

/**
 * GraphQL query to find the SMTP app by identifier
 */
const FIND_SMTP_APP_QUERY = gql`
  query FindSmtpApp {
    apps(first: 10, filter: { search: "smtp" }) {
      edges {
        node {
          id
          name
          identifier
          privateMetadata {
            key
            value
          }
        }
      }
    }
  }
`;

/**
 * Fetch SMTP configuration from the SMTP app's metadata
 */
export async function fetchSmtpConfigurationFromApp(
  apiClient: Client,
  saleorApiUrl: string,
  configurationId?: string,
): Promise<SmtpConfiguration | null> {
  logger.info("Fetching SMTP configuration from SMTP app", { configurationId, saleorApiUrl });

  try {
    // Find the SMTP app
    const result = await apiClient
      .query<{
        apps: {
          edges: Array<{
            node: {
              id: string;
              name: string;
              identifier: string | null;
              privateMetadata: Array<{ key: string; value: string }>;
            };
          }>;
        };
      }>(FIND_SMTP_APP_QUERY, {})
      .toPromise();

    if (result.error) {
      logger.error("Error querying for SMTP app", { error: result.error });
      return null;
    }

    // Find the SMTP app (by identifier or name)
    const smtpApp = result.data?.apps.edges.find(
      (edge) =>
        edge.node.identifier === "saleor.app.smtp" ||
        edge.node.name.toLowerCase().includes("smtp"),
    )?.node;

    if (!smtpApp) {
      logger.warn("SMTP app not found in Saleor instance");
      return null;
    }

    logger.debug("Found SMTP app", { appId: smtpApp.id, appName: smtpApp.name });

    // Log all metadata keys for debugging
    logger.debug("SMTP app metadata keys", {
      keys: smtpApp.privateMetadata.map((m) => m.key),
      count: smtpApp.privateMetadata.length,
    });

    // The SMTP app stores metadata with the Saleor API URL as a suffix
    // Format: "smtp-config__{saleorApiUrl}"
    // We need to normalize the URL to match (remove trailing slash, ensure consistency)
    const normalizedSaleorApiUrl = saleorApiUrl.endsWith("/")
      ? saleorApiUrl.slice(0, -1)
      : saleorApiUrl;

    // Try to find the metadata key with the domain suffix
    const smtpConfigMetadataKey = `smtp-config__${normalizedSaleorApiUrl}`;
    let smtpConfigMetadata = smtpApp.privateMetadata.find(
      (meta) => meta.key === smtpConfigMetadataKey,
    );

    // Fallback: try with trailing slash
    if (!smtpConfigMetadata) {
      const smtpConfigMetadataKeyWithSlash = `smtp-config__${normalizedSaleorApiUrl}/`;
      smtpConfigMetadata = smtpApp.privateMetadata.find(
        (meta) => meta.key === smtpConfigMetadataKeyWithSlash,
      );
    }

    // Fallback: try to find any key that starts with "smtp-config"
    if (!smtpConfigMetadata) {
      smtpConfigMetadata = smtpApp.privateMetadata.find((meta) =>
        meta.key.startsWith("smtp-config"),
      );
      if (smtpConfigMetadata) {
        logger.info("Found SMTP config using fallback key matching", {
          foundKey: smtpConfigMetadata.key,
        });
      }
    }

    if (!smtpConfigMetadata) {
      logger.warn("SMTP configuration not found in app metadata", {
        availableKeys: smtpApp.privateMetadata.map((m) => m.key),
        searchedKey: smtpConfigMetadataKey,
        message:
          "The SMTP app may not be configured yet. Please configure at least one SMTP configuration in the SMTP app.",
      });
      return null;
    }

    // Decrypt the metadata value (SMTP app uses EncryptedMetadataManager)
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      logger.error("SECRET_KEY environment variable not set. Cannot decrypt SMTP configuration.");
      return null;
    }

    let decryptedValue: string;
    let smtpConfig: SmtpConfig;
    
    // Try decryption first
    try {
      decryptedValue = decrypt(smtpConfigMetadata.value, secretKey);
      smtpConfig = JSON.parse(decryptedValue);
    } catch (decryptError) {
      // Decryption failed - this is expected if Newsletter app has different SECRET_KEY than SMTP app
      // Try parsing as plain JSON (in case it's not encrypted)
      try {
        smtpConfig = JSON.parse(smtpConfigMetadata.value);
        logger.debug("SMTP config was not encrypted, parsed as plain JSON");
      } catch (parseError) {
        // Neither decryption nor plain JSON worked
        // This is expected in development when apps have different SECRET_KEYs
        logger.debug("Cannot read SMTP app configuration - SECRET_KEY mismatch with SMTP app", {
          hint: "This is expected in development. Using environment variables as fallback.",
        });
        return null;
      }
    }

    if (!smtpConfig.configurations || smtpConfig.configurations.length === 0) {
      logger.warn("No SMTP configurations found");
      return null;
    }

    // If a specific configuration ID is provided, find it
    if (configurationId) {
      const config = smtpConfig.configurations.find((c) => c.id === configurationId);
      if (config && config.active) {
        logger.info("Found SMTP configuration by ID", { configurationId, name: config.name });
        return config;
      }
      logger.warn("SMTP configuration not found or inactive", { configurationId });
    }

    // Otherwise, find the first active configuration
    const activeConfig = smtpConfig.configurations.find((c) => c.active);

    if (!activeConfig) {
      logger.warn("No active SMTP configuration found");
      return null;
    }

    logger.info("Found active SMTP configuration", {
      id: activeConfig.id,
      name: activeConfig.name,
    });

    return activeConfig;
  } catch (error) {
    logger.error("Failed to fetch SMTP configuration", { error });
    return null;
  }
}

/**
 * Convert SMTP app configuration to email sender format
 */
export function convertSmtpConfigToEmailSenderFormat(
  config: SmtpConfiguration,
): {
  host: string;
  port: number;
  encryption: "TLS" | "SSL" | "NONE";
  user?: string;
  password?: string;
  fromEmail: string;
  fromName?: string;
} {
  return {
    host: config.smtpHost,
    port: parseInt(config.smtpPort, 10),
    encryption: config.encryption,
    user: config.smtpUser,
    password: config.smtpPassword,
    fromEmail: config.senderEmail || "noreply@example.com",
    fromName: config.senderName,
  };
}
