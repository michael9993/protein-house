import { NextAppRouterHandler } from "@saleor/app-sdk/handlers/next-app-router";
import { SALEOR_API_URL_HEADER, SALEOR_SCHEMA_VERSION_HEADER } from "@saleor/app-sdk/headers";
import { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import { loggerContext } from "@/lib/logger-context";
import { SaleorApiUrl } from "@/modules/saleor/saleor-api-url";

const logger = createLogger("observability");

/**
 * Observability attribute keys — mirrors @saleor/apps-otel ObservabilityAttributes.
 * Kept local to avoid pulling in heavy OpenTelemetry peer dependencies.
 */
export const ObservabilityAttributes = {
  SALEOR_API_URL: "saleorApiUrl",
  SALEOR_VERSION: "saleorVersion",
  CHANNEL_SLUG: "channelSlug",
  TRANSACTION_ID: "transactionId",
  CONFIGURATION_ID: "configurationId",
  ORDER_ID: "orderId",
  CHECKOUT_ID: "checkoutId",
  PSP_REFERENCE: "pspReference",
  SOURCE_OBJECT_ID: "sourceObjectId",
  SOURCE_OBJECT_TYPE: "sourceObjectType",
  TRANSACTION_AMOUNT: "transactionAmount",
  PAYPAL_ENVIRONMENT: "paypalEnvironment",
  PAYPAL_ORDER_ID: "paypalOrderId",
  PATH: "path",
  SALEOR_EVENT: "saleorEvent",
} as const;

/**
 * App Router middleware that sets span attributes from Saleor webhook headers.
 * Drop-in replacement for @saleor/apps-otel withSpanAttributesAppRouter,
 * writing to loggerContext instead of OTel spans (upgradeable later).
 */
export const withSpanAttributes = (handler: NextAppRouterHandler) => {
  return (req: NextRequest) => {
    const saleorApiUrl = req.headers.get(SALEOR_API_URL_HEADER);
    const saleorVersion = req.headers.get(SALEOR_SCHEMA_VERSION_HEADER);

    if (saleorApiUrl) {
      loggerContext.set(ObservabilityAttributes.SALEOR_API_URL, saleorApiUrl);
    }

    if (saleorVersion) {
      loggerContext.set(ObservabilityAttributes.SALEOR_VERSION, saleorVersion);
    }

    loggerContext.set(ObservabilityAttributes.PATH, req.nextUrl.pathname);

    return handler(req);
  };
};

/**
 * Set Saleor API URL and version in observability context.
 */
export const setObservabilitySaleorApiUrl = (
  saleorApiUrl: SaleorApiUrl,
  version?: string | null | undefined,
) => {
  loggerContext.set(ObservabilityAttributes.SALEOR_API_URL, saleorApiUrl);

  if (version) {
    loggerContext.set(ObservabilityAttributes.SALEOR_VERSION, version);
  }
};

/**
 * Set source object (Checkout/Order) in observability context.
 */
export const setObservabilitySourceObjectId = (so: {
  __typename?: "Checkout" | "Order" | string;
  id?: string | null;
}) => {
  if (!so.id) {
    return;
  }

  loggerContext.set(ObservabilityAttributes.SOURCE_OBJECT_ID, so.id);

  if (so.__typename) {
    loggerContext.set(ObservabilityAttributes.SOURCE_OBJECT_TYPE, so.__typename);
  }
};

/**
 * Set PayPal-specific attributes in observability context.
 */
export const setObservabilityPayPalContext = (attrs: {
  paypalOrderId?: string;
  paypalEnvironment?: string;
  pspReference?: string;
}) => {
  if (attrs.paypalOrderId) {
    loggerContext.set(ObservabilityAttributes.PAYPAL_ORDER_ID, attrs.paypalOrderId);
  }

  if (attrs.paypalEnvironment) {
    loggerContext.set(ObservabilityAttributes.PAYPAL_ENVIRONMENT, attrs.paypalEnvironment);
  }

  if (attrs.pspReference) {
    loggerContext.set(ObservabilityAttributes.PSP_REFERENCE, attrs.pspReference);
  }
};

/**
 * Capture an exception for observability.
 * Logs to structured logger. When Sentry is added later, this becomes the
 * single integration point — just add `Sentry.captureException(error)` here.
 */
export const captureException = (error: unknown) => {
  logger.error("Captured exception", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
};
