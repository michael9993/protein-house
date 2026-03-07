# Saleor Platform Agent Guide

This repo is a multi-project workspace. Follow the conventions of the directory you are working in.
If rules exist in .cursor/rules/, .cursorrules, or .github/copilot-instructions.md, they must be followed.
No Cursor or Copilot rules were found at the repo root at the time of writing.

## Workspace Layout

- saleor/ - Django/GraphQL backend (Python)
- dashboard/ - Admin dashboard (React + Vite, TypeScript)
- storefront/ - Next.js storefront (TypeScript)
- apps/ - Saleor Apps monorepo (Next.js + TypeScript, Turborepo)
- infra/ - Docker compose and setup scripts

## Global Setup Notes

- Use Docker Compose for the full stack: `docker compose -f infra/docker-compose.dev.yml up -d`
- Avoid committing .env files or secrets.
- Prefer running commands inside the project directory they belong to.

## Docker Development Workflow

This project uses Docker Compose for local development. All services run in containers.

### Main Containers

- **saleor-api** - Django/GraphQL backend (Saleor API)
- **saleor-worker** - Celery worker for background tasks
- **saleor-scheduler** - Celery beat scheduler for periodic tasks
- **saleor-dashboard** - React admin dashboard (Vite + React 18 + Tailwind CSS v4 + macaw-ui-next + Lucide icons)
- **saleor-storefront** - Next.js storefront
- **saleor-storefront-control-app** - Storefront control CMS app (page-based admin: 10 pages — Homepage, Product Listing, Product Detail, Cart, Checkout, Account, Auth, Layout, Static Pages, Global Design; ComponentBlock UI; shadcn/ui + Tailwind; Cmd+K; live preview)
- **saleor-bulk-manager-app** - Bulk import/export manager (products, categories, collections, customers, orders, vouchers, gift cards via CSV/Excel)
- **saleor-image-studio-app** - AI-powered image editor (Fabric.js canvas, 12 templates, bg removal via rembg, AI generation via Nano Banana/Gemini, upscaling via Real-ESRGAN, Sharp enhancement, save to product)
- **saleor-dropship-app** - Multi-supplier dropship orchestrator (AliExpress + CJ Dropshipping, auto-forward orders, tracking sync, fraud detection, exception queue, financial safety, admin dashboard)
- **saleor-stripe-app** - Stripe payment app
- **saleor-smtp-app** - SMTP email app (handles email notifications, fulfillment, invoices, welcome emails)
- **saleor-invoice-app** - Invoice generation app (generates PDF invoices for orders)
- **saleor-newsletter-app** - Newsletter management app (subscribers, templates, campaigns, MJML email templates)
- **saleor-sales-analytics-app** - Sales analytics dashboard app (KPIs, revenue charts, top products, category breakdown, Excel export)
- **saleor-postgres** - PostgreSQL database
- **saleor-redis** - Redis cache/broker

### Container Restart Guidelines

**After making changes, always determine which container(s) need to be restarted:**

1. **Backend changes (saleor/)**:

   - Schema/model changes: Restart `saleor-api`, `saleor-worker`, `saleor-scheduler`
   - Code changes only: Restart `saleor-api` (auto-reload may work, but restart ensures consistency)
   - Migration changes: Restart `saleor-api` after running migrations

2. **Dashboard changes (dashboard/)**:

   - Restart `saleor-dashboard-dev`
   - If GraphQL schema changed: Run `pnpm generate` in dashboard, then restart container

3. **Storefront changes (storefront/)**:

   - Restart `saleor-storefront-dev`
   - If GraphQL schema changed: Run `pnpm generate` in storefront, then restart container

4. **Storefront Control App changes (apps/apps/storefront-control/)**:

   - Restart `saleor-storefront-control-app`
   - If schema/config structure changed: Update sample config files (see below)

5. **Newsletter App changes (apps/apps/newsletter/)**:

   - Restart `saleor-newsletter-app`
   - If MJML templates or campaign logic changed: Restart required
   - If subscriber management features changed: Restart required

