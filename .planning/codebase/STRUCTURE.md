# Codebase Structure

**Analysis Date:** 2026-02-15

## Directory Layout

```
saleor-platform/
├── saleor/                      # Django/GraphQL backend (Python 3.12)
│   ├── saleor/                  # Main app package
│   │   ├── graphql/             # GraphQL API (schema, resolvers)
│   │   ├── product/             # Product models, mutations
│   │   ├── order/               # Order management
│   │   ├── checkout/            # Checkout logic
│   │   ├── account/             # User accounts
│   │   ├── payment/             # Payment webhooks
│   │   ├── plugins/             # Extension system
│   │   │   └── custom/          # Custom plugins
│   │   ├── channel/             # Multi-channel support
│   │   ├── core/                # Core models, utilities
│   │   ├── settings.py          # Django configuration
│   │   └── asgi.py              # ASGI entrypoint
│   ├── tests/                   # Pytest fixtures, test data
│   ├── manage.py                # Django management script
│   └── setup.cfg                # Pytest + ruff configuration
│
├── storefront/                  # Next.js 15 customer storefront (React 19)
│   ├── src/
│   │   ├── app/                 # Next.js App Router (RSC-first)
│   │   │   ├── layout.tsx       # Root layout (fonts, providers)
│   │   │   ├── [channel]/       # Multi-channel dynamic routes
│   │   │   │   ├── layout.tsx   # Channel layout (config provider, auth)
│   │   │   │   ├── (main)/      # Main storefront routes
│   │   │   │   │   ├── page.tsx # Homepage
│   │   │   │   │   ├── products/
│   │   │   │   │   ├── categories/
│   │   │   │   │   ├── account/ # User account pages
│   │   │   │   │   └── about/
│   │   │   │   └── checkout/    # Checkout route
│   │   │   ├── checkout/        # Checkout Pages Router (legacy, separate app)
│   │   │   │   ├── Root.tsx     # Urql provider, checkout UI
│   │   │   │   ├── components/  # Checkout form sections
│   │   │   │   ├── state/       # Zustand stores (cart, form validation)
│   │   │   │   ├── providers/   # Checkout context providers
│   │   │   │   └── views/       # Page views
│   │   │   ├── actions.ts       # Server actions (getCurrentUser, etc.)
│   │   │   ├── cart-actions.ts  # Cart mutations (addToCart, updateCart)
│   │   │   ├── api/             # API routes (webhooks, auth)
│   │   │   ├── error.tsx        # Error boundary
│   │   │   └── globals.css      # Base styles
│   │   │
│   │   ├── components/          # Shared React components
│   │   │   ├── home/            # Homepage sections (Hero, Categories, etc.)
│   │   │   ├── ui/              # Generic UI (Header, Footer, ProductCard)
│   │   │   └── ...              # Other feature components
│   │   │
│   │   ├── providers/           # React context providers
│   │   │   ├── StoreConfigProvider.tsx # Config state + 64 hooks
│   │   │   ├── AuthProvider.tsx
│   │   │   └── WishlistProvider.tsx
│   │   │
│   │   ├── lib/                 # Utilities
│   │   │   ├── graphql.ts       # GraphQL client execution
│   │   │   ├── cms.ts           # CMS configuration helpers
│   │   │   ├── preview-mode.ts  # Preview iframe bridge
│   │   │   └── storefront-control/ # Config sync from admin
│   │   │
│   │   ├── config/              # Configuration
│   │   │   ├── store.config.ts  # Types + defaults (types from shared package)
│   │   │   └── examples/        # Example configs
│   │   │
│   │   ├── hooks/               # Custom hooks (useProduct, useFilter, etc.)
│   │   │
│   │   ├── graphql/             # GraphQL operation definitions
│   │   │   ├── HomepageProducts.graphql
│   │   │   ├── ProductDetail.graphql
│   │   │   └── ...
│   │   │
│   │   └── gql/                 # Generated GraphQL types (graphql-codegen)
│   │       └── graphql.ts       # Generated types + TypedDocumentString
│   │
│   ├── public/                  # Static assets
│   ├── next.config.js           # Next.js configuration
│   ├── tsconfig.json            # TypeScript strict mode
│   └── package.json             # Dependencies (urql, @saleor/auth-sdk, etc.)
│
├── dashboard/                   # React 18 admin dashboard (Vite)
│   ├── src/
│   │   ├── components/          # Admin UI components
│   │   ├── pages/               # Admin pages (Products, Orders, etc.)
│   │   ├── graphql/             # GraphQL operations
│   │   ├── hooks/               # Custom hooks
│   │   └── index.tsx            # React root
│   │
│   ├── vite.config.ts
│   └── codegen.ts               # GraphQL codegen config (Apollo)
│
├── apps/                        # Turborepo monorepo: Saleor Apps + shared packages
│   ├── apps/                    # Individual Saleor Apps
│   │   ├── storefront-control/  # CMS configuration admin (Next.js)
│   │   │   ├── src/
│   │   │   │   ├── pages/[channelSlug]/ # Admin UI (6 sections)
│   │   │   │   │   ├── index.tsx        # Dashboard
│   │   │   │   │   ├── store/           # Store settings
│   │   │   │   │   ├── design/          # Branding + colors
│   │   │   │   │   ├── pages/           # Custom pages
│   │   │   │   │   ├── commerce/        # E-commerce settings
│   │   │   │   │   ├── content/         # Text + content (8 tabs)
│   │   │   │   │   └── integrations/    # External APIs
│   │   │   │   ├── modules/
│   │   │   │   │   ├── config/
│   │   │   │   │   │   ├── schema.ts    # Zod form validation schemas
│   │   │   │   │   │   ├── defaults.ts  # Default config values
│   │   │   │   │   │   └── helpers.ts   # Config utilities
│   │   │   │   │   ├── trpc/            # tRPC routers (config, settings)
│   │   │   │   │   ├── graphql/         # GraphQL operations
│   │   │   │   │   └── ui/              # Shared form components
│   │   │   │   ├── components/
│   │   │   │   │   ├── ui/              # shadcn/ui components
│   │   │   │   │   ├── forms/           # Form field components
│   │   │   │   │   ├── layout/          # Layout wrappers
│   │   │   │   │   └── preview/         # Live preview
│   │   │   │   ├── lib/
│   │   │   │   │   ├── settings-index.ts # Cmd+K search index
│   │   │   │   │   └── hooks/           # useConfigPage, usePreview
│   │   │   │   ├── sample-config-import.json    # Hebrew/ILS fallback config
│   │   │   │   └── sample-config-import-en.json # English/USD fallback config
│   │   │   └── next.config.js
│   │   │
│   │   ├── bulk-manager/        # Bulk import/export (Next.js)
│   │   │   ├── src/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── index.tsx        # Entity selector
│   │   │   │   │   ├── products/
│   │   │   │   │   ├── categories/
│   │   │   │   │   └── ...              # 7 entity pages
│   │   │   │   ├── modules/
│   │   │   │   │   ├── import/          # Import handlers
│   │   │   │   │   │   ├── handlers/    # Field mapping, validation
│   │   │   │   │   │   ├── templates/   # CSV template generation
│   │   │   │   │   │   └── converters/  # Data format conversion
│   │   │   │   │   ├── export/          # Export handlers (Excel, CSV)
│   │   │   │   │   ├── trpc/            # tRPC routers (import, export, delete)
│   │   │   │   │   └── ui/              # Import/export UI components
│   │   │   │   └── graphql/
│   │   │   └── next.config.js
│   │   │
│   │   ├── image-studio/        # AI image editor (Next.js)
│   │   │   ├── src/
│   │   │   │   ├── pages/       # Pages Router
│   │   │   │   ├── components/
│   │   │   │   │   ├── editor/
│   │   │   │   │   │   ├── hooks/       # useCanvas, useHistory, useKeyboardShortcuts
│   │   │   │   │   │   ├── Canvas.tsx  # Fabric.js editor
│   │   │   │   │   │   └── LayersPanel.tsx
│   │   │   │   │   ├── ai/              # AI feature panels
│   │   │   │   │   │   ├── BackgroundRemoval.tsx
│   │   │   │   │   │   ├── Upscale.tsx
│   │   │   │   │   │   └── ...
│   │   │   │   │   └── product/         # Product browser
│   │   │   │   ├── modules/
│   │   │   │   │   ├── trpc/
│   │   │   │   │   │   ├── routers/
│   │   │   │   │   │   │   ├── ai.ts    # AI service integrations
│   │   │   │   │   │   │   ├── products.ts
│   │   │   │   │   │   │   ├── media.ts
│   │   │   │   │   │   │   └── enhance.ts
│   │   │   │   │   │   └── server.ts
│   │   │   │   │   ├── templates/
│   │   │   │   │   │   ├── types.ts
│   │   │   │   │   │   └── built-in.ts
│   │   │   │   │   └── services/ # AI service wrappers (rembg, ESRGAN, Gemini)
│   │   │   │   └── lib/
│   │   │   │       ├── idb.ts    # IndexedDB for auto-save
│   │   │   │       └── ...
│   │   │   └── next.config.js
│   │   │
│   │   ├── stripe/              # Stripe payments (Next.js)
│   │   ├── smtp/                # Email service (Next.js)
│   │   ├── invoices/            # PDF invoice generation (Next.js)
│   │   ├── newsletter/          # Newsletter management (Next.js)
│   │   ├── sales-analytics/     # Analytics & KPIs (Next.js)
│   │   ├── avatax/              # Tax calculation (Next.js)
│   │   ├── klaviyo/             # Email marketing (Next.js)
│   │   ├── cms/                 # Headless CMS (Next.js)
│   │   ├── segment/             # CDP integration (Next.js)
│   │   └── search/              # Algolia integration (Next.js)
│   │
│   ├── packages/                # Shared libraries
│   │   ├── storefront-config/   # Shared config schema (Zod)
│   │   │   ├── src/
│   │   │   │   ├── schema/      # Zod schemas (17 domain files)
│   │   │   │   │   ├── branding.ts
│   │   │   │   │   ├── content.ts
│   │   │   │   │   ├── design.ts
│   │   │   │   │   ├── homepage.ts
│   │   │   │   │   ├── features.ts
│   │   │   │   │   ├── filters.ts
│   │   │   │   │   ├── footer.ts
│   │   │   │   │   ├── header.ts
│   │   │   │   │   ├── integrations.ts
│   │   │   │   │   ├── pages.ts
│   │   │   │   │   ├── primitives.ts
│   │   │   │   │   ├── seo.ts
│   │   │   │   │   ├── localization.ts
│   │   │   │   │   ├── dark-mode.ts
│   │   │   │   │   ├── ecommerce.ts
│   │   │   │   │   ├── promo-popup.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── types.ts     # Exported Zod-inferred types
│   │   │   │   ├── migrations.ts # Config version migrations
│   │   │   │   └── defaults.ts  # Default values
│   │   │   └── package.json
│   │   │
│   │   ├── errors/              # Custom error classes (@saleor/apps-errors)
│   │   ├── logger/              # Structured logging
│   │   ├── ui/                  # Shared UI components (shadcn/ui)
│   │   ├── domain/              # Shared domain types
│   │   ├── dynamo-config-repository/ # DynamoDB config storage
│   │   ├── trpc/                # tRPC server setup
│   │   ├── otel/                # OpenTelemetry integration
│   │   └── ...                  # Other shared utilities
│   │
│   ├── turbo.json               # Turborepo task graph
│   ├── pnpm-workspace.yaml      # PNPM workspace config
│   └── package.json             # Root package
│
├── scripts/
│   ├── catalog-generator/       # Store infrastructure as code (Node.js)
│   │   ├── src/
│   │   │   ├── config/          # Product/category definitions
│   │   │   │   ├── products.ts  # 100 product definitions
│   │   │   │   ├── categories.ts # 35+ categories with hierarchy
│   │   │   │   └── collections.ts # 18 collections
│   │   │   ├── generators/      # Code generators (Zod schema, types)
│   │   │   ├── add-translations.ts # Hebrew translation script
│   │   │   ├── deploy.ts        # @saleor/configurator wrapper
│   │   │   ├── import-converter.ts # Data format conversion
│   │   │   └── cleanup-catalog.ts # Remove products/categories
│   │   ├── config.yml           # Infrastructure-as-code
│   │   ├── patches/             # patch-package patches
│   │   ├── output/              # Generated files (Excel, CSVs)
│   │   └── SETUP.md             # Catalog generator documentation
│   │
│   ├── build-all-production.mjs # CI/CD build script
│   └── fetch-storefront-config.ts # Download config from Saleor
│
├── infra/                       # Docker Compose orchestration
│   ├── docker-compose.dev.yml   # 14 services (API, storefront, apps, db, redis)
│   ├── docker-compose.prod.yml  # Production deployment
│   ├── nginx.conf               # Reverse proxy + CSP headers
│   ├── .env                     # Environment variables
│   ├── .env.production.example  # Production env template
│   ├── scripts/                 # Setup scripts
│   │   ├── init-new-store.ps1   # New store setup wizard
│   │   ├── toggle-storefront-mode.ps1 # Toggle dev/prod mode
│   │   └── backup-db.sh         # PostgreSQL backup
│   └── DEPLOY.md                # Deployment guide
│
├── .github/                     # GitHub configuration
│   ├── workflows/               # CI/CD pipelines
│   │   └── storefront-ci.yml    # Type-check → lint → build
│   └── ...
│
├── PRD.md                       # Product requirements (v1.4.0)
├── CLAUDE.md                    # Project instructions for Claude
├── AGENTS.md                    # Agent guidelines + container reference
├── .cursorrules                 # Global cursor rules
└── .planning/
    └── codebase/                # Generated analysis documents
        ├── ARCHITECTURE.md
        ├── STRUCTURE.md
        ├── CONVENTIONS.md
        ├── TESTING.md
        ├── STACK.md
        ├── INTEGRATIONS.md
        └── CONCERNS.md
```

