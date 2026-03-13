# Saleor Apps

## Project Structure

**Monorepo Architecture**: Turborepo-managed monorepo with PNPM workspaces.

- `/apps/` — Individual Saleor applications (10 custom apps)
- `/packages/` — Shared libraries (`@saleor/apps-storefront-config`, apps-logger, apps-ui, apps-errors, etc.)
- Uses `workspace:*` dependencies

### Your Apps

| App | Directory | Port | Stack |
|-----|-----------|------|-------|
| storefront-control | `apps/storefront-control/` | 3004 | Next.js Pages Router, tRPC, shadcn/ui, Tailwind |
| stripe | `apps/stripe/` | 3002 | Next.js, tRPC, Stripe SDK |
| smtp | `apps/smtp/` | 3001 | Next.js, Handlebars templates |
| invoices | `apps/invoices/` | 3003 | Next.js, PDF generation |
| newsletter | `apps/newsletter/` | 3005 | Next.js, tRPC, MJML templates |
| sales-analytics | `apps/sales-analytics/` | 3006 | Next.js, tRPC, Recharts, Excel export |
| bulk-manager | `apps/bulk-manager/` | 3007 | Next.js, tRPC, CSV/Excel parsing |
| image-studio | `apps/image-studio/` | 3008 | Next.js, tRPC, Fabric.js v6, Sharp |
| dropship-orchestrator | `apps/dropship-orchestrator/` | 3009 | Next.js, tRPC, BullMQ, ioredis |
| tax-manager | `apps/tax-manager/` | 3010 | Next.js, tRPC |

## Essential Commands

All commands run inside Docker containers (`docker exec`), not on the host.

```bash
# Development (replace <container> with the app's container name)
docker exec -it <container> pnpm dev
docker exec -it <container> pnpm build       # Build + type check
docker exec -it <container> pnpm lint

# Turborepo (from apps/ root, inside any app container)
docker exec -it <container> pnpm turbo run build
docker exec -it <container> pnpm turbo run lint

# GraphQL codegen (after schema changes)
docker exec -it <container> pnpm generate
```

Container names follow the pattern `saleor-<app-name>-app-dev` (e.g., `saleor-storefront-control-app-dev`, `saleor-bulk-manager-app-dev`).

## Architecture Patterns

### Domain-Driven Modular Structure

```
apps/<app-name>/src/
├── modules/          # Domain-specific business logic
│   └── <domain>/     # e.g., trpc/, config/, webhooks/
├── pages/            # Next.js Pages Router
│   └── [channelSlug]/ # Per-channel admin pages
├── components/       # React components
│   ├── pages/        # Page-level components
│   └── ui/           # Shared UI primitives
├── lib/              # Utilities, registries, helpers
└── app/api/          # Webhooks (App Router routes)
```

### Result-Based Error Handling

Uses `neverthrow` — functions return `Result<T, E>` instead of throwing:

```typescript
// Testing neverthrow results
result._unsafeUnwrap()    // Assert success, get value
result._unsafeUnwrapErr() // Assert error, get error
```

### Branded Types with Zod

Follow ADR 0002 (`apps/adr/`) for type-safe primitives:

```typescript
const saleorApiUrlSchema = z.string().url().endsWith("/graphql/").brand("SaleorApiUrl");
```

### Error Classes

```typescript
static ValidationError = BaseError.subclass("ValidationError", {
  props: { _brand: "AppChannelConfig.ValidationError" as const },
});
```

### Shared Config Package

`@saleor/apps-storefront-config` in `packages/storefront-config/` — Zod schemas, inferred types, and config version migrations shared between Storefront Control admin and the storefront consumer.

## UI Patterns

### Storefront Control (Primary Admin App)

- **UI Stack**: shadcn/ui + Radix primitives + Tailwind CSS
- **Navigation**: `useRouter().push()` with `<button>` elements — **never** `<Link>` from Next.js (fails silently in Saleor Dashboard iframe)
- **Page pattern**: ComponentBlock cards (collapsible, icon + title + toggle), tab navigation
- **Config hooks**: `useConfigPage()` eliminates boilerplate (loading, saving, dirty state)
- **Cmd+K**: Command palette powered by settings search index (`src/lib/settings-index.ts`)

