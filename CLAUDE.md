# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aura E-Commerce Platform — a fully-featured, enterprise-grade, multi-tenant e-commerce platform built on Saleor. Supports multi-channel commerce (Israel ILS/Hebrew/RTL + International USD/English/LTR), CMS-driven configuration, and modular app ecosystem.

### Cloning for a New Store

This repo is designed to be cloned and rebranded for different stores. See **[CLONE-GUIDE.md](CLONE-GUIDE.md)** for the full step-by-step guide.

**Quick version:** `git clone` -> `platform.ps1 init` -> `platform.ps1 new-store` -> `platform.ps1 up` -> `platform.ps1 install-apps`

**Key concepts:**
- Docker container names are parameterized via `COMPOSE_PREFIX` env var (default: `aura`). Multiple stores can coexist on the same machine with different prefixes and ports.
- The `new-store` wizard rebrands platform.yml, .env, sample configs, cloudflared config, and catalog-generator config.
- Template files (`*.example`) alongside config files show the expected structure for new stores.
- The repo contains data from the reference store (Pawzen). The wizard overwrites the relevant files during rebranding.

## Core Design Principles

These principles **must guide every feature and code change**:

1. **Scalability First** — Design for 10x growth. Use pagination for all list queries, never fetch all records. Use background jobs (Celery) for heavy operations.
2. **Configuration Over Code** — Everything configurable via Storefront Control app. No hardcoded values for store name, URLs, branding, feature flags, or UI text.
3. **Multi-Tenancy Ready** — All settings are per-channel. One deployment serves multiple storefronts/brands.
4. **Reusability & DRY** — Extract common patterns into hooks/components. Use composition over inheritance.
5. **Future-Proof** — Decouple UI, business logic, and data fetching. API-first design.
6. **Conversion-First E-Commerce** — Always recommend and implement industry best practices for e-commerce flows. Protect the checkout funnel: never interrupt it with non-essential steps (email confirmations, account setup, redirects). Defer non-critical operations (account creation, newsletter signup, analytics) to after order placement. When proposing any checkout, cart, or payment flow change, proactively explain the conversion rate implications and recommend the approach that major platforms (Shopify, Amazon, etc.) use.

## Workspace Structure

```
saleor-platform/
├── saleor/              # Django/GraphQL backend (Python 3.12)
├── dashboard/           # Admin dashboard (React 18 + Vite + Tailwind CSS v4, TypeScript)
├── storefront/          # Customer storefront (Next.js 16, React 19, TypeScript)
├── apps/                # Saleor Apps monorepo (Turborepo, TypeScript)
│   ├── apps/            # Individual apps (storefront-control, bulk-manager, stripe, newsletter, etc.)
│   └── packages/        # Shared packages (@saleor/apps-storefront-config, apps-logger, apps-ui, etc.)
├── scripts/
│   └── catalog-generator/ # Store infrastructure as code + product catalog generation
├── infra/               # Docker Compose orchestration, platform CLI & setup scripts
├── PRD.md               # Product requirements (authoritative spec — keep updated)
├── AGENTS.md            # Agent guidelines (commands, patterns — keep updated)
└── QUICK-START.md       # Quick start guide for new developers
```

Check `.cursorrules` files in each subdirectory for project-specific conventions.

## Docker-First Development

**All commands run inside Docker containers via `docker exec`.** Never run `npm`, `pnpm`, `npx`, or `python` directly on the host machine.

### Starting the Environment

```bash
docker compose -f infra/docker-compose.dev.yml up -d
docker compose -f infra/docker-compose.dev.yml ps    # Verify health
```

### Container Map

Container names are parameterized via `COMPOSE_PREFIX` env var (default: `aura`). The table below uses `{prefix}` as placeholder — replace with your `COMPOSE_PREFIX` value (e.g., `aura-api-dev`, `mystore-api-dev`).

| Container | Port | Purpose |
|-----------|------|---------|
| `{prefix}-api-dev` | 8000 | Saleor GraphQL API |
| `{prefix}-worker-dev` | - | Celery background worker |
| `{prefix}-scheduler-dev` | - | Celery beat scheduler |
| `{prefix}-dashboard-dev` | 9000 | Admin dashboard |
| `{prefix}-storefront-dev` | 3000 | Customer storefront |
| `{prefix}-storefront-control-app-dev` | 3004 | CMS configuration app |
| `{prefix}-stripe-app-dev` | 3002 | Stripe payments |
| `{prefix}-smtp-app-dev` | 3001 | Email notifications |
| `{prefix}-invoice-app-dev` | 3003 | PDF invoices |
| `{prefix}-newsletter-app-dev` | 3005 | Newsletter management |
| `{prefix}-sales-analytics-app-dev` | 3006 | Sales analytics |
| `{prefix}-bulk-manager-app-dev` | 3007 | Bulk import/export manager |
| `{prefix}-image-studio-app-dev` | 3008 | AI-powered image editor |
| `{prefix}-dropship-app-dev` | 3009 | Dropship orchestrator (AliExpress + CJ) |
| `{prefix}-tax-manager-app-dev` | 3010 | Self-hosted tax calculation engine |
| `{prefix}-paypal-app-dev` | 3011 | PayPal Commerce payments |
| `{prefix}-postgres-dev` | 5432 | PostgreSQL database |
| `{prefix}-redis-dev` | 6379 | Redis cache/broker |
| `{prefix}-rembg-dev` | 7000 | AI background removal (Image Studio) |
| `{prefix}-esrgan-dev` | 7001 | AI image upscaling (Image Studio) |

