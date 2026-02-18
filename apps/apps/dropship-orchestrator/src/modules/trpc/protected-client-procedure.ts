import { verifyJWT } from "@saleor/app-sdk/auth";
import { TRPCError } from "@trpc/server";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";

import { saleorApp } from "../../saleor-app";
import { middleware, procedure } from "./trpc-server";

function normalizeSaleorApiUrl(url: string): string {
  let normalized = url.trim();
  normalized = normalized.replace(/\/graphql\/?$/, "");
  normalized = normalized.replace(/\/+$/, "");
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

  const normalizedUrl = normalizeSaleorApiUrl(ctx.saleorApiUrl);
  let authData = await saleorApp.apl.get(normalizedUrl);

  if (!authData) {
    authData = await saleorApp.apl.get(ctx.saleorApiUrl);
  }

  if (!authData) {
    const alternateUrl = ctx.saleorApiUrl.endsWith("/")
      ? ctx.saleorApiUrl.slice(0, -1)
      : ctx.saleorApiUrl + "/";
    authData = await saleorApp.apl.get(alternateUrl);

    if (authData) {
      await saleorApp.apl.set({
        ...authData,
        saleorApiUrl: normalizedUrl,
      });
    }
  }

  if (!authData && ctx.saleorApiUrl.includes("trycloudflare.com")) {
    const localhostVariations = [
      "http://localhost:8000/graphql/",
      "http://localhost:8000/graphql",
      "http://localhost:8000/",
      "http://localhost:8000",
    ];

    for (const localhostUrl of localhostVariations) {
      authData = await saleorApp.apl.get(localhostUrl);
      if (authData) {
        await saleorApp.apl.set({
          ...authData,
          saleorApiUrl: normalizedUrl,
        });
        break;
      }
    }
  } else if (!authData && ctx.saleorApiUrl.includes("localhost:8000")) {
    try {
      if (typeof (saleorApp.apl as any).getAll === "function") {
        const allAuthData = await (saleorApp.apl as any).getAll();
        const tunnelAuth = allAuthData?.find(
          (auth: any) => auth.saleorApiUrl && auth.saleorApiUrl.includes("trycloudflare.com"),
        );

        if (tunnelAuth) {
          const mergedAuth = {
            ...tunnelAuth,
            saleorApiUrl: normalizedUrl,
          };
          authData = mergedAuth as typeof authData;
          await saleorApp.apl.set(mergedAuth as Parameters<typeof saleorApp.apl.set>[0]);
        }
      }
    } catch (e) {
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
      saleorApiUrl: normalizedUrl,
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
        requiredPermissions: ["MANAGE_APPS", ...(meta?.requiredClientPermissions || [])],
      });
    } catch (e) {
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