6. **Sales Analytics App changes (apps/apps/sales-analytics/)**:

   - Restart `saleor-sales-analytics-app`
   - If tRPC router or analytics calculations changed: Restart required
   - If Excel export functionality changed: Restart required

7. **Bulk Manager App changes (apps/apps/bulk-manager/)**:

   - Restart `saleor-bulk-manager-app` (use service name, not container name with `-dev`)
   - If router/import logic changed: Restart required
   - If new entity type added: Update permissions in manifest

8. **Image Studio App changes (apps/apps/image-studio/)**:

   - Restart `saleor-image-studio-app`
   - If tRPC router or AI client changed: Restart required
   - AI services (rembg, esrgan) are separate containers

9. **Dropship Orchestrator changes (apps/apps/dropship-orchestrator/)**:

   - Restart `saleor-dropship-app` (use service name, not container name with `-dev`)
   - If supplier adapter or webhook handler changed: Restart required
   - If BullMQ job/worker/scheduler changed: Restart required
   - Depends on Redis for BullMQ job queues

10. **Other App changes (apps/apps/\*/)**:

   - Restart the corresponding app container:
     - `saleor-stripe-app` for Stripe app
     - `saleor-smtp-app` for SMTP app
     - `saleor-invoice-app` for Invoice app

8. **Database/Redis changes**:
   - Usually no restart needed (data persists in volumes)
   - Only restart if configuration changed

**Restart command:**

```bash
docker compose -f infra/docker-compose.dev.yml restart <container-name>
```

**View logs:**

```bash
docker compose -f infra/docker-compose.dev.yml logs -f <container-name>
```

**Check container status:**

```bash
docker compose -f infra/docker-compose.dev.yml ps
```

## Build / Lint / Test Commands

### Saleor API (saleor/)

- Install deps (uv/venv expected): `uv sync` or project-specific setup
- Start dev server: `poe start` (runs `uvicorn saleor.asgi:application --reload`)
- Migrations: `poe migrate` / `poe make-migrations`
- Build GraphQL schema: `poe build-schema`
- Lint (Ruff): `ruff check .`
- Type check (mypy): `mypy saleor`
- Tests (all): `pytest --reuse-db`
- Tests (single file): `pytest --reuse-db path/to/test_file.py`
- Tests (single test): `pytest --reuse-db path/to/test_file.py -k test_name`

### Dashboard (dashboard/)

- Install deps: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Type check: `pnpm check-types` or `pnpm check-types:src`
- Lint: `pnpm lint` (runs eslint + prettier)
- Lint fix: `pnpm lint:eslint` / `pnpm lint:prettier`
- Tests (Jest): `pnpm test`
- Tests (single file): `pnpm test path/to/test.tsx`
- Tests (watch): `pnpm test:watch`
- Playwright e2e: `pnpm e2e`
- Playwright single test: `pnpm exec playwright test path/to/spec.ts`

### Storefront (storefront/)

- Install deps: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Type check: `pnpm type-check`
- Tests: (none configured in scripts; rely on lint/type-check)
- GraphQL types: `pnpm generate`

### Apps Monorepo (apps/)

- Install deps: `pnpm install`
- Dev (all): `pnpm dev` (turbo)
- Build (all): `pnpm build`
- Lint (all): `pnpm lint`
- Lint fix: `pnpm lint:fix`
- Type check: `pnpm check-types`
- Tests (all): `pnpm test` or `pnpm test:ci`
- Run a single app: `pnpm --filter <app-name> dev`
- App lint: `pnpm --filter <app-name> lint`
- App tests: `pnpm --filter <app-name> test`
- App unit tests (Vitest): `vitest --project units`
- App e2e tests (Vitest): `vitest --project e2e`
- GraphQL codegen: `pnpm generate`

## Code Style Guidelines

### General

- Respect existing patterns in the target package (do not mix styles).
- Prefer small, composable functions over large blocks.
- Keep edits minimal and localized; avoid wide refactors without request.
- Never add emojis to source unless the user requests them.

### Python (saleor/)

