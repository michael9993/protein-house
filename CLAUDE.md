# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aura E-Commerce Platform — a fully-featured, enterprise-grade, multi-tenant e-commerce platform built on Saleor. Supports multi-channel commerce (Israel ILS/Hebrew/RTL + International USD/English/LTR), CMS-driven configuration, and modular app ecosystem. First client: Mansour Shoes.

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
├── infra/               # Docker Compose orchestration & setup scripts
├── PRD.md               # Product requirements (authoritative spec — keep updated)
└── AGENTS.md            # Agent guidelines (commands, patterns — keep updated)
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

| Container | Port | Purpose |
|-----------|------|---------|
| `saleor-api-dev` | 8000 | Saleor GraphQL API |
| `saleor-worker-dev` | - | Celery background worker |
| `saleor-scheduler-dev` | - | Celery beat scheduler |
| `saleor-dashboard-dev` | 9000 | Admin dashboard |
| `saleor-storefront-dev` | 3000 | Customer storefront |
| `saleor-storefront-control-app-dev` | 3004 | CMS configuration app |
| `saleor-stripe-app-dev` | 3002 | Stripe payments |
| `saleor-smtp-app-dev` | 3001 | Email notifications |
| `saleor-invoice-app-dev` | 3003 | PDF invoices |
| `saleor-newsletter-app-dev` | 3005 | Newsletter management |
| `saleor-sales-analytics-app-dev` | 3006 | Sales analytics |
| `saleor-bulk-manager-app-dev` | 3007 | Bulk import/export manager |
| `saleor-image-studio-app-dev` | 3008 | AI-powered image editor |
| `saleor-dropship-app-dev` | 3009 | Dropship orchestrator (AliExpress + CJ) |
| `saleor-tax-manager-app-dev` | 3010 | Self-hosted tax calculation engine |
| `saleor-postgres-dev` | 5432 | PostgreSQL database |
| `saleor-redis-dev` | 6379 | Redis cache/broker |
| `saleor-rembg-dev` | 7000 | AI background removal (Image Studio) |
| `saleor-esrgan-dev` | 7001 | AI image upscaling (Image Studio) |

### Access Points

- **Saleor API**: http://localhost:8000/graphql/
- **Dashboard**: http://localhost:9000
- **Storefront**: http://localhost:3000

## Common Development Commands

All commands use `docker exec`. For an interactive shell, use `docker exec -it <container> sh`.

### Platform CLI (`infra/platform.ps1`)

```powershell
.\infra\platform.ps1 new-store                 # Rebrand for a new store (wizard)
.\infra\platform.ps1 status                    # Health dashboard
.\infra\platform.ps1 up                        # Start platform (Docker + ephemeral tunnels)
.\infra\platform.ps1 up -Mode selfhosted       # Start with named tunnels
.\infra\platform.ps1 down                      # Stop everything
.\infra\platform.ps1 restart storefront        # Restart a service
.\infra\platform.ps1 backup -Compress          # Database backup
.\infra\platform.ps1 install-apps              # Register all Saleor apps
.\infra\platform.ps1 logs api                  # Tail container logs
.\infra\platform.ps1 codegen                   # Run GraphQL codegen
.\infra\platform.ps1 generate-tunnel-config    # Regenerate cloudflared-config.yml
```

Service registry: `infra/platform.yml` — single source of truth for all ports, containers, tunnels, and store identity.

### New Store Setup

Clone the repo and run `platform.ps1 new-store` to rebrand everything for a new store. The wizard collects ~9 inputs and propagates them to all config files. See [QUICKSTART.md](QUICKSTART.md) for full guide.

```powershell
# Interactive wizard
.\infra\platform.ps1 new-store

# Non-interactive
.\infra\platform.ps1 new-store -StoreName "My Store" -PrimaryColor "#E11D48" -Domain "mystore.com"
```

**Hydration targets**: `platform.yml`, `.env`, both sample config JSONs, `storefront-cms-config.json`, `cloudflared-config.yml`, TS config. Store identity lives in `platform.yml` under `store:` section.