## Directory Purposes

**saleor/:**
- **Purpose:** Django/GraphQL backend (Saleor 3.23 base)
- **Contains:** Product catalog, order management, checkout, user accounts, payment webhooks, plugin system
- **Key files:** `saleor/settings.py` (Django config), `saleor/graphql/api.py` (schema root), `saleor/graphql/{domain}/` (resolvers)

**storefront/:**
- **Purpose:** Customer-facing e-commerce UI with Next.js 15 App Router
- **Contains:** 31+ routes, checkout, account pages, homepage sections, product listings
- **Key files:** `src/app/[channel]/layout.tsx` (multi-channel root), `src/providers/StoreConfigProvider.tsx` (config + hooks), `src/lib/graphql.ts` (GraphQL client)

**dashboard/:**
- **Purpose:** Admin dashboard for Saleor management
- **Contains:** Product editing, order management, customer admin, payment configuration
- **Key files:** `src/index.tsx` (React root), Apollo client setup

**apps/apps/storefront-control/:**
- **Purpose:** CMS admin for storefront configuration (no code changes needed)
- **Contains:** 6-section UI (Store, Design, Pages, Commerce, Content, Integrations), live preview, Cmd+K search
- **Key files:** `src/pages/[channelSlug]/` (admin pages), `src/modules/config/schema.ts` (form validation), `sample-config-import*.json` (dev fallback configs)

