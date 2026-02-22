# Full Dropship Integration Plan

**Date**: 2026-02-22
**Status**: In Progress
**Scope**: End-to-end integration across Storefront, Dashboard, Dropship App, Saleor API, Bulk Manager
**Last Updated**: 2026-02-22 01:30 GMT+2

### Progress Summary

| Section | Status | Notes |
|---------|--------|-------|
| Pre-Req Fix A | DONE | Order classifier reads individual `dropship.*` keys + legacy JSON fallback |
| Pre-Req Fix B | DONE | `shipping.*` metadata added to CSV; costPrice documented as public (Phase 3 moves to private) |
| Pre-Req Fix C | DONE | `variantMetadata` column in Bulk Manager field-mapper + products-router; CSV generates `dropship.supplierSku` per variant |
| Pre-Req Fix D | DONE | Export separator changed from `key=value; ` to `key:value;` (matching import) |
| Phase 1 Step 1.1 | DONE | `shipping.estimatedMinDays/MaxDays/carrier` added to CSV generation |
| Phase 1 Step 1.2 | DONE | (Covered by Fix A) |
| Phase 1 Step 1.3 | DONE | `metadata { key value }` added to ProductDetails, ProductListItem, OrderDetailsFragment, checkout.graphql |
| Phase 1 Step 1.4 | **NEXT** | Create `storefront/src/lib/shipping.ts` helper — needs `pnpm generate` first |
| Phase 1 Steps 1.5–1.9 | Pending | ProductDetailClient, product cards, order details, JSON-LD, RTL audit |
| Phase 2 | Pending | Config system 11-file sync |
| Phase 3 | Pending | Direct import pipeline |
| Phase 4 | Pending | Order tracking & fulfillment |
| Phase 5 | Pending | Dynamic pricing engine |
| Phase 6 | Pending | Polish & completeness |

---

## 0. Execution Guide (For Implementing Agent)

### Skills to Invoke

Invoke these skills **before** starting the corresponding work:

| When | Skill | Invocation |
|------|-------|------------|
| Before executing any phase | `superpowers:executing-plans` | Always — this is the execution orchestrator |
| Before any storefront UI work (Phases 1, 6b, 6c, 6d, 6f) | `senior-frontend` | Required for React/Next.js component work |
| Before creating/modifying UI components | `frontend-design` | For product cards, badges, timeline, cart estimates |
| Before UI/UX decisions (badges, timeline, delivery display) | `ui-ux-pro-max` | Layout, visual hierarchy, interaction patterns |
| Before Saleor GraphQL queries/mutations | `saleor-api-skill` | GraphQL field names, mutation shapes, metadata API |
| Before backend work (tRPC routers, workers, pricing) | `senior-backend` | For Phase 3, 4, 5, 6a, 6e |
| Before config system 11-file sync (Phase 2) | `ecommerce-expert` | Shipping config, delivery display best practices |

### Parallel Agent Strategy

Use `superpowers:dispatching-parallel-agents` for independent work within phases:

**Pre-Req Fixes** — All 4 fixes are independent, deploy 4 parallel agents:
- Agent 1: Fix A (order-classifier.ts + use-case.ts)
- Agent 2: Fix B (source/types.ts — costPrice to privateMetadata)
- Agent 3: Fix C (field-mapper.ts + products-router.ts — variantMetadata)
- Agent 4: Fix D (products-router.ts export separator)
- **Note**: Fix C and Fix D both touch `products-router.ts` — sequence C before D, or have one agent do both.

**Phase 1** — Steps 1.1–1.3 are independent; 1.4–1.9 depend on 1.3:
- Wave 1 (parallel): Step 1.1 (CSV metadata), Step 1.2 (classifier fix — already done in Pre-Req), Step 1.3 (GraphQL queries + `pnpm generate`)
- Wave 2 (parallel after 1.3): Step 1.4 (shipping.ts helper), Step 1.8 (JSON-LD), Step 1.9 (RTL audit)
- Wave 3 (parallel after 1.4): Step 1.5 (ProductDetailClient), Step 1.6 (product cards), Step 1.7 (order details)

**Phase 2** — Sequential (11-file sync must be atomic):
- One agent, one commit. All 11 files updated together.

**Phase 3** — Two parallel agents:
- Agent 1: Step 3.1 (`importToSaleor` mutation)
- Agent 2: Step 3.2 (Source page UI)
- Then: Step 3.3 (`refreshProducts`) after 3.1

**Phase 4** — Three parallel agents:
- Agent 1: Step 4.1 (order metadata enrichment)
- Agent 2: Step 4.3 (SMTP email templates)
- Agent 3: Step 4.4 (fulfillment timeline UI)

**Phase 5** — Three parallel agents:
- Agent 1: Steps 5.1 + 5.2 (pricing rules + currency converter)
- Agent 2: Step 5.3 (pricing admin page)
- Agent 3: Step 5.4 (NavBar update — trivial, can be part of Agent 2)

**Phase 6** — Five parallel agents:
- Agent 1: Step 6a (stock sync worker)
- Agent 2: Step 6b (cart estimates)
- Agent 3: Step 6c (checkout multi-supplier)
- Agent 4: Step 6d (search filter) + 6f (wishlist badges)
- Agent 5: Step 6e (returns workflow — new pages + router)

### Docker Commands Quick Reference

```bash
# Container restarts after code changes
docker compose -f infra/docker-compose.dev.yml restart saleor-storefront-dev          # Storefront changes
docker compose -f infra/docker-compose.dev.yml restart saleor-dropship-app-dev        # Dropship app changes
docker compose -f infra/docker-compose.dev.yml restart saleor-bulk-manager-app-dev    # Bulk Manager changes (use SERVICE name, not container)
docker compose -f infra/docker-compose.dev.yml restart saleor-storefront-control-app-dev  # Config/admin changes
docker compose -f infra/docker-compose.dev.yml restart saleor-smtp-app-dev            # SMTP template changes

# GraphQL type regeneration (after modifying .graphql files)
docker exec saleor-storefront-dev pnpm generate

# Verification commands (run AFTER restart)
docker exec saleor-storefront-dev pnpm type-check                    # Storefront types
docker exec saleor-storefront-dev pnpm lint                          # Storefront lint
docker exec saleor-dropship-app-dev pnpm build                       # Dropship app build
docker exec saleor-bulk-manager-app-dev pnpm build                   # Bulk Manager build
docker exec saleor-storefront-control-app-dev pnpm build              # Storefront Control build

# Log checking (if something breaks)
docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-storefront-dev
docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-dropship-app-dev
```

