# Aura E-Commerce Platform — Improvement Roadmap

> **Created:** February 20, 2026
> **Last Updated:** February 22, 2026
> **Platform Readiness:** ~96% (Pre-Launch — Phase 0 Complete)
> **Total Mapped Work:** ~130-180 hours remaining across 3 phases

---

## Current State Summary

**What's solid:**
- Full checkout with Stripe payments (cards, Apple/Google Pay, PayPal via Stripe)
- 34 storefront routes, dual-channel (Hebrew RTL + English LTR)
- 10 Saleor apps all functional (CMS, analytics, bulk ops, image studio, dropship orchestrator)
- 17 Docker services orchestrated with 74 automation scripts
- Config system with zero hardcoded values (64 hooks, 20 schema domains)
- Dashboard fully modernized (Tailwind CSS v4, macaw-ui-next, Lucide icons, React Router v7)
- Backend 100% stock Saleor 3.23 + custom auth
- GA4/GTM analytics with full e-commerce event tracking (view_item, add_to_cart, begin_checkout, purchase, search)
- GDPR cookie consent banner (configurable, 3 categories, consent-gated analytics)
- Product JSON-LD structured data (Product, Offer, BreadcrumbList)
- Google Ads conversion tracking (GA4-imported, auto-attributed)
- Product reviews/ratings system (full backend + storefront UI: star ratings, review form with image upload, review list, helpful votes)
- Abandoned cart email recovery (3-email Celery sequence, SMTP templates EN+HE, signed recovery URLs, E2E tested)
- Dropship Orchestrator (AliExpress + CJ Dropshipping, order forwarding, tracking sync, fraud detection, pricing engine, returns management, delivery estimates)
- Image Studio (AI-powered image editor with canvas, templates, bg removal, generation, upscaling)
- Bulk Manager (CSV/Excel import/export/delete for 7 entity types: products, categories, collections, customers, orders, vouchers, gift cards)
- CI pipelines for storefront, dashboard, backend, and apps monorepo (separate workflows per service)