**apps/apps/bulk-manager/:**
- **Purpose:** Bulk import/export/delete for store data
- **Contains:** 7 entity types (Products, Categories, Collections, Customers, Orders, Vouchers, Gift Cards), CSV/Excel generation
- **Key files:** `src/modules/import/handlers/` (field mapping), `src/modules/export/` (Excel generation)

**apps/apps/image-studio/:**
- **Purpose:** AI-powered image editor with canvas, templates, enhancement
- **Contains:** Fabric.js canvas, AI integrations (rembg, ESRGAN, Gemini), product integration
- **Key files:** `src/components/editor/Canvas.tsx`, `src/modules/trpc/routers/` (AI services)

**apps/packages/storefront-config/:**
- **Purpose:** Shared Zod schema (single source of truth for config shape)
- **Contains:** 17 domain schema files, migrations, Zod-inferred types
- **Key files:** `src/schema/index.ts` (rolled-up schema), `src/types.ts` (exported types)

**scripts/catalog-generator/:**
- **Purpose:** Infrastructure-as-code + product catalog generation
- **Contains:** Product/category/collection definitions, YAML config, Excel/CSV generators
- **Key files:** `config.yml` (infrastructure), `src/config/products.ts`, `src/add-translations.ts`

**infra/:**
- **Purpose:** Docker Compose orchestration for development and production
- **Contains:** 14 services, environment variables, reverse proxy config
- **Key files:** `docker-compose.dev.yml`, `nginx.conf`, `.env`

