# Plan: White-Label "Saleor" → "Aura" Platform Rebrand

**Date**: 2026-02-11 (updated with recent commit audit)
**Status**: Ready for implementation
**Estimated scope**: ~120+ files, 9 phases

## Context

The Saleor open-source platform doesn't want its name shown in forked apps. This plan renames all user-facing, config, infrastructure, and documentation references from "Saleor" to "Aura" while keeping internal code references (Python module, SDK imports, cookies) intact. The approach centralizes brand names for easy future rebrands.

---

## Scope & Decisions

| Area | Decision |
|------|----------|
| Python backend module (`saleor/`) | **SKIP** — 1000+ imports, migrations would break |
| Workspace packages (`@saleor/apps-*`) | **SKIP** — internal, not user-visible |
| External npm packages (`@saleor/auth-sdk`, etc.) | **SKIP** — cannot rename |
| Cookie names (`saleor_auth_*`) | **SKIP** — SDK-mandated |
| App manifest IDs (`saleor.app.*`) | **KEEP** — avoid re-installing apps |
| `window.__SALEOR_CONFIG__` | **KEEP** — dashboard SDK expects it |
| `allowedSaleorUrls`, `requiredSaleorVersion` | **KEEP** — SDK field names |
| Database table names | **KEEP** — Django migrations reference them |
| Generated GraphQL types | **KEEP** — auto-generated from schema |
| Docker services/containers | **RENAME** `saleor-*` → `aura-*` |
| Environment variables | **RENAME** `SALEOR_*` → `AURA_*` |
| UI text, metadata, branding | **RENAME** all to "Aura" |
| Dashboard help links (docs.saleor.io) | **REMOVE** |
| App manifest author/URLs | **RENAME** visible fields |
| Documentation (CLAUDE.md, READMEs) | **UPDATE** |
| Package.json names | **RENAME** where possible |
| Dashboard images (favicons, logos, OG) | **REPLACE** |

---

## CRITICAL: Pre-Migration Safety

### Risks That Can Destroy Data

1. **`docker compose down -v` DELETES ALL VOLUMES** — database, media, everything. NEVER use `-v`.
2. **Changing POSTGRES_USER** from "saleor" to "aura" **locks you out** if the existing volume was initialized with "saleor". PostgreSQL only creates the user on first init.
3. **Service name changes** (`saleor-api:8000` → `aura-api:8000`) **invalidate all app registrations and webhooks** stored in the DB. Apps must be reinstalled.
4. **Volume name changes** can orphan existing data if Docker Compose project name changes.

### Required Pre-Migration Steps

```bash
# 1. Backup database
docker exec saleor-postgres-dev pg_dump -U saleor saleor > backup-pre-aura.sql

# 2. Backup media volume
docker run --rm -v saleor-platform_saleor-media:/data -v "$(pwd):/backup" alpine tar czf /backup/media-backup.tar.gz -C /data .

# 3. Backup .env
copy infra\.env infra\.env.backup

# 4. Stop containers (NO -v flag!)
docker compose -f infra/docker-compose.dev.yml stop

# 5. Pin COMPOSE_PROJECT_NAME to prevent volume orphaning
# Add to infra/.env:
COMPOSE_PROJECT_NAME=saleor-platform
```

### Required Post-Migration Steps

```bash
# 1. Recreate containers with new names
docker compose -f infra/docker-compose.dev.yml down
docker compose -f infra/docker-compose.dev.yml up -d

# 2. Wait for all services healthy
docker compose -f infra/docker-compose.dev.yml ps

# 3. Reinstall ALL apps (webhooks re-register with new URLs)
.\infra\scripts\install-dashboard-apps.ps1
.\infra\scripts\install-bulk-manager-app.ps1

# 4. Regenerate GraphQL types
docker exec -it aura-storefront-dev pnpm generate

# 5. Verify builds
docker exec -it aura-storefront-dev pnpm build
```

---

## Phase 1: Brand Constants (Easy Future Rebrands)

**Create** `storefront/src/config/brand.ts`:
```ts
/**
 * Centralized brand constants for the platform.
 * Change PLATFORM_NAME here to rebrand the entire storefront.
 * For runtime-configurable values (store name, tagline), use StoreConfigProvider hooks.
 */
export const PLATFORM_NAME = "Aura";
export const PLATFORM_DESCRIPTION = "Your premium shopping destination";
export const PLATFORM_TITLE_SUFFIX = PLATFORM_NAME;
```