**What's missing (in order of urgency):**
- No E2E tests on the storefront (can't deploy with confidence)
- No Core Web Vitals monitoring (can't measure performance)
- BNPL partially integrated (Klarna payment method exists in Stripe app but needs completion)

---

## Timeline Overview

```
LAUNCH ──────────────────────────────────────────────────>

Phase 0 ██░░░░░░░░░░░░░░░░░░  ~2 days (before launch) — COMPLETE
Phase 1 ░░██████████░░░░░░░░  ~2 weeks (post-launch)
Phase 2 ░░░░░░░░░░██████░░░░  Month 1-2
Phase 3 ░░░░░░░░░░░░░░██████  Month 2-3
```

---

## Phase 0 — Pre-Launch Blockers ~~(12-16 hours)~~ COMPLETE

All code tasks completed February 21, 2026.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | **GA4 + GTM integration** | DONE | GTM container `GTM-PWN35T2R`, GA4 property `G-1X96SJX4SP`. Events: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `search`. Consent-gated via cookie banner. Deduplication prevents double-firing. |
| 2 | **Product JSON-LD schema** | DONE (pre-existing) | Product + Offer + BreadcrumbList on PDP. `storefront/src/app/[channel]/(main)/products/[slug]/page.tsx:169-259` |
| 3 | **Cookie consent banner** | DONE | 3 categories (essential/analytics/marketing). Configurable via Storefront Control (position, expiry, all text translatable). localStorage-based with custom event for consent changes. Hebrew + English. |
| 4 | **Email flow verification** | SKIPPED | SMTP app functional, templates working. Manual verification during staging. |
| 5 | **Staging environment validation** | PENDING | Operational task — run checklist before production deploy. |
| 6 | **Google Ads conversion tracking** | DONE | GA4-imported purchase conversion linked to Google Ads account. Data-driven attribution. |

**Key files created:**
- `storefront/src/lib/consent.ts` — localStorage consent manager
- `storefront/src/lib/analytics.ts` — GA4 dataLayer events with consent queue + deduplication
- `storefront/src/ui/components/CookieConsent/CookieConsent.tsx` — Banner component
- `storefront/src/ui/components/GoogleTagManager.tsx` — Consent-gated GTM loader

---

## Phase 1 — First 2 Weeks Post-Launch (48-68 hours)

High-impact items that directly affect revenue and stability.

### Week 1: Revenue & Stability

| # | Task | Time | Revenue Impact | Detail |
|---|------|------|---------------|--------|
| 1 | ~~**Abandoned cart email sequence**~~ | ~~6-8 hrs~~ | ~~5-15% cart recovery~~ | **DONE** — 3-email sequence (1hr, 24hr, 72hr) via Celery Beat + SMTP app. Signed recovery URLs with 7-day expiry. MJML templates in EN+HE. `CheckoutRecover` GraphQL mutation. E2E tested. |
| 2 | **E2E tests — critical flows** | 10-15 hrs | Risk reduction | Start with 5 flows: checkout completion, login/register, add-to-cart, search, account orders. Playwright setup + first test suite. No test runner exists in storefront currently. |
| 3 | **Performance monitoring** | 8-10 hrs | SEO + UX | No Core Web Vitals data. Google ranks on CWV. Add web-vitals RUM reporting to GA4 + Lighthouse CI in pipeline. |

### Week 2: Compliance & Security

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 4 | **CI/CD unification** | 8-12 hrs | Risk reduction | Each service (storefront, dashboard, backend, apps) has its own CI workflow. Add unified orchestration pipeline that runs all checks on PR, plus deployment automation for staging/production. |
| 5 | **GDPR consent management** | 4-6 hrs | Legal | Full system beyond the cookie banner: data export endpoint, consent records, preference center UI. Cookie banner and consent manager already exist. |
| 6 | **App-level rate limiting** | 4-6 hrs | Security | Nginx rate limiting exists but apps have no throttling. Add express-rate-limit or similar to GraphQL-heavy endpoints. |
| 7 | **E2E tests — extended** | 10-15 hrs | Risk reduction | Continue Playwright: promo codes, wishlist, newsletter subscribe, track order, multi-channel switching. |

**Previously listed — now confirmed DONE:**
- ~~Reviews/Ratings UI (8-12 hrs)~~ — Full backend (GraphQL mutations, DB models) + storefront UI (star ratings, review form with image upload, review list, helpful votes) already exist in `storefront/src/ui/components/ProductReviews/`.

---

## Phase 2 — Month 1-2 Post-Launch (45-70 hours)

Significant business value and operational maturity.

### Revenue Growth

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 1 | **BNPL completion (Klarna/Afterpay)** | 8-12 hrs | **HIGH** — 20-30% conversion lift | Klarna payment method class exists in Stripe app (`apps/apps/stripe/src/modules/stripe/payment-methods/klarna.ts`). Needs: testing, Afterpay addition, checkout UI integration, Stripe PaymentElement config. Fashion/shoes is the #1 BNPL category. |
| 2 | **Customer loyalty program** | 20-30 hrs | **HIGH** — repeat purchases | Points system, membership tiers, reward vouchers. LTV multiplier for shoe store. Build on Saleor's existing voucher + gift card infrastructure. |

### Operational Maturity

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 3 | **Log aggregation (Loki or CloudWatch)** | 8-12 hrs | **MEDIUM** | Logs only in Docker stdout across 17 services. Sentry exists for error tracking but no centralized log aggregation. Set up Grafana Loki or CloudWatch with structured log ingestion. |
| 4 | **Load testing** | 6-8 hrs | **MEDIUM** | No idea what the platform handles under load. Write k6 scripts for: checkout flow, product listing pagination, search, GraphQL API. Run before any sale or promotion. |
| 5 | **Incident response runbooks** | 4-6 hrs | **MEDIUM** | Documented procedures for: Stripe down, DB full, Redis crash, container OOM, deployment rollback. Saves hours during real outages. |
| 6 | **Synthetic monitoring** | 4-6 hrs | **MEDIUM** | No uptime checks. Add scheduled health probes (UptimeRobot, Checkly, or similar) for: storefront, API, checkout, each app. Alert before customers notice downtime. |

---

## Phase 3 — Quarter 1 (40-55 hours)

Strategic improvements for scale and developer experience.

### Conversion Optimization

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 1 | **A/B testing framework** | 10-15 hrs | **MEDIUM** | Can't test headline changes, CTA colors, or checkout layouts. Need: feature flags + variant allocation + GA4 custom events for measurement. Config feature toggles exist but not experimental A/B infrastructure. |

### Developer Experience

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 2 | **Storybook component library** | 15-20 hrs | **MEDIUM** | No Storybook config or stories exist. Add stories for: table primitives, form components, navigation, product cards. Enables visual regression testing + design system docs. |
| 3 | **Dashboard strict TypeScript** | 10-15 hrs | **MEDIUM** | Currently uses gradual plugin (`typescript-strict-plugin`). Enable global `strict: true` and fix the resulting ~200-300 type errors for full type safety. |
| 4 | **Blue-green deployment** | 8-12 hrs | **MEDIUM** | Zero-downtime deploys. Currently must restart containers = brief downtime during each deploy. |

### SEO Quick Wins

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 5 | **FAQPage JSON-LD** | 1-2 hrs | **LOW** | FAQ page already exists. Add schema markup for Google FAQ rich results. |

**Previously listed — now confirmed DONE:**
- ~~PayPal integration (8-12 hrs)~~ — Already integrated via Stripe PaymentElement. Payment method class at `apps/apps/stripe/src/modules/stripe/payment-methods/paypal.ts` with tests.
- ~~BreadcrumbList JSON-LD (2-3 hrs)~~ — Already on Product Detail Page as part of Product JSON-LD schema.

---

## Parallel Track: Dropship Full Integration

The Dropship Orchestrator app is functional with significant integration already complete. Tracked in a separate plan:

**Plan**: [`docs/plans/2026-02-22-dropship-full-integration.md`](docs/plans/2026-02-22-dropship-full-integration.md)

**Completed:**
- Delivery estimate badges in storefront cart + checkout (multi-supplier notice)
- Direct import pipeline (CJ → Saleor, bypasses CSV)
- Dynamic pricing engine (markup rules, currency conversion, 3-tab admin UI)
- Returns management (full CRUD admin, status workflow)
- Stock sync BullMQ worker (built, pending adapter `getStockBatch` implementation)

**Remaining:**
- Stock sync adapter implementation (AliExpress + CJ `getStockBatch`)
- Automated price push from pricing engine to Saleor variants
- Search filtering by supplier/dropship
- Order tracking email links

**Estimated remaining effort**: ~20-30 hours.

This work can run in parallel with Phases 1-3 above since it mostly touches different files (dropship app, some shared storefront components).

---

## Priority Matrix

```
                        HIGH IMPACT
                            |
     BNPL Completion (P2)   |  ✅ GA4/GTM (P0) — DONE
     Loyalty (P2)           |  ✅ Abandoned Cart (P1) — DONE
     Dropship Remaining     |  E2E Tests (P1)
                            |  ✅ Reviews/Ratings — DONE
                            |  ✅ Product JSON-LD (P0) — DONE
  ─────────────────────────-+──────────────────────── URGENT
                            |
     A/B Testing (P3)       |  ✅ Cookie Consent (P0) — DONE
     Storybook (P3)         |  GDPR (P1)
     Log Aggregation (P2)   |  Perf Monitoring (P1)
     Load Testing (P2)      |  Rate Limiting (P1)
                            |  CI/CD Unification (P1)
                            |
                        LOW IMPACT
```

---

## Recommended Execution Order

If working solo, this is the optimal sequence:

### ~~This Week (before launch)~~ COMPLETE (Feb 21, 2026)
1. ~~GA4 + GTM integration~~ DONE
2. ~~Product JSON-LD schema~~ DONE (pre-existing)
3. ~~Cookie consent banner~~ DONE
4. ~~Email flow verification~~ SKIPPED (SMTP verified working)
5. Staging validation — remaining operational task

### Week 1 Post-Launch
6. ~~Abandoned cart emails (6-8 hrs)~~ DONE
7. Playwright E2E — critical flows (10-15 hrs)

### Week 2 Post-Launch
8. Performance monitoring + CWV (8-10 hrs)
9. CI/CD unification (8-12 hrs)

### Week 3-4
10. GDPR consent management (4-6 hrs)
11. App-level rate limiting (4-6 hrs)
12. E2E tests — extended coverage (10-15 hrs)

### Month 2
13. BNPL / Klarna completion (8-12 hrs)
14. Log aggregation (8-12 hrs)
15. Load testing scripts (6-8 hrs)
16. Synthetic monitoring (4-6 hrs)
17. Incident runbooks (4-6 hrs)

### Month 3
18. Customer loyalty program (20-30 hrs)
19. A/B testing framework (10-15 hrs)
20. Storybook stories (15-20 hrs)
21. Dashboard strict TypeScript (10-15 hrs)
22. Blue-green deployment (8-12 hrs)
23. FAQPage JSON-LD (1-2 hrs)

### Parallel (Month 1-3)
24. Dropship integration remaining — stock sync, auto-pricing, search filters (~20-30 hrs, see separate plan)

---

## Key Revenue Opportunities

| Improvement | Expected Lift | Effort | ROI Rating | Status |
|------------|--------------|--------|-----------|--------|
| Reviews/Ratings UI | 15-25% conversion lift | — | — | DONE |
| Product JSON-LD | 10-20% organic CTR lift | — | — | DONE |
| PayPal | Payment diversity | — | — | DONE |
| Abandoned cart emails | 5-15% cart recovery | — | — | DONE |
| BNPL (Klarna) | 20-30% conversion lift | 8-12 hrs | Excellent | Partial |
| Loyalty program | 2-3x customer LTV | 20-30 hrs | High | TODO |
| A/B testing | Compound 1-5% per test | 10-15 hrs | Medium | TODO |
| Performance (CWV) | 1-2% per 100ms improvement | 8-10 hrs | Medium | TODO |

---

## Biggest Risks Right Now

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Broken checkout deployed with no tests | High | Critical — lost revenue | E2E tests (Phase 1) |
| ~~No analytics = blind decisions~~ | ~~Certain~~ | ~~High~~ | ~~GA4/GTM (Phase 0)~~ RESOLVED |
| ~~Legal exposure without cookie consent~~ | ~~Certain~~ | ~~Medium~~ | ~~Cookie banner (Phase 0)~~ RESOLVED |
| ~~No abandoned cart recovery = lost revenue~~ | ~~High~~ | ~~High~~ | ~~Abandoned cart emails (Phase 1)~~ RESOLVED |
| No unified CI = inconsistent quality | Medium | High — regressions between services | CI/CD unification (Phase 1) |
| No monitoring = outages go unnoticed | Medium | High — silent revenue loss | Synthetic monitoring (Phase 2) |
| No load testing = unknown capacity | Medium | Critical during sales | Load testing (Phase 2) |

---

## Changelog

| Date | Update |
|------|--------|
| 2026-02-20 | Initial roadmap created from PLATFORM-STATE.md assessment |
| 2026-02-21 | Phase 0 completed: GA4/GTM (GTM-PWN35T2R), cookie consent, Google Ads conversion tracking. Product JSON-LD was pre-existing. |
| 2026-02-22 | Full audit: Abandoned cart emails completed (3-email Celery + SMTP + recovery URL, E2E tested). Reviews/Ratings confirmed DONE (removed from Phase 1). PayPal confirmed DONE via Stripe (removed from Phase 3). BreadcrumbList JSON-LD confirmed DONE (removed from Phase 3). BNPL/Klarna updated to partial (reduced hours). CI/CD description corrected (all services have CI, need unification not creation). Dropship integration significantly expanded: pricing engine, returns management, delivery estimates, direct import pipeline all complete. Product gallery refactored (vertical thumbnails, lightbox zoom). Updated platform readiness to ~96%. |

*This roadmap should be reviewed and updated after each phase completion.*