## Key File Locations

**Entry Points:**

- `storefront/src/app/layout.tsx` - Root layout (fonts, providers)
- `storefront/src/app/[channel]/layout.tsx` - Channel layout (config fetching, channel validation)
- `dashboard/src/index.tsx` - Dashboard React root
- `apps/apps/storefront-control/src/pages/index.tsx` - Storefront Control admin root
- `saleor/saleor/settings.py` - Django settings

**Configuration:**

- `storefront/src/config/store.config.ts` - Storefront config types + defaults
- `apps/packages/storefront-config/src/schema/` - Shared Zod schemas (17 files)
- `apps/apps/storefront-control/src/modules/config/defaults.ts` - Admin form defaults
- `apps/apps/storefront-control/src/modules/config/schema.ts` - Admin form validation
- `infra/.env` - Environment variables for all services

**Core Logic:**

- `storefront/src/providers/StoreConfigProvider.tsx` - Config provider + 64 custom hooks
- `storefront/src/lib/graphql.ts` - GraphQL client execution (server/client aware)
- `storefront/src/app/actions.ts` - Server actions (mutations, auth)
- `storefront/src/app/cart-actions.ts` - Cart mutations
- `saleor/saleor/graphql/` - GraphQL resolvers (by domain)
- `apps/apps/storefront-control/src/modules/trpc/` - Config API (tRPC)

