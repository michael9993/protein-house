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

## Workspace Structure

```
saleor-platform/
├── saleor/              # Django/GraphQL backend (Python 3.12)
├── dashboard/           # Admin dashboard (React 18 + Vite, TypeScript)
├── storefront/          # Customer storefront (Next.js 15, React 19, TypeScript)
├── apps/                # Saleor Apps monorepo (Turborepo, TypeScript)
│   ├── apps/            # Individual apps (storefront-control, bulk-manager, stripe, newsletter, etc.)
│   └── packages/        # Shared packages (@saleor/apps-storefront-config, apps-logger, apps-ui, etc.)
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
| `saleor-postgres-dev` | 5432 | PostgreSQL database |
| `saleor-redis-dev` | 6379 | Redis cache/broker |

### Access Points

- **Saleor API**: http://localhost:8000/graphql/
- **Dashboard**: http://localhost:9000
- **Storefront**: http://localhost:3000

## Common Development Commands

All commands use `docker exec`. For an interactive shell, use `docker exec -it <container> sh`.

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
- Zustand for local state (checkout validation, loading states) — `storefront/src/checkout/state/`
- Context API for global state (store config, wishlist, cart drawer, quick view)
- Auth via `@saleor/auth-sdk` cookies with server-side session

**Checkout Architecture:**
- Separate app within storefront using Pages Router (`storefront/src/checkout/`)
- Multiple Zustand stores for form validation and update state
- Payment integrations: Stripe (`@stripe/react-stripe-js`) and Adyen (`@adyen/adyen-web`)

## Testing Conventions

**Python (saleor/):** Pytest with fixtures from `tests/fixtures/`. Use `--reuse-db` for speed. Prefer fixtures over mocking. Flat test functions (no classes).

**Dashboard:** Jest for unit tests (colocated with source), Playwright for E2E. Import sorting enforced by simple-import-sort ESLint rule.

**Apps:** Vitest with workspace config. Unit tests in `src/**/*.test.ts`, E2E via `vitest --project e2e`. Mocks in `src/__tests__/mocks/`. For neverthrow: `._unsafeUnwrap()` for success, `._unsafeUnwrapErr()` for errors.

**Storefront:** No test runner. Relies on TypeScript strict mode and ESLint.

## Code Style

**TypeScript (all frontend):** Strict mode, avoid `any`. Functional components + hooks. Named exports preferred. Prettier formatting. ESLint as source of truth.

**Python (saleor/):** Black-style (4 spaces, 88 columns). Ruff linting. Type hints required for public functions.

**Apps-specific:** Result-based error handling with neverthrow. Branded types with Zod. BaseError subclasses. Repository pattern. Keep webhook handlers thin.

## Saleor Apps Reference

| App | Container | Port | Purpose |
|-----|-----------|------|---------|
| storefront-control | `saleor-storefront-control-app-dev` | 3004 | 6-section admin (Store/Design/Pages/Commerce/Content/Integrations), shadcn/ui, Cmd+K, live preview |
| sales-analytics | `saleor-sales-analytics-app-dev` | 3006 | KPIs, charts, Excel export |
| newsletter | `saleor-newsletter-app-dev` | 3005 | Subscribers, MJML templates, campaigns |
| stripe | `saleor-stripe-app-dev` | 3002 | Payment processing |
| smtp | `saleor-smtp-app-dev` | 3001 | Email delivery (fulfillment, invoices, welcome) |
| invoices | `saleor-invoice-app-dev` | 3003 | PDF invoice generation |
| bulk-manager | `saleor-bulk-manager-app-dev` | 3007 | CSV/Excel bulk import/export/delete for products, categories, collections, customers, orders, vouchers, gift cards |

Also in apps monorepo but not Dockerized locally: avatax, search (Algolia), klaviyo, cms, segment.

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
| `apps/packages/storefront-config/src/schema/` | Shared Zod config schema (20 files, 2,332 lines) |
| `apps/packages/storefront-config/src/types.ts` | Shared TypeScript types (Zod-inferred) |
| `apps/packages/storefront-config/src/migrations.ts` | Config version migrations |
| `apps/apps/storefront-control/src/modules/config/schema.ts` | Admin form validation schema (227 lines) |
| `apps/apps/storefront-control/src/modules/config/defaults.ts` | Default config values (1,665 lines) |
| `apps/apps/storefront-control/sample-config-import.json` | Hebrew/ILS sample config |
| `apps/apps/storefront-control/sample-config-import-en.json` | English/USD sample config |
| `apps/turbo.json` | Turborepo task pipeline |
| `saleor/saleor/settings.py` | Django settings and installed apps |

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