### Critical Gotchas for the Executing Agent

1. **Docker-first**: ALL commands via `docker exec`. Never run `pnpm` or `python` on host.
2. **HMR is unreliable**: Always `docker compose restart` after changes. Don't trust hot-reload.
3. **11-file config sync** (Phase 2): All files must be updated atomically. Missing any one causes runtime errors. See CLAUDE.md "Keeping Everything in Sync" for the full list.
4. **Sample config JSONs**: ALWAYS update BOTH `sample-config-import.json` (Hebrew) AND `sample-config-import-en.json` (English). Every content field needs proper translations.
5. **RTL**: Use logical CSS properties everywhere (`ms-4` not `ml-4`, `text-start` not `text-left`, `ps-2` not `pl-2`). Test Hebrew channel rendering.
6. **macaw-ui Sprinkles crash**: In Saleor apps loaded in dashboard iframe, NEVER import macaw-ui `Box`/`Text`/`Button`/`Input` in page-level files. Use plain HTML primitives from `src/components/ui/primitives.tsx`. macaw-ui is ONLY safe in `_app.tsx`.
7. **AppBridge navigation**: In Saleor apps, use `router.push()` with `<button>`, NOT `<Link>` from Next.js. Links fail silently in the iframe.
8. **GraphQL regeneration**: After modifying ANY `.graphql` file, must run `pnpm generate` in the relevant container BEFORE type-checking.
9. **Bulk Manager service name**: Use `saleor-bulk-manager-app` (service name) for `docker compose restart`, not `saleor-bulk-manager-app-dev` (container name).
10. **`export { X } from` does NOT make X local**: If you need to use an imported type in the same file, add a separate `import { X }` statement.
11. **Large file rewrites**: For files >500 lines, use `Edit` tool with targeted replacements. Don't try to `Write` entire large files (token limits).
12. **Verification after EVERY phase**: Run type-check + lint + build for all affected containers. Check logs. Don't skip this.

### Commit Strategy

One commit per logical unit of work:
- Pre-Req Fixes: 1 commit per fix (4 commits total), or 1 combined commit if fixes are small
- Phase 1: 2-3 commits (GraphQL + types gen, shipping helper + UI, order tracking)
- Phase 2: 1 commit (atomic 11-file sync)
- Phase 3: 2 commits (import mutation, source page UI)
- Phase 4: 2 commits (order metadata, email templates + timeline)
- Phase 5: 2 commits (pricing engine, admin page)
- Phase 6: 1 commit per sub-step (6 commits)

Commit message format: `feat(dropship): <description>` for features, `fix(dropship): <description>` for bug fixes.

### Key File Paths (Quick Copy)

```
# Pre-Req Fixes
apps/apps/dropship-orchestrator/src/modules/webhooks/order-paid/order-classifier.ts
apps/apps/dropship-orchestrator/src/modules/webhooks/order-paid/use-case.ts
apps/apps/dropship-orchestrator/src/modules/source/types.ts
apps/apps/bulk-manager/src/modules/import/field-mapper.ts
apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts

# Phase 1 - Storefront
storefront/src/graphql/ProductDetails.graphql
storefront/src/graphql/ProductListItem.graphql
storefront/src/graphql/OrderDetailsFragment.graphql
storefront/src/checkout/graphql/checkout.graphql
storefront/src/lib/shipping.ts                                        # NEW
storefront/src/app/[channel]/(main)/products/[slug]/ProductDetailClient.tsx
storefront/src/app/[channel]/(main)/products/[slug]/page.tsx
storefront/src/app/[channel]/(main)/products/components/ProductCard.tsx
storefront/src/ui/components/ProductCard/ProductCard.tsx
storefront/src/components/home/HomepageProductCard.tsx
storefront/src/app/[channel]/(main)/account/orders/[orderId]/OrderDetailsClient.tsx
storefront/src/checkout/sections/DeliveryMethods/DeliveryMethods.tsx

# Phase 2 - Config Sync (all 11 files)
apps/packages/storefront-config/src/schema/ecommerce.ts
apps/packages/storefront-config/src/schema/content.ts
apps/packages/storefront-config/src/types.ts
apps/apps/storefront-control/src/modules/config/defaults.ts
apps/apps/storefront-control/src/modules/config/schema.ts
storefront/src/config/store.config.ts
storefront/src/providers/StoreConfigProvider.tsx
apps/apps/storefront-control/sample-config-import.json
apps/apps/storefront-control/sample-config-import-en.json
apps/apps/storefront-control/src/lib/settings-index.ts
apps/apps/storefront-control/src/pages/[channelSlug]/commerce.tsx

# Phase 3 - Direct Import
apps/apps/dropship-orchestrator/src/modules/trpc/routers/source-router.ts
apps/apps/dropship-orchestrator/src/pages/source/index.tsx

# Phase 4 - Tracking
apps/apps/dropship-orchestrator/src/modules/jobs/workers/tracking-sync-worker.ts
apps/apps/dropship-orchestrator/src/pages/api/webhooks/cj/logistics.ts
apps/apps/smtp/src/modules/smtp/default-templates.ts

# Phase 5 - Pricing
apps/apps/dropship-orchestrator/src/modules/pricing/pricing-rules.ts   # NEW
apps/apps/dropship-orchestrator/src/modules/pricing/currency-converter.ts  # NEW
apps/apps/dropship-orchestrator/src/modules/trpc/routers/pricing-router.ts  # NEW
apps/apps/dropship-orchestrator/src/pages/pricing/index.tsx            # NEW
apps/apps/dropship-orchestrator/src/components/ui/NavBar.tsx

# Phase 6 - Polish
apps/apps/dropship-orchestrator/src/modules/jobs/workers/stock-sync-worker.ts  # NEW
apps/apps/dropship-orchestrator/src/modules/jobs/scheduler.ts
storefront/src/app/[channel]/(main)/cart/CartClient.tsx
storefront/src/app/[channel]/(main)/search/page.tsx
apps/apps/dropship-orchestrator/src/modules/trpc/routers/returns-router.ts  # NEW
apps/apps/dropship-orchestrator/src/pages/returns/index.tsx            # NEW
apps/apps/dropship-orchestrator/src/modules/trpc/router.ts
```