### Plain HTML Primitives (All Apps)

macaw-ui Box/Text/Button imported in **page-level files** crash inside the Saleor Dashboard iframe (`TypeError: Cannot read properties of undefined (reading 'defaultClass')`). Root cause: vanilla-extract Sprinkles initialization order with ThemeSynchronizer's `setTheme()`.

**Fix**: Keep ThemeProvider/ThemeSynchronizer in `_app.tsx` only. In all page files, use plain HTML primitives from `src/components/ui/primitives.tsx`.

## Gotchas

- **AppBridge iframe navigation**: Use `router.push()` with `<button>`, NOT `<Link>` from Next.js
- **macaw-ui in pages**: Only safe in `_app.tsx` — crashes in page files when loaded in iframe
- **Zod array fields in forms**: Schema `z.array(z.string())` needs `Controller` with join/split logic, not plain `register()` which treats arrays as strings
- **Docker restart**: Use service name `saleor-bulk-manager-app` (not container name with `-dev`)
- **macaw-ui type errors**: Pre-existing `__borderLeft` issue with `tsc --noEmit`; dev server works fine

## Testing

- **Vitest** with workspace config
- Unit tests: `src/**/*.test.ts`
- E2E: `vitest --project e2e`
- Mocks: `src/__tests__/mocks/`

## Turborepo Pipeline

Turborepo manages task dependencies across apps and packages. Defined in `apps/turbo.json`:

- `build` depends on `^build` (packages build first, then apps)
- `lint` and `test` run independently per package
- `generate` runs GraphQL codegen per app

When a shared package changes (e.g., `@saleor/apps-storefront-config`), all dependent apps rebuild automatically.

## Environment Setup

Apps receive environment via Docker Compose (`infra/docker-compose.dev.yml`). Key variables:

- `APL=file` — App Permission List storage (file-based in dev)
- `APP_API_BASE_URL` — Public URL for webhook registration (cloudflared tunnel or localhost)
- `NEXT_PUBLIC_SALEOR_HOST_URL` — Saleor API URL (e.g., `http://localhost:8000`)
- `SECRET_KEY` — App secret for Saleor authentication

App-specific env vars are defined per-service in `docker-compose.dev.yml`. When adding a new env var, update both the compose file and `infra/.env`.

## Adding a New App

1. Create directory in `apps/apps/<app-name>/`
2. Copy structure from an existing app (e.g., `tax-manager` for simple, `storefront-control` for complex)
3. Add service to `infra/docker-compose.dev.yml` (container, port, volumes, env)
4. Add to `infra/platform.yml` service registry (port, container, tunnel)
5. Add to root CLAUDE.md Container Map
6. Register with Saleor via `platform.ps1 install-apps` or manual manifest registration

## Debugging Tips

- **Check container logs**: `docker compose -f infra/docker-compose.dev.yml logs --tail=100 <container>`
- **tRPC errors**: Check browser Network tab for `/api/trpc/*` calls — error details in response body
- **Webhook issues**: Check Saleor Dashboard > Apps > [App] > Webhooks for delivery status
- **macaw-ui crash**: If you see `Cannot read properties of undefined (reading 'defaultClass')`, you're importing macaw-ui components in a page file — move to `_app.tsx` or use plain HTML primitives
- **Build fails in container**: Try `docker exec -it <container> pnpm install` first (deps may be stale after volume mount changes)
- **Config not loading**: Verify app is registered in Saleor and has correct permissions. Check `APL` storage file.

## Key References

- **ADRs**: `apps/adr/` — Architecture Decision Records
- **Copilot instructions**: `apps/.github/copilot-instructions.md`
- **Shared config schema**: `packages/storefront-config/src/schema/` (21 domain files)