---

## Phase 2: Docker Infrastructure

### File: `infra/docker-compose.dev.yml` + `infra/docker-compose.prod.yml`

Both files share the same naming patterns. Apply all renames to BOTH.

**Service names** (rename all 14):
| Before | After |
|--------|-------|
| `saleor-postgres` | `aura-postgres` |
| `saleor-redis` | `aura-redis` |
| `saleor-api` | `aura-api` |
| `saleor-worker` | `aura-worker` |
| `saleor-scheduler` | `aura-scheduler` |
| `saleor-dashboard` | `aura-dashboard` |
| `saleor-storefront` | `aura-storefront` |
| `saleor-storefront-control-app` | `aura-storefront-control-app` |
| `saleor-stripe-app` | `aura-stripe-app` |
| `saleor-smtp-app` | `aura-smtp-app` |
| `saleor-invoice-app` | `aura-invoice-app` |
| `saleor-newsletter-app` | `aura-newsletter-app` |
| `saleor-sales-analytics-app` | `aura-sales-analytics-app` |
| `saleor-bulk-manager-app` | `aura-bulk-manager-app` |

**Container names**: `saleor-*-dev` → `aura-*-dev` (all 14)

**Network**: `saleor-network` → `aura-network`

**Volume**: `saleor-media` → `aura-media`

**Environment variable keys**:
| Before | After |
|--------|-------|
| `SALEOR_API_PORT` | `AURA_API_PORT` |
| `SALEOR_API_TUNNEL_URL` | `AURA_API_TUNNEL_URL` |
| `SALEOR_API_URL` | `AURA_API_URL` |
| `NEXT_PUBLIC_SALEOR_API_URL` | `NEXT_PUBLIC_AURA_API_URL` |
| `SALEOR_APP_TOKEN` | `AURA_APP_TOKEN` |

**Internal service URLs**: `http://saleor-api:8000` → `http://aura-api:8000` (all service-to-service refs)

**Database credentials**: Keep `POSTGRES_USER` and `POSTGRES_DB` as-is ("saleor") if set in `.env`. Only change the **defaults** in docker-compose (the `:-saleor` fallbacks) — but confirm `.env` overrides them first. If `.env` sets explicit values, the defaults don't matter.

### File: `infra/.env` + `infra/.env.production.example`

Rename env var keys: `SALEOR_*` → `AURA_*` in BOTH files. Keep values unchanged. Keep `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` values unchanged (DB lockout risk).

### File: `infra/nginx.conf` (~12 refs)

- `upstream saleor_api` → `upstream aura_api`
- `proxy_pass http://saleor_api` → `proxy_pass http://aura_api`
- Log paths: `saleor-api-access.log` → `aura-api-access.log`
- Static paths: `/var/www/saleor/media/` → `/var/www/aura/media/`, `/var/www/saleor/static/` → `/var/www/aura/static/`
- Comments: "Saleor GraphQL API" → "Aura GraphQL API", "Saleor Apps" → "Aura Apps"

### File: `apps/Dockerfile.prod` (3 refs)

- Comment: "Generic production Dockerfile for Saleor Apps" → "...for Aura Apps"
- `turbo prune "saleor-app-${APP_NAME}"` → `"aura-app-${APP_NAME}"`
- `turbo run build --filter="saleor-app-${APP_NAME}"` → `"aura-app-${APP_NAME}"`

### File: `.github/workflows/storefront-ci.yml` (2 refs)

- `NEXT_PUBLIC_SALEOR_API_URL` → `NEXT_PUBLIC_AURA_API_URL` (lines 28, 67)

---

## Phase 3: Storefront (~15 files)

### 3a. Layout Metadata (3 files)

**`storefront/src/app/[channel]/(main)/layout.tsx`** (lines 31-32):
- `"Saleor Storefront example"` → use `storeConfig.seo?.defaultTitle || PLATFORM_NAME`
- Import from `@/config/brand`

**`storefront/src/app/checkout/layout.tsx`** (lines 4-7):
- `"Saleor Storefront example"` → `` `Checkout | ${PLATFORM_NAME}` ``

**`storefront/src/app/[channel]/(main)/pages/[slug]/page.tsx`** (line 18):
- `"Saleor Storefront example"` → `PLATFORM_TITLE_SUFFIX`