**Catalog templates**: `CATALOG_TEMPLATE=starter npm run generate` (in `scripts/catalog-generator/`) generates a 20-product starter catalog instead of the default Pawzen catalog.

### Saleor API (saleor/) — Container: `saleor-api-dev`

```bash
docker exec -it saleor-api-dev python manage.py migrate           # Run migrations
docker exec -it saleor-api-dev python manage.py makemigrations     # Create migrations
docker exec -it saleor-api-dev python manage.py build_schema       # Build GraphQL schema
docker exec -it saleor-api-dev python manage.py createsuperuser    # Create admin user
docker exec -it saleor-api-dev pytest --reuse-db                   # All tests
docker exec -it saleor-api-dev pytest --reuse-db path/to/test.py   # Single file
docker exec -it saleor-api-dev pytest --reuse-db path/to/test.py -k test_name  # Specific test
docker exec -it saleor-api-dev ruff check .                        # Lint
docker exec -it saleor-api-dev mypy saleor                         # Type check
```

### Dashboard (dashboard/) — Container: `saleor-dashboard-dev`

```bash
docker exec -it saleor-dashboard-dev pnpm dev           # Start dev server
docker exec -it saleor-dashboard-dev pnpm build          # Build for production
docker exec -it saleor-dashboard-dev pnpm generate       # Generate GraphQL types
docker exec -it saleor-dashboard-dev pnpm test           # Run Jest tests
docker exec -it saleor-dashboard-dev pnpm test:watch     # Watch mode
docker exec -it saleor-dashboard-dev pnpm e2e            # Playwright E2E tests
docker exec -it saleor-dashboard-dev pnpm lint           # ESLint + Prettier
docker exec -it saleor-dashboard-dev pnpm check-types    # TypeScript type check
```

### Storefront (storefront/) — Container: `saleor-storefront-dev`

```bash
docker exec -it saleor-storefront-dev pnpm dev           # Start dev server
docker exec -it saleor-storefront-dev pnpm build          # Build for production
docker exec -it saleor-storefront-dev pnpm generate       # Generate GraphQL types
docker exec -it saleor-storefront-dev pnpm lint           # Next.js ESLint
docker exec -it saleor-storefront-dev pnpm type-check     # TypeScript type check
```

### Apps Monorepo (apps/) — Per-app containers

```bash
# Example with storefront-control app (replace container name for other apps)
docker exec -it saleor-storefront-control-app-dev pnpm dev
docker exec -it saleor-storefront-control-app-dev pnpm build
docker exec -it saleor-storefront-control-app-dev pnpm lint
docker exec -it saleor-storefront-control-app-dev pnpm test
```

### Database — Container: `saleor-postgres-dev`

```bash
docker exec -it saleor-postgres-dev psql -U saleor -d saleor      # Connect to DB
docker exec saleor-postgres-dev pg_dump -U saleor saleor > backup.sql  # Backup
```

## Container Restart & Verification Guidelines

> **MANDATORY: After making code changes, ALWAYS restart the affected container(s) AND verify the build succeeds.**
>
> **DO NOT rely on hot-reload / HMR.** Hot-reload does NOT work reliably in this Docker setup — file watchers inside containers frequently miss host-side file changes, especially on Windows. Always perform a full container restart (`docker compose restart`) after changes. Never assume your changes are live just because you saved the file.

### Container Restart Map

| Change Location | Container(s) to Restart |
|-----------------|------------------------|
| `saleor/` (code changes) | `saleor-api-dev` |
| `saleor/` (schema/models) | `saleor-api-dev`, `saleor-worker-dev`, `saleor-scheduler-dev` |
| `saleor/` (migrations) | Run migrate first, then restart `saleor-api-dev` |
| `dashboard/` | `saleor-dashboard-dev` |
| `storefront/` | `saleor-storefront-dev` |
| `apps/apps/storefront-control/` | `saleor-storefront-control-app-dev` |
| `apps/apps/stripe/` | `saleor-stripe-app-dev` |
| `apps/apps/smtp/` | `saleor-smtp-app-dev` |
| `apps/apps/invoices/` | `saleor-invoice-app-dev` |
| `apps/apps/newsletter/` | `saleor-newsletter-app-dev` |
| `apps/apps/sales-analytics/` | `saleor-sales-analytics-app-dev` |
| `apps/apps/bulk-manager/` | `saleor-bulk-manager-app-dev` |
| `apps/apps/image-studio/` | `saleor-image-studio-app-dev` |
| `apps/apps/dropship-orchestrator/` | `saleor-dropship-app-dev` |
| `apps/apps/tax-manager/` | `saleor-tax-manager-app-dev` |