### Access Points

- **Saleor API**: http://localhost:8000/graphql/
- **Dashboard**: http://localhost:9000
- **Storefront**: http://localhost:3000

## Common Development Commands

All commands use `docker exec`. For an interactive shell, use `docker exec -it <container> sh`.

> **Note:** Command examples below use `aura-` as the default container name prefix. If you set a different `COMPOSE_PREFIX` in `.env`, replace `aura-` with your prefix value (e.g., `mystore-api-dev` instead of `aura-api-dev`).

### Platform CLI (`infra/platform.ps1`)

```powershell
.\infra\platform.ps1 setup                     # Full guided setup (init + brand + DB + apps)
.\infra\platform.ps1 setup -NonInteractive     # Automated setup with defaults
.\infra\platform.ps1 new-store                 # Rebrand for a new store (wizard)
.\infra\platform.ps1 status                    # Health dashboard
.\infra\platform.ps1 up                        # Start platform (Docker + ephemeral tunnels)
.\infra\platform.ps1 up -Mode selfhosted       # Start with named tunnels
.\infra\platform.ps1 up -Profile prod          # Start with production compose
.\infra\platform.ps1 down                      # Stop everything
.\infra\platform.ps1 restart storefront        # Restart a service
.\infra\platform.ps1 db-init                   # Initialize DB (migrate + admin + schema)
.\infra\platform.ps1 db-init -SeedData         # DB init with demo products
.\infra\platform.ps1 backup -Compress          # Database backup
.\infra\platform.ps1 install-apps              # Register all Saleor apps
.\infra\platform.ps1 install-apps -Include "smtp","stripe"  # Install specific apps only
.\infra\platform.ps1 install-apps -Exclude "newsletter"     # Install all except specific apps
.\infra\platform.ps1 install-apps -SkipDelete               # Don't delete existing apps first
.\infra\platform.ps1 cleanup-apps             # Remove duplicate app installations
.\infra\platform.ps1 logs api                  # Tail container logs
.\infra\platform.ps1 codegen                   # Run GraphQL codegen
.\infra\platform.ps1 init                      # Prereqs check + .env + secret generation
.\infra\platform.ps1 generate-tunnel-config    # Regenerate cloudflared-config.yml
```

Service registry: `infra/platform.yml` — single source of truth for all ports, containers, tunnels, and store identity.

### New Project Setup

Clone the repo and run `platform.ps1 setup` for a fully guided setup. Or use individual commands for more control. See [QUICK-START.md](QUICK-START.md) for full guide.

```powershell
# Full guided setup (recommended for new projects)
.\infra\platform.ps1 setup

# Or step by step:
.\infra\platform.ps1 init                     # Prereqs + .env + secrets
.\infra\platform.ps1 new-store                # Brand wizard (~10 inputs)
.\infra\platform.ps1 up                       # Start Docker + tunnels (auto-detects fresh DB)
.\infra\platform.ps1 install-apps             # Register all Saleor apps

# Non-interactive
.\infra\platform.ps1 new-store -StoreName "My Store" -PrimaryColor "#E11D48" -Domain "mystore.com"
```

**Hydration targets**: `platform.yml`, `.env`, both sample config JSONs, `storefront/storefront-cms-config.json`, `cloudflared-config.yml`, TS config. Store identity lives in `platform.yml` under `store:` section.

**Catalog templates**: `CATALOG_TEMPLATE=starter npm run generate` (in `scripts/catalog-generator/`) generates a 20-product starter catalog instead of the default Pawzen catalog.

### Saleor API (saleor/) — Container: `aura-api-dev`

```bash
docker exec -it aura-api-dev python manage.py migrate           # Run migrations
docker exec -it aura-api-dev python manage.py makemigrations     # Create migrations
docker exec -it aura-api-dev python manage.py build_schema       # Build GraphQL schema
docker exec -it aura-api-dev python manage.py createsuperuser    # Create admin user
docker exec -it aura-api-dev pytest --reuse-db                   # All tests
docker exec -it aura-api-dev pytest --reuse-db path/to/test.py   # Single file
docker exec -it aura-api-dev pytest --reuse-db path/to/test.py -k test_name  # Specific test
docker exec -it aura-api-dev ruff check .                        # Lint
docker exec -it aura-api-dev mypy saleor                         # Type check
```

### Dashboard (dashboard/) — Container: `aura-dashboard-dev`

```bash
docker exec -it aura-dashboard-dev pnpm dev           # Start dev server
docker exec -it aura-dashboard-dev pnpm build          # Build for production
docker exec -it aura-dashboard-dev pnpm generate       # Generate GraphQL types
docker exec -it aura-dashboard-dev pnpm test           # Run Jest tests
docker exec -it aura-dashboard-dev pnpm test:watch     # Watch mode
docker exec -it aura-dashboard-dev pnpm e2e            # Playwright E2E tests
docker exec -it aura-dashboard-dev pnpm lint           # ESLint + Prettier
docker exec -it aura-dashboard-dev pnpm check-types    # TypeScript type check
```

### Storefront (storefront/) — Container: `aura-storefront-dev`

