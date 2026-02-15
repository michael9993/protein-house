# Architecture

**Analysis Date:** 2026-02-15

## Pattern Overview

**Overall:** Multi-layer, configuration-driven e-commerce platform built on Saleor (Django/GraphQL backend) with decoupled frontends and modular Saleor Apps ecosystem. Three-tier configuration system enables CMS-driven customization without code changes.

**Key Characteristics:**
- **Configuration-first**: All storefront behavior driven by Storefront Control app (admin CMS) → Saleor metadata → runtime hooks
- **Multi-channel architecture**: Single codebase serves multiple storefronts/brands via `[channel]` route parameter (ILS/Hebrew/RTL vs USD/English/LTR)
- **Modular apps ecosystem**: 15 Saleor Apps using domain-driven design, neverthrow Result pattern, branded Zod types
- **Server-first Next.js**: Next.js 15 App Router with server components as default, minimal client state via Zustand
- **Docker-first development**: All services containerized; development via `docker exec` (never direct pnpm/python)

## Layers

**Presentation (Frontend):**
- Location: `storefront/src/`, `dashboard/`, `apps/apps/*/src/`
- Contains: Next.js pages, React components, UI hooks, server actions
- Depends on: GraphQL API, Saleor Apps metadata, configuration provider
- Used by: End users (storefront), admins (dashboard), system operators (apps)

**Data Access (GraphQL):**
- Location: `storefront/src/lib/graphql.ts`, `saleor/saleor/graphql/`, dashboard `codegen.ts`, apps `graphql.config.ts`
- Contains: Typed GraphQL clients (urql for storefront, Apollo for dashboard), type generation from schema
- Depends on: Saleor API, authentication (cookies + app tokens)
- Used by: All frontends for querying Saleor

**Business Logic (Apps Layer):**
- Location: `apps/apps/*/src/modules/`, `saleor/saleor/plugins/custom/`
- Contains: Domain-driven use cases, repositories, webhook handlers, tRPC routers
- Depends on: GraphQL client, external APIs (Stripe, AI services, DynamoDB)
- Used by: Webhook handlers, tRPC routes, checkout flows

**Backend (Saleor):**
- Location: `saleor/saleor/`
- Contains: Django models, GraphQL resolvers, business logic (orders, products, payments, channels)
- Depends on: PostgreSQL, Redis, plugin ecosystem, external integrations
- Used by: All frontends via GraphQL, background jobs via Celery

**Configuration (Shared Schema):**
- Location: `apps/packages/storefront-config/src/schema/` (17 files)
- Contains: Zod schemas for store config (branding, features, content, UI text, homepage sections)
- Depends on: Nothing (pure schema layer)
- Used by: Storefront Control app (admin forms), storefront (hooks), shared types

## Data Flow

**Storefront Page Rendering:**

1. Request to `/[channel]/products/[slug]` route in `storefront/src/app/[channel]/(main)/products/`
2. Server component validates channel, fetches config from Storefront Control app or sample JSON fallback
3. `executeGraphQL()` (in `storefront/src/lib/graphql.ts`) calls Saleor API with server-side Docker URL
4. GraphQL response cached per-operation via Next.js `revalidate` config
5. Server component composes page with data, passes to client components
6. Client hydrates with minimal Zustand state (cart, filters), attaches event listeners
7. RTL/LTR detected from config, applied via `StoreConfigProvider` using logical CSS properties

**Configuration Update Flow:**

1. Admin edits config in Storefront Control app (`apps/apps/storefront-control/src/pages/[channelSlug]/`)
2. Form validation against schema in `apps/apps/storefront-control/src/modules/config/schema.ts`
3. Data saved to Saleor metadata via tRPC mutation in `apps/apps/storefront-control/src/modules/trpc/routers/config-router.ts`
4. Storefront fetches fresh config (or uses sample JSON in dev) via `useStoreConfig()` hook
5. Custom event `storefront-config-updated` dispatched, listened by `StoreConfigProvider`
6. Config state updated, CSS variables regenerated, components re-render

**Checkout Flow:**

1. Client adds to cart via server action `addToCart()` in `storefront/src/app/cart-actions.ts`
2. Navigates to `/checkout` (separate Pages Router app in `storefront/src/checkout/`)
3. Zustand stores in `storefront/src/checkout/state/` manage form validation, email/address collection
4. Payment integration (Stripe or Adyen) via `storefront/src/checkout/components/PaymentSection.tsx`
5. On success, server action `completeCheckout()` finalizes order via Saleor GraphQL
6. Redirect to order confirmation

**Catalog Generation (Infra-as-Code):**

1. Developer defines infrastructure in `scripts/catalog-generator/config.yml` (product types, attributes, warehouses)
2. `npm run deploy` applies config via `@saleor/configurator` (patched for SINGLE_REFERENCE)
3. `npm run translate` adds Hebrew translations to categories/collections
4. `npm run generate` creates Excel + CSV files from `scripts/catalog-generator/src/config/products.ts`
5. Admin imports via Bulk Manager app (`apps/apps/bulk-manager/`) which calls Saleor batch mutations