- Formatting follows Black-style rules (EditorConfig: 4 spaces, 88 columns).
- Linting uses Ruff with a large rule set; fix violations or justify ignores.
- Type hints are required for public functions and complex logic.
- Prefer fixtures over mocking in tests; use pytest fixtures from `tests/fixtures`.
- Tests should be flat functions (no test classes) and use given/when/then naming.
- Error handling: raise specific exceptions; avoid bare except.

### TypeScript / React (dashboard/, storefront/, apps/)

- Use TypeScript everywhere; avoid `any` unless absolutely necessary.
- Prefer functional components and hooks; keep components focused.
- Keep file exports consistent; avoid default exports if the folder uses named.
- Use Prettier formatting; do not hand-format.
- Use ESLint rules as source of truth (import sorting, no unused vars, etc.).
- Error handling: use explicit error boundaries or Result-style handling when used.

### Apps-Specific Patterns (apps/)

- Result-based error handling with `neverthrow` (`Result<T, E>`); avoid throwing.
- Branded types with Zod for validated primitives (see ADR 0002).
- Error classes via `BaseError.subclass()` from `@saleor/apps-errors`.
- Repository pattern for storage; do not access DBs directly in handlers.
- Use cases encapsulate business logic; keep webhook handlers thin.

### Dashboard Patterns (dashboard/)

- Uses React 18, Vite, Jest, and **Tailwind CSS v4**; keep test files near source.
- Imports should be sorted (simple-import-sort ESLint rule).
- Prefer `React.FC` only if existing file uses it; otherwise use function components.
- Keep GraphQL operations in the codegen flow; run `pnpm generate` if changed.
- **Styling**: Tailwind CSS v4 via `cn()` from `@dashboard/utils/cn`. Root font-size is 50.782% (macaw-ui); Tailwind `@theme` overrides `--spacing` and `--text-*` with px values so utilities produce correct sizes.
- **Icons**: Lucide React (`lucide-react`), not `@mui/icons-material`. Use `iconSize`/`iconStrokeWidthBySize` from `@dashboard/components/icons`.
- **Tables**: Custom HTML primitives from `@dashboard/components/Table` (Table, TableHead, TableBody, TableFooter, TableRow, TableCell). Use `TableCellHeader` for sortable columns, `TableRowLink` for clickable rows.
- **URLs**: Use `withQs(path, params)` from `@dashboard/utils/urls` — never `path + "?" + stringifyQs(params)` (React Router v7 rejects `?` in pathname).
- **Routes**: Relative paths only in nested routes (React Router v7). No leading `/` on child route paths.
- **SVG sizing**: Any SVG icon without a sizing parent must have `w-6 h-6` or similar Tailwind classes. SVGs with only `viewBox` expand to fill their container.

### Storefront Patterns (storefront/)

- Next.js App Router; keep server/client boundaries explicit.
- Use `next lint` rules; Tailwind is used for styling (prettier-plugin-tailwindcss).
- Keep GraphQL documents in the codegen flow; run `pnpm generate` if changed.
- **Config types from shared package**: `StoreConfig = StorefrontConfig` (Zod-inferred from `@saleor/apps-storefront-config`). 64 hooks in `StoreConfigProvider.tsx`.
- **Homepage product sections**: Data-driven (newest by CREATED_AT, top-rated by RATING when collections empty). "New" badge uses product `created` (last 30 days). See PRD §10.2.
- **12+ configurable homepage sections**: Hero, TrustStrip, Marquee, BrandGrid, Categories, TrendingProducts, PromotionBanner, FlashDeals, CollectionMosaic, BestSellers, CustomerFeedback, Newsletter. All in `storefront/src/components/home/`.
- **Account pages**: Refurbished UI with brand-color gradient header, plain stats grid, mobile bottom tab bar, RTL-aware layout. All in `storefront/src/app/[channel]/(main)/account/`.

## Naming Conventions

- TypeScript: camelCase for variables/functions, PascalCase for components/types.
- Python: snake_case for functions/variables, PascalCase for classes.
- Filenames follow existing patterns in each package (do not rename unless asked).

## Imports

- Group imports by module type (external, internal, local) per ESLint/ruff rules.
- Avoid deep relative imports if the project uses path aliases.
- Keep side-effect imports at the top only when required.