```bash
docker exec -it aura-storefront-dev pnpm dev           # Start dev server
docker exec -it aura-storefront-dev pnpm build          # Build for production
docker exec -it aura-storefront-dev pnpm generate       # Generate GraphQL types
docker exec -it aura-storefront-dev pnpm lint           # Next.js ESLint
docker exec -it aura-storefront-dev pnpm type-check     # TypeScript type check
```

### Apps Monorepo (apps/) — Per-app containers

```bash
# Example with storefront-control app (replace container name for other apps)
docker exec -it aura-storefront-control-app-dev pnpm dev
docker exec -it aura-storefront-control-app-dev pnpm build
docker exec -it aura-storefront-control-app-dev pnpm lint
docker exec -it aura-storefront-control-app-dev pnpm test
```

### Database — Container: `aura-postgres-dev`

```bash
docker exec -it aura-postgres-dev psql -U saleor -d saleor      # Connect to DB
docker exec aura-postgres-dev pg_dump -U saleor saleor > backup.sql  # Backup
```

## Container Restart & Verification Guidelines

> **MANDATORY: After making code changes, ALWAYS restart the affected container(s) AND verify the build succeeds.**
>
> **DO NOT rely on hot-reload / HMR.** Hot-reload does NOT work reliably in this Docker setup — file watchers inside containers frequently miss host-side file changes, especially on Windows. Always perform a full container restart (`docker compose restart`) after changes. Never assume your changes are live just because you saved the file.

### Container Restart Map

> Container names below use the default `COMPOSE_PREFIX` (`aura`). Replace `aura-` with your prefix if different.

| Change Location | Container(s) to Restart |
|-----------------|------------------------|
| `saleor/` (code changes) | `aura-api-dev` |
| `saleor/` (schema/models) | `aura-api-dev`, `aura-worker-dev`, `aura-scheduler-dev` |
| `saleor/` (migrations) | Run migrate first, then restart `aura-api-dev` |
| `dashboard/` | `aura-dashboard-dev` |
| `storefront/` | `aura-storefront-dev` |
| `apps/apps/storefront-control/` | `aura-storefront-control-app-dev` |
| `apps/apps/stripe/` | `aura-stripe-app-dev` |
| `apps/apps/smtp/` | `aura-smtp-app-dev` |
| `apps/apps/invoices/` | `aura-invoice-app-dev` |
| `apps/apps/newsletter/` | `aura-newsletter-app-dev` |
| `apps/apps/sales-analytics/` | `aura-sales-analytics-app-dev` |
| `apps/apps/bulk-manager/` | `aura-bulk-manager-app-dev` |
| `apps/apps/image-studio/` | `aura-image-studio-app-dev` |
| `apps/apps/dropship-orchestrator/` | `aura-dropship-app-dev` |
| `apps/apps/tax-manager/` | `aura-tax-manager-app-dev` |
| `apps/apps/paypal/` | `aura-paypal-app-dev` |

```bash
docker compose -f infra/docker-compose.dev.yml restart <container-name>
docker compose -f infra/docker-compose.dev.yml logs -f <container-name>    # View logs
docker compose -f infra/docker-compose.dev.yml logs --tail=100 <container> # Last 100 lines
```

**If GraphQL schema changed**, regenerate types before restarting frontends:
```bash
docker exec -it aura-api-dev python manage.py build_schema
docker exec -it aura-dashboard-dev pnpm generate
docker exec -it aura-storefront-dev pnpm generate
```

### Post-Change Verification (Always Do This)

**After every set of code changes, run the appropriate verification commands.** Do not skip this step — catching type errors early prevents cascading breakage.

| What Changed | Verification Command | Container |
|--------------|---------------------|-----------|
| Storefront code (`storefront/`) | `docker exec aura-storefront-dev pnpm type-check` | `aura-storefront-dev` |
| Storefront code (`storefront/`) | `docker exec aura-storefront-dev pnpm lint` | `aura-storefront-dev` |
| Storefront Control app | `docker exec aura-storefront-control-app-dev pnpm build` | `aura-storefront-control-app-dev` |
| Any app in `apps/` | `docker exec <app-container> pnpm build` | Per-app container |
| Dashboard code | `docker exec aura-dashboard-dev pnpm check-types` | `aura-dashboard-dev` |
| Python backend | `docker exec aura-api-dev ruff check .` | `aura-api-dev` |
| Python backend | `docker exec aura-api-dev mypy saleor` | `aura-api-dev` |

**Verification workflow after storefront changes:**
```bash
# 1. Restart the container
docker compose -f infra/docker-compose.dev.yml restart aura-storefront
# 2. Wait for dev server to be ready, then type-check
docker exec aura-storefront-dev pnpm type-check
# 3. Check logs for runtime errors
docker compose -f infra/docker-compose.dev.yml logs --tail=50 aura-storefront
```

**Verification workflow after Storefront Control app changes:**
```bash
# 1. Restart the container
docker compose -f infra/docker-compose.dev.yml restart aura-storefront-control-app
# 2. Build to verify no type/compile errors
docker exec aura-storefront-control-app-dev pnpm build
# 3. Check logs
docker compose -f infra/docker-compose.dev.yml logs --tail=50 aura-storefront-control-app
```

**When to check logs:** Always check container logs after restart if:
- You modified imports or exports
- You changed TypeScript types or interfaces
- You added/removed dependencies
- You changed config schema or structure
- The container might fail to start

## Architecture Overview

### Multi-Channel Architecture

