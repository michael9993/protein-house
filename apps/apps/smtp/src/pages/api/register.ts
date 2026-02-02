import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";
import { wrapWithLoggerContext } from "@saleor/apps-logger/node";
import { withSpanAttributes } from "@saleor/apps-otel/src/with-span-attributes";
import { SaleorVersionCompatibilityValidator } from "@saleor/apps-shared/saleor-version-compatibility-validator";

import { createInstrumentedGraphqlClient } from "../../lib/create-instrumented-graphql-client";
import { createLogger } from "../../logger";
import { loggerContext } from "../../logger-context";
import { fetchSaleorVersion } from "../../modules/feature-flag-service/fetch-saleor-version";
import { REQUIRED_SALEOR_VERSION, saleorApp } from "../../saleor-app";

const allowedUrlsPattern = process.env.ALLOWED_DOMAIN_PATTERN;

const logger = createLogger("createAppRegisterHandler");

/**
 * Required endpoint, called by Saleor to install app.
 * It will exchange tokens with app, so saleorApp.apl will contain token
 */
export default wrapWithLoggerContext(
  withSpanAttributes(
    createAppRegisterHandler({
      apl: saleorApp.apl,
      allowedSaleorUrls: [
        (url) => {
          if (allowedUrlsPattern) {
            // we don't escape the pattern because it's not user input - it's an ENV variable controlled by us
            const regex = new RegExp(allowedUrlsPattern);

            const checkResult = regex.test(url);

            if (!checkResult) {
              logger.warn("Blocked installation attempt from disallowed Saleor instance", {
                saleorApiUrl: url,
                allowedUrlsPattern,
              });
            }

            return checkResult;
          }

          return true;
        },
      ],
      async onRequestVerified(_req, { authData: { token, saleorApiUrl }, respondWithError }) {
        const logger = createLogger("onRequestVerified");

        let saleorVersion: string;

        try {
          const client = createInstrumentedGraphqlClient({
            saleorApiUrl: saleorApiUrl,
            token: token,
          });

          saleorVersion = await fetchSaleorVersion(client);
        } catch (e: unknown) {
          const message = (e as Error)?.message ?? "Unknown error";

          logger.debug(
            { message, saleorApiUrl },
            "Error during fetching saleor version in onRequestVerified handler",
          );

          throw respondWithError({
            message: "Couldn't communicate with Saleor API",
            status: 400,
          });
        }

        if (!saleorVersion) {
          logger.warn({ saleorApiUrl }, "No version returned from Saleor API");
          throw respondWithError({
            message: "Saleor version couldn't be fetched from the API",
            status: 400,
          });
        }

        const isVersionValid = new SaleorVersionCompatibilityValidator(
          REQUIRED_SALEOR_VERSION,
        ).isValid(saleorVersion);

        if (!isVersionValid) {
          logger.info(
            { saleorApiUrl },
            "Rejecting installation due to incompatible Saleor version",
          );
          throw respondWithError({
            message: `Saleor version (${saleorVersion}) is not compatible with this app version (${REQUIRED_SALEOR_VERSION})`,
            status: 400,
          });
        }

        logger.info("Saleor version validated successfully");
      },
      onAuthAplSaved: async (_req, context) => {
        const logger = createLogger("onAuthAplSaved");

        logger.info("App configuration set up successfully", {
          saleorApiUrl: context.authData.saleorApiUrl,
        });

        /*
         * Fetch JWKS from Saleor instance and update APL.
         * This ensures we store the actual JWKS JSON instead of a URL.
         * Critical for tunnel setups where PUBLIC_URL might differ from localhost.
         */
        try {
          let saleorApiUrl = context.authData.saleorApiUrl;

          // If saleorApiUrl is localhost and we have a tunnel URL in environment, use tunnel URL
          if (saleorApiUrl.includes("localhost:8000")) {
            const envSaleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;

            if (envSaleorApiUrl) {
              // Normalize the env URL to ensure /graphql/ suffix

              saleorApiUrl =
                envSaleorApiUrl.endsWith("/graphql/")
                ? envSaleorApiUrl
                : envSaleorApiUrl.endsWith("/graphql")
                  ? envSaleorApiUrl + "/"
                  : envSaleorApiUrl.endsWith("/")
                    ? envSaleorApiUrl + "graphql/"
                    : envSaleorApiUrl + "/graphql/";

              logger.info("Using tunnel URL from environment for JWKS fetch", {
                originalUrl: context.authData.saleorApiUrl,
                tunnelUrl: saleorApiUrl,
              });
            }
          }

          /*
           * Extract base URL from GraphQL endpoint.
           * e.g. "http://localhost:8000/graphql/" -> "http://localhost:8000"
           * or "https://tunnel.trycloudflare.com/graphql/" -> "https://tunnel.trycloudflare.com"
           */
          const baseUrl = saleorApiUrl.replace(/\/graphql\/?$/, "");
          const jwksUrl = `${baseUrl}/.well-known/jwks.json`;

          logger.debug("Fetching JWKS from Saleor instance", { jwksUrl, saleorApiUrl });

          const response = await fetch(jwksUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          });

          if (!response.ok) {
            logger.warn("Failed to fetch JWKS from Saleor instance", {
              jwksUrl,
              status: response.status,
              statusText: response.statusText,
            });

            return;
          }

          const jwksJson = await response.json();

          // Validate JWKS structure
          if (!jwksJson || typeof jwksJson !== "object" || !Array.isArray(jwksJson.keys)) {
            logger.warn("Invalid JWKS structure received", { jwksUrl });

            return;
          }

          if (jwksJson.keys.length === 0) {
            logger.warn("JWKS keys array is empty", { jwksUrl });

            return;
          }

          // Update APL with the fetched JWKS JSON string

          const updatedAuthData = {
            ...context.authData,
            jwks: JSON.stringify(jwksJson),
          };

          await saleorApp.apl.set(updatedAuthData);

          logger.info("Updated APL with JWKS from Saleor instance", {
            saleorApiUrl,
            keysCount: jwksJson.keys.length,
          });
        } catch (error) {
          logger.error("Failed to fetch and update JWKS from Saleor instance", {
            saleorApiUrl: context.authData.saleorApiUrl,
            error: error instanceof Error ? error.message : String(error),
          });
          // Don't throw - registration succeeded, JWKS update is optional
        }
      },
    }),
  ),
  loggerContext,
);
