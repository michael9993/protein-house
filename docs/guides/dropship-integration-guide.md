# Dropship Integration Guide

**Last Updated**: February 22, 2026
**Status**: Fully implemented across 6 phases

Complete reference for the multi-supplier dropshipping system built into the Aura E-Commerce Platform. Covers CJ Dropshipping (primary) and AliExpress (adapter ready), with product sourcing, dynamic pricing, stock sync, order forwarding, returns management, and storefront delivery estimates.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Admin Dashboard Pages](#2-admin-dashboard-pages)
3. [Product Sourcing Workflow](#3-product-sourcing-workflow)
4. [Dynamic Pricing Engine](#4-dynamic-pricing-engine)
5. [Stock Sync & Background Jobs](#5-stock-sync--background-jobs)
6. [Order Forwarding & Tracking](#6-order-forwarding--tracking)
7. [Returns Management](#7-returns-management)
8. [Storefront Integration](#8-storefront-integration)
9. [Metadata Reference](#9-metadata-reference)
10. [File Reference](#10-file-reference)
11. [Configuration & Deployment](#11-configuration--deployment)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Saleor Dashboard                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Dropship Orchestrator App (iframe)            │   │
│  │  ┌──────┬────────┬────────┬───────┬──────┬────────┐  │   │
│  │  │Dash- │Suppli- │Source  │Pric-  │Orders│Excep-  │  │   │
│  │  │board │ers     │        │ing    │      │tions   │  │   │
│  │  ├──────┴────────┴────────┴───────┴──────┴────────┤  │   │
│  │  │Returns          │Settings       │Audit Log     │  │   │
│  │  └──────────────────┴───────────────┴─────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐    ┌──────────────────┐    ┌──────────────┐
│  CJ API     │    │   Saleor API     │    │   Redis      │
│  (Supplier) │    │   (GraphQL)      │    │  (BullMQ)    │
└─────────────┘    └──────────────────┘    └──────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │Storefront│ │  Cart  │ │ Checkout │
        │(PDP/PLP) │ │        │ │          │
        └──────────┘ └────────┘ └──────────┘
```

**Container**: `saleor-dropship-app-dev` | Port: 3009
**Stack**: Next.js (Pages Router), tRPC, BullMQ, ioredis, neverthrow, Zod
**UI**: Plain HTML primitives (macaw-ui crashes in Dashboard iframe)

---

## 2. Admin Dashboard Pages

Access via: **Dashboard > Apps > Dropship Orchestrator**

### 2.1 Dashboard (`/`)
Overview with key metrics: active orders, pending exceptions, recent audit events.

### 2.2 Suppliers (`/suppliers`)
Configure supplier connections:
- **CJ Dropshipping** (`/suppliers/cj`): API key configuration, connection test
- **AliExpress** (`/suppliers/aliexpress`): OAuth flow, token management

### 2.3 Source (`/source`)
Product discovery and import hub. See [Section 3](#3-product-sourcing-workflow) for full workflow.

### 2.4 Pricing (`/pricing`)
Three-tab interface for pricing management. See [Section 4](#4-dynamic-pricing-engine).

### 2.5 Orders (`/orders`)
Track forwarded dropship orders, view supplier order IDs, and monitor fulfillment status.

### 2.6 Exceptions (`/exceptions`)
Queue of orders that failed automatic forwarding (fraud flags, cost ceiling exceeded, supplier errors). Manual review and retry.

### 2.7 Returns (`/returns`)
Full return request lifecycle management. See [Section 7](#7-returns-management).

### 2.8 Settings (`/settings`)
Global dropship configuration:
- Cost ceiling percentage (default: 70%)
- Daily spend limit
- Price drift threshold (default: 15%)
- Fraud detection rules
- Auto-forward toggle

### 2.9 Audit Log (`/audit`)
Chronological log of all dropship events (17 event types): order forwards, tracking updates, stock syncs, price drift alerts, etc.

---

## 3. Product Sourcing Workflow

### Step 1: Find Products

**Source Page > Search or Paste URLs**

Two methods:
- **Search**: Enter keywords, filter by category/price/country. Results from CJ catalog.
- **Paste**: Paste CJ product URLs, PIDs, or SKUs (one per line). Supports multiple formats:
  - Full URL: `https://cjdropshipping.com/product/...`
  - Product ID: `1234567890ABCDEF`
  - UUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
  - SKU: `CJ-SKU-12345`

### Step 2: Review & Edit Products

Each fetched product shows:
- Images (up to 5)
- Variants with attributes (Color, Size auto-classified from CJ data)
- Cost price per variant
- Suggested retail price

**Editable fields** (inline):
- Product name
- Product type (datalist: Shoes, Tops, Bottoms, Accessories, Dropship Product)
- Category slug (datalist: 30+ options like `men-running-shoes`, `women-heels`)
- Collections (comma-separated)
- Gender (Men, Women, Unisex)

### Step 3: Fetch Shipping Estimates

Click **"Fetch Shipping"** to get per-variant delivery estimates:
- Shipping cost, carrier, estimated days (e.g., "10-20 business days")
- Groups variants by weight to minimize API calls
- Results populate the shipping columns in the product table

### Step 4: Export or Import

**Option A — CSV Export (via Bulk Manager)**:
1. Set markup multiplier (e.g., 2.5x)
2. Click "Download CSV"
3. Go to Dashboard > Apps > Bulk Manager > Products
4. Upload the CSV
5. Products created in Saleor with all metadata

CSV includes:
- Product: name, slug, productType, category, description, weight, images (5), collections
- Variants: SKU (`DS-CJ-{pid}-{vid}`), price, costPrice, variant attributes, variant images
- Metadata: `dropship.supplier:cj`, `dropship.costPrice:{cost}`, `shipping.estimatedMinDays:{min}`, etc.
- Variant metadata: `dropship.supplierSku:{vid}`
- Settings: `isPublished:Yes`, `trackInventory:No`

**Option B — Direct Import to Saleor**:
1. Select target channels (ILS, USD, or both)
2. Set markup and optional ILS exchange rate
3. Click "Import to Saleor"
4. Products created directly via GraphQL mutations:
   - Product with public metadata (shipping estimates)
   - Private metadata (supplier, cost price)
   - Variants per channel with converted prices
   - Collection assignments
   - Channel publishing

### Step 5: Verify

Products appear in Dashboard > Products with:
- `externalReference`: `CJ-{pid}`
- Public metadata: `shipping.*` keys
- Private metadata: `dropship.*` keys
- Variant private metadata: `dropship.supplierSku`

---

## 4. Dynamic Pricing Engine

### 4.1 Pricing Rules

**Location**: Pricing page > Rules tab

Rules define how cost prices are converted to retail prices. Each rule has:

| Field | Description |
|-------|-------------|
| Name | Descriptive label (e.g., "Shoes markup") |
| Type | `global` (all products), `supplier`, `region`, `category` |
| Match Value | What to match (e.g., "cj" for supplier type, "shoes" for category) |
| Strategy | `percentage_markup` (multiply), `fixed_markup` (add), `margin_target` (target margin %) |
| Value | The numeric value (e.g., 2.5 for 2.5x, 5.00 for $5 markup, 40 for 40% margin) |
| Priority | Higher priority rules win when multiple match (0-100) |
| Active | Toggle on/off |

**Rule Resolution Order**: category > region > supplier > global (by type), then by priority within each type.

**Default Rule**: Global, percentage_markup, 2.5x — applied when no other rule matches.

**Examples**:

| Rule | Type | Match | Strategy | Value | Effect |
|------|------|-------|----------|-------|--------|
| Default markup | global | — | percentage_markup | 2.5 | $10 cost → $25 retail |
| Premium shoes | category | shoes | percentage_markup | 3.0 | $10 cost → $30 retail |
| CJ fixed | supplier | cj | fixed_markup | 8.00 | $10 cost → $18 retail |
| 40% margin target | global | — | margin_target | 40 | $10 cost → $16.67 retail |

### 4.2 Exchange Rates

**Location**: Pricing page > Rates tab

For multi-channel stores (USD + ILS), configure currency conversion:

| From | To | Rate | Example |
|------|----|------|---------|
| USD | ILS | 3.65 | $25.00 → ₪91.25 |
| USD | EUR | 0.92 | $25.00 → €23.00 |

- Rates are manually maintained (no auto-fetch from external APIs)
- **Staleness warning**: If a rate hasn't been updated in 7+ days, the admin sees a warning
- Inverse rates auto-calculated (ILS→USD = 1/3.65)

### 4.3 Price Preview

**Location**: Pricing page > Preview tab

Test pricing without affecting live products:
1. Enter product names and cost prices
2. Select target currency
3. See calculated retail price, margin percentage, and which rule was applied
4. Adjust rules/rates, preview again

---

## 5. Stock Sync & Background Jobs

### 5.1 Job Schedule

All jobs run via BullMQ workers with Redis:

| Job | Schedule | Purpose |
|-----|----------|---------|
| **Stock Sync** | Every 4h (`0 1,5,9,13,17,21 * * *`) | Poll supplier stock, update Saleor variant quantities |
| **Tracking Sync** | Every 2h (`0 */2 * * *`) | Poll supplier tracking updates, update order metadata |
| **Reconciliation** | Every 6h (`0 */6 * * *`) | Cross-check orders, catch missed updates, flag discrepancies |
| **Token Refresh** | Every 12 days | Refresh CJ OAuth tokens before 15-day expiry |

### 5.2 Stock Sync Worker — Detailed Flow

```
1. Fetch all Saleor products with metadata key "dropship.supplier"
   (paginated, 100 per page)

2. Group products by supplier ("cj", "aliexpress")

3. For each supplier:
   a. Get credentials from app metadata
   b. Initialize supplier adapter
   c. Collect all variant SKUs (from dropship.supplierSku metadata)
   d. Call adapter.getStockBatch(skus, credentials)
   e. For each variant with stock data:
      - Call productVariantStocksUpdate mutation
      - Update warehouse quantity

4. Log results:
   - Total products/variants processed
   - Number updated, out-of-stock, errors
   - Audit event: STOCK_SYNC_COMPLETE
```

**Key behaviors**:
- Graceful handling of missing adapters or credentials (logs warning, skips supplier)
- Concurrency: 1 (serialized to avoid overwhelming supplier APIs)
- Job options: 3 retries with exponential backoff, 24h cleanup for completed jobs

### 5.3 Job Management

Jobs are managed via the scheduler module:
- `startScheduler(saleorApiUrl, appToken)` — called on app startup
- `stopScheduler()` — graceful shutdown (closes workers, queues, Redis connection)

---

## 6. Order Forwarding & Tracking

### 6.1 Order Flow

```
Customer places order
         │
         ▼
   ORDER_PAID webhook
         │
         ▼
   Order Classifier
   ├── Identify dropship lines (via product metadata)
   ├── Group by supplier
   └── Non-dropship lines → normal fulfillment
         │
         ▼
   Safety Checks
   ├── Fraud detection (4 rules, score < 50 passes)
   ├── Cost ceiling check (default 70% of retail)
   ├── Daily spend limit
   └── Price drift check
         │
    ┌────┴────┐
    ▼         ▼
  Pass      Fail
    │         │
    ▼         ▼
 Auto-forward   Exception Queue
 to supplier    (manual review)
    │
    ▼
 Tracking Sync (every 2h)
    │
    ▼
 Order metadata updated
 (trackingUrl, carrier, status)
```

### 6.2 Fraud Detection

4 rules with composite scoring:
- **Velocity**: Too many orders from same customer in short period
- **Address**: Suspicious address patterns
- **Value**: Unusually high order value
- **Blacklist**: Known bad actors

Score < 50 = pass, ≥ 50 = flagged to exception queue.

### 6.3 Financial Safety

- **Cost ceiling**: Supplier cost must be < X% of retail price (default 70%)
- **Daily spend limit**: Total auto-forwarded orders capped per day
- **Price drift detection**: Alert when supplier cost changes > threshold (default 15%)

---

## 7. Returns Management

### 7.1 Return Status Flow

```
   ┌──────────┐    Approve    ┌──────────┐    Ship Back    ┌─────────────┐    Refund    ┌──────────┐
   │Requested │──────────────▶│ Approved │───────────────▶│ Shipped Back│─────────────▶│ Refunded │
   └──────────┘               └──────────┘                └─────────────┘              └──────────┘
        │
        │  Reject
        ▼
   ┌──────────┐
   │ Rejected │
   └──────────┘
```

### 7.2 Creating a Return

**Location**: Returns page > Create form

| Field | Description |
|-------|-------------|
| Order ID | Saleor order ID |
| Order Number | Human-readable order number |
| Customer Email | For communication |
| Supplier | CJ or AliExpress (sets return window) |
| Product Name | Item being returned |
| Quantity | Number of units |
| Reason | Free-text explanation |

**Auto-set**: Return window (CJ: 15 days, AliExpress: 30 days)

### 7.3 Managing Returns

- **Filter tabs**: All, Requested, Approved, Shipped Back, Refunded, Rejected — each with count badge
- **Status actions**: Context-sensitive buttons per status
  - Requested → Approve / Reject
  - Approved → Mark Shipped Back
  - Shipped Back → Mark Refunded
- **Notes**: Optional notes on each status change
- **Delete**: Remove return requests (with confirmation)

---

## 8. Storefront Integration

### 8.1 Product Detail Page (PDP)

If a product has `shipping.estimatedMinDays` / `shipping.estimatedMaxDays` metadata:
- Shows **"Ships in 10-20 business days"** badge below the price
- Configurable via Storefront Control: `shipping.showEstimatedDelivery` toggle
- Label text configurable: `deliveryEstimateLabel` (supports `{days}` placeholder)

### 8.2 Product Cards (PLP)

Same delivery badge as PDP, rendered via `UiCardDeliveryBadge` component:
- Only shows when `showEstimatedDelivery` is enabled in config
- Only shows when product has shipping metadata

### 8.3 Cart Page

Per-line delivery estimates:
- Each cart line shows "Ships in X-Y business days" below the item
- Reads from `product.metadata` on checkout lines
- Falls back to config defaults if no per-product metadata
- Order summary shows max delivery time across all items

### 8.4 Checkout — Multi-Supplier Notice

When a cart contains items with different delivery speeds:
- Items grouped by speed: **fast** (1-5 days), **standard** (6-14 days), **extended** (15+ days)
- If multiple speed groups exist, an amber notice appears below shipping method selection:
  > "Your order may arrive in multiple shipments. Items have different estimated delivery times."
  - Lists items in each speed group

### 8.5 Wishlist

When adding products to wishlist, metadata is captured. Wishlist items display:
- Delivery estimate badge (same as product cards)
- Out-of-stock overlay (pre-existing)
- Badge only shows for in-stock items with shipping metadata

### 8.6 Order Details (Account)

Order tracking information displayed from `dropship` order metadata:
- Tracking number and URL
- Carrier name
- Estimated delivery date
- Shipment status

---

## 9. Metadata Reference

### Product Public Metadata

| Key | Value | Example | Set By |
|-----|-------|---------|--------|
| `shipping.estimatedMinDays` | Minimum delivery days | `"10"` | Source page (CSV or direct import) |
| `shipping.estimatedMaxDays` | Maximum delivery days | `"20"` | Source page |
| `shipping.carrier` | Shipping carrier name | `"CJ Packet"` | Source page |

### Product Private Metadata

| Key | Value | Example | Set By |
|-----|-------|---------|--------|
| `dropship.supplier` | Supplier identifier | `"cj"` | Source page |
| `dropship.costPrice` | Supplier cost (USD) | `"5.00"` | Source page |
| `dropship.shippingCost` | Shipping cost (USD) | `"2.50"` | Source page (optional) |
| `dropship.variantWeight` | Variant weight (kg) | `"0.50"` | Source page (optional) |

### Variant Private Metadata

| Key | Value | Example | Set By |
|-----|-------|---------|--------|
| `dropship.supplierSku` | Supplier variant ID | `"A1B2C3D4"` | Source page |

### Order Public Metadata

| Key | Value | Set By |
|-----|-------|--------|
| `dropship` | JSON blob: `{ trackingUrl, trackingNumber, carrier, status, shippedAt, forwardedAt, estimatedDeliveryDate }` | Tracking sync worker |

### App Private Metadata

| Key | Purpose |
|-----|---------|
| `dropship-creds-cj` | CJ API credentials |
| `dropship-creds-aliexpress` | AliExpress OAuth tokens |
| `dropship-pricing-rules` | JSON array of pricing rules |
| `dropship-exchange-rates` | JSON array of exchange rates |
| `dropship-returns` | JSON array of return requests |
| `dropship-settings` | Global dropship settings |

---

## 10. File Reference

### Dropship App (`apps/apps/dropship-orchestrator/`)

#### Core Modules
| Path | Purpose |
|------|---------|
| `src/modules/trpc/router.ts` | Main tRPC router (9 sub-routers) |
| `src/modules/trpc/routers/source-router.ts` | Product sourcing, CJ API, import pipeline |
| `src/modules/trpc/routers/pricing-router.ts` | Pricing rules & exchange rates CRUD |
| `src/modules/trpc/routers/returns-router.ts` | Return request lifecycle management |
| `src/modules/trpc/routers/suppliers-router.ts` | Supplier credential management |
| `src/modules/trpc/routers/orders-router.ts` | Dropship order tracking |
| `src/modules/trpc/routers/exceptions-router.ts` | Failed order exception queue |
| `src/modules/trpc/routers/settings-router.ts` | Global settings CRUD |
| `src/modules/trpc/routers/audit-router.ts` | Audit log queries |
| `src/modules/trpc/routers/dashboard-router.ts` | Dashboard metrics |

#### Pricing
| Path | Purpose |
|------|---------|
| `src/modules/pricing/pricing-rules.ts` | Rule schema, resolution, application logic |
| `src/modules/pricing/currency-converter.ts` | Exchange rates, conversion, staleness detection |

#### Source & Types
| Path | Purpose |
|------|---------|
| `src/modules/source/types.ts` | `SourcedProduct` type, `generateCSV()`, styling constants |

#### Background Jobs
| Path | Purpose |
|------|---------|
| `src/modules/jobs/queues.ts` | 4 BullMQ queue definitions, Redis connection |
| `src/modules/jobs/scheduler.ts` | Start/stop scheduler, register repeatable jobs |
| `src/modules/jobs/job-types.ts` | Job payload interfaces |
| `src/modules/jobs/workers/stock-sync-worker.ts` | Poll supplier stock, update Saleor |
| `src/modules/jobs/workers/tracking-sync-worker.ts` | Poll supplier tracking |

#### Suppliers
| Path | Purpose |
|------|---------|
| `src/modules/suppliers/types.ts` | `SupplierAdapter` interface |
| `src/modules/suppliers/registry.ts` | `SupplierRegistry` singleton |
| `src/modules/suppliers/cj/` | CJ Dropshipping adapter |
| `src/modules/suppliers/aliexpress/` | AliExpress adapter |

#### Order Processing
| Path | Purpose |
|------|---------|
| `src/modules/webhooks/order-paid/` | ORDER_PAID webhook handler, classifier, use-case |
| `src/modules/webhooks/order-cancelled/` | ORDER_CANCELLED webhook handler |
| `src/modules/fraud/` | Fraud detection rules and scoring |

#### Admin Pages
| Path | Purpose |
|------|---------|
| `src/pages/index.tsx` | Dashboard |
| `src/pages/suppliers/` | Supplier config (index, aliexpress, cj) |
| `src/pages/source/index.tsx` | Product sourcing |
| `src/pages/pricing/index.tsx` | Pricing management |
| `src/pages/orders/index.tsx` | Order tracking |
| `src/pages/exceptions/index.tsx` | Exception queue |
| `src/pages/returns/index.tsx` | Returns management |
| `src/pages/settings/index.tsx` | Global settings |
| `src/pages/audit/index.tsx` | Audit log |

#### UI
| Path | Purpose |
|------|---------|
| `src/components/ui/NavBar.tsx` | 9-item admin navigation |
| `src/components/ui/primitives.tsx` | Box, Text, Button, Input — iframe-safe HTML wrappers |

### Storefront (`storefront/`)

| Path | Purpose |
|------|---------|
| `src/lib/shipping.ts` | `getProductShippingEstimate()`, `formatEstimate()`, `getOrderTrackingData()` |
| `src/lib/wishlist.tsx` | `WishlistItem` interface (includes metadata), `useWishlist()` |
| `src/app/[channel]/(main)/cart/CartClient.tsx` | Per-line delivery estimates, order-level delivery summary |
| `src/app/[channel]/(main)/cart/page.tsx` | Passes product metadata to CartClient |
| `src/checkout/sections/DeliveryMethods/DeliveryMethods.tsx` | Multi-supplier split shipment notice |
| `src/app/[channel]/(main)/account/wishlist/WishlistClient.tsx` | Wishlist delivery badges |
| `src/ui/components/ProductCard/ProductCard.tsx` | Product card delivery badge + metadata in wishlist |
| `src/app/[channel]/(main)/products/components/ProductCard.tsx` | Products page card delivery badge |
| `src/app/[channel]/(main)/products/[slug]/ProductDetailClient.tsx` | PDP delivery estimate |
| `src/graphql/ProductDetails.graphql` | Includes `metadata { key value }` |
| `src/graphql/ProductListItem.graphql` | Includes `metadata { key value }` |
| `src/graphql/OrderDetailsFragment.graphql` | Includes `metadata { key value }` |
| `src/checkout/graphql/checkout.graphql` | Includes `metadata { key value }` on checkout line products |

### Bulk Manager Integration (`apps/apps/bulk-manager/`)

| Path | Purpose |
|------|---------|
| `src/modules/import/field-mapper.ts` | `variantMetadata` column support |
| `src/modules/trpc/routers/products-router.ts` | Variant metadata mutation during import |

---

## 11. Configuration & Deployment

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `REDIS_URL` | Yes | `redis://redis:6379` | BullMQ job queues |
| `SALEOR_API_URL` | Yes | — | Saleor GraphQL endpoint |
| `APP_TOKEN` | Yes | — | App authentication token |

### Docker Compose

Container defined in `infra/docker-compose.dev.yml`:
```yaml
saleor-dropship-app:
  container_name: saleor-dropship-app-dev
  build: ../apps
  ports:
    - "3009:3000"
  environment:
    - REDIS_URL=redis://redis:6379
```

### First-Time Setup

1. **Install app** in Saleor Dashboard (Apps > Install > Dropship Orchestrator)
2. **Configure CJ credentials**: Suppliers > CJ Dropshipping > Enter API key
3. **Set pricing rules**: Pricing > Rules tab > Add rules or use default 2.5x
4. **Configure exchange rates**: Pricing > Rates tab > Set USD→ILS rate
5. **Test**: Source > Paste a CJ product URL > Fetch > Preview pricing > Import

### Restart Commands

```bash
# After code changes
docker compose -f infra/docker-compose.dev.yml restart saleor-dropship-app

# Check build logs
docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-dropship-app

# Verify build succeeded (look for "Ready in Xms")
docker compose -f infra/docker-compose.dev.yml logs saleor-dropship-app | tail -5
```

### Health Checks

- App running: `http://localhost:3009` responds
- Redis connected: Check scheduler logs for "Scheduler started"
- CJ API working: Source > Search > Should return products
- Stock sync running: Audit log > Look for `STOCK_SYNC_COMPLETE` events
