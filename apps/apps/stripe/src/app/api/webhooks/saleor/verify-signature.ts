import { verifySignatureWithJwks } from "@saleor/app-sdk/auth";
import { SALEOR_API_URL_HEADER } from "@saleor/app-sdk/headers";
import { createLogger } from "@/lib/logger";

const logger = createLogger("verifyWebhookSignature");

/**
 * Get the actual Saleor API URL, preferring tunnel URL over localhost
 */
function getActualSaleorApiUrl(saleorApiUrlFromHeader: string | null): string {
  // Check environment variable first (tunnel URL)
  const envSaleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
  
  // If we have a tunnel URL in env and header is localhost, use tunnel URL
  if (envSaleorApiUrl && saleorApiUrlFromHeader && saleorApiUrlFromHeader.includes("localhost:8000")) {
    // Normalize the env URL
    if (!envSaleorApiUrl.endsWith("/graphql/")) {
      if (envSaleorApiUrl.endsWith("/graphql")) {
        return envSaleorApiUrl + "/";
      }
      if (envSaleorApiUrl.endsWith("/")) {
        return envSaleorApiUrl + "graphql/";
      }
      return envSaleorApiUrl + "/graphql/";
    }
    return envSaleorApiUrl;
  }
  
  // Otherwise use the header URL
  return saleorApiUrlFromHeader || "";
}

/**
 * Custom webhook signature verification that uses local Saleor instance JWKS
 * instead of fetching from remote cloud services.
 * 
 * This is necessary for self-hosted Saleor instances where JWKS should be
 * fetched from the local Saleor instance's /.well-known/jwks.json endpoint.
 * 
 * The SDK's verifySignatureWithJwks may try to fetch JWKS from a remote URL.
 * This wrapper intercepts URL-based JWKS and fetches from the local Saleor instance instead.
 */
export async function verifyWebhookSignature(
  jwks: string,
  signature: string,
  rawBody: string,
): Promise<void> {
  logger.info("verifyWebhookSignature called", {
    jwksType: typeof jwks,
    jwksLength: typeof jwks === "string" ? jwks.length : 0,
    jwksPreview: typeof jwks === "string" ? (jwks.length > 200 ? jwks.substring(0, 200) + "..." : jwks) : "not a string",
    signatureLength: signature.length,
    rawBodyLength: rawBody.length,
  });

  try {
    // Always fetch fresh JWKS from Saleor instance to ensure we have the correct keys
    // This is critical when using tunnels or when Saleor instance changes
    let saleorBaseUrl: string;
    const envSaleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
    
    // Determine which Saleor instance to fetch JWKS from
    if (envSaleorApiUrl) {
      // Use tunnel URL from environment (preferred for tunnel setups)
      saleorBaseUrl = envSaleorApiUrl.replace(/\/graphql\/?$/, "");
      logger.info("Using tunnel URL from environment for JWKS fetch", {
        tunnelBaseUrl: saleorBaseUrl,
        envSaleorApiUrl,
      });
    } else if (typeof jwks === "string" && (jwks.startsWith("http://") || jwks.startsWith("https://"))) {
      // Extract from JWKS URL if it's a URL
      const jwksUrl = new URL(jwks);
      saleorBaseUrl = `${jwksUrl.protocol}//${jwksUrl.host}`;
      logger.info("Extracting Saleor base URL from JWKS URL", {
        saleorBaseUrl,
        jwksUrl: jwks,
      });
    } else {
      // Fallback: try to extract from stored JWKS or use localhost
      // If JWKS is JSON, we need to fetch from the actual Saleor instance
      // For tunnel setups, we should have NEXT_PUBLIC_SALEOR_API_URL set
      saleorBaseUrl = "http://localhost:8000";
      logger.warn("No tunnel URL in environment and JWKS is not a URL, using localhost fallback", {
        saleorBaseUrl,
        jwksType: typeof jwks,
      });
    }
    
    // Always fetch fresh JWKS from Saleor instance
    const jwksEndpoint = `${saleorBaseUrl}/.well-known/jwks.json`;
    logger.info("Fetching fresh JWKS from Saleor instance", { jwksEndpoint });
    
    try {
      const response = await fetch(jwksEndpoint, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch JWKS from ${jwksEndpoint}: ${response.status} ${response.statusText}`);
      }
      
      const jwksJson = await response.json();
      
      // Validate JWKS structure
      if (!jwksJson || typeof jwksJson !== "object" || !Array.isArray(jwksJson.keys)) {
        throw new Error("Invalid JWKS structure: missing 'keys' array");
      }
      
      if (jwksJson.keys.length === 0) {
        throw new Error("JWKS keys array is empty");
      }
      
      // Use fresh JWKS from Saleor instance
      jwks = JSON.stringify(jwksJson);
      logger.info("Successfully fetched fresh JWKS from Saleor instance", {
        keysCount: jwksJson.keys.length,
        jwksLength: jwks.length,
        fetchedFrom: jwksEndpoint,
      });
    } catch (fetchError) {
      logger.error("Failed to fetch fresh JWKS from Saleor instance", {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        errorStack: fetchError instanceof Error ? fetchError.stack : undefined,
        jwksEndpoint,
      });
      
      // If fetch fails and we have stored JWKS as JSON, try using it as fallback
      if (typeof jwks === "string" && jwks.trim().length > 0 && !jwks.startsWith("http://") && !jwks.startsWith("https://")) {
        try {
          const parsed = JSON.parse(jwks);
          if (parsed && typeof parsed === "object" && Array.isArray(parsed.keys) && parsed.keys.length > 0) {
            logger.warn("Using stored JWKS as fallback after fetch failure", {
              keysCount: parsed.keys.length,
            });
            // Continue with stored JWKS
          } else {
            throw fetchError; // Re-throw if stored JWKS is invalid
          }
        } catch (parseError) {
          throw fetchError; // Re-throw original fetch error if stored JWKS is invalid
        }
      } else {
        throw fetchError; // Re-throw if no stored JWKS to fall back to
      }
    }
    
    // Use SDK's verifySignatureWithJwks with the (potentially updated) JWKS
    logger.debug("Calling SDK's verifySignatureWithJwks", {
      jwksLength: jwks.length,
      jwksIsUrl: jwks.startsWith("http://") || jwks.startsWith("https://"),
    });
    
    try {
      await verifySignatureWithJwks(jwks, signature, rawBody);
      logger.info("Signature verification succeeded");
    } catch (sdkError) {
      logger.error("SDK signature verification failed", {
        error: sdkError instanceof Error ? sdkError.message : String(sdkError),
        errorStack: sdkError instanceof Error ? sdkError.stack : undefined,
        errorName: sdkError instanceof Error ? sdkError.name : undefined,
      });
      throw sdkError;
    }
  } catch (error) {
    logger.error("Webhook signature verification error", {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : undefined,
      jwksType: typeof jwks,
      jwksPreview: typeof jwks === "string" ? (jwks.length > 200 ? jwks.substring(0, 200) + "..." : jwks) : "not a string",
    });
    throw error;
  }
}