Two target markets, routed via `[channel]` parameter in Next.js:

| Market | Channel | Currency | Language | Direction |
|--------|---------|----------|----------|-----------|
| Israel | ILS | Israeli Shekel (₪) | Hebrew | RTL |
| International | USD | US Dollar ($) | English | LTR |

- Dynamic routing: `/[channel]/products`, `/[channel]/checkout`
- Channel validation server-side with redirect to default if invalid
- Channel passed to all GraphQL operations
- Default channel: `NEXT_PUBLIC_DEFAULT_CHANNEL` env var

### Configuration-Driven Storefront (3-Tier)

| Priority | Source | Location | Use Case |
|----------|--------|----------|----------|
| 1 (Highest) | Storefront Control App | Saleor API Metadata | Production, runtime config |
| 2 | Sample Config Files | `apps/apps/storefront-control/*.json` | Development fallback |
| 3 | Static Config | `storefront/src/config/store.config.ts` | Type definitions, base defaults |

**Shared Config Package**: `@saleor/apps-storefront-config` in `apps/packages/storefront-config/` — 20 domain schema files (2,332 lines), Zod-inferred types, config version migrations. Used by both the Storefront Control admin and the storefront consumer.

**Implementation**: `storefront/src/providers/StoreConfigProvider.tsx` manages loading and provides hooks:
- Generic: `useStoreConfig()`, `useConfigSection(key)`, `useHomepageSection(id)`, `useFeature(feature)`
- Branding: `useBranding()`, `useDesignTokens()`, `useButtonStyle()`, `useBadgeStyle()`
- Content: `useContentConfig()`, `useFiltersText()`, `useProductDetailText()`, `useOrdersText()`, + 10 more text hooks
- Navigation: `useHeaderConfig()`, `useFooterConfig()`, `useNavbarText()`
- Homepage: `useHeroConfig()`, `useTrustStripConfig()`, `useMarqueeConfig()`, `useBrandGridConfig()`, + 8 more section hooks

**Config sections**: store info, branding (10 color tokens, typography, logos), features (19+ toggles), ecommerce (currency, shipping, tax), header/footer, homepage (12+ configurable sections), filters, UI customization, all UI text/translations, localization (RTL/LTR), dark mode, SEO, promo popup.

Real-time updates via custom event `storefront-config-updated`. Preview mode via PostMessage iframe bridge.

### Adding New Configurable Features (11-File Sync)

**All config-related files MUST stay in sync.** A mismatch causes runtime errors, missing fields, or broken admin UI. When adding, renaming, or removing any config field, update ALL relevant files:

| # | File / Location | What to Do |
|---|-----------------|------------|
| 1 | `apps/packages/storefront-config/src/schema/` | Add/update Zod schema (source of truth) |
| 2 | `apps/packages/storefront-config/src/types.ts` | Update exports (if new top-level section) |
| 3 | `apps/apps/storefront-control/src/modules/config/defaults.ts` | Add default value |
| 4 | `apps/apps/storefront-control/src/modules/config/schema.ts` | Add admin form validation |
| 5 | `storefront/src/config/store.config.ts` | Add storefront-side type/default |
| 6 | `storefront/src/providers/StoreConfigProvider.tsx` | Create/update React hook |
| 7 | `apps/apps/storefront-control/sample-config-import.json` | Add Hebrew value (**never empty string**) |
| 8 | `apps/apps/storefront-control/sample-config-import-en.json` | Add English value |
| 9 | `apps/apps/storefront-control/src/lib/settings-index.ts` | Add Cmd+K search entry (`page`, `sectionId`, `title`, `description`, `keywords[]`, `category`, `tab`) |
| 10 | `apps/apps/storefront-control/src/pages/[channelSlug]/` | Add admin UI controls (if user-facing) |
| 11 | `PRD.md` / `CLAUDE.md` / `AGENTS.md` | Update docs (if significant) |

**After changes:** Restart storefront + storefront-control-app containers at minimum.

**Hard rules:**
- Never add a schema field without also adding its default, sample config values, and search index entry
- Never add a storefront hook without the corresponding schema field in the shared package
- When renaming a field, update ALL 11 locations — partial renames cause silent breakage
- When removing a field, remove from ALL locations and check for dangling references
- Both sample configs must have proper translations (Hebrew / English) — audit for empty strings periodically

```typescript
// BAD: Hardcoded behavior
const MAX_RELATED_PRODUCTS = 8;
const RELATED_TITLE = "You May Also Like";

// GOOD: Configurable via Storefront Control
const { maxItems, title, subtitle, strategy } = useRelatedProductsConfig();
```

### RTL/LTR Implementation

Direction auto-detected from locale. RTL locales: `he`, `ar`, `fa`, `ur`, `yi`, `ps`.

**CSS Strategy** — use logical properties and Tailwind logical utilities:
- `margin-inline-start` not `margin-left` / `ms-4` not `ml-4`
- `start-0` not `left-0` / `end-0` not `right-0`
- `rtl:rotate-180` for directional icons

### Homepage Product Sections (Data-Driven)

| Section | Primary Source | Fallback (if collection empty) |
|---------|---------------|-------------------------------|
| Featured | Collection `featured-products` | None |
| New Arrivals | Collection `new-arrivals` | Products sorted by `CREATED_AT` DESC |
| Best Sellers | Collection `best-sellers` | Products sorted by `RATING` DESC |
| On Sale | Collection `sale` | None |