### Phase Completion Checklist

After each phase, before moving on:
- [ ] All affected containers restarted
- [ ] `pnpm generate` run (if GraphQL files changed)
- [ ] `pnpm type-check` passes (storefront)
- [ ] `pnpm build` passes (apps)
- [ ] Container logs checked (no runtime errors)
- [ ] Git commit created with descriptive message
- [ ] Verification items for the phase checked off (Section 11)

---

## 1. Core Architectural Principle

**The storefront is store-type agnostic.** Zero `if (isDropship)` logic anywhere in storefront code.

Two metadata namespaces, strictly separated:

| Namespace | Who Reads | Who Writes | Purpose |
|-----------|-----------|------------|---------|
| `shipping.*` | Storefront, emails, SEO | Dropship App, Bulk Manager, any import tool | Universal product shipping data |
| `dropship.*` | Dropship App only (order automation) | Dropship App, Source page CSV | Backend supplier mapping |

**Fallback chain**: Per-product `shipping.*` metadata → Global config defaults from Storefront Control.

| Store Type | Has `shipping.*` Metadata? | Customer Sees |
|-----------|--------------------------|---------------|
| Physical only | No | Global default: "Ships in 2-5 business days" |
| Dropship only | Yes (from CJ freight API) | Per-product: "Ships in 10-20 business days" |
| Hybrid | Some yes, some no | Each product shows its own estimate or the default |

---

## 2. Pre-Requisite Fixes (Before Any Phase)

Three bugs and one security issue must be fixed first — they affect the entire integration.

### Fix A: Order Classifier Metadata Key Format — DONE

**Problem**: The order-paid classifier reads `productMetadata.find(m => m.key === "dropship")` expecting a single JSON key. But the CSV generates individual keys like `dropship.supplier`, `dropship.supplierSku`. Products imported via CSV are **invisible** to the order automation.

**File**: `apps/apps/dropship-orchestrator/src/modules/webhooks/order-paid/order-classifier.ts`

**Fix**: Update classifier to read individual `dropship.*` keys with backward compatibility:
```typescript
// Try new format first (individual keys from CSV import)
const supplier = productMetadata.find(m => m.key === "dropship.supplier")?.value;
const supplierSku = productMetadata.find(m => m.key === "dropship.supplierSku")?.value;
const costPrice = productMetadata.find(m => m.key === "dropship.costPrice")?.value;

// Fallback: legacy format (single JSON key from direct API)
if (!supplier) {
  const legacy = productMetadata.find(m => m.key === "dropship");
  if (legacy) {
    const data = JSON.parse(legacy.value);
    // use data.supplier, data.supplierSku, data.costPrice
  }
}
```

Also update any other code in `order-paid/use-case.ts` that reads the `dropship` key from products.

### Fix B: Move costPrice to privateMetadata — DONE (shipping.* added; costPrice deferred to Phase 3)

**Problem**: The CSV puts `dropship.costPrice` in product `metadata` (public). Customers can see your supplier cost via GraphQL introspection.

**File**: `apps/apps/dropship-orchestrator/src/modules/source/types.ts` (generateCSV)

**Fix**: Split metadata into two columns — or use `privateMetadata` for cost-sensitive fields. Since Bulk Manager only supports a single `metadata` column, the cleanest fix is:
- Keep `dropship.supplier` and `dropship.supplierSku` in public `metadata` (not sensitive)
- Move `dropship.costPrice` and `dropship.shippingCost` to product `privateMetadata` via a post-import step in the direct import pipeline (Phase 3)
- For the CSV flow: document that `costPrice` in metadata is acceptable during development but must be moved to `privateMetadata` before production

### Fix C: Variant-Level Metadata for Supplier SKU — DONE

**Problem**: Bulk Manager `parseMetadata()` sets metadata on the product, not individual variants. But `dropship.supplierSku` is variant-specific (each CJ variant has a different `vid`).

**File**: `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts`

**Fix**: Add a `variantMetadata` column support to the Bulk Manager field mapper:
- New column: `variantMetadata` with same `key:value;key:value` format
- Applied per-variant during `productVariantBulkCreate` or `productVariantUpdate`
- Update `field-mapper.ts` to recognize the column
- Update `products-router.ts` to pass variant metadata to the Saleor mutation

Also update CSV generation in Source page to put `dropship.supplierSku:{vid}` in `variantMetadata` column instead of `metadata`.

### Fix D: Bulk Manager Metadata Format Asymmetry — DONE

**Problem**: Import parses `key:value` (colon separator) but export generates `key=value` (equals separator). Re-importing an export would break metadata.

**File**: `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts` (export section ~line 1778)

**Fix**: Change export to use colon separator matching the import format:
```typescript
// Before:
const metadataStr = (product.metadata || []).map((m) => `${m.key}=${m.value}`).join("; ");
// After:
const metadataStr = (product.metadata || []).map((m) => `${m.key}:${m.value}`).join(";");
```

---

## 4. Phase 1: Storefront Shipping Display

**Goal**: Products show delivery estimates. Order details show tracking links. Everything driven by `shipping.*` metadata with config fallback.