## Error Handling

- Prefer explicit error types and structured error responses.
- Avoid swallowing exceptions; log and rethrow when appropriate.
- Use Result objects in apps where `neverthrow` is the pattern.

## Testing Guidance

- Add or update tests when behavior changes.
- Keep unit tests deterministic; avoid real network calls.
- Use existing mocks/fixtures instead of ad-hoc stubs.

## Changesets (apps/)

- Functional changes require a changeset: `pnpm changeset add`.
- Skip changesets for refactors without user-visible impact.

## Documentation Rules

- Do not create new docs unless the user asks.
- Update existing docs only when required by the change.

## When in Doubt

- Prefer the closest existing pattern in the directory you touch.
- Ask for clarification if a change might affect multiple packages.

## Apps Overview

### Sales Analytics App (`apps/apps/sales-analytics/`)

**Purpose**: Professional sales analytics dashboard for Saleor with KPIs, charts, and multi-channel insights.

**Features**:

- Key Performance Indicators (KPIs): GMV, Total Orders, AOV, Items Sold, Unique Customers with trend indicators
- Visualizations: Revenue over time (Area Chart), Top products by revenue, Sales by category (Donut Chart), Recent orders table
- Filters: Time range presets (Today, Last 7/30/90 days, 3/6/12 months, custom), Channel filter
- Excel Export: Professional Excel export with multiple sheets (Summary, Revenue Over Time, Top Products, Sales by Category, All Orders) with styled headers, borders, and currency formatting
- Dashboard Integration: Main dashboard via `NAVIGATION_ORDERS` extension (APP_PAGE target), Order details widget via `ORDER_DETAILS_WIDGETS` extension (WIDGET target)

**Tech Stack**:

- Next.js (Pages Router), React, TypeScript
- Tremor UI for analytics visualizations
- Macaw UI for app shell/forms
- tRPC for type-safe APIs
- xlsx (SheetJS) for Excel export
- neverthrow for error handling
- Zod for branded types

**Recent Updates**:

- Added Excel export functionality with professional formatting (styled headers, borders, column widths, currency formatting)
- Export includes all orders in selected period (not just recent 10)
- Multiple Excel sheets: Summary, Revenue Over Time, Top Products, Sales by Category, All Orders
- Added `getAllOrders` tRPC endpoint for fetching complete order data for export

**Container**: `saleor-sales-analytics-app` (port 3006)

### Newsletter App (`apps/apps/newsletter/`)

**Purpose**: Manage newsletter subscribers, email templates, and email campaigns.

**Features**:

- Subscriber management (active/inactive status, channel/language filtering)
- MJML email template management
- Campaign management (create, start, cancel, delete campaigns)
- Integration with SMTP app for sending emails
- Integration with Storefront Control app for branding
- Welcome and welcome-back email automation

**Container**: `saleor-newsletter-app` (port 3005)

### Storefront Control App (`apps/apps/storefront-control/`)

**Purpose**: Dashboard extension for managing storefront UI configuration — page-based CMS admin like Shopify Theme Editor.

**Architecture (Page-Based CMS):**

- **11 page-based navigation items**: Homepage, Product Listing, Product Detail, Cart, Checkout, Account, Auth Pages, Layout, Static Pages, Global Design, Component Designer
- **PAGE_REGISTRY** (`src/lib/page-registry.ts`): Central registry mapping admin pages to config paths, blocks, and icons
- **ComponentBlock UI**: Collapsible cards with icon, title, description, enable/disable toggle — like Shopify sections
- **Tech stack**: shadcn/ui (19 primitives) + Radix UI + Tailwind CSS + React Hook Form + Zod
- **Cmd+K command palette** with settings search across all pages
- **Live preview** system via PostMessage iframe bridge
- **`useConfigPage` hook** eliminates 30+ lines boilerplate per config page
- **Homepage section reordering** via drag-and-drop (@dnd-kit)

**Shared Config Package**: `@saleor/apps-storefront-config` — 21 domain schema files, Zod types, migrations

