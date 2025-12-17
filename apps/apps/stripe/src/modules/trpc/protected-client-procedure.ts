import { verifyJWT } from "@saleor/app-sdk/auth";
import { ObservabilityAttributes } from "@saleor/apps-otel/src/observability-attributes";
import { setTag } from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";

import { createInstrumentedGraphqlClient } from "@/lib/graphql-client";
import { createLogger } from "@/lib/logger";
import { saleorApp } from "@/lib/saleor-app";

import { middleware, procedure } from "./trpc-server";

const logger = createLogger("protectedClientProcedure");

const attachAppToken = middleware(async ({ ctx, next }) => {
  if (!ctx.saleorApiUrl) {
    logger.debug("ctx.saleorApiUrl not found, throwing");

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Missing saleorApiUrl in request",
    });
  }

  logger.debug("Looking up auth data in APL", {
    saleorApiUrl: ctx.saleorApiUrl,
    envOverride: process.env.NEXT_PUBLIC_SALEOR_API_URL,
  });

  let authData = await saleorApp.apl.get(ctx.saleorApiUrl);

  // Fallback: If auth data not found and we're using an overridden URL,
  // try looking up with the original localhost URL (in case it was stored with that)
  if (!authData && ctx.saleorApiUrl && ctx.saleorApiUrl.includes("trycloudflare.com")) {
    const localhostUrl = ctx.saleorApiUrl.replace(/https?:\/\/[^/]+/, "http://localhost:8000");
    logger.debug("Trying fallback lookup with localhost URL", {
      tunnelUrl: ctx.saleorApiUrl,
      localhostUrl: localhostUrl,
    });
    authData = await saleorApp.apl.get(localhostUrl);
    
    if (authData) {
      logger.info("Found auth data with fallback URL, updating to tunnel URL", {
        foundWith: localhostUrl,
        updatingTo: ctx.saleorApiUrl,
      });
      // Update the auth data to use the tunnel URL for future lookups
      await saleorApp.apl.set({
        ...authData,
        saleorApiUrl: ctx.saleorApiUrl,
      });
    }
  }

  if (!authData) {
    logger.error("Auth data not found in APL", {
      saleorApiUrl: ctx.saleorApiUrl,
      envOverride: process.env.NEXT_PUBLIC_SALEOR_API_URL,
      message: "This usually means the app was not installed correctly or the URL mismatch",
    });

    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing auth data. Please reinstall the app.",
    });
  }

  logger.debug("Auth data found in APL", {
    saleorApiUrl: authData.saleorApiUrl,
    appId: authData.appId,
  });

  return next({
    ctx: {
      appToken: authData.token,
      saleorApiUrl: authData.saleorApiUrl,
      appId: authData.appId,
    },
  });
});

const attachSharedServices = middleware(async ({ ctx, next }) => {
  const gqlClient = createInstrumentedGraphqlClient({
    saleorApiUrl: ctx.saleorApiUrl!, // Will be defined, previous middleware will ensure it
    token: ctx.token,
  });

  return next({
    ctx: {
      apiClient: gqlClient,
    },
  });
});

const validateClientToken = middleware(async ({ ctx, next, meta }) => {
  logger.debug("Calling validateClientToken middleware with permissions required", {
    permissions: meta?.requiredClientPermissions,
  });

  if (!ctx.token) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Missing token in request. This middleware can be used only in frontend",
    });
  }

  if (!ctx.appId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Missing appId in request. This middleware can be used after auth is attached",
    });
  }

  if (!ctx.saleorApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Missing saleorApiUrl in request. This middleware can be used after auth is attached",
    });
  }

  setTag(ObservabilityAttributes.SALEOR_API_URL, ctx.saleorApiUrl);

  try {
    logger.debug("trying to verify JWT token from frontend", {
      token: ctx.token ? `${ctx.token[0]}...` : undefined,
    });

    await verifyJWT({
      appId: ctx.appId,
      token: ctx.token,
      saleorApiUrl: ctx.saleorApiUrl,
      requiredPermissions: meta?.requiredClientPermissions,
    });
  } catch {
    logger.debug("JWT verification failed, throwing");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "JWT verification failed",
    });
  }

  return next({
    ctx: {
      saleorApiUrl: ctx.saleorApiUrl,
    },
  });
});

/**
 * Construct common graphQL client and attach it to the context
 *
 * Can be used only if called from the frontend (react-query),
 * otherwise jwks validation will fail (if createCaller used)
 *
 * TODO: Rethink middleware composition to enable safe server-side router calls
 */
export const protectedClientProcedure = procedure
  .use(attachAppToken)
  .use(validateClientToken)
  .use(attachSharedServices);