### 3b. Environment Variable References in Code

All files reading `process.env.SALEOR_*` or `process.env.NEXT_PUBLIC_SALEOR_*` — rename to `AURA_*`:
- `storefront/src/lib/graphql.ts`
- `storefront/src/app/config.ts`
- `storefront/src/ui/components/AuthProvider.tsx`
- `storefront/src/app/actions.ts` (multiple)
- `storefront/src/checkout/Root.tsx`
- `storefront/src/app/[channel]/(main)/auth/callback/route.ts`
- `storefront/src/app/[channel]/(main)/confirm-email/actions.ts`
- `storefront/.graphqlrc.ts`
- `storefront/next.config.js` (env refs + `hostname: "saleor-api"` → `"aura-api"`)

### 3c. localStorage Keys (3 custom keys)

| File | Key Before | Key After |
|------|-----------|-----------|
| `storefront/src/hooks/useProductFilters.ts:67` | `saleor_product_filters` | `aura_product_filters` |
| `storefront/src/ui/components/Filters/ProductFilters.tsx:178,195` | `saleor_filter_expanded_sections` | `aura_filter_expanded_sections` |
| `storefront/src/ui/components/nav/components/ChannelPicker.tsx:107` | `saleor_channel_preference` | `aura_channel_preference` |

### 3d. Delete Unused Files

- **DELETE** `storefront/src/components/Footer.tsx` — unused (real footer is `ui/components/FooterClient.tsx`)
- **DELETE** `storefront/src/checkout/assets/images/SaleorLogo.tsx` — unused Saleor wordmark SVG

### 3e. Package Name

`storefront/package.json`: `"name": "saleor-storefront"` → `"name": "aura-storefront"`

### 3f. Transpile Config

`storefront/next.config.js:14`: `transpilePackages: ["@saleor/apps-storefront-config"]` — **keep** (workspace package name not being renamed)

---

## Phase 4: Dashboard (~28 files + 13 image files)

### 4a. Login Page (1 file)

**`dashboard/src/index.html`** (lines 7, 10-12):
- `"Sign in to the Saleor Dashboard"` → `"Sign in to the Aura Dashboard"`
- Meta description: same replacement
- **KEEP** `window.__SALEOR_CONFIG__` — SDK requires it

### 4b. Welcome Page & Onboarding (2 files, 7 text changes)

**`dashboard/src/welcomePage/WelcomePageTilesContainer/tileData.tsx`** (5 changes):
- Line 55: "evaluating **Saleor**" → "evaluating **Aura**"
- Line 116: "**Saleor App Store**" → "**App Store**"
- Line 122: "on top of **Saleor**...in **Saleor Dashboard**" → "on top of **Aura**...in **Aura Dashboard**"
- Line 150: "Learn **Saleor** checkout" → "Learn **Aura** checkout"
- Line 190: "open source at **Saleor**" → "our platform"

**`dashboard/src/welcomePage/WelcomePageOnboarding/hooks/useOnboardingData.tsx`** (2 changes):
- Line 128: "**Saleor** includes a GraphQL Playground" → "**Aura** includes..."
- Line 159: "enhance **Saleor** with custom solutions" → "enhance **Aura** with..."

### 4c. Sidebar Branding (2 files, 3 changes)

**`dashboard/src/components/Sidebar/MountingPoint.tsx`**:
- Line 31: `<Text>Saleor Dashboard</Text>` → `<Text>Aura Dashboard</Text>`
- Line 57: "Go to Saleor Cloud" → REMOVE (not applicable)

**`dashboard/src/components/Sidebar/menu/EnvironmentLink.tsx`**:
- Line 28: "Saleor Cloud" → REMOVE or change to "Aura Cloud"

### 4d. Error Messages & System Text (4 files, 5 changes)

**`dashboard/src/auth/components/LoginPage/messages.ts`**:
- Line 17: "**Saleor** is unavailable" → "**Aura** is unavailable"

**`dashboard/src/auth/utils.ts`**:
- Line 122: "Continue with **Saleor Cloud**" → REMOVE or change

**`dashboard/src/intl.ts`** (2 changes):
- Line 97: "**Saleor** runs in read-only mode" → "**Aura** runs in read-only mode"
- Line 117: "**Saleor** ran into an unexpected problem" → "**Aura** ran into an unexpected problem"