**Component Designer** (`component-designer` page): Visual playground for per-component style overrides. Split-panel UI (component tree + property editor). Generates `--cd-{key}-{prop}` CSS variables. Registry of 24 components. "Copy style from..." dropdown for duplicating overrides between components. Override count badge in sidebar nav.

**Key Directories:**
- Pages: `src/pages/[channelSlug]/` (homepage/, global/, product-listing, product-detail, cart, checkout, account, auth-pages, layout-config, static-pages, component-designer)
- Components: `src/components/` (ui/ 19 primitives, layout/ 5, forms/ 12, shared/ 11 incl. ComponentBlock, preview/ 3, pages/ homepage + global + component-designer tab components)
- Hooks: `src/hooks/` (useConfigPage, usePreview)
- Search: `src/lib/search/` (field-location-map, field-labels, types) + `src/lib/page-registry.ts`

**Container**: `saleor-storefront-control-app` (port 3004)

### SMTP App (`apps/apps/smtp/`)

**Purpose**: Handles email notifications via SMTP.

**Features**:

- Email sending via SMTP configuration
- Fulfillment notifications
- Invoice emails
- Welcome emails
- Integration with Newsletter app

**Container**: `saleor-smtp-app` (port 3001)

### Invoice App (`apps/apps/invoices/`)

**Purpose**: Generates PDF invoices for orders.

**Features**:

- PDF invoice generation
- Order invoice management
- Integration with storefront for invoice downloads

**Container**: `saleor-invoice-app` (port 3003)

### Stripe App (`apps/apps/stripe/`)

**Purpose**: Saleor Payment App for Stripe integration.

**Features**:

- Stripe payment processing
- Payment gateway configuration
- Webhook handling for payment events

**Container**: `saleor-stripe-app` (port configured via STRIPE_APP_PORT)

### Bulk Manager App (`apps/apps/bulk-manager/`)

**Purpose**: Bulk import/export and batch operations for store data migration via CSV/Excel.

**Features**:

- 7 entity types: Products, Categories, Collections, Customers, Orders, Vouchers, Gift Cards
- CSV/Excel import with upsert mode (create or update by natural key)
- Product features: Multi-image (5), generic attributes (`attr:*`/`variantAttr:*`), multi-warehouse (`stock:*`), SEO, metadata
- Category features: Topological parent sorting (parents imported before children)
- Collection features: Product assignment by slug/SKU, channel publishing
- Customer features: Multiple addresses with default flags, upsert by email
- Order features: Export with status/date filters, Bulk Fulfill, Bulk Cancel
- Voucher/Gift Card features: Full import/export with channel listings, metadata
- Dynamic template generation from field-mapper metadata
- Router architecture: 10 sub-routers in `src/modules/trpc/routers/`

**Tech Stack**: Next.js (Pages Router), tRPC, papaparse (CSV), xlsx (Excel), Macaw UI, Zod

**Permissions**: MANAGE_PRODUCTS, MANAGE_ORDERS, MANAGE_USERS, MANAGE_APPS, MANAGE_DISCOUNTS, MANAGE_GIFT_CARD

**Container**: `saleor-bulk-manager-app-dev` (port 3007)

**Restart**: Use service name `saleor-bulk-manager-app` (not container name with `-dev` suffix)

### Image Studio App (`apps/apps/image-studio/`)

**Purpose**: AI-powered product image editor embedded in Saleor Dashboard. Full canvas editor with AI image processing for creating professional e-commerce product images.

**Features**:

- Canvas editor (Fabric.js v6): Add images/text/shapes, select/move/resize/rotate, undo/redo, zoom, export
- Saleor product integration: Browse products, edit images, save back to products via GraphQL multipart upload
- AI Background Removal: rembg Docker service (CPU), removes backgrounds to transparent PNG
- AI Background Generation: Nano Banana / Gemini (cloud), generates scene backgrounds from text prompts
- AI Upscaling: Real-ESRGAN Docker service (CPU), 2x/3x/4x image upscaling
- Image Enhancement: Sharp (server-side), brightness/saturation adjustment, format conversion, resize
- Template System: 12 built-in templates (product/social/banner/lifestyle), applies to canvas with typed layers
- Layers panel: Drag-to-reorder, visibility toggle, lock toggle
- Auto-save: IndexedDB (idb-keyval) with draft recovery on session start
- Right-click context menu: Copy/paste/duplicate/delete/layer ordering
- Keyboard shortcuts: Ctrl+Z/Y (undo/redo), Ctrl+C/V/D (copy/paste/duplicate), Ctrl+S (save), Ctrl+E (export), Del, Escape

