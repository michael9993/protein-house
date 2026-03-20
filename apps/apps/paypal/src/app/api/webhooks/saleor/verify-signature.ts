import { verifySignatureWithJwks } from "@saleor/app-sdk/auth";
import { createLogger } from "@/lib/logger";

const logger = createLogger("verifyWebhookSignature");

export async function verifyWebhookSignature(
  jwks: string,
  signature: string,
  rawBody: string,
): Promise<void> {
  try {
    let saleorBaseUrl: string;

    /* eslint-disable-next-line n/no-process-env */
    const envSaleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;

    if (envSaleorApiUrl) {
      saleorBaseUrl = envSaleorApiUrl.replace(/\/graphql\/?$/, "");
    } else if (typeof jwks === "string" && (jwks.startsWith("http://") || jwks.startsWith("https://"))) {
      const jwksUrl = new URL(jwks);
      saleorBaseUrl = `${jwksUrl.protocol}//${jwksUrl.host}`;
    } else {
      saleorBaseUrl = "http://localhost:8000";
    }

    const jwksEndpoint = `${saleorBaseUrl}/.well-known/jwks.json`;

    try {
      const response = await fetch(jwksEndpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch JWKS from ${jwksEndpoint}: ${response.status}`);
      }

      const jwksJson = await response.json();
      const jwksKeys = (jwksJson as { keys?: unknown[] })?.keys;

      if (!jwksJson || typeof jwksJson !== "object" || !Array.isArray(jwksKeys) || jwksKeys.length === 0) {
        throw new Error("Invalid JWKS structure");
      }

      jwks = JSON.stringify(jwksJson);
    } catch (fetchError) {
      if (typeof jwks === "string" && jwks.trim().length > 0 && !jwks.startsWith("http")) {
        try {
          const parsed = JSON.parse(jwks) as { keys?: unknown[] };
          if (parsed && Array.isArray(parsed.keys) && parsed.keys.length > 0) {
            logger.warn("Using stored JWKS as fallback");
          } else {
            throw fetchError;
          }
        } catch {
          throw fetchError;
        }
      } else {
        throw fetchError;
      }
    }

    await verifySignatureWithJwks(jwks, signature, rawBody);
  } catch (error) {
    logger.error("Webhook signature verification error", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
