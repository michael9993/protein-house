import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";
import { wrapWithLoggerContext } from "@saleor/apps-logger/node";
import { withSpanAttributes } from "@saleor/apps-otel/src/with-span-attributes";
import { SaleorVersionCompatibilityValidator } from "@saleor/apps-shared/saleor-version-compatibility-validator";

import { createInstrumentedGraphqlClient } from "../../lib/create-instrumented-graphql-client";
import { createLogger } from "../../logger";
import { loggerContext } from "../../logger-context";
import { fetchSaleorVersion } from "../../lib/fetch-saleor-version";
import { REQUIRED_SALEOR_VERSION, saleorApp } from "../../saleor-app";

const logger = createLogger("createAppRegisterHandler");

export default wrapWithLoggerContext(
  withSpanAttributes(
    createAppRegisterHandler({
      apl: saleorApp.apl,
      allowedSaleorUrls: [() => true], // Allow all URLs in development
      async onRequestVerified(req, { authData: { token, saleorApiUrl }, respondWithError }) {
        const logger = createLogger("onRequestVerified");

        let saleorVersion: string;

        try {
          // Create authenticated GraphQL client
          const client = createInstrumentedGraphqlClient({
            saleorApiUrl,
            token,
          });
          saleorVersion = await fetchSaleorVersion(client);
        } catch (error) {
          logger.error("Failed to fetch Saleor version", { error });
          return respondWithError({
            message: "Failed to verify Saleor version",
            status: 400,
          });
        }

        const versionValidator = new SaleorVersionCompatibilityValidator(REQUIRED_SALEOR_VERSION);

        if (!versionValidator.isValid(saleorVersion)) {
          logger.error("Saleor version incompatibility", {
            required: REQUIRED_SALEOR_VERSION,
            current: saleorVersion,
          });

          return respondWithError({
            message: `Saleor version ${saleorVersion} is not compatible. Required: ${REQUIRED_SALEOR_VERSION}`,
            status: 400,
          });
        }

        logger.info("App registration successful", {
          saleorApiUrl,
          saleorVersion,
        });
      },
    }),
  ),
  loggerContext,
);