**Tech Stack**: Next.js (Pages Router), tRPC, Fabric.js v6, Sharp, idb-keyval, shadcn/ui + Tailwind

**Permissions**: MANAGE_PRODUCTS

**Container**: `saleor-image-studio-app-dev` (port 3008)

**AI Services** (separate containers):
- rembg: `saleor-rembg-dev` (port 7000) — Background removal, ~2GB memory
- Real-ESRGAN: `saleor-esrgan-dev` (port 7001) — Image upscaling, ~3GB memory
- Nano Banana / Gemini: External API (Gemini 2.5 Flash Image), requires `GEMINI_API_KEY` (free 50 req/day)

**Restart**: Use service name `saleor-image-studio-app`

### Dropship Orchestrator (`apps/apps/dropship-orchestrator/`)

**Purpose**: Multi-supplier dropshipping middleware. Auto-forwards dropship-tagged orders to AliExpress/CJ Dropshipping, syncs tracking/fulfillment back to Saleor, with fraud detection, exception queue, financial safety, and admin dashboard. Toggleable — when disabled, store operates normally with concrete inventory.

**Architecture**:
- **Supplier Adapter Pattern**: Pluggable `SupplierAdapter` interface — AliExpress (OAuth, RPC gateway, polling) + CJ (API Key, REST, webhooks)
- **Order Flow**: ORDER_PAID webhook → classify lines (concrete vs dropship) → fraud checks → cost ceiling → auto-forward to supplier → store supplier_order_id in metadata
- **Background Jobs**: BullMQ + Redis — tracking sync (every 2h), reconciliation (every 6h), token refresh (every 12d)
- **Fraud Detection**: Velocity check, address validation, value threshold, blacklist — composite score (passes if < 50)
- **Financial Safety**: Cost ceiling, daily spend limit, price drift detection, margin calculation
- **Security**: Encrypted credentials (EncryptedMetadataManager), IP whitelisting (CJ webhooks), HMAC verification, audit trail, data minimization

**Product Tagging**: Products tagged via Saleor metadata `dropship.supplier`, `dropship.supplierSku`, etc. Products WITHOUT this metadata are concrete inventory (ignored by the app).

**Key directories**:
- `src/modules/suppliers/` — Adapter interface, registry, AliExpress + CJ implementations
- `src/modules/webhooks/` — ORDER_PAID/ORDER_CANCELLED use cases + CJ webhook handlers
- `src/modules/jobs/` — BullMQ queues, workers (tracking-sync, reconciliation, token-refresh), scheduler
- `src/modules/fraud/` — Fraud checker + 4 rules (velocity, address, value, blacklist)
- `src/modules/pricing/` — Margin calculator, cost ceiling, daily spend tracker, price drift detector
- `src/modules/security/` — IP whitelist (CIDR), idempotency (djb2 hash + dedup)
- `src/modules/audit/` — Audit logger (17 event types, capped at 1000 entries)
- `src/modules/trpc/routers/` — 6 routers: suppliers, orders, exceptions, settings, audit, dashboard
- `src/pages/` — Admin dashboard: overview, suppliers (AliExpress/CJ config), orders, exceptions, settings, audit log

**Tech Stack**: Next.js (Pages Router), tRPC, BullMQ, ioredis, neverthrow, Zod. UI uses plain HTML primitives (`src/components/ui/primitives.tsx`) — macaw-ui Box/Text crash in iframe.

**Permissions**: MANAGE_PRODUCTS, MANAGE_ORDERS, MANAGE_APPS, MANAGE_SHIPPING, MANAGE_CHECKOUTS

**Container**: `saleor-dropship-app-dev` (port 3009). Depends on Redis for BullMQ.

**Restart**: Use service name `saleor-dropship-app`