**Product Badges** (data-driven):
- **Sale**: price < undiscounted price
- **New**: product `created` within last 30 days (configurable via `NEW_PRODUCT_DAYS`)
- **Low stock**: total variant stock > 0 and <= 5
- **Out of stock**: total variant stock = 0

GraphQL definitions: `storefront/src/graphql/HomepageProducts.graphql`

### Homepage Configurable Sections

12+ configurable sections in `storefront/src/components/home/`, each with a `use<Section>Config()` hook. Sections: Hero, TrustStrip, Marquee, BrandGrid, Categories, TrendingProducts, PromotionBanner, FlashDeals, CollectionMosaic, BestSellers, CustomerFeedback, Newsletter. Section order is drag-and-drop configurable via the Design page in Storefront Control.

### Component Designer (Per-Component Style Overrides)

Visual playground in Storefront Control for overriding any storefront component's styling beyond global branding. Admins select a component from a tree, edit visual properties (colors, typography, spacing, hover states, custom Tailwind classes), and see live preview.

**Architecture**: CSS Custom Properties (`--cd-{key}-{prop}`) on `<html>`. Storefront components reference with fallbacks: `var(--cd-homepage-hero-bg, var(--store-primary))`. No React re-renders needed for live preview.

**Cascade**: Component override > Page config > Global branding.

**Key Files**:
| File | Purpose |
|------|---------|
| `apps/packages/storefront-config/src/schema/component-overrides.ts` | Zod schema (19 properties: visual, typography, layout, hover, customClasses) |
| `apps/apps/storefront-control/src/lib/component-registry.ts` | Runtime registry of customizable components across 7 pages |
| `apps/apps/storefront-control/src/pages/[channelSlug]/component-designer.tsx` | Admin page: split panel (tree + properties) |
| `apps/apps/storefront-control/src/components/pages/component-designer/` | ComponentTree, StylePropertiesPanel, PropertyFieldRenderer |
| `storefront/src/providers/StoreConfigProvider.tsx` | `useComponentStyle(key)` + `useComponentClasses(key)` hooks |
| `storefront/src/config/store.config.ts` | `getComponentOverrideCSSVariables()` — generates `--cd-*` CSS vars; `buildComponentStyle()` — maps overrides to inline styles |

**Storefront Wiring Pattern** (client components):
```tsx
import { buildComponentStyle } from "@/config";
import { useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";

const cdStyle = useComponentStyle("homepage.hero");
const cdClasses = useComponentClasses("homepage.hero");
<section
  data-cd="homepage-hero"
  className={`base-classes ${cdClasses}`}
  style={{ ...buildComponentStyle("homepage.hero", cdStyle) }}
>
```

Server components use CSS variables directly (no hooks): `style={{ backgroundColor: 'var(--cd-layout-header-bg, transparent)' }}`.

**Wired Components**: 47 components across all pages are fully wired via `buildComponentStyle()` helper. Covers: Homepage, Layout, PLP, PDP, Cart, Checkout, Account, Auth. Each component has a `data-cd="<key>"` attribute for the visual overlay system. See `apps/apps/storefront-control/src/lib/component-registry.ts` for the full registry.

### Apps Architecture Patterns

Apps in `apps/apps/` follow domain-driven design:

- **Result-Based Error Handling**: `neverthrow` — functions return `Result<T, E>` instead of throwing
- **Branded Types**: Zod branded types for validated primitives (see `apps/adr/` ADR 0002)
- **Repository Pattern**: Data access via repository interfaces (DynamoDB-backed)
- **Modular Structure**: `src/modules/` by domain, thin webhook handlers, rich use cases
- **Error Classes**: `BaseError.subclass()` from `@saleor/apps-errors`

### GraphQL Integration

**Storefront (urql)** — configured in `storefront/src/lib/graphql.ts`:
- Server-side rendering with Docker service names (`http://aura-api:8000/graphql/`)
- Retry: 4 max retries with exponential backoff (1s * 2^attempt), 30s timeout
- Per-operation caching with Next.js revalidation strategies
- Auth via `@saleor/auth-sdk` cookies

**Dashboard (Apollo Client)** — two schemas (main + staging), run `pnpm generate` after changes.

### Storefront Data Fetching Patterns

**Server Components (default):**
```typescript
async function ProductPage({ params }) {
  const product = await executeGraphQL(ProductDocument, {
    variables: { id: params.id },
    revalidate: 300,
  });
  return <ProductDetail product={product} />;
}
```

**Server Actions (mutations):**
```typescript
'use server'
export async function addToCart(cartId: string, productId: string) {
  const result = await executeGraphQL(AddToCartDocument, { ... });
  return { success: true, cart: result };
}
```

**State Management:**
- Context API for global state (store config, wishlist, cart drawer, quick view)
- Auth via `@saleor/auth-sdk` cookies with server-side session

**Checkout Architecture:**
- `storefront/src/checkout-v2/` — App Router, single-page accordion, React Hook Form + Zod, `useReducer` + Context state
  - Shared modules: `storefront/src/lib/checkout/` (GraphQL types, useCheckoutText, UserContext, country data, address utils)
  - Accordion steps: 0=Contact, 1=Shipping, 2=Delivery, 3=Payment — IDs: `#checkout-step-{N}-header` / `#checkout-step-{N}-panel`
  - Server Actions: `storefront/src/checkout-v2/_actions/` (11 actions)
  - Order confirmation: `storefront/src/checkout-v2/confirmation/` (OrderConfirmation, OrderSummary, OrderNextSteps)
  - E2E tests: `storefront/e2e/checkout-v2.spec.ts` — runs by default with `pnpm test:e2e`
  - Page object: `storefront/e2e/pages/checkout-v2.page.ts`
