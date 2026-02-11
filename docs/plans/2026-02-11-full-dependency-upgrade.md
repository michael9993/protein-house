# Aura Platform — Full Dependency Upgrade Plan

**Date:** February 11, 2026
**Status:** Ready for implementation
**Goal:** Update the entire platform to latest stable versions, ensuring 5-10 year longevity, scalability, and zero EOL dependencies.

---

## Longevity Assessment: What MUST Be Updated vs What Can Be Skipped

Every upgrade below is evaluated against one question: **"Will this cause problems if left unchanged for 5-10 years?"**

### ESSENTIAL — Will break or become unsupported

| Package | Location | Current | Target | Why Essential | EOL/Deadline |
|---------|----------|---------|--------|---------------|-------------|
| ESLint (storefront) | `storefront/` | 8.56.0 | 9.x | **Already EOL** — no security patches for 16 months | Overdue |
| @typescript-eslint/* | `storefront/` | 6.14.0 | 8.x | Required for ESLint 9; v6 is EOL | Overdue (tied to ESLint 9) |
| TypeScript (storefront) | `storefront/` | 5.3.3 | 5.9.2 | Only latest minor gets patches; ecosystem moving to TS 7 | Immediate |
| Next.js | `storefront/`, apps | 15.1.4 | 16.1.6 | EOL October 2026; Turbopack default in 16 | 8 months |
| cryptography (Python) | `saleor/pyproject.toml` | 44.x | 46.0.4 | 2 major versions of CVE fixes missed | Immediate |
| Stripe Python SDK | `saleor/pyproject.toml` | 3.x | 14.x | **11 major versions behind**; Stripe deprecates old API versions | Critical |
| @stripe/react-stripe-js | `storefront/` | 3.7.0 | 5.6.0 | 2 major versions; React 19 support | High |
| redis-py | `saleor/pyproject.toml` | 5.x | 7.1.0 | 2 major versions; connection API rewritten | High |
| Adyen (remove) | `storefront/` + `saleor/` | 5.53.3 / 4.x | Remove | Not used (Stripe only); backend lib in browser = vulnerability | Immediate |
| react-test-renderer | `storefront/` | 18.2.0 | Remove | **Deprecated** in React 19; version mismatch (React 19 vs renderer 18) | Immediate |
| Node.js | all | 22.x | 24 LTS | 22 maintenance ends April 2027 | ~14 months |
| Python support | `saleor/pyproject.toml` | 3.12 only | 3.12-3.13 | 3.12 EOL October 2028; need 3.13 for longevity | Plan ahead |
| Tailwind CSS | `storefront/`, apps | 3.4.x | 4.1 | v3 support ends ~Feb 2027; v4 is the future | ~12 months |
| PostgreSQL (Docker) | `infra/docker-compose.dev.yml` | 15-alpine | 16-alpine | PG 15 EOL Nov 2028; PG 16 LTS supported until Nov 2029 | ~2.5 years |

> **Note:** `@stripe/stripe-js` is already at 7.3.0 (modern) — no update needed. The Stripe Node.js SDK in `apps/apps/stripe/` is already at 18.1.0 — only the **Python backend** Stripe SDK (3.x) is critically outdated.

### RECOMMENDED — Improves scalability/performance but won't break

| Package | Location | Current | Target | Why Recommended |
|---------|----------|---------|--------|----------------|
| Zod | all | 3.x | 4.x | 14x faster parsing, 57% smaller bundle — matters at scale |
| Zustand | `storefront/` | 4.4.6 | 5.0.11 | Unmaintained; smaller bundle, better TS types |
| urql | `storefront/`, apps | 4.0.6 | 5.0.1 | Unmaintained; better SSR caching, smaller bundle |
| @headlessui/react | `storefront/` | 1.7.18 | 2.x | v1 no longer maintained; v2 has better accessibility + headless patterns |
| sharp | `storefront/` | 0.33.2 | 0.34.x | Image processing improvements + security |
| boto3/botocore | `saleor/pyproject.toml` | 1.28/1.37 | 1.42 | Missing 2 years of AWS features; may need for cloud scaling |
| uvicorn | `saleor/pyproject.toml` | 0.32 | 0.40 | 8 minor versions of ASGI server improvements |
| Pillow | `saleor/pyproject.toml` | 11.x | 12.x | Image processing security fixes |
| lxml | `saleor/pyproject.toml` | 4.x | 6.0 | 2 major versions of security fixes |
| sentry-sdk | `saleor/pyproject.toml` | 2.12 | 2.49 | 37 minor versions of monitoring improvements |
| Django | `saleor/pyproject.toml` | 5.2.8 | 5.2.11 | Security patch (Feb 2026 CVE fixes) |
| React (storefront) | `storefront/` | 19.1.0 | 19.2.4 | DoS mitigation security patches |
| pnpm.overrides | `storefront/`, `apps/` | Missing | Add | Dashboard has them, storefront/apps don't — security gap |

### SKIP — No longevity impact, pure noise

| Package | Current | Latest | Why Skip |
|---------|---------|--------|----------|
| Formik | 2.4.5 | 2.4.9 | **Abandoned library** — patching a dead project adds nothing. Either migrate to React Hook Form or leave as-is |
| Yup | 1.3.2 | 1.7.1 | Works fine, no security issues, no breaking changes coming |
| PostCSS | 8.4.32 | 8.5.6 | Patch-level, zero runtime impact |
| Prettier | 3.1.1 | 3.8.1 | Formatting tool — zero runtime impact, cosmetic only |
| Lucide React | 0.358.0 | 0.563.0 | Just adds new icons. Update when you need a specific icon |
| Swiper | 12.0.0 | 12.1.0 | Tiny patch, nothing meaningful |
| React Hook Form | 7.43.9 | 7.71.1 | Works fine, no breaking changes coming |
| oauthlib | 3.1 | 3.3 | Minor version, no security issues |
| braintree cap | <4.32 | <5 | Only matters if you're using Braintree (you're not — Stripe only) |
| razorpay | 1.2 | 1.4 | Only matters if you're using Razorpay (you're not — Stripe only) |
| ruff | 0.12 | 0.15 | Dev-only linter, no production impact |
| pytest | 8.x | 9.x | Dev-only test runner, no production impact |
| Turborepo | 2.4 | 2.8 | Build tool, backward compatible, update whenever convenient |

### TECH DEBT — Cannot update independently

| Package | Location | Issue | Why Blocked |
|---------|----------|-------|-------------|
| graphene | `saleor/` | 2.x → 3.x | Saleor upstream still on Graphene 2. Entire GraphQL layer rewrite |
| graphql-core | `saleor/` | 2.x → 3.x | Tied to graphene. Must follow Saleor upstream |
| @apollo/client | `dashboard/` | 3.4.17 → 3.12+ | 3 years behind; cache bugs, SSR improvements. But dashboard is Saleor upstream code — risky to diverge |
| @material-ui/core | `dashboard/` | 4.x → MUI 6.x | **EOL** — MUI v4 has no patches. But tied to `@saleor/macaw-ui` — cannot upgrade without macaw-ui migration |
| react-router | `dashboard/` | 5.x → 7.x | **EOL** — v5 no longer maintained. But dashboard has hundreds of routes using v5 API. Massive rewrite. |
| jest | `dashboard/` | 27.x → 30.x | Very old but dev-only. Dashboard-specific, low priority |

> **Dashboard note:** The dashboard (`dashboard/`) is largely Saleor upstream code (React 18, MUI v4, react-router v5, Apollo 3.4). Upgrading it means diverging from upstream, making future Saleor updates harder. **Recommendation:** Track Saleor upstream upgrades for dashboard, don't diverge independently. Focus upgrade effort on storefront + apps + backend.

### FUTURE WATCH — Not ready yet, plan for 2026-2027

| Package | Status | When |
|---------|--------|------|
| TypeScript 7 (Go compiler) | Preview | Mid-2026 — 10x faster builds |
| Django 6.0 | Stable | After 5.2 LTS migration; native CSP, Tasks framework |
| ESLint 10 | RC | Wait for stable |
| Python 3.14 | Stable | Wait for library ecosystem maturity |
| Vite 8 (Rolldown) | Beta | Wait for stable |

---

## Security Audit Summary

### Existing Vulnerabilities Found

| Severity | Issue | Location |
|----------|-------|----------|
| CRITICAL | `@adyen/api-library@15.0.0-beta` — backend-only library exposed in browser | `storefront/package.json` |
| CRITICAL | Stripe Python SDK 3.x — 11 major versions behind, old API version | `saleor/pyproject.toml` |
| HIGH | ESLint 8 — EOL since Oct 2024, zero security patches | `storefront/` |
| HIGH | cryptography 44.x — 2 major versions of CVE fixes missed | `saleor/pyproject.toml` |
| HIGH | No `pnpm.overrides` in storefront/apps (dashboard has them) | `storefront/package.json` |
| MEDIUM | `enable-pre-post-scripts=true` — supply chain risk | `storefront/.npmrc` |
| MEDIUM | redis-py 5.x — 2 major versions behind | `saleor/pyproject.toml` |

### All Target Packages: Safety Verified

- 14 of 17 frontend target packages: **no known CVEs** at target versions
- Next.js 16.1.6 + React 19.2.4: post-patch versions with security fixes
- eslint-config-prettier: verify lockfile pins exact version (CVE-2025-54313)
- All Python target versions: no known CVEs

---

## Step-by-Step Implementation Plan

### Execution Strategy

**Batch A** (1 session — safe, ~90% success rate): Phases 0-3
**Batch B** (separate sessions — each phase independently): Phases 4-9

Execute in this sequence to minimize risk and maximize stability.

---

### Phase 0: Security Hardening — Frontend + Backend (1 session, low risk)

Critical security fixes before any upgrades.

**Frontend:**
1. Remove `@adyen/adyen-web` and `@adyen/api-library` from `storefront/package.json`
2. Remove all Adyen checkout components from `storefront/src/checkout/`
3. Remove `react-test-renderer` 18.2.0 from `storefront/package.json` (deprecated in React 19, version mismatch)
4. Add `pnpm.overrides` to `storefront/package.json` matching dashboard's security patches:
   ```json
   "pnpm": {
     "overrides": {
       "dompurify@<3.2.4": ">=3.2.4",
       "js-yaml@>=4.0.0 <4.1.1": ">=4.1.1",
       "js-yaml@<3.14.2": ">=3.14.2",
       "vite@>=6.0.0 <6.4.1": ">=6.4.1",
       "ws@>=8.0.0 <8.17.1": ">=8.17.1"
     }
   }
   ```
5. Add same `pnpm.overrides` to `apps/package.json` for known transitive vulnerabilities

**Backend (`saleor/pyproject.toml`):**
6. `cryptography`: `>=44.0.2,<45` → `>=46.0.4,<47` (security critical — 2 major versions of CVE fixes)
7. `django[bcrypt]`: verify `~=5.2.8` resolves to 5.2.11 (Feb 2026 security patch)
8. Remove `Adyen>=4.0.0,<5` from dependencies (Stripe only)
9. Verify API container starts and auth flows work

**Files modified:**
- `storefront/package.json`
- `apps/package.json`
- `storefront/src/checkout/` (Adyen components)
- `saleor/pyproject.toml`

---

### Phase 1: Safe Patches — Frontend + Backend (1 session, low risk)

**Frontend (essential patches only):**
1. `storefront/package.json`: React 19.2.4 (DoS security patches)
2. Run `pnpm install` in storefront container, verify build passes

**Backend (`saleor/pyproject.toml` — safe constraint updates):**
3. `boto3`: `~=1.28` → `~=1.42` (14 minor versions of AWS updates — needed for scaling)
4. `botocore`: `~=1.37` → `~=1.42` (must match boto3)
5. `sentry-sdk`: `~=2.12` → `~=2.49` (37 minor versions of monitoring improvements)
6. `celery`: tighten lower bound `>=5.4,<6.0.0` (drop ancient 4.x)
7. `kombu`: tighten lower bound `>=5.4,<6.0.0` (match celery)
8. Run `docker compose restart saleor-api-dev saleor-worker-dev`, verify API starts

**Skipping** (no longevity impact): Formik, Yup, PostCSS, Prettier, Lucide, Swiper, RHF, pnpm, Turborepo, oauthlib, braintree, razorpay, ruff, pytest

**Files modified:**
- `storefront/package.json`
- `saleor/pyproject.toml`

---

### Phase 2: TypeScript Alignment (1 session, low risk)

1. Upgrade `storefront/package.json` TypeScript from 5.3.3 → 5.9.2
2. Update `@types/node`, `@types/react`, `@types/react-dom` to latest
3. Run `pnpm type-check` in storefront container — fix any new type errors
4. Verify all builds still pass

**Files modified:**
- `storefront/package.json`
- `storefront/tsconfig.json`

---

### Phase 3: Build Tooling (1 session, medium risk)

1. ESLint 8 → 9 migration (storefront only — apps/dashboard already on 9)
   - Convert `.eslintrc` to `eslint.config.js` (flat config)
   - `@typescript-eslint/eslint-plugin` 6.14.0 → 8.x (required for ESLint 9)
   - `@typescript-eslint/parser` 6.14.0 → 8.x (required for ESLint 9)
   - `eslint-config-next` 15.1.4 → match Next.js version
   - `eslint-config-prettier` 9.1.0 → 10.x (verify lockfile pins — CVE-2025-54313)
   - `eslint-plugin-import` 2.29.1 → latest v9-compatible
2. Turborepo 2.4.4 → 2.8.3 (apps monorepo)
3. Verify linting passes across all sub-projects

**Files modified:**
- `storefront/.eslintrc*` → `storefront/eslint.config.js`
- `storefront/package.json` (ESLint + all plugins)
- `apps/package.json` (Turborepo)

---

### Phase 4: Zod 3 → 4 (1-2 sessions, high risk)

1. Upgrade `@saleor/apps-storefront-config` shared package first
2. Test all Zod schema parsing and type inference
3. Cascade to apps monorepo (admin schema, bulk-manager, etc.)
4. Cascade to storefront (config validation)
5. Run full type-check across all projects

**Files modified:**
- `apps/packages/storefront-config/src/schema/*.ts`
- `apps/apps/storefront-control/src/modules/config/schema.ts`
- `storefront/src/config/store.config.ts`

---

### Phase 5: Next.js 15 → 16 (1-2 sessions, medium risk)

1. Read Next.js 16 migration guide and run codemods
2. Upgrade storefront first — test SSR, ISR, API routes, image optimization
3. Upgrade each app one-by-one (storefront-control → bulk-manager → smtp → etc.)
4. Verify all containers start and pages load

**Files modified:**
- `next.config.js` / `next.config.ts` (all Next.js projects)

---

### Phase 6: Tailwind CSS 3 → 4 (2-3 sessions, high risk)

1. Run `npx @tailwindcss/upgrade` on storefront-control first (smaller scope)
2. Test all admin pages and component rendering
3. Run migration on storefront (larger scope)
4. Test all pages, responsive design, RTL layout
5. Run migration on sales-analytics
6. Check browser compatibility requirements

**Files modified:**
- `tailwind.config.ts`, `postcss.config.js`, `globals.css`
- Potentially all styled components

---

### Phase 7: State, Data & UI Libraries (1-2 sessions, medium-high risk)

1. Zustand 4 → 5 (storefront checkout/cart/wishlist)
2. urql 4 → 5 (storefront + apps GraphQL)
3. `@headlessui/react` 1.7.18 → 2.x (storefront — new API, better accessibility)
4. `sharp` 0.33.2 → 0.34.x (storefront — image processing)
5. Test all GraphQL operations, checkout flow, cart functionality

**Files modified:**
- `storefront/package.json`
- `storefront/src/checkout/state/`
- `storefront/src/lib/graphql.ts`
- Components using `@headlessui/react` (API changes in v2)

---

### Phase 8: Stripe SDK Upgrade — Frontend + Backend (2-3 sessions, VERY HIGH risk)

> **Important clarifications:**
> - `@stripe/stripe-js` is already at 7.3.0 (modern) — NO update needed
> - The Stripe Node.js SDK in `apps/apps/stripe/` is already at 18.1.0 — NO update needed
> - Only `@stripe/react-stripe-js` (frontend) and `stripe` Python SDK (backend) need upgrading

**Frontend (storefront only):**
1. `@stripe/react-stripe-js` 3.7.0 → 5.6.0
   - Read both migration guides (v3→v4, v4→v5)
   - Update checkout Stripe components in `storefront/src/checkout/`
   - Test with Stripe test mode

**Backend (Saleor API only):**
2. Stripe Python `>=3.0.0,<4` → `>=14.0.0,<15` (11 major version jump!)
   - Stage through v8 first (StripeClient pattern migration)
   - Then v14 (API version 2025-09-30)
   - Update all payment gateway code in `saleor/saleor/payment/gateways/stripe/`
   - Update webhook handlers for new event formats

**Verification:**
3. Full end-to-end checkout testing with Stripe sandbox
4. Test: card payment, refunds, webhook delivery, payment status updates
5. Verify all payment flows (card, Apple Pay, Google Pay if applicable)

**Files modified:**
- `storefront/package.json` (`@stripe/react-stripe-js` only)
- `storefront/src/checkout/` (Stripe components)
- `saleor/pyproject.toml` (stripe constraint)
- `saleor/saleor/payment/gateways/stripe/` (backend code)

---

### Phase 9: Backend Infrastructure Upgrades (1-2 sessions, medium-high risk)

1. `redis-py`: `>=5.0.1,<6` → `>=7.1.0,<8` (test cache, Celery broker, sessions)
2. `uvicorn`: `>=0.32.0,<0.33` → `>=0.40.0,<0.41` (test ASGI server)
3. `Pillow`: `>=11.1.0,<12` → `>=12.1.0,<13` (test image upload/thumbnails)
4. `lxml`: `>=4.9.3,<5` → `>=6.0.0,<7` (test XML/HTML parsing)
5. Python constraint: `>=3.12,<3.13` → `>=3.12,<3.14` (future-proof for Python 3.13)
6. Restart API + worker containers, run test suite

**Files modified:**
- `saleor/pyproject.toml`

---

### Phase 10: Docker Infrastructure (1 session, low-medium risk)

1. PostgreSQL: `postgres:15-alpine` → `postgres:16-alpine` (LTS, supported until Nov 2029)
   - Run `pg_dump` backup before upgrading
   - Update `infra/docker-compose.dev.yml` image tag
   - Run `docker compose down && docker compose up -d`, verify migrations work
2. Verify Redis 7 is still supported (current `redis:7-alpine` — supported until ~2027, OK for now)
3. Node.js engine constraints:
   - `apps/package.json`: `>=22.0.0 <23.0.0` → `>=22.0.0 <25.0.0` (allow Node 24 LTS)
   - Update Dockerfiles to use Node 24 LTS base images when available
4. Python Dockerfile: verify base image uses Python 3.12+ (update to 3.13 when ready)

**Files modified:**
- `infra/docker-compose.dev.yml` (PostgreSQL image)
- `apps/package.json` (engines constraint)
- Dockerfiles (Node.js + Python base images)

---

## Risk Assessment

### VERY HIGH RISK
- **Stripe Python 3→14**: 11 major versions on payment backend — StripeClient rewrite, webhook format changes, API version jump
- **Tailwind v4**: Every styled component could be affected; CSS utility changes, config format change, browser requirements

### HIGH RISK (Requires careful testing)
- **Zod v4**: Foundational to config system — schema parsing, type inference, all 20 domain schemas
- **Stripe React 3→5**: Payment checkout flow — 2 major version jump
- **redis-py 5→7**: 2 major versions on cache/broker — connection API changes

### MEDIUM RISK (Likely manageable)
- **Next.js 16**: Usually provides codemods; main risk is Turbopack compatibility
- **ESLint 9**: Config migration required but tools available
- **urql v5**: GraphQL operations need testing
- **Zustand v5**: Migration guide is straightforward
- **cryptography 44→46**: Test auth flows, JWT verification
- **uvicorn 0.32→0.40**: Test ASGI server startup
- **Pillow 11→12**: Test image processing
- **lxml 4→6**: Test XML/HTML parsing

### LOW RISK (Safe to do immediately)
- TypeScript 5.3→5.9 (minor versions)
- Turborepo 2.4→2.8, React 19.1→19.2
- boto3/botocore version bumps, sentry-sdk
- Django 5.2.8→5.2.11 (security patch)

---

## Verification Plan

### After each frontend phase:
1. `docker exec -it saleor-storefront-dev pnpm build` — verify storefront builds
2. `docker exec -it saleor-storefront-dev pnpm type-check` — verify types
3. `docker exec -it saleor-storefront-dev pnpm lint` — verify linting
4. For each app: `docker exec -it <container> pnpm build` — verify app builds

### After each backend phase:
5. `docker compose -f infra/docker-compose.dev.yml restart saleor-api-dev saleor-worker-dev`
6. `docker exec -it saleor-api-dev python manage.py migrate --check` — verify no pending migrations
7. `docker exec -it saleor-api-dev pytest --reuse-db -x -q` — run test suite (stop on first failure)
8. Verify API responds: `curl http://localhost:8000/graphql/` — health check

### After all phases:
9. Manual smoke test: load storefront, navigate pages, test checkout
10. For payment changes: full Stripe sandbox checkout test

---

## Implementation Timeline Estimate

| Phase | Risk | Sessions | Dependencies |
|-------|------|----------|-------------|
| Phase 0: Security Hardening | Low | 1 | None |
| Phase 1: Safe Patches | Low | 1 | Phase 0 |
| Phase 2: TypeScript | Low | 1 | Phase 1 |
| Phase 3: ESLint 9 + @typescript-eslint 8 | Medium | 1 | Phase 2 |
| Phase 4: Zod 4 | High | 1-2 | Phase 3 |
| Phase 5: Next.js 16 | Medium | 1-2 | Phase 4 |
| Phase 6: Tailwind 4 | High | 2-3 | Phase 5 |
| Phase 7: State, Data & UI Libs | Medium-High | 1-2 | Phase 5 |
| Phase 8: Stripe Full-Stack | Very High | 2-3 | Phase 7 |
| Phase 9: Backend Infra | Medium-High | 1-2 | Phase 1 |
| Phase 10: Docker Infrastructure | Low-Medium | 1 | Phase 9 |

**Batch A (Phases 0-3):** ~4 sessions, low-medium risk, ~90% success rate
**Batch B (Phases 4-10):** ~11-16 sessions, medium-very high risk, each phase independent

---

## Current Package Versions (Reference Snapshot)

### Storefront (`storefront/package.json`)
| Package | Current Version |
|---------|----------------|
| next | 15.1.4 |
| react / react-dom | 19.1.0 |
| typescript | 5.3.3 |
| eslint | 8.56.0 |
| @typescript-eslint/* | 6.14.0 |
| @stripe/react-stripe-js | 3.7.0 |
| @stripe/stripe-js | 7.3.0 (already modern) |
| zustand | 4.4.6 |
| urql | 4.0.6 |
| zod | ^3.23.8 |
| tailwindcss | 3.4.0 |
| @headlessui/react | 1.7.18 |
| sharp | 0.33.2 |
| formik | 2.4.5 |
| yup | 1.3.2 |
| @adyen/adyen-web | 5.53.3 (REMOVE) |
| @adyen/api-library | 15.0.0-beta (REMOVE) |
| react-test-renderer | 18.2.0 (REMOVE — deprecated) |

### Apps Monorepo (`apps/package.json`)
| Package | Current Version |
|---------|----------------|
| turbo | 2.4.4 |
| pnpm (packageManager) | 10.23.0 |
| Node.js engine | >=22.0.0 <23.0.0 |

### Apps — Stripe (`apps/apps/stripe/`)
| Package | Current Version |
|---------|----------------|
| stripe (Node.js SDK) | 18.1.0 (already modern) |

### Dashboard (`dashboard/package.json`) — Saleor upstream, DO NOT diverge
| Package | Current Version | Note |
|---------|----------------|------|
| react / react-dom | 18.3.1 | Upstream-controlled |
| @apollo/client | 3.4.17 | Very old, but upstream |
| @material-ui/core | 4.12.4 | EOL, but tied to macaw-ui |
| react-router | 5.3.4 | EOL, but massive rewrite |
| typescript | 5.8.3 | Already recent |
| eslint | ^9.39.1 | Already on ESLint 9 |
| vite | ^6.4.1 | Already recent |
| jest | ^27.5.1 | Old, dev-only |

### Saleor Backend (`saleor/pyproject.toml`)
| Package | Current Constraint |
|---------|-------------------|
| stripe | >=3.0.0,<4 (CRITICAL — 11 major behind) |
| cryptography | >=44.0.2,<45 (HIGH — 2 major CVE gap) |
| redis | >=5.0.1,<6 (2 major behind) |
| uvicorn | >=0.32.0,<0.33 |
| Pillow | >=11.1.0,<12 |
| lxml | >=4.9.3,<5 |
| boto3 | ~=1.28 |
| botocore | ~=1.37 |
| sentry-sdk | ~=2.12 |
| django | ~=5.2.8 |
| celery | >=4.4.5,<6.0.0 |
| kombu | >=4.6.11,<6.0.0 |
| Python | >=3.12,<3.13 |
| Adyen | >=4.0.0,<5 (REMOVE) |

### Docker Infrastructure (`infra/docker-compose.dev.yml`)
| Service | Current Image |
|---------|--------------|
| PostgreSQL | postgres:15-alpine |
| Redis | redis:7-alpine |
