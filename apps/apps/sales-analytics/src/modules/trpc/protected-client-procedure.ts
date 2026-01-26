import { verifyJWT } from "@saleor/app-sdk/auth";
import { TRPCError } from "@trpc/server";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";

import { saleorApp } from "../../saleor-app";
import { middleware, procedure } from "./trpc-server";

// Helper to normalize Saleor API URL for consistent lookups
function normalizeSaleorApiUrl(url: string): string {
  // Remove trailing slashes and /graphql suffix
  let normalized = url.trim();
  normalized = normalized.replace(/\/graphql\/?$/, "");
  normalized = normalized.replace(/\/+$/, "");
  // Ensure it ends with /graphql/ for consistency
  if (!normalized.endsWith("/graphql")) {
    normalized = normalized + "/graphql";
  }
  if (!normalized.endsWith("/")) {
    normalized = normalized + "/";
  }
  return normalized;
}

const attachAppToken = middleware(async ({ ctx, next }) => {
  if (!ctx.saleorApiUrl) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Missing saleorApiUrl in request",
    });
  }

  // Normalize the URL for consistent lookups
  const normalizedUrl = normalizeSaleorApiUrl(ctx.saleorApiUrl);
  let authData = await saleorApp.apl.get(normalizedUrl);

  // Fallback: Try the original URL as-is
  if (!authData) {
    authData = await saleorApp.apl.get(ctx.saleorApiUrl);
  }

  // Fallback: Try with/without trailing slash
  if (!authData) {
    const alternateUrl = ctx.saleorApiUrl.endsWith("/")
      ? ctx.saleorApiUrl.slice(0, -1)
      : ctx.saleorApiUrl + "/";
    authData = await saleorApp.apl.get(alternateUrl);

    if (authData) {
      // Update to use the correct URL format
      await saleorApp.apl.set({
        ...authData,
        saleorApiUrl: normalizedUrl,
      });
    }
  }

  // Fallback: If using tunnel URL, try localhost URL (and vice versa)
  if (!authData && ctx.saleorApiUrl.includes("trycloudflare.com")) {
    // Try multiple localhost URL variations with normalized format
    const localhostVariations = [
      "http://localhost:8000/graphql/",
      "http://localhost:8000/graphql",
      "http://localhost:8000/",
      "http://localhost:8000",
    ];

    for (const localhostUrl of localhostVariations) {
      authData = await saleorApp.apl.get(localhostUrl);
      if (authData) {
        // Update to use the normalized tunnel URL for future lookups
        await saleorApp.apl.set({
          ...authData,
          saleorApiUrl: normalizedUrl,
        });
        break;
      }
    }
  } else if (!authData && ctx.saleorApiUrl.includes("localhost:8000")) {
    // Try to find any tunnel URL entry
    try {
      // Get all stored auth data (if APL supports getAll)
      if (typeof (saleorApp.apl as unknown as { getAll?: () => Promise<unknown[]> }).getAll === "function") {
        const allAuthData = await (saleorApp.apl as unknown as { getAll: () => Promise<Array<{ saleorApiUrl?: string }>> }).getAll();
        const tunnelAuth = allAuthData?.find(
          (auth) => auth.saleorApiUrl && auth.saleorApiUrl.includes("trycloudflare.com")
        );

        if (tunnelAuth) {
          // Use the found auth data but update the URL to normalized format
          authData = {
            ...tunnelAuth,
            saleorApiUrl: normalizedUrl,
          } as typeof authData;
          // Store it with the normalized URL for future lookups
          if (authData) {
            await saleorApp.apl.set(authData);
          }
        }
      }
    } catch {
      // getAll might not be available, ignore
    }
  }

  if (!authData) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing auth data. Please open the app in the dashboard to complete registration.",
    });
  }

  return next({
    ctx: {
      appToken: authData.token,
      saleorApiUrl: normalizedUrl, // Use normalized URL for consistency
      appId: authData.appId,
    },
  });
});

const validateClientToken = middleware(async ({ ctx, next, meta }) => {
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
      message: "Missing saleorApiUrl in request. This middleware can be used after auth is attached",
    });
  }

  if (!ctx.ssr) {
    try {
      await verifyJWT({
        appId: ctx.appId,
        token: ctx.token,
        saleorApiUrl: ctx.saleorApiUrl,
        requiredPermissions: ["MANAGE_ORDERS", ...(meta?.requiredClientPermissions || [])],
      });
    } catch {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "JWT verification failed",
      });
    }
  }

  return next({
    ctx: {
      ...ctx,
      saleorApiUrl: ctx.saleorApiUrl,
    },
  });
});

/**
 * Protected procedure that validates client token and attaches GraphQL client
 */
export const protectedClientProcedure = procedure
  .use(attachAppToken)
  .use(validateClientToken)
  .use(async ({ ctx, next }) => {
    const client = createGraphQLClient({
      saleorApiUrl: ctx.saleorApiUrl,
      token: ctx.appToken,
    });

    return next({
      ctx: {
        apiClient: client,
        appToken: ctx.appToken,
        saleorApiUrl: ctx.saleorApiUrl,
        appId: ctx.appId,
      },
    });
  });
