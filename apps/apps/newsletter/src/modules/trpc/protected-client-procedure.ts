import { verifyJWT } from "@saleor/app-sdk/auth";
import { TRPCError } from "@trpc/server";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";

import { saleorApp } from "../../saleor-app";
import { middleware, procedure } from "./trpc-server";

// Helper to normalize Saleor API URL for consistent lookups
function normalizeSaleorApiUrl(url: string): string {
    // Remove trailing slashes and /graphql suffix
    let normalized = url.trim();
    normalized = normalized.replace(/\/graphql\/?$/, '');
    normalized = normalized.replace(/\/+$/, '');
    // Ensure it ends with /graphql/ for consistency
    if (!normalized.endsWith('/graphql')) {
        normalized = normalized + '/graphql';
    }
    if (!normalized.endsWith('/')) {
        normalized = normalized + '/';
    }
    return normalized;
}

const attachAppToken = middleware(async ({ ctx, next }) => {
    if (!ctx.saleorApiUrl) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "App Bridge not ready. Please wait for the app to initialize.",
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
        const alternateUrl = ctx.saleorApiUrl.endsWith('/')
            ? ctx.saleorApiUrl.slice(0, -1)
            : ctx.saleorApiUrl + '/';
        authData = await saleorApp.apl.get(alternateUrl);

        if (authData) {
            // Update to use the correct URL format
            await saleorApp.apl.set({
                ...authData,
                saleorApiUrl: normalizedUrl,
            });
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
                requiredPermissions: ["MANAGE_APPS", "MANAGE_USERS", ...(meta?.requiredClientPermissions || [])],
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