**`dashboard/src/ripples/ripples/introducedRipples.tsx`**:
- Line 16: "new changes in **Saleor**" → "new changes in **Aura**"

### 4e. Extensions/Marketplace (2 files, 8 changes)

**`dashboard/src/extensions/components/AppDeleteDialog/messages.ts`** (2 changes):
- Lines 12, 24: "**Saleor Marketplace**" → "**Marketplace**"

**`dashboard/src/extensions/messages.ts`** (6 changes):
- Lines 115, 203, 240, 382, 441, 453: All "Saleor" → "Aura" or generic

### 4f. Attributes

**`dashboard/src/attributes/components/AttributeOrganization/AttributeOrganization.tsx`**:
- Lines 66-67: "in **Saleor** system" → "in the system"

### 4g. Remove Help Links (2 files)

**`dashboard/src/links.ts`** (~36 URLs):
- Set all `docs.saleor.io` URLs to `""` or remove
- `SALEOR_GITHUB_URL` → `""`
- `SALEOR_DISCORD_URL` → `""`

**`dashboard/src/components/Sidebar/menu/hooks/useEnvLink.ts`**:
- Lines 5, 7: Remove `cloud.saleor.io` and `cloud.staging.saleor.io` references

### 4h. Brand Assets (13+ image files)

**Replace with Aura-branded images:**
- `dashboard/assets/favicons/` — all favicon PNGs + ICO (8 files)
- `dashboard/assets/images/sidebar-default-logo.png`
- `dashboard/assets/images/sidebar-deafult-logo-darkMode.png` (note: typo in original filename)
- `dashboard/assets/og.png` — OpenGraph social sharing image

**Action**: User needs to provide Aura brand assets (logo, favicon, OG image). If not available, create simple text-based placeholders.

### 4i. Package Metadata

**`dashboard/package.json`**:
- `"name": "saleor-dashboard"` → `"name": "aura-dashboard"`
- `"author": "Saleor Commerce"` → `"author": "Aura"` (or your company name)

### 4j. Optional: Component Renames (low priority)

- `SaleorThrobber` → `AuraThrobber` (`dashboard/src/components/Throbber/SaleorThrobber.tsx`)

---

## Phase 5: Apps (~20 files)

### 5a. All App Manifests (7 files)

For each `apps/apps/*/src/pages/api/manifest.ts`:
- `author: "Saleor Commerce"` → `"Aura"`
- `supportUrl:` → `""`
- `homepageUrl:` → `""`
- `dataPrivacyUrl:` → `""`
- **KEEP** `id: "saleor.app.*"` and `requiredSaleorVersion`

Apps: storefront-control, smtp, invoices, stripe, newsletter, sales-analytics, bulk-manager

### 5b. Storefront Control App UI Text (2 files)

**`apps/apps/storefront-control/src/pages/index.tsx`** (lines 60, 63):
- "Saleor App" → generic text
- "Saleor Dashboard" → "Dashboard"

**`apps/apps/storefront-control/src/pages/[channelSlug]/layout-config.tsx`** (lines 219-230) *(moved from pages-config.tsx in recent restructure)*:
- "Use Saleor Promotions" → "Use Platform Promotions"
- "Pull active promotions from Saleor" → "Pull active promotions from the platform"
- "Use Saleor Vouchers" → "Use Platform Vouchers"
- "Pull active vouchers from Saleor" → "Pull active vouchers from the platform"

**`apps/apps/storefront-control/src/components/pages/homepage/HomepageSectionsTab.tsx`** (4 refs) *(new file from admin restructure)*:
- Line 538: "Saleor collection slug to pull products from" → "Collection slug to pull products from"
- Line 637: "Automatically show active Saleor discounts" → "Automatically show active discounts"
- Line 690: "Saleor collection slug for flash deal products" → "Collection slug for flash deal products"
- Line 797: "Saleor collection slug for best-selling products" → "Collection slug for best-selling products"

### 5c. App Error Messages (3 files)

- `apps/apps/newsletter/src/pages/api/newsletter/unsubscribe/[token].ts` — "Saleor API URL" → "API URL"
- `apps/apps/bulk-manager/src/modules/trpc/trpc-vanilla-client.ts` — "Saleor API URL" → "API URL"
- `apps/apps/newsletter/src/pages/api/newsletter/images/upload.ts` — "Missing Saleor API URL" → "Missing API URL"

