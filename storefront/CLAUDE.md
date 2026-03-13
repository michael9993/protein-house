---
description:
alwaysApply: true
---

# Storefront

Next.js 16 App Router + React 19 + TypeScript customer-facing storefront. All commands run inside Docker.

## Commands

```bash
docker exec -it saleor-storefront-dev pnpm dev          # Start dev server (port 3000)
docker exec -it saleor-storefront-dev pnpm build         # Production build
docker exec -it saleor-storefront-dev pnpm generate      # Regenerate GraphQL types
docker exec -it saleor-storefront-dev pnpm lint          # ESLint (next lint)
docker exec -it saleor-storefront-dev pnpm type-check    # TypeScript strict check
```

**E2E tests run on the HOST machine** (not Docker):
```bash
cd storefront
pnpm test:e2e                # All tests (headless)
pnpm test:e2e:headed         # With browser visible
pnpm test:e2e:ui             # Playwright interactive UI
```

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [channel]/(main)/   # Multi-channel routes (ILS/USD)
│   │   ├── account/        # Dashboard, orders, addresses, settings
│   │   ├── cart/            # Cart page
│   │   ├── products/        # PLP + PDP
│   │   ├── search/          # Search results
│   │   └── checkout/        # Legacy (redirects to checkout-v2)
│   ├── checkout/            # Checkout v2 entry point
│   └── api/                 # API routes (config, cart, webhooks)
├── checkout-v2/             # Single-page accordion checkout
│   ├── _actions/            # Server actions (18)
│   ├── steps/               # Contact, Shipping, Delivery, Payment
│   ├── confirmation/        # Order confirmation
│   └── summary/             # Checkout summary sidebar
├── components/              # Feature components
│   └── home/                # Homepage sections (12+)
├── config/                  # store.config.ts (types + defaults)
├── gql/                     # Generated GraphQL types
├── graphql/                 # GraphQL document definitions
├── hooks/                   # Custom React hooks
├── lib/                     # Core utilities
│   ├── graphql.ts           # urql client (retries, auth, Docker URLs)
│   ├── analytics.ts         # GA4 events + consent queue
│   ├── consent.ts           # Cookie consent manager
│   ├── checkout/            # Shared checkout modules
│   ├── preview-mode.ts      # Component Designer PostMessage bridge
│   └── preview-overlay.ts   # Visual overlay (click-to-edit)
├── providers/               # Context providers
│   └── StoreConfigProvider.tsx  # Config context + 64 hooks
└── ui/                      # Low-level UI primitives
```

## Key Patterns

### Server vs Client Components
- **Default to Server Components** — use `'use client'` only when needed (interactivity, hooks, browser APIs)
- **Data fetching** in server components via `executeGraphQL()` with revalidation
- **Mutations** via Server Actions (`'use server'`)
- **State** via Context API (store config, wishlist, cart drawer, quick view)

### Multi-Channel Routing
- Routes: `/[channel]/products`, `/[channel]/checkout`, etc.
- Channel validated server-side, redirects to default if invalid
- Channel passed to all GraphQL operations
- Default: `NEXT_PUBLIC_DEFAULT_CHANNEL` env var

### Configuration-Driven (3-Tier)
1. **Storefront Control App** (Saleor API metadata) — production
2. **Sample config JSONs** (`apps/apps/storefront-control/*.json`) — dev fallback
3. **Static config** (`src/config/store.config.ts`) — types and base defaults

Use `useConfigSection(key)`, `useHomepageSection(id)`, `useFeature(flag)`, or domain-specific hooks. Never hardcode store name, URLs, branding, feature flags, or UI text.

### RTL/LTR
Direction auto-detected from locale. Always use logical CSS properties:
- `ms-4` not `ml-4`, `me-4` not `mr-4`
- `start-0` not `left-0`, `end-0` not `right-0`
- `rtl:rotate-180` for directional icons (chevrons, arrows)

### Component Designer Wiring
Client components:
```tsx
import { buildComponentStyle } from "@/config";
import { useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";

const cdStyle = useComponentStyle("homepage.hero");
const cdClasses = useComponentClasses("homepage.hero");
<section data-cd="homepage-hero" className={`base ${cdClasses}`}
  style={{ ...buildComponentStyle("homepage.hero", cdStyle) }} />
```

Server components use CSS vars directly: `style={{ backgroundColor: 'var(--cd-layout-header-bg, transparent)' }}`

### GraphQL
- Client: urql in `src/lib/graphql.ts`
- Server-side uses Docker service name: `http://saleor-api:8000/graphql/`
- 4 max retries, exponential backoff, 30s timeout
- Auth: `@saleor/auth-sdk` cookies
- After schema changes: `pnpm generate` then restart container

## Integration Points

| App | Env Var | Purpose |
|-----|---------|---------|
| Storefront Control | `STOREFRONT_CONTROL_APP_URL` | CMS configuration |
| Invoices | `INVOICES_APP_URL` | Invoice downloads |
| Newsletter | `NEXT_PUBLIC_NEWSLETTER_APP_URL` | Unsubscribe links |
| SMTP | `NEXT_PUBLIC_SMTP_APP_URL` | Email sending |

## Testing

- **No unit test runner** — quality enforced via TypeScript strict mode + ESLint
- **E2E**: Playwright (runs on host, not Docker) against `http://localhost:3000`
- **Page objects**: `e2e/pages/` (cart, checkout, auth, search, account)
- **Auth**: Cookie injection (bypasses JWT ISS mismatch in dev)
- **Test data**: `e2e/fixtures/test-data.ts` (channel, credentials, Stripe test card)

## Gotchas

- **HMR unreliable** — Always `docker compose restart saleor-storefront-dev` after changes on Windows
- **Shared package access** — Docker volume mounts `../apps:/apps:ro`; tsconfig needs `"zod": ["./node_modules/zod"]`
- **`export { X } from` is NOT local** — Must also `import { X }` to use in the same file
- **ReactNode return type** — Don't use explicit `: ReactNode` on components used as JSX children (React 18 compat)
- **React.RefObject** — Use `React.RefObject<HTMLElement>` not `React.RefObject<HTMLElement | null>`
- **CSS marquee + RTL** — RTL flex reverses copy order; fix: `direction: ltr` on marquee container
- **ButtonsSchema** — `borderRadius` is on parent `ButtonsSchema`, NOT on `ButtonVariantSchema`. Path: `ui.buttons.borderRadius`

## Code Style

- TypeScript strict mode, avoid `any`
- Functional components + hooks, named exports preferred
- Tailwind CSS with `prettier-plugin-tailwindcss` for class sorting
- ESLint via `next lint`
- Prettier formatting