- Payment integrations: Stripe (`@stripe/react-stripe-js`) and Adyen (`@adyen/adyen-web`)

**Analytics & Consent:**
- **Cookie Consent** (`storefront/src/lib/consent.ts`): localStorage per-channel, 3 categories (essential/analytics/marketing), dispatches `consent-updated` event
- **GA4** (`storefront/src/lib/analytics.ts`): Events push to `window.dataLayer`, queue if no consent, deduplication via `_sentEvents` Set
- **GTM** (`storefront/src/ui/components/GoogleTagManager.tsx`): Loads only after analytics consent
- **Events**: view_item + add_to_cart (PDP), begin_checkout (cart), purchase (confirmation), search
- **GTM Container:** Configured per-store via `platform.yml` and Storefront Control app (set during `new-store` wizard)
- **GA4 Property:** Configured per-store via `platform.yml` and Storefront Control app (set during `new-store` wizard)

### Dashboard Architecture

Modernized from MUI v5 to Tailwind CSS v4 + macaw-ui-next. See `dashboard/CLAUDE.md` for full architecture details, including the font-size compatibility issue (1rem = ~8px), custom table components, `withQs()` URL pattern, and React Router v7 relative routing.

## Testing Conventions

**Python (saleor/):** Pytest with fixtures from `tests/fixtures/`. Use `--reuse-db` for speed. Prefer fixtures over mocking. Flat test functions (no classes).

**Dashboard:** Jest for unit tests (colocated with source), Playwright for E2E. Import sorting enforced by simple-import-sort ESLint rule.

**Apps:** Vitest with workspace config. Unit tests in `src/**/*.test.ts`, E2E via `vitest --project e2e`. Mocks in `src/__tests__/mocks/`. For neverthrow: `._unsafeUnwrap()` for success, `._unsafeUnwrapErr()` for errors.

**Storefront E2E:** Playwright test suite. **Runs on the host machine** (not Docker) against `http://localhost:3000`. Page object pattern in `storefront/e2e/pages/`. Auth uses cookie injection (bypasses JWT ISS mismatch in dev). Global setup verifies storefront + API reachability.

| Spec | Tests | Notes |
|------|-------|-------|
| `cart.spec.ts` | 5 | Add to cart, drawer, qty, remove |
| `checkout-v2.spec.ts` | 6 | Checkout: guest checkout, step locking, auth, CJ display (no order), promo UX, RTL |
| `auth.spec.ts` | 5 | Login, register, password reset, access guard |
| `search.spec.ts` | 4 | Search flows |
| `account.spec.ts` | 5+ | Auth redirect flows |

```bash
# Run from storefront/ directory (on host, NOT in Docker)
cd storefront
pnpm test:e2e                          # All tests (headless)
pnpm test:e2e:headed                   # With browser visible
pnpm test:e2e:ui                       # Playwright interactive UI
```

**Storefront static analysis:** TypeScript strict mode + ESLint (no unit test runner).

## Code Style

**TypeScript (all frontend):** Strict mode, avoid `any`. Functional components + hooks. Named exports preferred. Prettier formatting. ESLint as source of truth.

**Python (saleor/):** Black-style (4 spaces, 88 columns). Ruff linting. Type hints required for public functions.

**Apps-specific:** Result-based error handling with neverthrow. Branded types with Zod. BaseError subclasses. Repository pattern. Keep webhook handlers thin.

## Claude Code Skill Invocations

> These apply only to Claude Code sessions with the superpowers plugin installed.

| Workflow | Skill | When |
|----------|-------|------|
| Planning | `superpowers:writing-plans` | Before writing any implementation plan |
| Executing Plans | `superpowers:executing-plans` | Before executing an approved plan |
| Brainstorming | `brainstorming` | Before any creative work — features, components, new functionality |
| Frontend Development | `senior-frontend` | Before any storefront/dashboard UI work |
| Frontend Design | `frontend-design` | Before creating or redesigning UI components |
| UI/UX Decisions | `ui-ux-pro-max` | Before making UI/UX design decisions |
| Backend Work | `senior-backend` | Before API, Django, or GraphQL backend changes |
| E-Commerce Logic | `ecommerce-expert` | Before checkout, cart, pricing, or conversion decisions |
| Saleor API | `saleor-api-skill` | When writing GraphQL queries/mutations or looking up Saleor API types |
| SEO | `seo-optimizer` | Before SEO-related changes (meta tags, structured data, sitemap) |
| Security Review | `senior-security` | Before auth, payment, or sensitive data handling changes |
| DevOps | `senior-devops` | Before Docker, CI/CD, deployment, or infrastructure changes |
| Code Review | `superpowers:requesting-code-review` | After completing a feature or before merging |
| Debugging | `superpowers:systematic-debugging` | When encountering bugs or test failures |
| Verification | `superpowers:verification-before-completion` | Before claiming work is complete or creating PRs |
| React Best Practices | `react-best-practices` | When writing or refactoring React/Next.js components |

## Saleor Apps Reference