### Catalog Generator (`scripts/catalog-generator/`)

**Purpose**: Infrastructure-as-code for store setup + product catalog generation. Uses `@saleor/configurator` (patched) to manage product types, attributes, warehouses, and shipping zones via YAML, then generates product Excel/CSVs for Bulk Manager import.

**Runs on host machine** (not Docker). Connects via `SALEOR_URL` + `SALEOR_TOKEN` in `.env`.

**Commands**:

```bash
cd scripts/catalog-generator
npm run setup         # Full pipeline: deploy + translate + generate
npm run deploy:ci     # Apply config.yml to Saleor (non-interactive)
npm run diff          # Preview changes (dry run)
npm run introspect    # Pull current state into config.yml
npm run translate     # Hebrew translations for categories/collections
npm run generate      # Product Excel + CSVs for Bulk Manager
```

**Key files**:

- `config.yml` — Store infrastructure definition (product types, attributes, warehouses, shipping)
- `src/config/products.ts` — 100 product definitions (7 brands)
- `src/config/categories.ts` — 35+ bilingual categories
- `src/config/collections.ts` — 18 bilingual collections
- `src/add-translations.ts` — Hebrew translation script
- `patches/@saleor+configurator+1.1.0.patch` — SINGLE_REFERENCE support + shipping fix

**Patches**: `@saleor/configurator` v1.1.0 is patched via `patch-package` (auto-applied on `npm install`) for:
1. SINGLE_REFERENCE / MULTI_REFERENCE attribute type support
2. Shipping zone `minimumOrderPrice` format fix

**After `config.yml` changes**: Run `npm run diff` to preview, then `npm run deploy:ci` to apply.

**After product/category/collection data changes**: Run `npm run generate` (and `npm run translate` if bilingual data changed).

## Post-Change Checklist

After completing any changes, verify:

1. **Docker Containers**: Determine which container(s) need restarting based on what changed
2. **Configuration Sync (11-file pipeline)**: If ANY storefront config field was added, renamed, or removed:
   - [ ] Shared schema updated (`apps/packages/storefront-config/src/schema/`)
   - [ ] Shared types updated (`apps/packages/storefront-config/src/types.ts`) — if new top-level section
   - [ ] Admin form schema updated (`storefront-control/src/modules/config/schema.ts`)
   - [ ] Defaults updated (`storefront-control/src/modules/config/defaults.ts`)
   - [ ] Sample config files updated — **BOTH** `sample-config-import.json` (Hebrew) AND `sample-config-import-en.json` (English)
   - [ ] Storefront types updated (`storefront/src/config/store.config.ts`)
   - [ ] Hook added/updated in `StoreConfigProvider.tsx`
   - [ ] **Settings search index updated** (`storefront-control/src/lib/settings-index.ts`) — so Cmd+K finds the new setting
   - [ ] **Admin UI page updated** (`storefront-control/src/pages/[channelSlug]/`) — form fields, tabs, or sections
   - [ ] Documentation updated (`PRD.md`, `CLAUDE.md`, `AGENTS.md`) — if significant change
3. **Build/Lint**: Run appropriate lint/type-check commands for changed packages
4. **Documentation**: Update PRD.md, CLAUDE.md, and AGENTS.md if structure/behavior significantly changed. All three docs MUST stay in sync with each other and with the codebase.
5. **App-Specific Checks**:
   - **Sales Analytics**: If Excel export changed, verify xlsx package is installed (`pnpm add xlsx`)
   - **Newsletter**: If MJML templates changed, verify template validation
   - **Storefront Control**: If config schema changed, update sample config files, settings search index, and admin UI pages
   - **Bulk Manager**: If new entity type added, update permissions in manifest
6. **Sync Enforcement** (hard rules — never skip):
   - Never add a schema field without its default, sample config values (both languages), and search index entry
   - Never add an admin form field without a corresponding search index entry (Cmd+K must find everything)
   - Never add a storefront hook without the matching schema field in the shared package
   - When renaming a field, update ALL 11 sync locations — partial renames cause silent breakage
   - When removing a field, remove from ALL locations and grep the storefront for dangling references
