# Bulk Manager App: Audit, Bug Fixes & Code Cleanup

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix bugs, clean up code quality, and verify product import/export is fully dynamic in the bulk manager app.

**Architecture:** The bulk manager has 7 entity routers (products, categories, collections, customers, orders, vouchers, gift cards) sharing common helpers. The product router is the most complex (~2000 lines) with a dynamic attribute engine that auto-discovers, creates, and assigns attributes from CSV column prefixes (`attr:*`, `variantAttr:*`, `stock:*`). The import/export is already fully dynamic — no hardcoded product types or attribute names.

**Tech Stack:** Next.js (Pages Router), tRPC, urql (GraphQL), Zod, CSV/Excel parsing

---

### Task 1: Fix Dropship costPrice Bug

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts:1469`

**Context:** When setting dropship metadata on a product, the code stores the *sale price* as the cost price. This breaks margin calculations in the dropship orchestrator. `first.costPrice` is the correct field — it contains the supplier's cost, while `first.price` is the retail price.

**Step 1: Fix the metadata value**

Change line 1469 from:
```typescript
{ key: "dropship.costPrice", value: String(first.price || "0") },
```
To:
```typescript
{ key: "dropship.costPrice", value: String(first.costPrice || first.price || "0") },
```

Note: Falls back to `first.price` if `costPrice` is not provided (backward compat).

---

### Task 2: Add Safe Number Parsing Helpers

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/trpc/utils/helpers.ts`

**Context:** Multiple places use bare `parseInt()` / `parseFloat()` which return `NaN` on invalid input. NaN propagates silently into Saleor mutations causing unpredictable behavior (e.g., `quantityLimitPerCustomer: NaN`). Add validated helpers.

**Step 1: Add `safeParseInt` and `safeParseFloat` to helpers.ts**

```typescript
/**
 * Parse an integer string, returning undefined if invalid or NaN.
 * Optionally enforces a minimum value (e.g., 0 for stock quantities).
 */
export function safeParseInt(value: string | undefined, min?: number): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  if (isNaN(n)) return undefined;
  if (min !== undefined && n < min) return undefined;
  return n;
}

/**
 * Parse a float string, returning undefined if invalid or NaN.
 */
export function safeParseFloat(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  if (isNaN(n)) return undefined;
  return n;
}
```

---

### Task 3: Replace Bare parseInt/parseFloat in Products Router

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts`

**Context:** Replace all bare `parseInt()` / `parseFloat()` calls with the safe helpers from Task 2. Key locations:

1. **Line ~1337** — `parseFloat(first.weight)` → `safeParseFloat(first.weight)`
2. **Lines ~1608, ~1637** — `parseInt(vRow.quantityLimit)` → `safeParseInt(vRow.quantityLimit, 0)`
3. **Lines ~1609, ~1638** — `parseFloat(vRow.variantWeight)` → `safeParseFloat(vRow.variantWeight)`
4. **Lines ~1661-1662** — `parseFloat(vRow.price)` / `parseFloat(vRow.costPrice)` → `safeParseFloat()`
5. **Lines ~1688-1689** — stock `parseInt(val)` → `safeParseInt(val, 0)` (reject negative stock)
6. **Line ~1695** — single-warehouse stock `parseInt(vRow.stock)` → `safeParseInt(vRow.stock, 0)`

Add import at top:
```typescript
import { ..., safeParseInt, safeParseFloat } from "../utils/helpers";
```

---

### Task 4: Extract GraphQL Error Helper

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/trpc/utils/helpers.ts`
- Modify: All 7 routers in `apps/apps/bulk-manager/src/modules/trpc/routers/`

**Context:** The pattern `.graphQLErrors?.map((e: any) => e.message).join("; ")` appears 26 times across all routers. Extract to a typed helper to eliminate `any` and reduce duplication.

**Step 1: Add helper**

```typescript
/**
 * Extract a human-readable error message from a urql GraphQL error result.
 */
export function extractGraphQLError(error: { graphQLErrors?: Array<{ message: string }>; networkError?: { message: string }; message?: string }, fallback = "GraphQL error"): string {
  return error.graphQLErrors?.map((e) => e.message).join("; ")
    || error.networkError?.message
    || error.message
    || fallback;
}
```

**Step 2: Replace all 26 inline patterns**

In every router, replace:
```typescript
const errMsg = result.error.graphQLErrors?.map((e: any) => e.message).join("; ") || "GraphQL error";
```
With:
```typescript
const errMsg = extractGraphQLError(result.error);
```

And for `data.errors` patterns:
```typescript
data.errors.map((e: any) => e.message).join("; ")
```
With:
```typescript
extractGraphQLError({ graphQLErrors: data.errors })
```

Add import in each router:
```typescript
import { ..., extractGraphQLError } from "../utils/helpers";
```

---

