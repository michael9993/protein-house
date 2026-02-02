import type { AuthData } from "@saleor/app-sdk/APL";
import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next-app-router";
import { SALEOR_API_URL_HEADER } from "@saleor/app-sdk/headers";
import { withSpanAttributesAppRouter } from "@saleor/apps-otel/src/with-span-attributes";
import { compose } from "@saleor/apps-shared/compose";
import { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { withLoggerContext } from "@/lib/logger-context";
import { saleorApp } from "@/lib/saleor-app";

const logger = createLogger("createAppRegisterHandler");

const allowedUrlsPattern = env.ALLOWED_DOMAIN_PATTERN;

/**
 * Normalize Saleor API URL to ensure consistent format (trailing slash, etc.)
 */
const normalizeSaleorApiUrl = (url: string): string => {
  // Ensure URL ends with /graphql/
  if (!url.endsWith("/graphql/")) {
    if (url.endsWith("/graphql")) {
      return url + "/";
    }
    if (url.endsWith("/")) {
      return url + "graphql/";
    }
    return url + "/graphql/";
  }
  return url;
};

/**
 * Middleware to override Saleor API URL from environment variable
 * This fixes the issue where JWT token has localhost:8000 as issuer
 * but we need to use the tunnel URL for installation
 */
const overrideSaleorApiUrl = async (req: NextRequest): Promise<NextRequest> => {
  const envSaleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
  const incomingUrl = req.headers.get(SALEOR_API_URL_HEADER);

  // If environment variable is set and incoming URL is localhost, override it
  if (envSaleorApiUrl && incomingUrl && incomingUrl.includes("localhost:8000")) {
    const normalizedEnvUrl = normalizeSaleorApiUrl(envSaleorApiUrl);
    logger.info("Overriding Saleor API URL from environment variable", {
      originalUrl: incomingUrl,
      overrideUrl: normalizedEnvUrl,
    });

    // Clone headers and modify
    const headers = new Headers(req.headers);
    headers.set(SALEOR_API_URL_HEADER, normalizedEnvUrl);

    // Clone the request to preserve the body stream
    // NextRequest.clone() creates a copy that can be read independently
    const clonedReq = req.clone();
    
    // Create a new request with modified headers
    // Use the cloned request's body to avoid consuming the original
    return new NextRequest(req.url, {
      method: req.method,
      headers: headers,
      body: clonedReq.body,
    });
  }

  return req;
};

const handler = createAppRegisterHandler({
  apl: saleorApp.apl,
  /**
   * Prohibit installation from Saleor other than specified by the regex.
   * Regex source is ENV so if ENV is not set, all installations will be allowed.
   */
  allowedSaleorUrls: [
    (url: string) => {
      if (allowedUrlsPattern) {
        // we don't escape the pattern because it's not user input - it's an ENV variable controlled by us
        const regex = new RegExp(allowedUrlsPattern);

        const checkResult = regex.test(url);

        if (!checkResult) {
          logger.warn("Blocked installation attempt from disallowed Saleor instance", {
            saleorApiUrl: url,
          });
        }

        return checkResult;
      }

      return true;
    },
  ],
  onAplSetFailed: async (_req, context) => {
    logger.error("Failed to set APL", {
      saleorApiUrl: context.authData.saleorApiUrl,
      error: context.error,
    });
  },
  onAuthAplSaved: async (_req: unknown, context: { authData: AuthData }) => {
    logger.info("App configuration set up successfully", {
      saleorApiUrl: context.authData.saleorApiUrl,
    });
    
    // Fetch JWKS from local Saleor instance and update APL
    // This ensures we store the actual JWKS JSON instead of a URL
    try {
      let saleorApiUrl = context.authData.saleorApiUrl;
      
      // If saleorApiUrl is localhost and we have a tunnel URL in environment, use tunnel URL
      if (saleorApiUrl.includes("localhost:8000")) {
        const envSaleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
        if (envSaleorApiUrl) {
          saleorApiUrl = normalizeSaleorApiUrl(envSaleorApiUrl);
          logger.info("Using tunnel URL from environment for JWKS fetch", {
            originalUrl: context.authData.saleorApiUrl,
            tunnelUrl: saleorApiUrl,
          });
        }
      }
      
      // Extract base URL from GraphQL endpoint
      // e.g., "http://localhost:8000/graphql/" -> "http://localhost:8000"
      // or "https://tunnel.trycloudflare.com/graphql/" -> "https://tunnel.trycloudflare.com"
      const baseUrl = saleorApiUrl.replace(/\/graphql\/?$/, "");
      const jwksUrl = `${baseUrl}/.well-known/jwks.json`;
      
      logger.debug("Fetching JWKS from Saleor instance", { jwksUrl, saleorApiUrl });
      
      const response = await fetch(jwksUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });
      
      if (!response.ok) {
        logger.warn("Failed to fetch JWKS from local Saleor instance", {
          jwksUrl,
          status: response.status,
          statusText: response.statusText,
        });
        return;
      }
      
      const jwksJson = await response.json();
      
      // Validate JWKS structure
      const jwksKeys = (jwksJson as { keys?: unknown[] })?.keys;
      if (!jwksJson || typeof jwksJson !== "object" || !Array.isArray(jwksKeys)) {
        logger.warn("Invalid JWKS structure received", { jwksUrl });
        return;
      }

      if (jwksKeys.length === 0) {
        logger.warn("JWKS keys array is empty", { jwksUrl });
        return;
      }

      // Update APL with the fetched JWKS JSON string (context.authData has token, appId from SDK)
      const updatedAuthData = {
        ...context.authData,
        jwks: JSON.stringify(jwksJson),
      };

      await saleorApp.apl.set(updatedAuthData as AuthData);

      logger.info("Updated APL with JWKS from local Saleor instance", {
        saleorApiUrl,
        keysCount: jwksKeys.length,
      });
    } catch (error) {
      logger.error("Failed to fetch and update JWKS from local Saleor instance", {
        saleorApiUrl: context.authData.saleorApiUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - registration succeeded, JWKS update is optional
    }
  },
});

/**
 * Wrapper to override Saleor API URL before passing to handler
 */
const wrappedHandler = async (req: NextRequest) => {
  const modifiedReq = await overrideSaleorApiUrl(req);
  return handler(modifiedReq);
};

export const POST = compose(withLoggerContext, withSpanAttributesAppRouter)(wrappedHandler);
