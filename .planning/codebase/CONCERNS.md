# Codebase Concerns

**Analysis Date:** 2026-02-15

---

## Test Coverage Gaps

### Storefront (Critical)

**What's not tested:** The entire `storefront/` application (543 TypeScript/TSX files) has **zero test files**. No unit tests, integration tests, or E2E tests exist.

**Files:**
- `storefront/src/` (all files)
- `storefront/src/checkout/` (217 files - entire checkout Pages Router)
- `storefront/src/app/` (all route handlers and components)
- `storefront/src/providers/StoreConfigProvider.tsx` (1,942 lines - core config distribution)

**Risk:**
- Breaking changes to payment flows (Stripe/Adyen) go undetected until user test
- Checkout state management bugs (`updateStateStore`, `checkoutValidationStateStore`) surface in production
- Configuration changes break UI without warning
- RTL/LTR logic in StoreConfigProvider untested
- GraphQL query failures in server components caught too late

**Priority:** **HIGH** — Checkout and payment flows are critical customer paths.

**Test approach needed:**
- Unit tests for `StoreConfigProvider.tsx` hooks (64 exported hooks)
- Unit tests for checkout state management (Zustand stores)
- Integration tests for GraphQL data fetching patterns
- Component tests for key payment forms and checkout pages
- E2E tests for complete checkout flow (add to cart → payment → order confirmation)

---

## Dashboard UI Refresh Issue

**Problem:** When an invoice is generated via the Invoice app webhook, the Saleor Dashboard does NOT automatically refresh to show the new invoice. Users must manually navigate away and back to see it.

**Files:**
- `apps/apps/invoices/` (entire app)
- Dashboard integration points (upstream, not in this repo)

**Current Mitigation:**
- Documented in `/infra/INVOICE_DASHBOARD_REFRESH_ISSUE.md` (clear workaround: navigate away/back or press F5)
- Invoice IS created successfully in database and email IS sent
- This is a **Dashboard limitation**, not an Invoice app bug

**Impact:** **LOW** — Workaround is simple and reliable; data integrity not affected.

**Long-term fix:** Would require changes to Saleor Dashboard (GraphQL subscriptions, polling, or optimistic UI updates) — outside scope of this repo.

---

## Config Sync Complexity

**Problem:** Configuration changes must be synchronized across 11 separate files. Missing a sync location causes silent failures or missing fields in UI/storefront.

**Critical sync locations (must all be updated together):**

1. `apps/packages/storefront-config/src/schema/` (17 Zod schema files) — Source of truth for shape
2. `apps/packages/storefront-config/src/types.ts` — Exported TypeScript types
3. `apps/packages/storefront-config/src/migrations.ts` — Version migrations
4. `apps/apps/storefront-control/src/modules/config/defaults.ts` (1,764 lines) — Default values for every field
5. `apps/apps/storefront-control/src/modules/config/schema.ts` (227 lines) — Admin form validation
6. `storefront/src/config/store.config.ts` (1,613 lines) — Storefront-side defaults/types
7. `storefront/src/providers/StoreConfigProvider.tsx` (1,942 lines) — Config distribution hooks
8. `apps/apps/storefront-control/sample-config-import.json` (1,864 lines) — Hebrew/ILS dev fallback
9. `apps/apps/storefront-control/sample-config-import-en.json` (1,787 lines) — English/USD dev fallback
10. `apps/apps/storefront-control/src/lib/settings-index.ts` — Cmd+K search index
11. `apps/apps/storefront-control/src/pages/[channelSlug]/` (8 content tab files) — Admin UI

**Risk:**
- Forgetting to update sample JSON files → development breaks for new team members
- Missing admin form validation → invalid data accepted
- Incomplete hook exports → features inaccessible from components
- Settings search index gaps → admin can't find fields via Cmd+K

**Priority:** **MEDIUM** — Documented in CLAUDE.md; team follows 11-point checklist, but human error is possible.

