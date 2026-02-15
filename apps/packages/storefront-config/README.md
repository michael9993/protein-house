# Storefront Config (@saleor/apps-storefront-config)

## Overview

Shared configuration schema package — the single source of truth for all storefront configuration types, validation, and migrations. Used by both the storefront (consumer) and Storefront Control app (admin producer).

**Package:** `@saleor/apps-storefront-config` (pnpm workspace)

## Quick Start

```typescript
// Import in storefront or apps
import { StorefrontConfig, BrandingSchema } from "@saleor/apps-storefront-config";

// Use inferred types
const config: StorefrontConfig = { ... };

// Validate with Zod
const result = BrandingSchema.safeParse(data);
```

## Key Features

- **17 Domain-Specific Schemas:** 2,332 lines of Zod validation across store info, branding, features, ecommerce, content, UI, and more
- **Zod-Inferred Types:** Zero manual type definitions — all TypeScript types derived from schemas
- **Config Version Migrations:** Backward-compatible migrations for schema evolution
- **Shared Package:** Single source of truth used by multiple workspaces
- **Type Safety:** Compile-time validation across storefront and admin
- **Modular Schema:** Import only what you need from individual domain files

## Schema Domains (17 Files)

```
src/schema/
├── store.ts                 # Store name, description, contact info
├── branding.ts              # 10 color tokens, typography, logos
├── features.ts              # 19+ feature toggles
├── ecommerce.ts             # Currency, shipping, tax, payment
├── header.ts                # Navigation, announcement bar, mobile menu
├── footer.ts                # Footer links, copyright, social icons
├── homepage.ts              # 12+ configurable sections (hero, categories, etc.)
├── filters.ts               # Product filter UI and labels
├── ui.ts                    # Buttons, badges, cards, forms
├── seo.ts                   # Meta tags, OG tags, structured data
├── localization.ts          # RTL/LTR, locale settings
├── darkMode.ts              # Dark mode toggle and palette
├── promoPopup.ts            # Popup timing, content, targeting
├── content.ts               # All UI text and translations
├── productDetail.ts         # PDP layout and content
├── checkout.ts              # Checkout flow configuration
└── socialMedia.ts           # Social platform links
```

## File Structure

```
src/
├── schema/
│   ├── store.ts             # Store info schema
│   ├── branding.ts          # Branding schema
│   ├── features.ts          # Feature flags schema
│   ├── ecommerce.ts         # E-commerce settings schema
│   ├── header.ts            # Header schema
│   ├── footer.ts            # Footer schema
│   ├── homepage.ts          # Homepage sections schema
│   ├── filters.ts           # Filters schema
│   ├── ui.ts                # UI components schema
│   ├── seo.ts               # SEO schema
│   ├── localization.ts      # Localization schema
│   ├── darkMode.ts          # Dark mode schema
│   ├── promoPopup.ts        # Promo popup schema
│   ├── content.ts           # Content/text schema
│   ├── productDetail.ts     # Product detail schema
│   ├── checkout.ts          # Checkout schema
│   ├── socialMedia.ts       # Social media schema
│   └── index.ts             # Barrel exports
├── types.ts                 # Zod-inferred type exports
├── migrations.ts            # Config version migrations
└── index.ts                 # Package entry point
```

## Key Exports

```typescript
// Full schema and type
export const StorefrontConfigSchema: z.ZodType<StorefrontConfig>;
export type StorefrontConfig = z.infer<typeof StorefrontConfigSchema>;

// Individual section schemas
export const BrandingSchema: z.ZodObject<...>;
export const FeaturesSchema: z.ZodObject<...>;
export const HomepageSchema: z.ZodObject<...>;
// ... 14 more schema exports

// Migration function
export function migrateConfig(config: unknown): StorefrontConfig;
```

## Adding New Config Fields (11-Step Sync)

When adding new configuration fields, you MUST update all 11 locations to keep the system in sync:

1. **Shared schema** — `apps/packages/storefront-config/src/schema/` (add Zod field)
2. **Shared types** — `apps/packages/storefront-config/src/types.ts` (if new top-level section)
3. **Admin defaults** — `apps/apps/storefront-control/src/modules/config/defaults.ts`
4. **Admin form schema** — `apps/apps/storefront-control/src/modules/config/schema.ts`
5. **Storefront types** — `storefront/src/config/store.config.ts`
6. **Storefront hooks** — `storefront/src/providers/StoreConfigProvider.tsx`
7. **Sample config (Hebrew)** — `apps/apps/storefront-control/sample-config-import.json`
8. **Sample config (English)** — `apps/apps/storefront-control/sample-config-import-en.json`
9. **Settings search index** — `apps/apps/storefront-control/src/lib/settings-index.ts`
10. **Admin UI pages** — `apps/apps/storefront-control/src/pages/[channelSlug]/`
11. **Documentation** — PRD.md, CLAUDE.md, AGENTS.md (if significant)

**Critical:** Never add a schema field without also adding its default value, sample config values (both languages), and search index entry.

## Development

**Build the package:**
```bash
# From monorepo root
docker exec -it saleor-storefront-control-app-dev pnpm --filter @saleor/apps-storefront-config build
```

**Type check:**
```bash
docker exec -it saleor-storefront-control-app-dev pnpm --filter @saleor/apps-storefront-config type-check
```

**Used by:**
- `apps/apps/storefront-control/` — Admin producer (forms, validation)
- `storefront/` — Consumer (hooks, components)

## Related Docs

- CLAUDE.md section "Adding New Configurable Features" — Full checklist
- CLAUDE.md section "Keeping Everything in Sync" — 11-file sync table
- PRD.md section 9.1 — Storefront Control app specifications
- AGENTS.md — Configuration architecture patterns