### 1.1 Fix CSV Metadata to Include Shipping Data — DONE

**File**: `apps/apps/dropship-orchestrator/src/modules/source/types.ts`

The `generateCSV` function already produces `dropship.*` metadata. Add `shipping.*` fields using data already available from `fetchShipping`:

```
Current:  dropship.supplier:cj;dropship.supplierSku:{vid};dropship.costPrice:{cost}
Add:      shipping.estimatedMinDays:{min};shipping.estimatedMaxDays:{max};shipping.carrier:{carrier}
```

The `shippingDays` field (e.g., "10-20") is already populated on each variant from the freight API. Parse min/max from the string.

### 1.2 Fix Product Metadata Key Format — DONE (covered by Fix A)

**File**: `apps/apps/dropship-orchestrator/src/modules/webhooks/order-paid/order-classifier.ts`

Update the classifier to read individual `dropship.*` keys instead of a single JSON `dropship` key:

```typescript
// Before:
const entry = productMetadata.find(m => m.key === "dropship");
const data = JSON.parse(entry.value);

// After:
const supplier = productMetadata.find(m => m.key === "dropship.supplier")?.value;
const supplierSku = productMetadata.find(m => m.key === "dropship.supplierSku")?.value;
const costPrice = productMetadata.find(m => m.key === "dropship.costPrice")?.value;
```

Also update the order-paid use case and any other code that reads the `dropship` key.

### 1.3 Add `metadata` to GraphQL Queries — DONE