See Container Map above for ports and container names. See `apps/CLAUDE.md` for app-specific architecture and patterns. App purposes:

- **storefront-control** (3004): Page-based CMS admin (11 pages), ComponentBlock UI, shadcn/ui, Cmd+K, live preview
- **stripe** (3002): Payment processing
- **smtp** (3001): Email delivery (fulfillment, invoices, welcome)
- **invoices** (3003): PDF invoice generation
- **newsletter** (3005): Subscribers, MJML templates, campaigns
- **sales-analytics** (3006): KPIs, charts, Excel export
- **bulk-manager** (3007): CSV/Excel bulk import/export/delete (products, categories, collections, customers, orders, vouchers, gift cards)
- **image-studio** (3008): AI-powered image editor (Fabric.js canvas, bg removal, upscaling, generation)
- **dropship-orchestrator** (3009): Multi-supplier dropshipping (AliExpress + CJ), order forwarding, tracking, fraud detection
- **tax-manager** (3010): Self-hosted tax calculation with country/state rates, export zero-rating
- **paypal** (3011): PayPal Commerce payments (cards + PayPal wallet), REST v2 Orders API, file-based config

## Catalog Generator & Store Infrastructure (`scripts/catalog-generator/`)

Manages store infrastructure as code and generates product catalog files. See [SETUP.md](scripts/catalog-generator/SETUP.md) for full documentation.

**What it manages:** Product types, attributes (with values), channels, warehouses, shipping zones, shop settings — defined in `config.yml` and applied via `@saleor/configurator` (patched for SINGLE_REFERENCE support).

**Pipeline:** `npm run setup` = deploy infrastructure → translate to Hebrew → generate product Excel/CSVs → upload via Bulk Manager.

**Commands (run from `scripts/catalog-generator/`):**

```bash
npm run setup         # Full pipeline: deploy + translate + generate
npm run deploy:ci     # Apply config.yml to Saleor (non-interactive)
npm run diff          # Preview changes (dry run)
npm run introspect    # Pull current Saleor state into config.yml
npm run translate     # Add Hebrew translations to categories/collections
npm run generate      # Generate product Excel + CSVs
```

**Key files:**

| File | Purpose |
|------|---------|
| `scripts/catalog-generator/config.yml` | Store infrastructure YAML (product types, attributes, warehouses, shipping) |
| `scripts/catalog-generator/src/config/products.ts` | 100 product definitions across 7 brands |
| `scripts/catalog-generator/src/config/categories.ts` | 35+ bilingual categories with hierarchy |
| `scripts/catalog-generator/src/config/collections.ts` | 18 bilingual collections |
| `scripts/catalog-generator/src/add-translations.ts` | Hebrew translation script (reuses categories.ts/collections.ts) |
| `scripts/catalog-generator/patches/` | patch-package patches for @saleor/configurator SINGLE_REFERENCE + shipping fix |

**Important:** This runs on the **host machine** (not Docker). It connects to Saleor via the GraphQL API URL in `.env`.

## Key Configuration Files

**Infrastructure:**
- `infra/.env` — Environment variables for all Docker services
- `infra/docker-compose.dev.yml` — Docker services orchestration
- `infra/platform.yml` — Service registry (ports, containers, tunnels, store identity)

**Storefront config pipeline** (see "Keeping Everything in Sync" for the full 11-file list):
- `apps/packages/storefront-config/src/schema/` — Zod schemas (source of truth)
- `apps/packages/storefront-config/src/types.ts` — Shared TypeScript types
- `apps/apps/storefront-control/src/modules/config/defaults.ts` — Default values
- `apps/apps/storefront-control/sample-config-import.json` — Hebrew/ILS dev fallback
- `apps/apps/storefront-control/sample-config-import-en.json` — English/USD dev fallback
- `storefront/src/config/store.config.ts` — Storefront-side types and defaults
- `storefront/src/providers/StoreConfigProvider.tsx` — Config context + all hooks

**Other key files:**
- `storefront/src/lib/graphql.ts` — urql client (retries, auth, Docker service URLs)
- `saleor/saleor/settings.py` — Django settings
- `storefront/playwright.config.ts` — E2E config
- `storefront/e2e/fixtures/test-data.ts` — Test constants (channel, credentials, Stripe test card)

## Gotchas & Common Mistakes

### Docker & Containers
- **HMR does NOT work reliably** — Always `docker compose restart` after changes on Windows. Never assume saves are live.
- **Volume mount changes** require `docker compose up --force-recreate`, not just `restart`
- **Docker restart uses service names** (e.g., `aura-api`, `aura-storefront`, `aura-bulk-manager-app`), NOT container names with `-dev` suffix (e.g., NOT `aura-api-dev`). `docker exec` uses container names (`-dev`), but `docker compose restart` uses service names (no `-dev`)
- **Catalog generator runs on the HOST** (not Docker) — it connects to Saleor via the API URL in `.env`

### TypeScript & React
- **`export { X } from` does NOT make X local** — Must also `import { X }` separately to use in the same file
- **ReactNode return type** — Don't use explicit `: ReactNode` on components used as JSX children (React 18 type compat). Let TS infer.
- **React.RefObject** — Use `React.RefObject<HTMLElement>` not `React.RefObject<HTMLElement | null>` for DOM refs in JSX
- **Zod array fields in forms** — Schema `z.array(z.string())` needs `Controller` with join/split logic, not plain `register()`