### 5d. App Environment Variable References

All `apps/apps/*/` files reading `process.env.SALEOR_*` — rename to `AURA_*`. SDK imports (`@saleor/app-sdk/headers`) stay.

### 5e. `saleor-app.ts` File Renames (7 files)

Rename the file itself: `saleor-app.ts` → `aura-app.ts` in each app, and update all imports. Files:
- `apps/apps/storefront-control/src/saleor-app.ts`
- `apps/apps/smtp/src/saleor-app.ts`
- `apps/apps/invoices/src/saleor-app.ts`
- `apps/apps/stripe/saleor-app.ts`
- `apps/apps/newsletter/src/saleor-app.ts`
- `apps/apps/sales-analytics/src/saleor-app.ts`
- `apps/apps/bulk-manager/src/saleor-app.ts`

### 5f. App Package Names

For each `package.json`: `"name": "saleor-app-*"` → `"name": "aura-app-*"`

### 5g. Newsletter App Title

`apps/apps/newsletter/src/pages/_app.tsx`: `appName="Saleor Newsletter App"` → `"Aura Newsletter App"`

### 5h. Inject Banner Items (1 file, low priority)

`apps/apps/storefront-control/src/modules/config/inject-banner-items.ts`:
- Rename function `injectBannerItemsFromSaleor` → `injectBannerItemsFromPlatform`
- Update console.warn message and comments

---

## Phase 6: Infrastructure Scripts

### `infra/scripts/*.ps1` — Global Find-Replace

All container name patterns: `saleor-*-dev` → `aura-*-dev` (14 patterns)
All service name patterns: `saleor-*` → `aura-*` (14 patterns)
Text: `Saleor Platform` → `Aura Platform`
DB commands: `-U saleor` → `-U saleor` (**KEEP** — DB user stays unchanged)

### `infra/scripts/install-dashboard-apps.ps1`

Update any hardcoded URLs with `saleor-api` → `aura-api`

### `infra/scripts/install-bulk-manager-app.ps1`

Same updates as above

### `infra/scripts/tunnel-*.ps1` (11 files)

Update container name references

### `infra/scripts/backup-db.sh` (~12 refs) *(NEW — added in recent commits)*

- Comment: "Database Backup Script for Saleor Platform" → "...for Aura Platform"
- Default container: `CONTAINER="${2:-saleor-postgres-dev}"` → `aura-postgres-dev`
- Backup filename: `BACKUP_FILE="saleor-backup-..."` → `"aura-backup-..."`
- Echo: `"Saleor Database Backup"` → `"Aura Database Backup"`
- Find cleanup: `saleor-backup-*.sql.gz` → `aura-backup-*.sql.gz`
- **KEEP** `POSTGRES_USER` and `POSTGRES_DB` defaults as "saleor" (DB values unchanged)

### `infra/scripts/restore-db.sh` (~12 refs) *(NEW)*

- Same pattern as backup script
- Temp file: `/tmp/saleor-restore-*` → `/tmp/aura-restore-*`
- Restart instructions: `saleor-api saleor-worker saleor-scheduler` → `aura-api aura-worker aura-scheduler`
- **KEEP** `POSTGRES_USER` and `POSTGRES_DB` defaults as "saleor"

---

## Phase 7: Backend API Welcome Page

**`saleor/templates/home/index.html`**:
- "Saleor e-commerce" → "Aura e-commerce"
- "Your Saleor instance is ready" → "Your Aura instance is ready"
- "Saleor core" → "Aura core"
- "Saleor Platform" → "Aura Platform"

### Dockerfile Labels (low priority)

**`saleor/Dockerfile`** (lines 58-65): OCI labels with "saleor" → "aura"
- **KEEP** `saleor.asgi:application` in CMD (Python module path)
- **KEEP** `groupadd -r saleor && useradd -r saleor` (Unix user, internal only)

**`dashboard/Dockerfile`** (lines 53-59): OCI labels → update
- **KEEP** `https://apps.saleor.io` URLs (external Saleor service)

---

## Phase 8: Catalog Generator & New Docs

### `scripts/catalog-generator/config.yml` (3 comment refs)