**State Management:**

- **Persistent (database)**: Orders, products, customers in Saleor PostgreSQL
- **Runtime config**: Store settings in Saleor metadata (Storefront Control source of truth)
- **Local state**: Checkout form validation, filters, cart drawer visibility via Zustand (`storefront/src/checkout/state/`)
- **Global context**: Store config, auth, wishlist via React Context + hooks
- **Client session**: Auth cookies via `@saleor/auth-sdk` (httpOnly, refreshed silently)

## Key Abstractions

**StoreConfigProvider Hook System:**

- Purpose: Central access to all runtime configuration without props drilling
- Examples: `storefront/src/providers/StoreConfigProvider.tsx`, `storefront/src/config/store.config.ts`
- Pattern: Context + custom hooks (64 hooks total)
  - Generic: `useStoreConfig()`, `useConfigSection(key)`, `useHomepageSection(id)`, `useFeature()`
  - Domain-specific: `useBranding()`, `useDesignTokens()`, `useButtonStyle()`, `useRelatedProductsConfig()`, `useProductDetailText()`
- All hooks read from Context, trigger re-renders on config update

**GraphQL Execution (Server + Client):**

- Purpose: Type-safe, retry-enabled GraphQL queries with server/client awareness
- Location: `storefront/src/lib/graphql.ts`
- Pattern: `executeGraphQL<Result, Variables>(operation, { variables, revalidate, withAuth })`
  - Server-side: Uses `SALEOR_API_URL` (Docker service name `http://saleor-api:8000/graphql/`)
  - Client-side: Uses `NEXT_PUBLIC_SALEOR_API_URL` (localhost or tunnel URL)
  - Automatic retry with exponential backoff (4 max retries, 1s * 2^attempt)
  - Auth via `getServerAuthClient()` cookies + optional app tokens
  - Per-operation caching with `revalidate` parameter (e.g., 300 for 5-min cache)

**Server Actions for Mutations:**

- Purpose: Type-safe server-side mutations without API layer
- Location: `storefront/src/app/actions.ts`, `storefront/src/app/cart-actions.ts`
- Pattern: `'use server'` directive, direct GraphQL calls, return serializable data
- Used for: addToCart, updateCart, createOrder, manageWishlist, updateAccount

**Apps Module Pattern (Neverthrow + Branded Types):**

- Purpose: Composable, testable business logic with explicit error handling
- Location: `apps/apps/*/src/modules/`
- Pattern:
  ```typescript
  // Branded types for compile-time safety
  type SaleorApiUrl = z.infer<typeof saleorApiUrlSchema> & { readonly __brand: "SaleorApiUrl" };

  // Use cases return Result<Success, Error>
  export class CreateOrderUseCase extends BaseUseCase {
    async execute(input: CreateOrderInput): Promise<Result<Order, CreateOrderError>> {
      // Try to do work, return Ok(data) or Err(error)
    }
  }

  // Repositories handle data access
  export class ConfigRepository {
    async getConfig(id: string): Promise<AppConfig | null> { ... }
  }
  ```

**Configuration Schema (Zod):**

- Purpose: Single source of truth for config shape across all consumers
- Location: `apps/packages/storefront-config/src/schema/` (17 domain files)
- Files: `branding.ts`, `content.ts`, `design.ts`, `ecommerce.ts`, `features.ts`, `filters.ts`, `footer.ts`, `header.ts`, `homepage.ts`, `integrations.ts`, `localization.ts`, `pages.ts`, `primitives.ts`, `promo-popup.ts`, `seo.ts`, `dark-mode.ts`, `index.ts`
- Pattern: Each file exports `XyzSchema = z.object({ ... })`, rolled up in `index.ts` into `StorefrontConfigSchema`
- Used by: Admin form validation (`storefront-control` app), shared types, storefront defaults

**Turborepo Monorepo Orchestration:**

- Purpose: Coordinate builds, tests, linting across 15+ apps and 12+ packages
- Location: `apps/turbo.json`
- Pattern:
  - Task graph with dependency `dependsOn: ["^build"]` (build dependencies first)
  - Caching for deterministic builds (`outputs: [".next/**"]`)
  - Workspace routing: `pnpm --filter @saleor/bulk-manager dev` targets app
  - Global env for all tasks (CI, NODE_ENV, OTEL, PORT, etc.)

## Entry Points

**Storefront (Next.js):**
- Location: `storefront/src/app/layout.tsx`, `storefront/src/app/[channel]/layout.tsx`
- Triggers: HTTP request to `localhost:3000` or deployment URL
- Responsibilities:
  - Root layout in `layout.tsx` sets up fonts, ToastProvider
  - Channel layout in `[channel]/layout.tsx` validates channel slug, fetches config, wraps in StoreConfigProvider
  - Dynamic route handler for multi-channel via `generateStaticParams()` (fetches from API or env fallback)