### Task 5: Tighten Legacy Brand/Color Attribute Matching

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts:1307-1314, 1572-1573`

**Context:** The legacy `brand` field is matched against any attribute whose slug *contains* "brand" or "manufacturer" (e.g., `slug.includes("brand")`). This can accidentally match unrelated attributes like "sub-brand-filter" or "rebrand-campaign". Same for `color`. Tighten to exact slug/name match only, since users should use `attr:Brand` for dynamic matching.

**Step 1: Fix brand matching (lines ~1307-1314)**

Replace:
```typescript
// Legacy brand field fallback — match any attribute containing "brand" or "manufacturer"
if (!value && first.brand) {
  if (slug === "brand" || name === "brand" ||
      slug.includes("brand") || slug.includes("manufacturer") ||
      name.includes("brand") || name.includes("manufacturer")) {
    value = first.brand;
  }
}
```
With:
```typescript
// Legacy brand field fallback — exact slug/name match only
if (!value && first.brand) {
  if (slug === "brand" || slug === "manufacturer" || name === "brand" || name === "manufacturer") {
    value = first.brand;
  }
}
```

**Step 2: Fix color matching (line ~1572)**

Replace:
```typescript
if (!value && (slug.includes("color") || slug.includes("colour") || name.includes("color"))) {
  value = vRow.color;
}
```
With:
```typescript
if (!value && vRow.color && (slug === "color" || slug === "colour" || name === "color" || name === "colour")) {
  value = vRow.color;
}
```

---

### Task 6: Clean Up `any` Types in Helpers

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/trpc/utils/helpers.ts:6-16, 39`

**Context:** The existing `assertQuerySuccess` and `tryParseDescription` functions use `any`. Type them properly.

**Step 1: Type assertQuerySuccess**

Replace:
```typescript
export function assertQuerySuccess(result: { data?: any; error?: any }, operationName: string) {
  if (result.error) {
    const gqlErrors = result.error.graphQLErrors?.map((e: any) => e.message).join("; ");
    const networkError = result.error.networkError?.message;
    const errorMsg = gqlErrors || networkError || result.error.message || "Unknown GraphQL error";
```
With:
```typescript
interface GraphQLQueryResult {
  data?: unknown;
  error?: {
    graphQLErrors?: Array<{ message: string }>;
    networkError?: { message: string };
    message?: string;
  };
}

export function assertQuerySuccess(result: GraphQLQueryResult, operationName: string) {
  if (result.error) {
    const errorMsg = extractGraphQLError(result.error, "Unknown GraphQL error");
```

**Step 2: Type tryParseDescription**

Replace:
```typescript
return parsed.blocks.map((b: any) => b.data?.text || "").join("\n");
```
With:
```typescript
return parsed.blocks.map((b: { data?: { text?: string } }) => b.data?.text || "").join("\n");
```

---

### Task 7: Validate Negative Stock & Missing Numeric Guard

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts`

**Context:** After Task 3 replaces `parseInt` with `safeParseInt(val, 0)`, negative stock values will correctly return `undefined` (skipped). But we should also add a warning in the import results when numeric values are invalid so users know their data was skipped.

**Step 1:** In the stock parsing loop (~line 1686-1690), add a warning log:

Replace the stock loop:
```typescript
if (whId && !isNaN(parseInt(val))) {
  stocks.push({ warehouse: whId, quantity: parseInt(val) });
}
```
With (using safeParseInt from Task 3):
```typescript
const qty = safeParseInt(val, 0);
if (whId && qty !== undefined) {
  stocks.push({ warehouse: whId, quantity: qty });
}
```

Same for single-warehouse stock (~line 1694-1697):
```typescript
const qty = safeParseInt(vRow.stock, 0);
if (qty !== undefined) {
  stocks.push({ warehouse: rowWarehouseId, quantity: qty });
}
```

---

### Task 8: Build Verification

**Step 1:** Build the app inside Docker:
```bash
docker exec saleor-bulk-manager-app-dev sh -c "cd /app/apps/bulk-manager && pnpm next build"
```

**Step 2:** Restart the container:
```bash
docker compose -f infra/docker-compose.dev.yml restart saleor-bulk-manager-app
```

**Step 3:** Check logs:
```bash
docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-bulk-manager-app
```

---

## Summary of Changes

| # | Type | Description | Files |
|---|------|-------------|-------|
| 1 | Bug fix | Dropship costPrice uses wrong field | products-router.ts |
| 2 | New helper | `safeParseInt`, `safeParseFloat` | helpers.ts |
| 3 | Bug fix | Replace bare parseInt/parseFloat (NaN guard) | products-router.ts |
| 4 | Cleanup | Extract `extractGraphQLError` + replace 26 inline patterns | helpers.ts + all 7 routers |
| 5 | Bug fix | Tighten brand/color attribute matching | products-router.ts |
| 6 | Cleanup | Remove `any` from helpers | helpers.ts |
| 7 | Bug fix | Validate negative stock | products-router.ts |

## Dynamic Import/Export Verification

The audit confirmed that product import/export is **fully dynamic**:
- Product types: resolved by name/slug, auto-created if `autoCreateProductTypes=true`
- Attributes: discovered from `attr:*` / `variantAttr:*` CSV prefixes, auto-created if `autoCreateAttributes=true`
- Attribute values: auto-created for DROPDOWN/MULTISELECT types
- Warehouses: resolved by name from `stock:*` CSV prefixes
- Categories, collections, tax classes: all resolved by name/slug lookup
- Export: attribute columns generated dynamically from actual product data
- Templates: generated from field metadata, not hardcoded

No hardcoded product types, attribute names, or slugs were found.