- "Mansour Shoes — Saleor Store Infrastructure Configuration" → "...Aura Store..."
- "Pull current state from Saleor" → "Pull current state from Aura"
- "Apply this config to Saleor" → "Apply this config to Aura"
- **KEEP** "Managed by @saleor/configurator" (external package)

### `scripts/catalog-generator/SETUP.md` (~15 refs)

- "A running Saleor instance" → "A running Aura instance"
- "Apply config.yml to Saleor" → "Apply config.yml to the platform"
- "Pull current Saleor state" → "Pull current platform state"
- Env var refs: `SALEOR_URL` → `AURA_URL`, `SALEOR_TOKEN` → `AURA_TOKEN`
- **KEEP** `@saleor/configurator` references (external package)

### `scripts/catalog-generator/.env.example`

- `SALEOR_URL=` → `AURA_URL=`
- `SALEOR_TOKEN=` → `AURA_TOKEN=`

### `scripts/catalog-generator/package.json`

- Remove `"saleor"` from keywords array
- **KEEP** `@saleor/configurator` dependency (external package)

### `infra/DEPLOY.md` (~20 refs)

- Architecture diagram: `saleor-api`, `saleor-worker`, `saleor-scheduler` → `aura-*`
- Static paths: `/var/www/saleor/` → `/var/www/aura/`
- Env var: `NEXT_PUBLIC_SALEOR_API_URL` → `NEXT_PUBLIC_AURA_API_URL`
- All `docker exec saleor-*-prod` commands → `aura-*-prod`
- Cron examples: `saleor-postgres-prod` → `aura-postgres-prod`
- Log path: `/var/log/saleor-backup.log` → `/var/log/aura-backup.log`

### `infra/KUBERNETES-PLAN.md` (~20 refs)

- All deployment names: `saleor-api-deployment.yaml` → `aura-api-deployment.yaml`
- Service names: `saleor-api-service.yaml` → `aura-api-service.yaml`
- Registry paths: `registry.digitalocean.com/aura/saleor-api:v1` → `...aura/aura-api:v1`
- Secrets: `saleor-api-secrets` → `aura-api-secrets`
- HPA files: `saleor-api-hpa.yaml` → `aura-api-hpa.yaml`
- Volume ref: `saleor-media` → `aura-media`
- Comment: "Saleor API env vars" → keep as technical note about upstream

### `docs/plans/2026-02-10-mansour-seed.md` (24 refs)

- Container names and "Saleor" platform references → update

### `MVP-ROADMAP.md` (~20 refs)

- "Saleor 3.23" → "Aura (based on Saleor 3.23)" for first reference, then "Aura" elsewhere
- Container names: `saleor-*-dev` → `aura-*-dev`
- "Saleor API" → "Aura API"
- "@saleor/auth-sdk" → keep (external package)

---

## Phase 9: Core Documentation (Highest Ref Counts)

### 9a. `PRD.md` (123 refs!)
- Largest single file — needs systematic find-replace
- Container names, env vars, architecture descriptions
- **KEEP** references to "Saleor" as upstream technology where appropriate (e.g., "built on Saleor 3.23")

### 9b. `CLAUDE.md` (root) (~84 refs)
- All container name references → update
- Project title: "built on Saleor" → "powered by Aura"
- All `docker exec` examples
- Container map table
- Env var names

### 9c. `AGENTS.md` (~52 refs)
- Same scope as CLAUDE.md

### 9d. `MEMORY.md`
- Container name references
- Architecture notes

### 9e. README files
- Root `README.md`
- `storefront/README.md`
- `storefront/INTEGRATION_NOTES.md`
- `storefront/.cursorrules`

### 9f. Root `package.json`
- `"name": "saleor-platform"` → `"name": "aura-platform"`
- `"description": "Saleor Platform..."` → `"Aura Platform..."`

---

## What Stays as "Saleor"