**Dashboard (React/Vite):**
- Location: `dashboard/src/index.tsx`, `dashboard/src/app.tsx`
- Triggers: Admin login to `localhost:9000`
- Responsibilities: Apollo client setup, auth redirect, page routing to admin panels

**Storefront Control App (Next.js):**
- Location: `apps/apps/storefront-control/src/pages/index.tsx`
- Triggers: Dashboard iframe navigation to `/app/storefront-control`
- Responsibilities:
  - 6-section navigation: Store, Design, Pages, Commerce, Content, Integrations
  - Fetches/saves config via tRPC to Saleor metadata
  - Live preview bridge via PostMessage iframe
  - Cmd+K settings search via `settings-index.ts`

**Bulk Manager App (Next.js):**
- Location: `apps/apps/bulk-manager/src/pages/index.tsx`
- Triggers: Dashboard iframe navigation to `/app/bulk-manager`
- Responsibilities:
  - Import/export/delete for 7 entity types (Products, Categories, Collections, Customers, Orders, Vouchers, Gift Cards)
  - CSV/Excel generation with dynamic templates
  - Bulk delete UI with confirmation

**Image Studio App (Next.js):**
- Location: `apps/apps/image-studio/src/pages/index.tsx`
- Triggers: Dashboard iframe or direct navigation to `localhost:3008`
- Responsibilities:
  - Fabric.js canvas for image editing
  - AI services: rembg (bg removal), Real-ESRGAN (upscaling), Nano Banana (generation)
  - Product integration: browse Saleor products, upload edits
  - tRPC routers: `ai`, `products`, `media`, `enhance`

**Catalog Generator (CLI):**
- Location: `scripts/catalog-generator/package.json` scripts
- Triggers: `npm run setup`, `npm run deploy`, `npm run translate`, `npm run generate`
- Responsibilities:
  - Deploy infrastructure-as-code from `config.yml` to Saleor
  - Generate product definitions, categories, collections
  - Add Hebrew translations
  - Export Excel/CSV for bulk import

## Error Handling

**Strategy:** Layered approach with context-aware recovery.

**Patterns:**

**GraphQL Errors:**
- `executeGraphQL()` throws on network timeout (after retries), catches GraphQL errors in response
- Server components catch and render error boundary
- Client components use error boundary or toast notifications
- Example: `storefront/src/app/error.tsx` catches all server component errors

**Apps (neverthrow Result):**
- Use cases return `Result<T, E>` instead of throwing
- Pattern: `const result = await useCase.execute(input); return result.mapErr(handler)`
- Webhook handlers catch and log errors, return 200 OK always (prevent Saleor retries)
- Tests: `result._unsafeUnwrap()` for success, `result._unsafeUnwrapErr()` for errors

**Validation Errors:**
- Zod schemas throw on invalid input
- Apps use `BaseError.subclass()` from `@saleor/apps-errors` for domain errors
- Forms use `react-hook-form` with Zod resolver for client-side validation

**Auth Errors:**
- Missing auth cookies → redirect to login via `@saleor/auth-sdk`
- Invalid tokens → refresh silently, retry request
- Permission errors (AUTHENTICATED_APP not granted) → log helpful message, fallback to env config

## Cross-Cutting Concerns

**Logging:**
- Backend: Python logging with `django.conf.settings.LOGGING`
- Frontend: Console + structured logging via `@saleor/apps-logger` (apps only)
- Apps: `console.log` with contextual prefixes like `[GraphQL]`, `[Checkout]`
- Observability: OpenTelemetry optional (via OTEL_* env vars)

**Validation:**
- Storefront: TypeScript strict mode, ESLint
- Apps: Zod schemas for all user input, neverthrow for error handling
- Backend: Django model validation, GraphQL schema enforcement
- Forms: react-hook-form with Zod resolvers (client + server side)

**Authentication:**
- Storefront: `@saleor/auth-sdk` with httpOnly cookies (CSRF-safe), auto-refresh
- Apps: Saleor app manifest (private key + webhook signing), session storage for admin
- Backend: Django user model + permission system
- Channel validation: Server-side validation against Saleor channels list

**Localization (i18n):**
- No i18n library (custom pattern)
- Config-driven: All UI text in `content.*` sections of config
- RTL detection: From locale code (he, ar, fa, ur → RTL)
- CSS: Logical properties (`ms-4` not `ml-4`, `start-0` not `left-0`, `rtl:rotate-180`)

**Performance:**
- Pagination: All list queries use first/after (edges/nodes pattern)
- Caching: per-operation caching in urql + Next.js revalidate
- Images: Next.js Image with dynamic srcset, lazy loading
- Code splitting: Dynamic imports for heavy features (payment providers)

**SEO:**
- Dynamic metadata in layout components (`metadata` export)
- Sitemap: `storefront/src/app/sitemap.ts` (products, categories, collections)
- Open Graph: From config + product/category metadata
- robots.txt: Configured in `infra/nginx.conf`

---

*Architecture analysis: 2026-02-15*