```bash
docker compose -f infra/docker-compose.dev.yml restart <container-name>
docker compose -f infra/docker-compose.dev.yml logs -f <container-name>    # View logs
docker compose -f infra/docker-compose.dev.yml logs --tail=100 <container> # Last 100 lines
```

**If GraphQL schema changed**, regenerate types before restarting frontends:
```bash
docker exec -it saleor-api-dev python manage.py build_schema
docker exec -it saleor-dashboard-dev pnpm generate
docker exec -it saleor-storefront-dev pnpm generate
```

### Post-Change Verification (Always Do This)

**After every set of code changes, run the appropriate verification commands.** Do not skip this step — catching type errors early prevents cascading breakage.

| What Changed | Verification Command | Container |
|--------------|---------------------|-----------|
| Storefront code (`storefront/`) | `docker exec saleor-storefront-dev pnpm type-check` | `saleor-storefront-dev` |
| Storefront code (`storefront/`) | `docker exec saleor-storefront-dev pnpm lint` | `saleor-storefront-dev` |
| Storefront Control app | `docker exec saleor-storefront-control-app-dev pnpm build` | `saleor-storefront-control-app-dev` |
| Any app in `apps/` | `docker exec <app-container> pnpm build` | Per-app container |
| Dashboard code | `docker exec saleor-dashboard-dev pnpm check-types` | `saleor-dashboard-dev` |
| Python backend | `docker exec saleor-api-dev ruff check .` | `saleor-api-dev` |
| Python backend | `docker exec saleor-api-dev mypy saleor` | `saleor-api-dev` |

**Verification workflow after storefront changes:**
```bash
# 1. Restart the container
docker compose -f infra/docker-compose.dev.yml restart saleor-storefront-dev
# 2. Wait for dev server to be ready, then type-check
docker exec saleor-storefront-dev pnpm type-check
# 3. Check logs for runtime errors
docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-storefront-dev
```

