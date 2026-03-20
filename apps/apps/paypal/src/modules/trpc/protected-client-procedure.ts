import { verifyJWT } from "@saleor/app-sdk/auth";
import { TRPCError } from "@trpc/server";

import { createInstrumentedGraphqlClient } from "@/lib/graphql-client";
import { createLogger } from "@/lib/logger";
import { saleorApp } from "@/lib/saleor-app";

import { middleware, procedure } from "./trpc-server";

const logger = createLogger("protectedClientProcedure");

const attachAppToken = middleware(async ({ ctx, next }) => {
  if (!ctx.saleorApiUrl) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Missing saleorApiUrl in request" });
  }

  let authData = await saleorApp.apl.get(ctx.saleorApiUrl);

  if (!authData && ctx.saleorApiUrl.includes("trycloudflare.com")) {
    const localhostUrl = ctx.saleorApiUrl.replace(/https?:\/\/[^/]+/, "http://localhost:8000");
    authData = await saleorApp.apl.get(localhostUrl);
    if (authData) {
      await saleorApp.apl.set({ ...authData, saleorApiUrl: ctx.saleorApiUrl });
    }
  }

  if (!authData) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing auth data. Please reinstall the app.",
    });
  }

  return next({
    ctx: { appToken: authData.token, saleorApiUrl: authData.saleorApiUrl, appId: authData.appId },
  });
});

const attachSharedServices = middleware(async ({ ctx, next }) => {
  const gqlClient = createInstrumentedGraphqlClient({
    saleorApiUrl: ctx.saleorApiUrl!,
    token: ctx.token,
  });

  return next({ ctx: { apiClient: gqlClient } });
});

const validateClientToken = middleware(async ({ ctx, next, meta }) => {
  if (!ctx.token) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Missing token in request" });
  }
  if (!ctx.appId) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Missing appId in request" });
  }
  if (!ctx.saleorApiUrl) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Missing saleorApiUrl" });
  }

  try {
    await verifyJWT({
      appId: ctx.appId,
      token: ctx.token,
      saleorApiUrl: ctx.saleorApiUrl,
      requiredPermissions: meta?.requiredClientPermissions ?? [],
    });
  } catch (e) {
    console.error("JWT verification failed:", e instanceof Error ? e.message : e);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "JWT verification failed" });
  }

  return next({ ctx: { saleorApiUrl: ctx.saleorApiUrl } });
});

export const protectedClientProcedure = procedure
  .use(attachAppToken)
  .use(validateClientToken)
  .use(attachSharedServices);