### Config System
- **After GraphQL schema changes**: Run `build_schema` in API, then `pnpm generate` in dashboard AND storefront
- **New configurable features** require updating ALL 11 sync locations (see "Keeping Everything in Sync")
- **Sample config JSONs**: ALWAYS update BOTH Hebrew AND English — every content field needs proper translations in both
- **tsconfig paths for Docker**: Shared packages need `"zod": ["./node_modules/zod"]` so zod resolves correctly

### Storefront
- **RTL**: Always use logical CSS properties (`ms-4` not `ml-4`, `start-0` not `left-0`)
- **CSS marquee + RTL**: RTL flex reverses copy order, breaking `translateX(-100%)`. Fix: `direction: ltr` on marquee container
- **ButtonsSchema**: `borderRadius` is on `ButtonsSchema` (parent), not `ButtonVariantSchema` (children). Path: `ui.buttons.borderRadius`

### Apps (Saleor Dashboard Iframe)
- **macaw-ui Sprinkles crash**: macaw-ui Box/Text in page files crash in iframe. Keep macaw-ui ONLY in `_app.tsx`, use plain HTML primitives elsewhere
- **AppBridge navigation**: Use `router.push()` with `<button>`, NOT `<Link>` from Next.js — Link fails silently in iframe

### Large File Operations
- **Large file rewrites**: Use PowerShell scripts with `Get-Content` + line range extraction, not the Write tool (token limits)

## Environment Setup

All environment variables live in `infra/.env`. Key variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `SECRET_KEY` | Django secret key | Random string |
| `DATABASE_URL` | PostgreSQL connection | `postgres://saleor:saleor@aura-postgres:5432/saleor` |
| `ALLOWED_HOSTS` | Django allowed hosts | `localhost,aura-api` |
| `DASHBOARD_URL` | Dashboard URL for CORS | `http://localhost:9000` |
| `STOREFRONT_URL` | Storefront URL for CORS | `http://localhost:3000` |
| `NEXT_PUBLIC_DEFAULT_CHANNEL` | Default storefront channel | `default-channel` |
| `NEXT_PUBLIC_SALEOR_API_URL` | Client-side API URL | `http://localhost:8000/graphql/` |
| `DEFAULT_FROM_EMAIL` | Transactional email sender | `noreply@yourdomain.com` |
| `CONTACT_EMAIL` | Contact form notifications recipient | `support@yourdomain.com` |
| `DASHBOARD_TUNNEL_URL` | Dashboard tunnel URL (for Vite allowedHosts) | `https://dash.yourdomain.com` |

For tunneled/production access, update `ALLOWED_HOSTS`, `DASHBOARD_URL`, `STOREFRONT_URL`, and app `APP_API_BASE_URL` values. Use `platform.ps1 generate-tunnel-config` for cloudflared.

## Troubleshooting

| Problem | Diagnosis | Fix |
|---------|-----------|-----|
| Container won't start | `docker compose logs <container>` | Check for port conflicts, missing env vars, or syntax errors |
| DB connection refused | `docker compose ps aura-postgres-dev` | Ensure postgres is healthy; run `docker compose restart aura-postgres` |
| GraphQL type errors after schema change | Types are stale | Run `build_schema` in API, then `pnpm generate` in dashboard + storefront |
| "Module not found" in storefront | Shared package not mounted | Check volume mounts in docker-compose; run `docker compose up --force-recreate` |
| App not appearing in Dashboard | App not registered | Run `platform.ps1 install-apps` or manually register via Dashboard > Apps |
| App install fails "already installed" | Duplicate apps in DB | Run `platform.ps1 cleanup-apps` or `manage.py cleanup_apps` to remove duplicates |
| App has no permissions | `appInstall` sent empty permissions array | Run `manage.py cleanup_apps` to set correct manifest permissions |
| Storefront shows fallback config | Storefront Control not reachable | Check `STOREFRONT_CONTROL_APP_URL` env var and app container health |
| Dashboard "Blocked request" on tunnel | `DASHBOARD_TUNNEL_URL` not set or has protocol | Set `DASHBOARD_TUNNEL_URL=https://dash.yourdomain.com` in `.env`; Vite strips protocol automatically |
| Contact form emails go to wrong address | `CONTACT_EMAIL` not set | Add `CONTACT_EMAIL=support@yourdomain.com` to `.env` and restart API |
| E2E tests fail to connect | Containers not running | Run `docker compose up -d` first; E2E expects `localhost:3000` + `localhost:8000` |
| Type check passes but runtime crashes | HMR didn't pick up changes | Restart the container (`docker compose restart <container>`) |

## Important Documentation

- **PRD.md**: Authoritative product spec — keep updated with significant changes
- **AGENTS.md**: Agent guidelines, container restart rules, build commands, code style — keep updated
- **Project-specific .cursorrules**: In `saleor/`, `dashboard/`, `storefront/`, `apps/`
- **apps/.github/copilot-instructions.md**: Detailed app patterns and architecture
- **apps/adr/**: Architecture Decision Records

## Node.js Environment

- **Required**: Node.js >= 22.0.0 (check `.nvmrc` files)
- **Package Manager**: pnpm >= 10.0.0
- **Monorepo Tools**: Turborepo (apps), PNPM workspaces

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:
- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
Instead use:
- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED
WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
Instead use:
- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)
Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)
If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)
Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `ctx_stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |
