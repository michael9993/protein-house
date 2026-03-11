import { verifyJWT } from "@saleor/app-sdk/auth";
import { Permission } from "@saleor/app-sdk/types";
import { TRPCError } from "@trpc/server";

import { saleorApp } from "@/saleor-app";
import { createLogger } from "@/logger";
import { middleware, procedure } from "./trpc-server";

const logger = createLogger("protectedClientProcedure");

function normalizeUrl(url: string): string {
  let normalized = url.replace(/\/+$/, "");
  if (normalized.endsWith("/graphql")) {
    normalized = normalized.slice(0, -"/graphql".length);
  }
  return normalized;
}

const attachAppToken = middleware(async ({ ctx, next }) => {
  const { saleorApiUrl } = ctx;

  if (!saleorApiUrl) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Missing saleorApiUrl header" });
  }

  const normalizedUrl = normalizeUrl(saleorApiUrl);

  const authData = await saleorApp.apl.get(saleorApiUrl)
    ?? await saleorApp.apl.get(`${normalizedUrl}/graphql/`)
    ?? await saleorApp.apl.get(`${normalizedUrl}/graphql`);

  if (!authData) {
    logger.warn("APL lookup failed", { saleorApiUrl, normalizedUrl });
    throw new TRPCError({ code: "UNAUTHORIZED", message: "App not registered for this Saleor instance" });
  }

  return next({
    ctx: {
      ...ctx,
      appId: authData.appId,
      appToken: authData.token,
      saleorApiUrl: authData.saleorApiUrl,
    },
  });
});

const validateClientToken = middleware(async ({ ctx, next, meta }) => {
  const { token, appId, saleorApiUrl } = ctx as typeof ctx & { appToken: string };

  if (!token || !saleorApiUrl) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing auth credentials" });
  }

  if (!ctx.ssr) {
    try {
      await verifyJWT({
        appId: appId!,
        token,
        saleorApiUrl,
        requiredPermissions: (meta?.requiredClientPermissions ?? ["MANAGE_APPS"]) as Permission[],
      });
    } catch (e) {
      logger.warn("JWT verification failed", {
        error: e instanceof Error ? e.message : String(e),
        appId: appId ?? "undefined",
        saleorApiUrl,
      });
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid JWT token" });
    }
  }

  return next({ ctx });
});

export const protectedClientProcedure = procedure.use(attachAppToken).use(validateClientToken);