**State Management:**

- `storefront/src/checkout/state/` - Zustand stores (cart, form validation, email)
- `storefront/src/checkout/contexts/` - React Context (CheckoutId, User)

**Hooks & Utils:**

- `storefront/src/hooks/` - Custom hooks (useProduct, useFilter, etc.)
- `storefront/src/lib/storefront-control/` - Config sync utilities
- `apps/packages/logger/` - Structured logging
- `apps/packages/errors/` - Custom error classes

**Testing:**

- `saleor/tests/` - Pytest fixtures, test data (flat structure, no classes)
- `apps/apps/*/src/**/*.test.ts` - Vitest unit tests (co-located)
- `apps/apps/*/e2e/` - Vitest E2E tests (PactumJS)

## Naming Conventions

**Files:**

- `*.ts` - TypeScript files (utilities, types, server actions)
- `*.tsx` - React component files
- `*.graphql` - GraphQL operation definitions
- `**/schema.ts` - Zod validation schemas
- `**/hooks.ts` or `use*.ts` - React hooks
- `**/actions.ts` - Server actions
- `**.test.ts` - Vitest unit tests
- `**.spec.ts` - E2E tests

**Directories:**

- `modules/` - Domain-driven design (one per business domain)
- `components/` - React components (by feature)
- `lib/` - Utilities and helpers (non-React)
- `hooks/` - Custom React hooks
- `config/` - Configuration files
- `graphql/` - GraphQL operations
- `pages/` - Next.js pages (Pages Router) or admin sections (App Router groups)
- `(main)` - Route group (not in URL, for organization)
- `[param]` - Dynamic route segments

**Variables & Functions:**

- camelCase for variables, functions, component props
- PascalCase for React components, type names
- SCREAMING_SNAKE_CASE for constants
- Prefixed hooks: `use*` (useStoreConfig, useProduct)
- Prefixed handlers: `handle*` (handleAddToCart, handleSubmit)

## Where to Add New Code

**New Storefront Feature:**

1. **Page route:** `storefront/src/app/[channel]/(main)/{feature}/page.tsx` (server component)
2. **Component:** `storefront/src/components/{feature}/` (React component)
3. **Hooks:** `storefront/src/hooks/use{Feature}.ts` (custom hooks)
4. **GraphQL:** `storefront/src/graphql/{Feature}.graphql` (operations)
5. **Server actions:** `storefront/src/app/{feature}-actions.ts` if mutations needed
6. **Styling:** Tailwind CSS directly in JSX, no separate CSS files