| Category | Why |
|----------|-----|
| `@saleor/auth-sdk`, `@saleor/app-sdk`, `@saleor/macaw-ui` imports | External npm packages |
| `@saleor/apps-*` workspace packages | User chose to skip |
| Python `from saleor.*` imports + `saleor.asgi:application` | Module rename too risky |
| `window.__SALEOR_CONFIG__` | Dashboard SDK expects it |
| Cookie names `saleor_auth_*` | SDK-mandated |
| App IDs `saleor.app.*` | User chose to keep |
| `requiredSaleorVersion`, `allowedSaleorUrls` | SDK field names |
| Database table names | Django migrations |
| Generated GraphQL types | Auto-generated |
| `SaleorAuthProvider`, `createSaleorAuthClient` | External SDK components |
| POSTGRES_USER / POSTGRES_DB values | DB lockout risk |
| `https://apps.saleor.io` URLs in Dockerfile | External service |
| `https://github.com/saleor/saleor` schema fetch URLs | Upstream dependency |
| Unix user `saleor` in backend Dockerfile | Internal, not visible |
| `@saleor/configurator` in catalog-generator | External npm package |
| `@saleor+configurator+1.1.0.patch` patch filename | Must match package name |

---

## Execution Order

1. **Phase 0**: Pre-migration backup + safety (CRITICAL)
2. **Phase 1**: Brand constants (`brand.ts`) — no dependencies
3. **Phase 2**: Docker infrastructure (dev + prod compose, nginx, .env files, CI) — foundational
4. **Phase 3-5**: Storefront + Dashboard + Apps — can run in parallel
5. **Phase 6**: Scripts (ps1, bash backup/restore) — depends on Phase 2 names
6. **Phase 7**: Backend welcome page + Dockerfile labels
7. **Phase 8**: Catalog generator + new infra docs (DEPLOY.md, KUBERNETES-PLAN.md, MVP-ROADMAP.md)
8. **Phase 9**: Core documentation (PRD 123 refs, CLAUDE.md 84 refs, AGENTS.md 52 refs, READMEs)
9. **Post-migration**: Reinstall apps, regenerate types, verify builds

---

## User Action Required

Before implementation, you need to provide:
1. **Dashboard brand assets** — Aura logo (PNG, light + dark variants), favicon (16x16, 32x32, 192x192, 512x512), OG image (1200x630)
2. **Decision**: Should `POSTGRES_USER`/`POSTGRES_DB` values change? (Recommended: NO)
3. **Decision**: Company name for `author` fields in package.json/manifests? ("Aura" or your company name)

---

## Verification Checklist

### Automated Checks
```bash
# 1. All containers start and are healthy
docker compose -f infra/docker-compose.dev.yml ps

# 2. Storefront builds
docker exec -it aura-storefront-dev pnpm build

# 3. No "Saleor" in storefront source (except SDK imports)
grep -ri "saleor" storefront/src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v "@saleor/" | grep -v "saleor_auth"

# 4. No "Saleor" in dashboard visible text (except SDK/generated)
grep -ri "saleor" dashboard/src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v "@saleor/" | grep -v ".generated." | grep -v "__SALEOR_CONFIG__"
```

### Manual Smoke Tests
- Visit `http://localhost:3000` — title shows config value or "Aura", not "Saleor"
- Visit `http://localhost:9000` — login page says "Aura Dashboard"
- Visit `http://localhost:8000` — API welcome says "Aura"
- Open Storefront Control app — no "Saleor" in UI text
- Dashboard sidebar shows "Aura Dashboard"
- Dashboard welcome page has no "Saleor" references
- Trigger a login error — message says "Aura" not "Saleor"
- Create a test order — webhook fires successfully (confirms app reinstall worked)
- Check localStorage in browser devtools — keys use `aura_*` prefix
- Run `./infra/scripts/backup-db.sh local aura-postgres-dev` — creates `aura-backup-*.sql.gz`
- Check catalog generator: `cd scripts/catalog-generator && cat .env` — uses `AURA_URL`

### Full Grep Audit (Final)
```bash
# Comprehensive check — should only return SDK imports, package deps, Python module, cookies
grep -ri "saleor" --include="*.ts" --include="*.tsx" --include="*.yml" --include="*.sh" --include="*.ps1" --include="*.md" --include="*.html" --include="*.json" --include="*.conf" . | grep -v node_modules | grep -v ".git/" | grep -v ".generated." | grep -v "package-lock" | grep -v "pnpm-lock" | grep -v "__SALEOR_CONFIG__" | grep -v "saleor_auth" | grep -v "@saleor/" | grep -v "from saleor" | grep -v "import saleor" | grep -v "saleor.asgi" | grep -v "saleor.wsgi" | grep -v "saleor.settings" | grep -v "saleor.app." | grep -v "configurator" | grep -v "celerybeat"
```
This final grep should return zero results when the rebrand is complete.