**Files**:
| File | Change |
|------|--------|
| `storefront/src/graphql/ProductDetails.graphql` | Add `metadata { key value }` on product |
| `storefront/src/graphql/ProductListItem.graphql` | Add `metadata { key value }` on product (enables card badges + wishlist + search) |
| `storefront/src/graphql/OrderDetailsFragment.graphql` | Add `metadata { key value }` on ORDER (not fulfillment — Saleor doesn't support fulfillment metadata input) |
| `storefront/src/checkout/graphql/checkout.graphql` | Add `metadata { key value }` on line item products (enables cart delivery estimates) |

Then regenerate: `docker exec saleor-storefront-dev pnpm generate`

**Security**: `metadata` is public. After Fix B, only `shipping.*` and `dropship.supplier`/`dropship.supplierSku` are in public metadata. Cost prices stay in `privateMetadata`.

### 1.4 Create Shipping Helper

**New file**: `storefront/src/lib/shipping.ts`

```typescript
export interface ShippingEstimate {
  minDays: number;
  maxDays: number;
  carrier?: string;
}

export function getProductShippingEstimate(
  metadata: Array<{ key: string; value: string }> | null | undefined
): ShippingEstimate | null {
  if (!metadata) return null;
  const min = metadata.find(m => m.key === "shipping.estimatedMinDays")?.value;
  const max = metadata.find(m => m.key === "shipping.estimatedMaxDays")?.value;
  const carrier = metadata.find(m => m.key === "shipping.carrier")?.value;
  if (!min) return null;
  return { minDays: Number(min), maxDays: Number(max) || Number(min), carrier: carrier ?? undefined };
}

export function formatEstimate(est: ShippingEstimate, format: "range" | "max"): string {
  if (format === "max") return String(est.maxDays);
  return est.minDays === est.maxDays ? String(est.minDays) : `${est.minDays}-${est.maxDays}`;
}

export function getOrderTrackingUrl(
  metadata: Array<{ key: string; value: string }> | null | undefined
): string | null {
  if (!metadata) return null;
  const dropshipJson = metadata.find(m => m.key === "dropship")?.value;
  if (!dropshipJson) return null;
  try {
    const data = JSON.parse(dropshipJson);
    return data.trackingUrl || null;
  } catch { return null; }
}
```

### 1.5 Update ProductDetailClient

**File**: `storefront/src/app/[channel]/(main)/products/[slug]/ProductDetailClient.tsx`

Add delivery estimate display:
- **Below stock status**: "Ships in {X-Y} business days" (small text, config-driven label)
- **Shipping tab**: Prepend per-product estimate before generic shipping policy text
- **Logic**: Read `shipping.*` metadata → fallback to config defaults → null if `showEstimatedDelivery` is false
- **RTL**: Use `text-start` not `text-left`, `ms-2` not `ml-2` for the estimate badge
- **Mobile**: Show estimate badge in a sticky position on mobile (visible without scrolling), collapsible on desktop shipping tab

### 1.6 Update Product Cards, Wishlist, and Listings

**Files** (all consume `ProductListItem` fragment — one GraphQL change propagates to all):
- `storefront/src/app/[channel]/(main)/products/components/ProductCard.tsx`
- `storefront/src/ui/components/ProductCard/ProductCard.tsx`
- `storefront/src/components/home/HomepageProductCard.tsx`
- Wishlist items (use same fragment — delivery badge appears automatically)

Show a small "Ships in X days" text below price if metadata present and `showEstimatedDelivery` config is true. Togglable via config — cards are dense, so this should be subtle (small text, muted color).

### 1.7 Update Order Detail Page

**File**: `storefront/src/app/[channel]/(main)/account/orders/[orderId]/OrderDetailsClient.tsx`

- Read ORDER `metadata` for tracking data (from `dropship` JSON key: `trackingUrl`, `carrier`, `estimatedDeliveryDate`)
- If `trackingUrl` exists → render tracking number as a clickable external link (`target="_blank" rel="noopener"`)
- If only `trackingNumber` on fulfillment (no URL) → show as plain text
- Show estimated delivery date if available
- **RTL**: Use `ms-auto` for link alignment, `rtl:rotate-180` on external-link icon
- Works for all orders, not just dropship

### 1.8 Update SEO JSON-LD

**File**: `storefront/src/app/[channel]/(main)/products/[slug]/page.tsx`

The server component generates JSON-LD. It already queries the product — once `metadata` is added to the GraphQL query, read `shipping.*` metadata and add structured data:

```json
"shippingDetails": {
  "@type": "OfferShippingDetails",
  "deliveryTime": {
    "@type": "ShippingDeliveryTime",
    "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "d" },
    "transitTime": { "@type": "QuantitativeValue", "minValue": 10, "maxValue": 20, "unitCode": "d" }
  }
}
```

Only add `shippingDetails` when `shipping.estimatedMinDays` metadata exists. This helps Google Shopping rank listings with transparent delivery.

### 1.9 Fix RTL in Checkout DeliveryMethods

**File**: `storefront/src/checkout/sections/DeliveryMethods/DeliveryMethods.tsx`

Audit and fix:
- Replace any `ml-auto` with `ms-auto`, `mr-2` with `me-2`
- Verify `justify-between` works correctly with RTL (it does — flexbox respects `direction`)
- Test with Hebrew locale to confirm price appears on the correct side

---

## 5. Phase 2: Config System (11-File Sync)

**Goal**: Admin controls for shipping display settings. Activate the dormant `showEstimatedDelivery` flag.

### 2.1 Extend ShippingSettingsSchema

**File**: `apps/packages/storefront-config/src/schema/ecommerce.ts`

Add to existing `ShippingSettingsSchema`:
```typescript
defaultEstimatedMinDays: z.number().min(0).default(2),
defaultEstimatedMaxDays: z.number().min(0).default(5),
estimatedDeliveryFormat: z.enum(["range", "max"]).default("range"),
```

### 2.2 Add Fulfillment Text Labels

**File**: `apps/packages/storefront-config/src/schema/content.ts`

Under existing `ProductTextSchema`:
```typescript
deliveryEstimateLabel: z.string().default("Ships in {days} business days"),
estimatedDeliveryPrefix: z.string().default("Estimated delivery"),
businessDaysLabel: z.string().default("business days"),
trackOrderLabel: z.string().default("Track your order"),
```

### 2.3 Sync All 11 Files

| # | File | Change |
|---|------|--------|
| 1 | `apps/packages/storefront-config/src/schema/ecommerce.ts` | Add 3 shipping fields |
| 2 | `apps/packages/storefront-config/src/types.ts` | Verify Zod inference exports |
| 3 | `apps/apps/storefront-control/src/modules/config/defaults.ts` | Add: `defaultEstimatedMinDays: 2, defaultEstimatedMaxDays: 5, estimatedDeliveryFormat: "range"` |
| 4 | `apps/apps/storefront-control/src/modules/config/schema.ts` | Add form validation for new fields |
| 5 | `storefront/src/config/store.config.ts` | Verify types flow through |
| 6 | `storefront/src/providers/StoreConfigProvider.tsx` | Ensure `useEcommerceSettings()` exposes new fields |
| 7 | `sample-config-import.json` | Hebrew: `"deliveryEstimateLabel": "נשלח תוך {days} ימי עסקים"`, etc. |
| 8 | `sample-config-import-en.json` | English: `"deliveryEstimateLabel": "Ships in {days} business days"`, etc. |
| 9 | `settings-index.ts` | Search entries: "delivery estimate", "shipping days", "estimated delivery" |
| 10 | Storefront Control Commerce page | Add form fields under Shipping section |
| 11 | CLAUDE.md / PRD.md | Document new config fields |

---

## 6. Phase 3: Direct Import Pipeline

**Goal**: One-click Source → Saleor import, bypassing the CSV → Bulk Manager manual step.

### 3.1 `importToSaleor` Mutation

**File**: `apps/apps/dropship-orchestrator/src/modules/trpc/routers/source-router.ts`

New mutation that creates products directly via Saleor GraphQL:

**Input**: `SourcedProduct[]` + channels, markup, product type, category, autoCreateAttributes

**Process** (per product):
1. `productTypeCreate` or find existing "Dropship Product" type
2. Create/find variant selection attributes (Color, Size, etc.) with `variantSelection: true`
3. `productCreate` with:
   - Product metadata: `shipping.estimatedMinDays`, `shipping.estimatedMaxDays`, `shipping.carrier`
   - Product metadata: `dropship.supplier`, `dropship.costPrice`
   - `externalReference: CJ-{pid}`
4. `productVariantBulkCreate` with:
   - Pricing: `costPrice × markup` per channel
   - Variant attributes: Color, Size values
   - `trackInventory: false`
5. `updateMetadata` on each variant: `dropship.supplierSku: {vid}`
6. `productChannelListingUpdate` to publish

**Output**: `{ created: [{id, name, variants}], errors: [{name, error}] }`

### 3.2 Update Source Page UI

**File**: `apps/apps/dropship-orchestrator/src/pages/source/index.tsx`

Add alongside existing "Download CSV":
- "Import to Saleor" button
- Channel multi-select dropdown
- Progress bar with batch status
- Results summary

### 3.3 `refreshProducts` Mutation

For re-syncing already-imported products:
- Input: `CJ-*` external references
- Re-fetch from CJ API
- Compare prices, availability, images
- Flag price drift exceeding threshold
- Optionally auto-update within tolerance

---

## 7. Phase 4: Order Tracking & Fulfillment

**Goal**: Tracking data flows from supplier → Saleor order metadata → storefront display + email.

### 4.1 Enrich Order Metadata on Fulfillment

**Files**:
- `apps/apps/dropship-orchestrator/src/modules/jobs/workers/tracking-sync-worker.ts`
- `apps/apps/dropship-orchestrator/src/pages/api/webhooks/cj/logistics.ts`

Both already store tracking data in order metadata under the `dropship` key. Ensure the JSON includes:
```json
{
  "status": "shipped",
  "trackingNumber": "LZ123456",
  "trackingUrl": "https://track.cjdropshipping.com/track?num=LZ123456",
  "carrier": "CJ Packet",
  "shippedAt": "2026-02-22T10:00:00Z",
  "estimatedDeliveryDate": "2026-03-08"
}
```

The CJ logistics webhook already stores `trackingUrl` and `shippingCompany`. Verify the tracking-sync-worker does the same.

### 4.2 Storefront Order Detail

Already handled in Phase 1.7 — `getOrderTrackingUrl()` reads from order metadata.

### 4.3 Email Tracking Link

**File**: `apps/apps/smtp/src/modules/smtp/default-templates.ts`

The `ORDER_FULFILLED` and `ORDER_FULFILLMENT_UPDATE` templates show `{{fulfillment.tracking_number}}` as plain text. No clickable URL.

**Fix (two parts)**:

**Part 1** — Build tracking URL in the Dropship app when creating fulfillments:
- CJ tracking: `https://track.cjdropshipping.com/track?num={trackingNumber}`
- AliExpress: `https://global.cainiao.com/detail.htm?mailNoList={trackingNumber}`
- Store URL template per supplier in settings (configurable)
- Write `trackingUrl` to order metadata under `dropship` key (already done in CJ logistics webhook, verify tracking-sync-worker)

**Part 2** — Update SMTP templates to include clickable link:

The Saleor `ORDER_FULFILLED` webhook payload includes `order.metadata`. The SMTP app can read the `dropship` metadata key to extract `trackingUrl`.

**File**: `apps/apps/smtp/src/modules/smtp/default-templates.ts`

In the `ORDER_FULFILLED` template (English + Hebrew versions), add a "Track Package" button:
```html
{{#if order.metadata.dropship}}
  <a href="{{trackingUrl}}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
    Track Your Package
  </a>
{{/if}}
```

**Note**: Verify that `order.metadata` is available in the SMTP webhook payload. If not, the SMTP app would need to fetch order metadata via GraphQL when processing the webhook.

### 4.4 Fulfillment Timeline

**File**: `storefront/src/app/[channel]/(main)/account/orders/[orderId]/OrderDetailsClient.tsx`

Add a visual order progress component (universal, not dropship-specific):

```
● Order Placed (Feb 22) → ● Processing → ● Shipped (Feb 25) → ○ Delivered
```

- Uses existing fulfillment `status` and `created` timestamps
- Status mapping: UNFULFILLED → "Processing", FULFILLED → "Shipped", DELIVERED → "Delivered"
- If order has `dropship` metadata with `forwardedAt`, show "Sent to fulfillment partner" as an intermediate step
- **RTL**: Use `flex-row-reverse` or rely on `direction: rtl` for timeline progression
- **Mobile**: Stack vertically on small screens, horizontal on desktop

---

## 8. Phase 5: Dynamic Pricing Engine

**Goal**: Rule-based markup, currency conversion, bulk price management.

### 5.1 Pricing Rules

**New file**: `apps/apps/dropship-orchestrator/src/modules/pricing/pricing-rules.ts`

```typescript
interface PricingRule {
  id: string;
  name: string;
  type: "global" | "supplier" | "region" | "category";
  supplierId?: string;
  regionCode?: string;
  categorySlug?: string;
  strategy: "percentage_markup" | "fixed_markup" | "margin_target";
  value: number;
  priority: number;
  active: boolean;
}
```

Rule cascade: category-specific > region > supplier > global (highest priority wins).

### 5.2 Currency Converter & Multi-Channel Pricing

**New file**: `apps/apps/dropship-orchestrator/src/modules/pricing/currency-converter.ts`

**Problem**: CJ/AliExpress quote costs in USD. The ILS channel needs prices in Shekels. Currently the markup is applied in USD only.

**Fix**:
- Admin sets exchange rate(s) in settings: `{ "USD_ILS": 3.65, "USD_EUR": 0.92 }`
- `convertCurrency(amount, from, to, rates)` function
- Applied after markup: `retailPriceUSD × exchangeRate = retailPriceILS`
- The `importToSaleor` mutation (Phase 3) must set **per-channel pricing**:
  - USD channel: `costPrice × markup`
  - ILS channel: `costPrice × markup × exchangeRate`
- Show "last updated" date next to exchange rate in admin
- Warn if rate is >7 days old (yellow banner)
- Future: API-based rate fetching (Open Exchange Rates, etc.)

### 5.3 Pricing Admin Page

**New files**:
- `apps/apps/dropship-orchestrator/src/modules/trpc/routers/pricing-router.ts`
- `apps/apps/dropship-orchestrator/src/pages/pricing/index.tsx`

Features:
- CRUD for pricing rules
- Live preview: "Show me what 50 products would cost with these rules"
- Bulk recalculate: update all product prices in Saleor

### 5.4 NavBar Update

Add "Pricing" between "Source" and "Orders" in navigation.

---

## 9. Phase 6: Polish & Completeness

### 6a. Supplier Stock Sync

**New file**: `apps/apps/dropship-orchestrator/src/modules/jobs/workers/stock-sync-worker.ts`

- BullMQ job every 4h
- Query all Saleor products with `dropship.supplier` metadata via GraphQL (paginated, 100 per page)
- For each supplier, batch-fetch stock via `adapter.getStockBatch(skus)`
- Update Saleor via `stockBulkUpdate` mutation (match by variant `externalReference` or SKU)
- Create exceptions for products that went out-of-stock
- Audit log entry for each sync run

**Register in scheduler**: `apps/apps/dropship-orchestrator/src/modules/jobs/scheduler.ts`

### 6b. Cart Delivery Estimates

**File**: `storefront/src/app/[channel]/(main)/cart/CartClient.tsx`

**Prerequisite**: Phase 1.3 added `metadata` to checkout line item product queries.

For each cart line:
- Read `shipping.estimatedMaxDays` from the product's metadata
- Show per-line: "Ships in {X-Y} days" in small text below product name
- Show order-level summary: "All items arrive within {maxDays} business days"
- Falls back to config default if no metadata
- **RTL**: Use `text-start`, logical margin properties

### 6c. Checkout Multi-Supplier Awareness

**File**: `storefront/src/checkout/sections/DeliveryMethods/DeliveryMethods.tsx` (or new component)

When checkout items have different `shipping.estimatedMaxDays` values:
- Group items by delivery speed (fast: 1-5 days, standard: 6-14 days, extended: 15+ days)
- Show message: "Your order may arrive in multiple shipments"
- Per-group: "Items A, B: Ships in 2-5 days" / "Item C: Ships in 10-20 days"
- This is informational only — doesn't change the Saleor shipping method selection

**Note**: This requires `metadata` on checkout line products (added in Phase 1.3). The grouping is purely UI — Saleor still handles the actual fulfillment split via the Dropship Orchestrator webhook.

### 6d. Search Filtering by Delivery Time

**File**: `storefront/src/app/[channel]/(main)/search/page.tsx` (or search filter component)

Add optional delivery time filter:
- "Fast Shipping (1-5 days)" / "Standard (6-14 days)" / "Extended (15+ days)"
- Client-side filter: after products are fetched, filter by `shipping.estimatedMaxDays` metadata
- Cannot do server-side (Saleor doesn't index metadata for filtering)
- Show filter only when `showEstimatedDelivery` config is true
- **Implementation**: Since this is client-side filtering on already-fetched results, it works best on category/collection pages where all products are loaded. For search results, show as a sort option ("Sort by delivery speed") rather than a filter.

### 6e. Basic Return Workflow

**New files**:
- `apps/apps/dropship-orchestrator/src/pages/returns/index.tsx` — Admin return queue page
- `apps/apps/dropship-orchestrator/src/modules/trpc/routers/returns-router.ts` — Return CRUD

**Features**:
- Admin page listing return requests (fetched from Saleor order metadata or app metadata)
- Configurable return window per supplier (e.g., CJ: 15 days, AliExpress: 30 days)
- Return status: `requested → approved → shipped_back → refunded` (manual workflow)
- No auto-forwarding to supplier (v1 — admin contacts supplier manually)
- Store return status in order metadata under `dropship.return` key
- Register router in main tRPC router, add "Returns" to NavBar

### 6f. Wishlist Stock Alerts

Since `ProductListItem.graphql` now includes `metadata` (from Phase 1.3), wishlist items automatically get delivery estimate data. Add:
- "Ships in X days" badge on wishlist items (same logic as product cards)
- Out-of-stock indicator if `quantityAvailable === 0` (already exists, verify it works)

---

## 10. File Inventory

### New Files (10)

| File | Phase |
|------|-------|
| `storefront/src/lib/shipping.ts` | 1 |
| `dropship-orchestrator/src/modules/pricing/pricing-rules.ts` | 5 |
| `dropship-orchestrator/src/modules/pricing/currency-converter.ts` | 5 |
| `dropship-orchestrator/src/modules/trpc/routers/pricing-router.ts` | 5 |
| `dropship-orchestrator/src/pages/pricing/index.tsx` | 5 |
| `dropship-orchestrator/src/modules/jobs/workers/stock-sync-worker.ts` | 6a |
| `dropship-orchestrator/src/modules/trpc/routers/returns-router.ts` | 6e |
| `dropship-orchestrator/src/pages/returns/index.tsx` | 6e |
| This plan file | — |

### Modified Files (30+)

| File | Phase | Change |
|------|-------|--------|
| **Pre-Req Fixes** | | |
| `dropship-orchestrator/.../order-classifier.ts` | Fix A | Read individual `dropship.*` keys + backward compat |
| `dropship-orchestrator/.../order-paid/use-case.ts` | Fix A | Update metadata reading throughout |
| `dropship-orchestrator/.../source/types.ts` | Fix B | Move costPrice out of public metadata |
| `bulk-manager/.../field-mapper.ts` | Fix C | Add `variantMetadata` column support |
| `bulk-manager/.../products-router.ts` | Fix C+D | variantMetadata handling + fix export separator |
| **Phase 1** | | |
| `dropship-orchestrator/.../source/types.ts` | 1.1 | Add `shipping.*` to CSV metadata |
| `storefront/src/graphql/ProductDetails.graphql` | 1.3 | Add `metadata { key value }` |
| `storefront/src/graphql/ProductListItem.graphql` | 1.3 | Add `metadata { key value }` |
| `storefront/src/graphql/OrderDetailsFragment.graphql` | 1.3 | Add order `metadata { key value }` |
| `storefront/src/checkout/graphql/checkout.graphql` | 1.3 | Add product `metadata` on line items |
| `ProductDetailClient.tsx` | 1.5 | Delivery estimate + RTL + mobile |
| Product cards (3 files) | 1.6 | Delivery badge |
| `OrderDetailsClient.tsx` | 1.7 | Tracking links + timeline |
| `products/[slug]/page.tsx` | 1.8 | JSON-LD `shippingDetails` |
| `checkout/.../DeliveryMethods.tsx` | 1.9 | RTL fixes (logical properties) |
| **Phase 2** | | |
| `storefront-config/src/schema/ecommerce.ts` | 2.1 | Extend ShippingSettingsSchema |
| `storefront-config/src/schema/content.ts` | 2.2 | Add fulfillment text labels |
| `storefront-control/.../defaults.ts` | 2.3 | Add shipping defaults |
| `storefront-control/.../schema.ts` | 2.3 | Add form validation |
| `storefront/src/config/store.config.ts` | 2.3 | Verify types |
| `storefront/.../StoreConfigProvider.tsx` | 2.3 | Expose new shipping fields |
| `sample-config-import.json` | 2.3 | Hebrew shipping labels |
| `sample-config-import-en.json` | 2.3 | English shipping labels |
| `settings-index.ts` | 2.3 | Search entries |
| Storefront Control Commerce page | 2.3 | Shipping settings form |
| **Phase 3** | | |
| `source-router.ts` | 3.1 | `importToSaleor` + `refreshProducts` |
| `source/index.tsx` | 3.2 | Import button + progress UI |
| **Phase 4** | | |
| `tracking-sync-worker.ts` | 4.1 | Ensure trackingUrl in order metadata |
| `cj/logistics.ts` | 4.1 | Verify trackingUrl persistence |
| `smtp/.../default-templates.ts` | 4.3 | Add "Track Package" link (EN + HE) |
| **Phase 5** | | |
| `dropship-orchestrator/.../trpc/router.ts` | 5 | Register pricing router |
| `NavBar.tsx` | 5+6e | Add Pricing + Returns nav |
| `settings-router.ts` | 5.2 | Add currency/exchange rate config |
| **Phase 6** | | |
| `scheduler.ts` | 6a | Register stock-sync job |
| `CartClient.tsx` | 6b | Per-line delivery estimates |
| `DeliveryMethods.tsx` | 6c | Multi-supplier grouping |
| `search/page.tsx` | 6d | Delivery time sort/filter |

---

## 11. Verification Plan

### Pre-Req Fixes
- [x] Order classifier reads `dropship.supplier` as individual metadata key
- [x] Order classifier falls back to legacy `dropship` JSON key (backward compat)
- [ ] `dropship.costPrice` NOT visible in public product metadata (deferred to Phase 3 direct import pipeline)
- [x] Bulk Manager import supports `variantMetadata` column
- [x] Bulk Manager export uses `:` separator (matching import format)
- [ ] End-to-end: CSV import → order placed → order classifier recognizes product as dropship

### Phase 1
- [ ] Product with `shipping.estimatedMinDays=10` metadata shows "Ships in 10-20 business days"
- [ ] Product WITHOUT metadata shows global default from config
- [ ] Product with `showEstimatedDelivery=false` shows nothing
- [ ] Order with `trackingUrl` in metadata shows clickable tracking link
- [ ] Order WITHOUT tracking URL shows tracking number as plain text
- [ ] JSON-LD includes `shippingDetails` when metadata present
- [ ] Product cards show delivery badge (subtle text below price)
- [ ] Wishlist items show delivery estimate (same fragment as cards)
- [ ] Checkout DeliveryMethods renders correctly in RTL (Hebrew channel)
- [ ] `docker exec saleor-storefront-dev pnpm generate` succeeds (GraphQL files modified, needs running)
- [ ] `docker exec saleor-storefront-dev pnpm type-check` passes

### Phase 2
- [ ] `showEstimatedDelivery` toggle controls display on product page
- [ ] `defaultEstimatedMinDays` / `defaultEstimatedMaxDays` configurable in admin
- [ ] Hebrew sample config has proper translations for all shipping labels
- [ ] Cmd+K finds "delivery estimate" and "shipping days"
- [ ] `docker exec saleor-storefront-control-app-dev pnpm build` succeeds

### Phase 3
- [ ] "Import to Saleor" creates products with `shipping.*` metadata on product
- [ ] Each variant has `dropship.supplierSku` in variant metadata
- [ ] Variant selection attributes created with `variantSelection: true`
- [ ] Color/Size swatches work on storefront for imported products
- [ ] `externalReference: CJ-{pid}` set correctly
- [ ] ILS + USD channel pricing both set (with exchange rate)
- [ ] Re-import (upsert) updates prices without duplicating products

### Phase 4
- [ ] CJ logistics webhook stores `trackingUrl` in order metadata
- [ ] Tracking sync worker stores `trackingUrl` in order metadata
- [ ] Storefront order detail shows clickable tracking link
- [ ] SMTP email includes "Track Package" button with correct URL
- [ ] Fulfillment timeline shows correct progression

### Phase 5
- [ ] Global 2.5x markup rule applies to all products
- [ ] Supplier-specific rule overrides global
- [ ] Category-specific rule overrides supplier
- [ ] Currency conversion USD→ILS produces correct prices
- [ ] Bulk recalculate updates all product prices in both channels
- [ ] Exchange rate staleness warning shows after 7 days

### Phase 6
- [ ] Stock sync job runs every 4h without errors
- [ ] Out-of-stock products flagged in exceptions
- [ ] Cart shows per-line delivery estimates
- [ ] Checkout shows multi-supplier shipping message when applicable
- [ ] Search results sortable by delivery speed
- [ ] Returns admin page lists and manages return requests
- [ ] Wishlist shows delivery badges

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `metadata` query adds latency to product pages | Low | Medium | Metadata returned in same query; no extra round-trip |
| CJ freight API returns stale delivery estimates | Medium | Medium | Add `shipping.estimatedAt` timestamp; `refreshProducts` mutation updates |
| Order classifier backward compat fails | High | High | Fix A checks BOTH key formats; test with old + new products |
| Direct import hits Saleor rate limits | Medium | Medium | Batch with delays, progress UI, respect `Retry-After` header |
| ILS pricing drift from manual exchange rate | Medium | Medium | Admin warning if rate >7 days old; future API-based rates |
| SMTP webhook payload missing order metadata | Medium | High | Verify payload structure; fallback to GraphQL fetch if needed |
| Checkout metadata query bloats payload | Low | Low | Only `shipping.*` keys needed; metadata is small |
| Search delivery filter unreliable (client-side) | Medium | Low | Use as sort option, not strict filter; document limitation |

---

## 13. Dependencies & Ordering

```
Pre-Req Fixes (FIRST — blocks everything)
    │
    ▼
Phase 1 ──→ Phase 2 ──→ Phase 3
  │                        │
  └──→ Phase 4 ───────────→ Phase 6
                            │
       Phase 5 ─────────────┘
```

- **Pre-Req Fixes first** (classifier bug, security fix, Bulk Manager fixes)
- **Phase 1 second** (unblocks everything — GraphQL metadata + shipping helper + storefront UI)
- **Phase 2 third** (config system makes Phase 1 features admin-configurable)
- **Phase 3 after Phase 1** (direct import uses same metadata format + pricing from Phase 5 currency converter)
- **Phase 4 after Phase 1** (tracking uses same order metadata pattern)
- **Phase 5 independent** (pricing engine doesn't depend on storefront changes, but Phase 3 benefits from currency converter)
- **Phase 6 last** (polish items depend on all prior phases)