**Mitigation in place:**
- CLAUDE.md section 2.7 documents all 11 locations with sync rules
- "Sync Enforcement Rules" explains consequences
- Sample config audit checklist (look for empty strings `": ""`)

**Better mitigation needed:**
- Consider build-time validation: script to compare sample JSON keys with schema fields
- TypeScript validation: stricter type inference for config sections to catch missing hooks
- Pre-commit hook to verify sample JSON structure matches schema

---

## Console Logging in Production Code

**Problem:** Extensive debug `console.log()` statements throughout storefront, created during development/debugging for reviews system.

**Files:** `storefront/src/app/actions.ts` — ~35+ `console.log()` calls with emoji prefixes (`[Get Review By ID] ✅`, `[All Product Reviews] 🔍`, etc.)

**Risk:**
- Production logs polluted with verbose debug output
- Potential information leakage (product IDs, review counts, filtering logic exposed in browser console)
- **LOW** impact if logs cleared in build, but inconsistent with other code

**Priority:** **LOW** — Not breaking, but poor practice.

**Fix needed:** Remove or conditionally gate debug logs behind `process.env.NODE_ENV === 'development'` or a feature flag.

---

## Missing Error Handling in GraphQL Client

**Problem:** `storefront/src/lib/graphql.ts` has retry logic with exponential backoff, but some edge cases may not be properly handled.

**Files:** `storefront/src/lib/graphql.ts` (line 80+ retry logic)

**Specific concerns:**
- Retry timeout calculation uses `Math.min(2^attempt * retryDelayMs, 30000)` — could exceed `timeoutMs` on slow networks
- GraphQL errors with `extensions.exception` are captured but not fully analyzed
- Network timeout vs. GraphQL error distinction unclear in error messages
- `executeGraphQL()` throws on error — caller must catch, but not all callers do

**Risk:** **MEDIUM** — Checkout/cart operations failing silently or with confusing error messages.

**Related files with missing error handling:**
- `storefront/src/app/actions.ts` — Multiple GraphQL calls with generic `catch (error: any)` that only logs
- `storefront/src/lib/checkout.ts` — `fetchAutoVouchers()` catches errors but doesn't propagate properly to UI

**Improvement needed:**
- Structured error responses (distinguish network timeout, GraphQL error, validation error)
- Caller guidance on how to handle each error type
- Error recovery strategies (retry, fallback, user-facing message)

---

## Type Safety Issues in macaw-ui Integration (Dashboard)

**Problem:** Dashboard/Apps use both `@saleor/macaw-ui` (v0.7.4, v1.4.1) and newer `@saleor/macaw-ui-next` during migration. Some type conflicts exist when running `tsc --noEmit`.

**Files:**
- Dashboard component files using `@saleor/macaw-ui` (old)
- Dashboard component files using `@saleor/macaw-ui-next` (new)
- Apps using `@saleor/macaw-ui` (older version)

**Current Status:**
- Dashboard migration to `macaw-ui-next` is in progress
- Some old `macaw-ui` imports remain alongside new ones
- `tsc --noEmit` may report `__borderLeft` type errors (pre-existing, documented)

**Risk:** **LOW** — Dev server works despite type errors; migration is ongoing.

**Priority:** **LOW** — Resolve after migration completes.

---

## Bulk Manager Complexity

**Problem:** Bulk import/export/delete router is highly complex with many entity types, field mappings, and edge cases.

**Files:**
- `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts` (very large, complex logic)
- `apps/apps/bulk-manager/src/modules/import/field-mapper.ts` (field type resolution)
- 6 entity routers: products, categories, collections, customers, vouchers, gift cards

**Specific risks:**
- Product import: Multi-image handling, attribute type resolution (SINGLE_REFERENCE, DROPDOWN, MULTISELECT, etc.)
- Category parent resolution: Requires topological sort to ensure parents are created before children
- Collection product assignment: By slug/SKU with fallback logic
- Metadata parsing: `key:value` pairs from CSV may conflict with reserved keys
- Stock/warehouse mapping: Multi-warehouse with custom column prefixes (`stock:*`)