**Verification workflow after Storefront Control app changes:**
```bash
# 1. Restart the container
docker compose -f infra/docker-compose.dev.yml restart saleor-storefront-control-app-dev
# 2. Build to verify no type/compile errors
docker exec saleor-storefront-control-app-dev pnpm build
# 3. Check logs
docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-storefront-control-app-dev
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

**Implementation**: `storefront/src/providers/StoreConfigProvider.tsx` (1,975 lines, 64 exports) manages loading and provides hooks:
- Generic: `useStoreConfig()`, `useConfigSection(key)`, `useHomepageSection(id)`, `useFeature(feature)`
- Branding: `useBranding()`, `useDesignTokens()`, `useButtonStyle()`, `useBadgeStyle()`
- Content: `useContentConfig()`, `useFiltersText()`, `useProductDetailText()`, `useOrdersText()`, + 10 more text hooks
- Navigation: `useHeaderConfig()`, `useFooterConfig()`, `useNavbarText()`
- Homepage: `useHeroConfig()`, `useTrustStripConfig()`, `useMarqueeConfig()`, `useBrandGridConfig()`, + 8 more section hooks

**Config sections**: store info, branding (10 color tokens, typography, logos), features (19+ toggles), ecommerce (currency, shipping, tax), header/footer, homepage (12+ configurable sections), filters, UI customization, all UI text/translations, localization (RTL/LTR), dark mode, SEO, promo popup.

Real-time updates via custom event `storefront-config-updated`. Preview mode via PostMessage iframe bridge.

### Adding New Configurable Features

When adding any new feature, follow this checklist:

1. Add schema in shared package: `apps/packages/storefront-config/src/schema/` (appropriate domain file)
2. Update shared types: `apps/packages/storefront-config/src/types.ts` (if new top-level section)
3. Add defaults in `apps/apps/storefront-control/src/modules/config/defaults.ts`
4. Add admin form validation in `apps/apps/storefront-control/src/modules/config/schema.ts`
5. Add/update types in `storefront/src/config/store.config.ts`
6. Create/update React hook in `storefront/src/providers/StoreConfigProvider.tsx`
7. **CRITICAL: Update BOTH sample config JSONs** — `sample-config-import.json` (Hebrew/ILS) AND `sample-config-import-en.json` (English/USD). These are the development fallback configs and must always have values for every field the storefront reads.
8. Add UI controls in Storefront Control admin page (if user-facing)
9. **Update settings search index** — `apps/apps/storefront-control/src/lib/settings-index.ts`. Add entries for new fields so they appear in Cmd+K command palette search. Each entry needs: `page`, `sectionId`, `title`, `description`, `keywords[]`, `category`, and `tab`.
10. **Update Storefront Control admin page** — If adding a new section or tab, ensure navigation in the appropriate page component (`apps/apps/storefront-control/src/pages/[channelSlug]/`) reflects it.
11. Update PRD.md, CLAUDE.md, and AGENTS.md if the change is significant.
12. Restart affected containers (storefront + storefront-control-app at minimum).

**Sample Config Rules:**
- Every content field read by the storefront MUST exist in both sample configs with proper translations
- Hebrew config: all user-facing text must be in Hebrew, not empty strings
- English config: all user-facing text must be in English
- When adding content to `content.productDetail`, `content.homepage`, etc., add to BOTH files
- Periodically audit for empty strings (`": ""`) in the Hebrew config — these indicate missing translations

### Keeping Everything in Sync (Critical)

**All config-related files MUST stay in sync.** A mismatch between any of these causes runtime errors, missing fields, or broken admin UI. When modifying any one file in this list, check whether the others also need updates:

| # | File / Location | What It Contains | When to Update |
|---|-----------------|------------------|----------------|
| 1 | `apps/packages/storefront-config/src/schema/` | Zod schema (source of truth for shape) | Any new field, renamed field, or type change |
| 2 | `apps/packages/storefront-config/src/types.ts` | Exported TypeScript types (Zod-inferred) | New top-level section or re-export change |
| 3 | `apps/apps/storefront-control/src/modules/config/defaults.ts` | Default values for every field | Any new field (must have a default) |
| 4 | `apps/apps/storefront-control/src/modules/config/schema.ts` | Admin form validation schema | Any new field the admin form needs to validate |
| 5 | `storefront/src/config/store.config.ts` | Storefront-side type definitions and defaults | Any new field the storefront reads |
| 6 | `storefront/src/providers/StoreConfigProvider.tsx` | React hooks that expose config to components | Any new field or section that needs a hook |
| 7 | `apps/apps/storefront-control/sample-config-import.json` | Hebrew/ILS development fallback | **Every** new content/config field |
| 8 | `apps/apps/storefront-control/sample-config-import-en.json` | English/USD development fallback | **Every** new content/config field |
| 9 | `apps/apps/storefront-control/src/lib/settings-index.ts` | Cmd+K search index for admin settings | Any new admin-visible field or section |
| 10 | `apps/apps/storefront-control/src/pages/[channelSlug]/` | Admin UI pages (forms, tabs, sections) | Any new user-facing config field |
| 11 | `PRD.md` / `CLAUDE.md` / `AGENTS.md` | Project documentation | Significant feature or architecture changes |

**Sync Enforcement Rules:**
- Never add a schema field without also adding its default, sample config values, and search index entry.
- Never add a storefront hook without the corresponding schema field in the shared package.
- Never add an admin form field without updating the settings search index (so Cmd+K finds it).
- When renaming a field, update ALL 11 locations — partial renames cause silent breakage.
- When removing a field, remove from ALL locations and check for dangling references in storefront components.

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

12+ configurable sections, each with its own hook and config in Storefront Control:

| Section | Component | Hook |
|---------|-----------|------|
| Hero | `Hero.tsx` | `useHeroConfig()` |
| Trust Strip | `TrustStrip.tsx` | `useTrustStripConfig()` |
| Marquee | `Marquee.tsx` | `useMarqueeConfig()` |
| Brand Grid | `BrandGrid.tsx` | `useBrandGridConfig()` |
| Categories | `Categories.tsx` | `useCategoriesConfig()` |
| Trending Products | `TrendingProducts.tsx` | `useTrendingConfig()` |
| Promotion Banner | `PromotionBanner.tsx` | `usePromotionBannerConfig()` |
| Flash Deals | `FlashDeals.tsx` | `useFlashDealsConfig()` |
| Collection Mosaic | `CollectionMosaic.tsx` | `useCollectionMosaicConfig()` |
| Best Sellers | `BestSellersSection.tsx` | `useBestSellersConfig()` |
| Customer Feedback | `CustomerFeedback.tsx` | `useCustomerFeedbackConfig()` |
| Newsletter | `NewsletterSignup.tsx` | `useNewsletterSectionConfig()` |

All in `storefront/src/components/home/`. Section order is drag-and-drop configurable via Design page.

### Component Designer (Per-Component Style Overrides)

Visual playground in Storefront Control for overriding any storefront component's styling beyond global branding. Admins select a component from a tree, edit visual properties (colors, typography, spacing, hover states, custom Tailwind classes), and see live preview.

**Architecture**: CSS Custom Properties (`--cd-{key}-{prop}`) on `<html>`. Storefront components reference with fallbacks: `var(--cd-homepage-hero-bg, var(--store-primary))`. No React re-renders needed for live preview.

**Cascade**: Component override > Page config > Global branding.

**Key Files**:
| File | Purpose |
|------|---------|
| `apps/packages/storefront-config/src/schema/component-overrides.ts` | Zod schema (19 properties: visual, typography, layout, hover, customClasses) |
| `apps/apps/storefront-control/src/lib/component-registry.ts` | Runtime registry of 24 customizable components across 7 pages |
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

**Wired Components** (47): All registered components are fully wired via `buildComponentStyle()` helper. Homepage (13): Hero, TrustStrip, Marquee, Categories, TrendingProducts, PromotionBanner, FlashDeals, CollectionMosaic, BestSellers, CustomerFeedback, Newsletter, BrandGrid, HomepageProductCard. Layout (5): Header, Footer, HeaderBanner, MobileBottomNav, SearchDialog. PLP (5): ActiveFiltersTags, StickyQuickFilters, ProductCard, ProductGrid, SortBy. PDP (7): ProductGallery, AddToCart, StickyMobileAddToCart, VariantSelector, QuantitySelector, ProductTabs, RelatedProducts. Cart (2): CartPage, CartDrawer. Checkout (8): CheckoutPage, Summary, PlaceOrder, ContactStep, ShippingStep, DeliveryStep, PaymentStep, OrderConfirmation. Account (5): Dashboard, Orders, Addresses, Wishlist, Settings. Auth (2): Login, ForgotPassword.

### Apps Architecture Patterns

Apps in `apps/apps/` follow domain-driven design:

- **Result-Based Error Handling**: `neverthrow` — functions return `Result<T, E>` instead of throwing
- **Branded Types**: Zod branded types for validated primitives (see `apps/adr/` ADR 0002)
- **Repository Pattern**: Data access via repository interfaces (DynamoDB-backed)
- **Modular Structure**: `src/modules/` by domain, thin webhook handlers, rich use cases
- **Error Classes**: `BaseError.subclass()` from `@saleor/apps-errors`

### GraphQL Integration

**Storefront (urql)** — configured in `storefront/src/lib/graphql.ts`:
- Server-side rendering with Docker service names (`http://saleor-api:8000/graphql/`)
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

**Analytics & Consent Architecture:**
- **Cookie Consent** (`storefront/src/lib/consent.ts`): localStorage-based, per-channel (`aura_cookie_consent_{channel}`), 3 categories (essential always on, analytics + marketing opt-in), configurable expiry. Dispatches `consent-updated` custom event on save.
- **GA4 Analytics** (`storefront/src/lib/analytics.ts`): All events push to `window.dataLayer`. If no analytics consent, events queue in memory. After consent granted, `flushEventQueue()` sends queued events. Deduplication via `_sentEvents` Set prevents double-firing of `view_item` and `purchase`.
- **GTM Loader** (`storefront/src/ui/components/GoogleTagManager.tsx`): Loads GTM script (`<Script strategy="afterInteractive">`) only after analytics consent. Listens for `consent-updated` event.
- **Cookie Banner** (`storefront/src/ui/components/CookieConsent/CookieConsent.tsx`): Accept All / Essential Only / Manage Preferences. All text from `useCookieConsentText()`. Position + expiry from `useCookieConsentConfig()`.
- **GA4 Events wired at**: `ProductDetailClient.tsx` (view_item + add_to_cart), `CartClient.tsx` (begin_checkout), `OrderConfirmation.tsx` (purchase), `TrackSearch.tsx` (search). Quick view modal fires view_item + add_to_cart via shared ProductDetailClient.
- **GTM Container:** `GTM-PWN35T2R` | **GA4 Property:** `G-1X96SJX4SP`

### Dashboard Architecture (D6 Modernization)

The dashboard was modernized from MUI v5 to Tailwind CSS v4 + macaw-ui-next. Key architecture:

**Styling Stack:**
- Tailwind CSS v4 with `@theme` overrides in `dashboard/src/index.css` — `--spacing: 4px` and `--text-*` variables in px (not rem) because macaw-ui sets `html { font-size: 50.782% }` making 1rem = 8px
- macaw-ui-next components (Input, Text, Divider, RadioGroup, etc.)
- Lucide React icons (replaced @mui/icons-material)
- `cn()` utility in `dashboard/src/utils/cn.ts` for class merging

**Custom Table Components** (`dashboard/src/components/Table/`):
- `Table`, `TableHead`, `TableBody`, `TableFooter`, `TableRow`, `TableCell` — native HTML `<table>` wrappers with Tailwind styling
- `TableSectionContext` for automatic `<th>` vs `<td>` rendering
- `TableCellHeader` — sortable column header with `ArrowSort` icon (24x24px, `w-6 h-6`)
- `TableRowLink` — wraps data rows in `<Link style={{ all: "inherit", display: "contents" }}>` for clickable rows

**URL Pattern** (`dashboard/src/utils/urls.ts`):
- `withQs(path, params)` utility — all 26 URL files use this to prevent trailing `?` (React Router v7 rejects `?` in pathname objects)
- `stringifyQs()` still used for iframe URLs in extensions

**Routing:** React Router v7 with relative paths (all nested routes converted from absolute to relative).

**Key Files:**
- `dashboard/src/index.css` — Tailwind `@theme` with px overrides, color tokens, root font-size
- `dashboard/src/components/Table/` — Custom table primitives (6 components + context)
- `dashboard/src/components/TableCellHeader/` — Sortable header with ArrowSort icon
- `dashboard/src/components/TableRowLink/` — Clickable table row with Link wrapper
- `dashboard/src/utils/urls.ts` — `withQs` utility + `stringifyQs` re-export
- `dashboard/src/utils/cn.ts` — `clsx` + `twMerge` utility

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

## Mandatory Skill Invocations

These skills MUST be invoked (via the Skill tool) at the start of the corresponding workflow. Do not skip them.

| Workflow | Skill to Invoke | When |
|----------|----------------|------|
| Planning | `superpowers:writing-plans` | Before writing any implementation plan |
| Executing Plans | `superpowers:executing-plans` | Before executing an approved plan |
| Frontend Development | `senior-frontend` | Before any storefront/dashboard UI work |
| Frontend Design | `frontend-design` | Before creating or redesigning UI components |
| UI/UX Decisions | `ui-ux-pro-max` | Before making UI/UX design decisions, layout changes, or interaction patterns |

## Saleor Apps Reference

| App | Container | Port | Purpose |
|-----|-----------|------|---------|
| storefront-control | `saleor-storefront-control-app-dev` | 3004 | Page-based CMS admin (11 pages: Homepage, Product Listing, Product Detail, Cart, Checkout, Account, Auth, Layout, Static Pages, Global Design, Component Designer), ComponentBlock UI, shadcn/ui, Cmd+K, live preview |
| sales-analytics | `saleor-sales-analytics-app-dev` | 3006 | KPIs, charts, Excel export |
| newsletter | `saleor-newsletter-app-dev` | 3005 | Subscribers, MJML templates, campaigns |
| stripe | `saleor-stripe-app-dev` | 3002 | Payment processing |
| smtp | `saleor-smtp-app-dev` | 3001 | Email delivery (fulfillment, invoices, welcome) |
| invoices | `saleor-invoice-app-dev` | 3003 | PDF invoice generation |
| bulk-manager | `saleor-bulk-manager-app-dev` | 3007 | CSV/Excel bulk import/export/delete for products, categories, collections, customers, orders, vouchers, gift cards |
| image-studio | `saleor-image-studio-app-dev` | 3008 | AI-powered image editor with canvas, templates, bg removal, generation, upscaling |
| dropship-orchestrator | `saleor-dropship-app-dev` | 3009 | Multi-supplier dropshipping middleware (AliExpress + CJ), order forwarding, tracking sync, fraud detection, exception queue |
| tax-manager | `saleor-tax-manager-app-dev` | 3010 | Self-hosted tax calculation with configurable country/state rates, export zero-rating, preset libraries (IL/EU/US) |

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

| File | Purpose |
|------|---------|
| `infra/.env` | Environment variables for all Docker services |
| `infra/docker-compose.dev.yml` | Docker services orchestration |
| `storefront/src/config/store.config.ts` | Build-time storefront defaults and types |
| `storefront/storefront-cms-config.json` | Runtime CMS configuration |
| `storefront/src/providers/StoreConfigProvider.tsx` | Config context + all config hooks |
| `storefront/src/lib/graphql.ts` | GraphQL client setup (urql, retries, auth) |
| `storefront/src/lib/cms.ts` | CMS content structure and metadata schema |
| `apps/packages/storefront-config/src/schema/component-overrides.ts` | Component Designer Zod schema (ComponentStyleOverride, ComponentOverrides) |
| `apps/apps/storefront-control/src/lib/component-registry.ts` | Component Designer runtime registry (24 components, 7 pages) |
| `apps/packages/storefront-config/src/schema/` | Shared Zod config schema (21 files) |
| `apps/packages/storefront-config/src/types.ts` | Shared TypeScript types (Zod-inferred) |
| `apps/packages/storefront-config/src/migrations.ts` | Config version migrations |
| `apps/apps/storefront-control/src/modules/config/schema.ts` | Admin form validation schema (227 lines) |
| `apps/apps/storefront-control/src/modules/config/defaults.ts` | Default config values (1,665 lines) |
| `apps/apps/storefront-control/sample-config-import.json` | Hebrew/ILS sample config |
| `apps/apps/storefront-control/sample-config-import-en.json` | English/USD sample config |
| `storefront/src/lib/consent.ts` | Cookie consent manager (localStorage, 3 categories, custom events) |
| `storefront/src/lib/analytics.ts` | GA4 dataLayer events with consent queue + deduplication |
| `storefront/src/ui/components/CookieConsent/CookieConsent.tsx` | GDPR cookie consent banner (configurable via Storefront Control) |
| `storefront/src/ui/components/GoogleTagManager.tsx` | Consent-gated GTM script loader |
| `apps/turbo.json` | Turborepo task pipeline |
| `saleor/saleor/settings.py` | Django settings and installed apps |
| `storefront/playwright.config.ts` | Playwright E2E config (Chrome, 60s timeout, traces on failure) |
| `storefront/e2e/global-setup.ts` | E2E pre-flight checks (storefront + API + test user) |
| `storefront/e2e/fixtures/graphql-client.ts` | Direct Saleor API client for E2E setup |
| `storefront/e2e/fixtures/test-data.ts` | Test constants (channel, credentials, Stripe test card) |

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
