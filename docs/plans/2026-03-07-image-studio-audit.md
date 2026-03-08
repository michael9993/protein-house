# Image Studio App: Audit, Dead Code Cleanup & Bug Fixes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up the image studio app — fix security bugs, remove `any` types, eliminate dead code, fix race conditions, and improve type safety.

**App location:** `apps/apps/image-studio/`
**Container:** `saleor-image-studio-app-dev`
**Tech stack:** Next.js (Pages Router), tRPC, Fabric.js v6, Sharp, Gemini API, rembg, Real-ESRGAN, macaw-ui, Saleor metadata storage

---

## Context

The image studio app was built rapidly and has accumulated technical debt: a critical security bug in the register endpoint (allows any Saleor URL in production), 10+ `any` types across routers and utilities, race conditions in the upscale polling panel, unused imports, and missing error types. This audit addresses the most impactful issues.

**Key files:**
- `src/pages/api/register.ts` (15 lines) — security bug: allows any Saleor URL in production
- `src/modules/trpc/routers/media-router.ts` (137 lines) — `any` types in error mapping
- `src/modules/trpc/routers/products-router.ts` (119 lines) — `any` types in edge mapping
- `src/modules/trpc/utils/helpers.ts` (14 lines) — `any` types in params and error mapping
- `src/modules/trpc/utils/image-upload.ts` (137 lines) — `any` types in error mapping
- `src/modules/ai/together-client.ts` (172 lines) — `any` types in Gemini response parsing
- `src/modules/trpc/protected-client-procedure.ts` (169 lines) — `any` casts for APL `getAll()`

---

## Task 1: Fix Security Bug in Register Endpoint

**Files:**
- Modify: `src/pages/api/register.ts`

**Problem:** The `allowedSaleorUrls` callback returns `true` for ALL URLs in ALL environments (lines 8-13). The dev guard is there, but the fallback on line 12 also returns `true`, making the guard useless.

**Fix:** In production, validate against the `ALLOWED_SALEOR_URLS` env var (comma-separated list), or at minimum only allow the configured `SALEOR_API_URL`:

```typescript
import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";

import { saleorApp } from "../../saleor-app";

const ALLOWED_DOMAINS = (process.env.ALLOWED_SALEOR_URLS || "")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

export default createAppRegisterHandler({
  apl: saleorApp.apl,
  allowedSaleorUrls: [
    (url) => {
      if (process.env.NODE_ENV === "development") {
        return true;
      }
      // In production, allow configured URLs or any if none specified (backward compat)
      if (ALLOWED_DOMAINS.length === 0) {
        return true;
      }
      return ALLOWED_DOMAINS.some((allowed) => url.startsWith(allowed));
    },
  ],
});
```

**Note:** This mirrors the pattern other Saleor apps use. With no `ALLOWED_SALEOR_URLS` env var set, behavior is unchanged (backward compatible). When set, only those URLs are allowed.

**Verify:** Build passes (`docker exec saleor-image-studio-app-dev sh -c "cd /app/apps/image-studio && pnpm next build"`)

---

## Task 2: Fix `any` Types in Helpers and Image Upload

**Files:**
- Modify: `src/modules/trpc/utils/helpers.ts`
- Modify: `src/modules/trpc/utils/image-upload.ts`

**Problem:** `helpers.ts` uses `any` for both params and error mapping. `image-upload.ts` uses `any` for GraphQL error mapping.

**Fix for `helpers.ts`:**
```typescript
import { TRPCError } from "@trpc/server";

interface GraphQLError {
  message: string;
  extensions?: Record<string, unknown>;
}

interface QueryResult {
  data?: unknown;
  error?: {
    graphQLErrors?: GraphQLError[];
    networkError?: { message: string };
    message?: string;
  };
}

export function assertQuerySuccess(result: QueryResult, operationName: string) {
  if (result.error) {
    const gqlErrors = result.error.graphQLErrors?.map((e) => e.message).join("; ");
    const networkError = result.error.networkError?.message;
    const errorMsg = gqlErrors || networkError || result.error.message || "Unknown GraphQL error";
    console.error(`[${operationName}] GraphQL error:`, errorMsg);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `GraphQL query failed (${operationName}): ${errorMsg}`,
    });
  }
}
```

**Fix for `image-upload.ts`:** Replace `(e: any) => e.message` with `(e: { message: string }) => e.message` and `(e: any) => \`${e.field}: ${e.message}\`` with `(e: { field: string; message: string }) => \`${e.field}: ${e.message}\``.

**Verify:** Build passes

---

## Task 3: Fix `any` Types in Media Router and Products Router

**Files:**
- Modify: `src/modules/trpc/routers/media-router.ts`
- Modify: `src/modules/trpc/routers/products-router.ts`

**Problem:**
- `media-router.ts` lines 93, 113: `(e: any) => e.message` in error mapping
- `products-router.ts` line 89: `(edge: any) => edge.node` in product mapping

**Fix for `media-router.ts`:** Replace `(e: any)` with `(e: { message: string })` in both error mappings.

**Fix for `products-router.ts`:** Define a product node interface and replace `(edge: any)`:
```typescript
interface ProductNode {
  id: string;
  name: string;
  slug: string;
  thumbnail: { url: string } | null;
  media: Array<{ id: string; url: string; alt: string; type: string }>;
}

// In the query handler:
products: (products?.edges ?? []).map((edge: { node: ProductNode }) => edge.node),
```

**Verify:** Build passes

---

## Task 4: Fix `any` Types in Gemini Client

**Files:**
- Modify: `src/modules/ai/together-client.ts`

**Problem:** Lines 72 and 148 use `(p: any)` when parsing Gemini API response parts.

**Fix:** Define proper interfaces for the Gemini response:
```typescript
interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}
```

Replace both `(p: any)` with `(p: GeminiPart)`.

**Verify:** Build passes

---

## Task 5: Fix `any` Casts in Protected Client Procedure

**Files:**
- Modify: `src/modules/trpc/protected-client-procedure.ts`

**Problem:** Lines 70-73 use `(saleorApp.apl as any).getAll()` and `(auth: any)` — fragile type-unsafe pattern.

**Fix:** Define a local interface for the APL extension:
```typescript
interface AplWithGetAll {
  getAll?: () => Promise<Array<{ saleorApiUrl: string; token: string; appId: string }>>;
}
```

Replace `(saleorApp.apl as any).getAll` with `(saleorApp.apl as AplWithGetAll).getAll` and type the `.find()` callback properly.

**Verify:** Build passes

---

## Task 6: Remove Dead Legacy Upscale Endpoint

**Files:**
- Modify: `src/modules/trpc/routers/ai-router.ts`

**Problem:** The sync `upscale` mutation (lines 62-79) is explicitly marked as "Legacy sync upscale — kept for backward compat but will timeout on Cloudflare Free". The async `upscaleStart` + `upscaleStatus` pattern replaces it.

**Fix:** Check if the sync `upscale` endpoint is called anywhere in the frontend:
- Search for `trpc.ai.upscale.` in all frontend files
- If only `upscaleStart`/`upscaleStatus` are used, remove the legacy endpoint
- If the sync endpoint IS used somewhere, update the comment but keep it

**Verify:** Build passes

---

## Task 7: Clean Up Unused Imports and Dead Code

**Files:**
- All files in `src/modules/`

**Fix:** Sweep all module files:
1. Remove unused imports
2. Remove commented-out code blocks
3. Check for unused variables
4. Check `together-client.ts` — `_width` and `_height` params in `generateImage()` are unused (prefixed with `_` but never sent to Gemini)

**Verify:** Build passes

---

## Task 8: Add Upscale Job Cleanup Safety

**Files:**
- Modify: `src/modules/trpc/routers/ai-router.ts`

**Problem:** The in-memory `upscaleJobs` Map grows unbounded if `cleanupOldJobs()` is never called (it's only called at `upscaleStart`). If no one starts a new job, old completed jobs sit in memory forever holding large base64 strings.

**Fix:** Add cleanup call to `upscaleStatus` as well (it's cheap — just iterates the map). Also, clean up completed/errored jobs after delivery (already done on line 137/143, but add a safety time-based sweep):

```typescript
// In upscaleStatus handler, add at the top:
cleanupOldJobs();
```

**Verify:** Build passes

---

## Verification

```bash
# 1. Build to verify no type errors
docker exec saleor-image-studio-app-dev sh -c "cd /app/apps/image-studio && pnpm next build"

# 2. Restart container
docker compose -f infra/docker-compose.dev.yml restart saleor-image-studio-app

# 3. Check logs for runtime errors
docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-image-studio-app-dev
```

---

## Summary

| # | Severity | File(s) | Change |
|---|----------|---------|--------|
| 1 | CRITICAL | `register.ts` | Fix production URL validation — allow restricting via `ALLOWED_SALEOR_URLS` env |
| 2 | HIGH | `helpers.ts`, `image-upload.ts` | Replace `any` with proper interfaces |
| 3 | HIGH | `media-router.ts`, `products-router.ts` | Replace `any` in error/edge mapping |
| 4 | MEDIUM | `together-client.ts` | Type Gemini API response parts |
| 5 | MEDIUM | `protected-client-procedure.ts` | Type APL `getAll()` extension |
| 6 | LOW | `ai-router.ts` | Remove dead legacy sync upscale if unused |
| 7 | LOW | All modules | Remove unused imports and dead code |
| 8 | LOW | `ai-router.ts` | Add cleanup to upscaleStatus for memory safety |