**Current coverage:** Unit tests exist in respective routers, but edge cases around concurrent imports, partial failures, and validation errors may slip through.

**Priority:** **MEDIUM** — Bulk operations affect many products at once; errors cascade.

**Test gaps:**
- Concurrent import handling (multiple imports of same entity type)
- Partial failure recovery (1/100 products fail, others succeed)
- Invalid metadata edge cases
- CSV encoding issues (UTF-8 BOM, different line endings)

---

## Dependency Management & Patching

**Problem:** Some dependencies require post-install patches via `patch-package` to function correctly.

**Files:**
- `apps/apps/bulk-manager/patches/` — Patches for @saleor/configurator
- `scripts/catalog-generator/patches/` — Patches for @saleor/configurator

**Patches applied:**
- `@saleor/configurator` — SINGLE_REFERENCE attribute support + shipping fix
- Patches are committed to git but fragile (break on npm install if not re-applied)

**Risk:** **MEDIUM** — Patched code not maintained upstream; breaking on dependency updates.

**Impact on deployment:**
- CI/CD must run `postinstall` hooks to apply patches
- Docker builds require patch-package integration

**Better approach:**
- Upstream patches to @saleor/configurator (contribute PR)
- Or fork @saleor/configurator into monorepo
- Or use alternative library with SINGLE_REFERENCE support

**Priority:** **MEDIUM** — Not urgent but increases deployment fragility.

---

## Production Environment Not Fully Tested

**Problem:** While Docker development environment is complete, production deployment setup is not fully validated.

**Files:**
- `infra/.env.production.example` — Template for production vars (documented but not tested)
- Production Dockerfile configs — Not present in repo (assumed external)
- Scaling/performance tuning — Not documented

**Unknowns:**
- Cloud provider (AWS, GCP, Azure?) — Not specified in repo
- Database replication & backup strategy — Not in CLAUDE.md/PRD.md
- SSL/TLS certificate management — Not documented
- Monitoring & alerting — Not configured
- Log aggregation — Not set up

**Risk:** **MEDIUM** — Deployment to production without proper validation could fail.

**MVP Status:** Document indicates "3-4 weeks to production" (as of Feb 8, 2026), so this is expected.

**Before production launch, must:**
1. Choose cloud provider & document in PRD
2. Set up managed database (RDS, Cloud SQL, etc.)
3. Configure CDN for storefront/images
4. Set up SSL/TLS
5. Configure monitoring (Sentry, DataDog, NewRelic)
6. Load testing & scaling validation
7. Backup/disaster recovery procedures
8. Security audit (OWASP top 10, CSP headers, secrets management)

---

## Hardcoded Security Tokens & Secrets Risk

**Problem:** Several files have examples with hardcoded secrets or use environment variables without validation.

**Files:**
- (deleted) `docs/JWT_TOKEN_ISSUER_FIX.md` — Contained example tunnel URLs (non-secret, but patterns)
- `infra/.env` — Actual env file (should be `.gitignore`d, appears to be present)
- `.env.example` files throughout — Correct, but verify no actual values committed

**Current safeguards:**
- `.env` file in `infra/` is NOT in `.gitignore` (potential risk) — verify it's not committed
- All `.env.example` files are properly documented
- No hardcoded API keys found in codebase (grep verified)

**Priority:** **MEDIUM** — Not a current breach, but environment file handling needs audit.

**Action needed:**
- Add `infra/.env` to `.gitignore` if not already
- Verify `.env.backup` is not committed
- Audit GitHub for any leaked secrets in commit history
- Use secret scanning tool (GitHub Advanced Security, Snyk)

---

## GraphQL Query Pagination Defaults

**Problem:** Many GraphQL queries use fixed pagination sizes (`first: 100`) without explicit user-facing limits or cursor-based continuation.

**Files:**
- `apps/apps/bulk-manager/src/modules/trpc/routers/` — Multiple routers use `first: 100` for pagination
- `apps/apps/avatax/` — Tax classes fetched with `first: 100`
- `storefront/src/` — Homepage product queries likely have pagination