**New Configurable Setting:**

Follow the 11-file sync checklist in CLAUDE.md:
1. `apps/packages/storefront-config/src/schema/` - Add Zod schema
2. `apps/packages/storefront-config/src/types.ts` - Export type if new section
3. `apps/apps/storefront-control/src/modules/config/defaults.ts` - Add default value
4. `apps/apps/storefront-control/src/modules/config/schema.ts` - Add form validation
5. `storefront/src/config/store.config.ts` - Add type
6. `storefront/src/providers/StoreConfigProvider.tsx` - Add hook
7. `apps/apps/storefront-control/sample-config-import.json` - Add Hebrew value
8. `apps/apps/storefront-control/sample-config-import-en.json` - Add English value
9. `apps/apps/storefront-control/src/lib/settings-index.ts` - Add search index entry
10. `apps/apps/storefront-control/src/pages/[channelSlug]/` - Add UI control if needed
11. `PRD.md`, `CLAUDE.md` - Update docs if significant

**New Saleor App:**

1. Copy template: `apps/templates/app-starter/`
2. Set up `src/modules/{domain}/` for business logic (use cases, repositories)
3. Add `src/pages/api/webhooks/saleor/` for webhook handlers
4. Add `webhooks.ts` with webhook definitions
5. Add tRPC routers in `src/modules/trpc/routers/`
6. Use neverthrow Result pattern for error handling
7. Add container to `infra/docker-compose.dev.yml`

**New Backend Resolver:**

1. Add model in `saleor/saleor/{domain}/models.py` if needed
2. Add mutations/queries in `saleor/saleor/graphql/{domain}/mutations.ts` or `queries.ts`
3. Register in `saleor/saleor/graphql/schema/mutations.ts` or `queries.ts`
4. Add tests in `saleor/tests/{domain}/test_*.py`
5. Run `docker exec aura-api-dev python manage.py build_schema` to regenerate

**New Admin Storefront Control Page:**

1. Create page file: `apps/apps/storefront-control/src/pages/[channelSlug]/{section}/*.tsx`
2. Use `useConfigPage()` hook for boilerplate reduction
3. Import config schema from `@saleor/apps-storefront-config`
4. Add form validation schema to `src/modules/config/schema.ts`
5. Add tRPC mutation to `src/modules/trpc/routers/config-router.ts`
6. Update settings search index: `src/lib/settings-index.ts`
7. Add navigation entry to `src/pages/[channelSlug]/layout.tsx`

## Special Directories

**storefront/src/checkout/:**
- **Purpose:** Separate checkout app (Pages Router inside App Router)
- **Generated:** No (source code)
- **Committed:** Yes
- **Note:** Uses Zustand for form validation, urql for GraphQL, Stripe + Adyen for payments

**apps/packages/storefront-config/:**
- **Purpose:** Shared configuration schema (monorepo dependency)
- **Generated:** No (source code)
- **Committed:** Yes
- **Note:** All consuming apps/storefront depend on this via `workspace:*` (monorepo)

**scripts/catalog-generator/output/:**
- **Purpose:** Generated Excel/CSV files for bulk import
- **Generated:** Yes (`npm run generate`)
- **Committed:** No (gitignore)

**storefront/src/gql/:**
- **Purpose:** Generated GraphQL types and stubs
- **Generated:** Yes (`pnpm generate` in storefront)
- **Committed:** Yes (types committed to avoid build issues)

**saleor/tests/fixtures/:**
- **Purpose:** Pytest fixtures for all tests
- **Generated:** No (source code)
- **Committed:** Yes
- **Note:** Central fixture registry; all tests use fixtures, no setup methods

**apps/apps/*/src/__tests__/mocks/:**
- **Purpose:** Mock objects and stubs for unit tests
- **Generated:** No (source code)
- **Committed:** Yes

**infra/esrgan/:**
- **Purpose:** Real-ESRGAN Docker image for image upscaling
- **Generated:** No (submodule or build artifact)
- **Committed:** No (but mounted as Docker volume)

---

*Structure analysis: 2026-02-15*