**Risk:**
- If dataset grows beyond 100, pagination logic silently breaks
- No UI indication that results are truncated
- Admin assumes they see all entities (e.g., all categories)

**Current approach:** Bulk manager uses cursor-based pagination with `after` parameter — good, but:
- `lookups-router.ts` fetches categories/product types with `first: 100` WITHOUT pagination (full fetch)
- No max limit enforced on API side (relies on Saleor's default 100)

**Priority:** **MEDIUM** — Not urgent for MVP (Mansour has <100 categories), but will fail at scale.

**Improvement:**
- Add explicit pagination limit constants
- UI should show "showing X of Y" or "load more" buttons
- Document pagination strategy in CLAUDE.md section on data fetching

---

## Security: dangerouslySetInnerHTML Usage

**Problem:** Multiple uses of `dangerouslySetInnerHTML` for user-generated or CMS content.

**Files with dangerouslySetInnerHTML:**
- `storefront/src/app/[channel]/(main)/about/AboutPage.tsx` — CMS content (using xss filter ✓)
- `storefront/src/app/[channel]/(main)/pages/[slug]/page.tsx` — CMS pages (using xss filter ✓)
- `storefront/src/ui/components/ProductDetails/ProductTabs.tsx` — Product description HTML
- `storefront/src/ui/components/ProductDetails/ProductAttributes.tsx` — Attribute richText
- `apps/apps/newsletter/` — MJML preview with HTML (controlled, not user-generated)

**Current safeguards:**
- CMS content uses `xss()` filter (good)
- Product descriptions from Saleor API (trusted source)
- Newsletter MJML is admin-controlled

**Risk:** **LOW** — XSS filter in place where needed; controlled inputs elsewhere.

**Verify:** Check that all CMS content paths use `xss()` filter consistently.

---

## Missing Service Health Checks

**Problem:** Docker Compose setup lacks proper health checks for services.

**Files:** `infra/docker-compose.dev.yml`

**Services without health checks:**
- Saleor API (waits for port 8000 only)
- Apps (no health checks for readiness)
- Database (PostgreSQL, Redis) — may have basic TCP checks

**Risk:** **MEDIUM** — Container runs but service not ready; subsequent operations fail.

**Current impact:** Development startup script has hard-coded `Start-Sleep -Seconds 30` wait — fragile.

**Better approach:** Add health checks to docker-compose.yml (Docker will manage startup order).

**Example:**
```yaml
saleor-api-dev:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/graphql/"]
    interval: 10s
    timeout: 5s
    retries: 3
```

**Priority:** **LOW** for development, **MEDIUM** for CI/CD.

---

## Checkout State Management Not Persisted

**Problem:** Checkout validation state (shipping address, billing address, guest user) is stored in Zustand memory stores, not persisted to browser storage or server.

**Files:**
- `storefront/src/checkout/state/checkoutValidationStateStore/checkoutValidationStateStore.ts`
- `storefront/src/checkout/state/updateStateStore/updateStateStore.ts`

**Risk:**
- User navigates away mid-checkout → state lost → must restart
- Browser refresh → state reset → form validation state lost
- Multi-tab checkout attempts → each tab has separate state

**Current behavior:** Unclear from code review; Zustand state is in-memory.

**Priority:** **LOW to MEDIUM** — Not critical for MVP, but user experience improvement.

**Possible solution:**
- Zustand middleware to persist to localStorage
- Or rely on Saleor checkout ID to reload state from server

---

## Large File Sizes (Code Generation)

**Problem:** Auto-generated GraphQL type files are very large; not a bug, but makes navigation harder.

**Files:**
- `storefront/src/gql/graphql.ts` (36,560 lines)
- `dashboard/src/graphql/hooks.generated.ts` (21,898 lines)
- `dashboard/src/graphql/types.generated.ts` (12,902 lines)
- `apps/apps/avatax/src/modules/category-mapping/google-product-categories.ts` (14,195 lines)

**Impact:**
- IDE slow on these files
- Git diffs massive on schema changes
- No direct edit needed (generated), but hard to navigate

**Not a code quality issue**, but developer experience could improve:
- Consider code-splitting generated types
- Use barrel exports to organize
- Separate domain types from GraphQL types

**Priority:** **LOW** — Not breaking, but nice-to-have refactor.

---

## API Error Handling Inconsistency

**Problem:** Different parts of codebase handle GraphQL/API errors differently.

**Files with inconsistent patterns:**
- `storefront/src/app/actions.ts` — `catch (error: any)` with generic logging
- `storefront/src/lib/checkout.ts` — Some errors re-fetched, others logged
- Apps' tRPC routers — Use `TRPCError` for structured errors (good)
- `storefront/src/lib/graphql.ts` — Custom retry logic

**Risk:** Caller confusion on error handling; some errors silent, others visible to user.

**Priority:** **MEDIUM** — Not urgent, but impacts reliability diagnostics.

**Improvement:** Establish unified error handling pattern (similar to apps' approach with `TRPCError` and result types).

---

## Documentation Maintenance Risk

**Problem:** This codebase has many documentation files that must stay in sync with code.

**Critical docs:**
- `PRD.md` (v1.3.0) — Must be updated for breaking changes
- `CLAUDE.md` — Must be updated for new features/patterns
- `AGENTS.md` — Must be updated for commands, app behaviors
- `README.md` — Not in repo (no overview doc)

**Risk:** **MEDIUM** — Docs quickly become outdated; new team members follow stale guidance.

**Mitigations in place:**
- PRD.md explicitly states "MUST be kept up-to-date"
- CLAUDE.md section 2.7 details all config sync locations
- AGENTS.md covers Docker commands

**Better mitigation:**
- Add pre-commit hook to validate docs match code
- Or use AI-assisted doc generation from codebase

---

## Saleor API Custom Auth Backend

**Problem:** Custom authentication backend for Saleor API (not detailed in repo docs).

**Files:** `saleor/` directory (4,153 Python files)

**Concern:** How is authentication extended beyond stock Saleor? Are there:
- Custom token expiration?
- Custom claims in JWT?
- Custom user attributes?

**Impact:** **MEDIUM** — Auth bugs could lock users out or expose data.

**Recommendation:** Document custom auth approach in CLAUDE.md.

---

## Summary of Priorities

| Priority | Issue | Impact |
|----------|-------|--------|
| **HIGH** | Storefront has 0 tests — no coverage for critical checkout/payment flows | Breaking changes undetected until production |
| **HIGH** | Config sync across 11 files — missing one causes silent UI/feature failures | Data inconsistency, broken features |
| **MEDIUM** | Invoice Dashboard refresh — UI doesn't auto-update (but data is correct) | Minor UX inconvenience, workaround exists |
| **MEDIUM** | Bulk manager complexity — many entity types, edge cases | Bulk operations fail silently on edge cases |
| **MEDIUM** | GraphQL error handling inconsistent — different patterns throughout | Confusing error messages, hard to debug |
| **MEDIUM** | Pagination defaults (first: 100) — scales poorly beyond 100 entities | Fails when dataset grows beyond 100 |
| **MEDIUM** | Dependency patching (@saleor/configurator) — fragile, not upstream | Deployment breaks on dependency updates |
| **MEDIUM** | Production setup not validated — deployment unknowns | Launch day surprises |
| **MEDIUM** | Secrets/env file management — infra/.env should be .gitignore`d | Risk of secret leakage |
| **LOW** | Console logging in production — debug logs pollute output | Information leakage, noise |
| **LOW** | Checkout state not persisted — page refresh loses form state | Minor UX annoyance |
| **LOW** | Large generated files (36k lines) — IDE performance, navigation | Developer experience slowdown |
| **LOW** | macaw-ui type conflicts during migration — type errors in tsc | Resolved after migration |

---

*Concerns audit: 2026-02-15*
