# Aura E-Commerce Platform — Improvement Roadmap

> **Created:** February 20, 2026
> **Last Updated:** February 21, 2026
> **Platform Readiness:** ~93% (Pre-Launch — Phase 0 Complete)
> **Total Mapped Work:** ~190-250 hours remaining across 3 phases

---

## Current State Summary

**What's solid:**
- Full checkout with Stripe payments (cards, Apple/Google Pay)
- 34 storefront routes, dual-channel (Hebrew RTL + English LTR)
- 10 Saleor apps all functional (CMS, analytics, bulk ops, image studio, dropship)
- 17 Docker services orchestrated with 74 automation scripts
- Config system with zero hardcoded values (64 hooks, 20 schema domains)
- Dashboard fully modernized (Tailwind CSS v4, 0 MUI imports, 348 test files)
- Backend 100% stock Saleor 3.23 + custom auth
- GA4/GTM analytics with full e-commerce event tracking (view_item, add_to_cart, begin_checkout, purchase, search)
- GDPR cookie consent banner (configurable, 3 categories, consent-gated analytics)
- Product JSON-LD structured data (Product, Offer, BreadcrumbList)
- Google Ads conversion tracking (GA4-imported, auto-attributed)

**What's missing (in order of urgency):**
- No tests on the storefront (can't deploy with confidence)
- Only 1 CI pipeline out of 4 needed
- No abandoned cart recovery (leaving money on the table)
- No BNPL (20-30% conversion lift for fashion)

---

## Timeline Overview

```
LAUNCH ──────────────────────────────────────────────────>

Phase 0 ██░░░░░░░░░░░░░░░░░░  ~2 days (before launch)
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

## Phase 1 — First 2 Weeks Post-Launch (66-92 hours)

High-impact items that directly affect revenue and stability.

### Week 1: Revenue & Conversion

| # | Task | Time | Revenue Impact | Detail |
|---|------|------|---------------|--------|
| 1 | **Abandoned cart email sequence** | 6-8 hrs | 5-15% cart recovery | 3-email sequence (1hr, 24hr, 72hr). Uses existing SMTP app + Celery scheduler. Proven ROI across all e-commerce. |
| 2 | **Reviews/Ratings UI** | 8-12 hrs | +15-25% conversion | GraphQL operations already exist (CreateProductReview, etc.). Need storefront UI: star ratings on product cards, review list on PDP, review submission form. Social proof is the #1 conversion driver for fashion. |
| 3 | **E2E tests — critical flows** | 10-15 hrs | Risk reduction | Start with 5 flows: checkout completion, login/register, add-to-cart, search, account orders. Playwright setup + first test suite. |

### Week 2: Stability & Compliance

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 4 | **CI/CD for all services** | 15-20 hrs | Risk reduction | Only storefront has CI. Add type-check + lint + build pipelines for: dashboard, backend (ruff + mypy), and each app. |
| 5 | **Performance monitoring** | 8-10 hrs | SEO + UX | No Core Web Vitals data. Google ranks on CWV. Add web-vitals RUM reporting to GA4 + Lighthouse CI in pipeline. |
| 6 | **GDPR consent management** | 4-6 hrs | Legal | Full system beyond the cookie banner: data export endpoint, consent records, preference center UI. |
| 7 | **App-level rate limiting** | 4-6 hrs | Security | Nginx rate limiting exists but apps have no throttling. Add express-rate-limit or similar to GraphQL-heavy endpoints. |
| 8 | **E2E tests — extended** | 10-15 hrs | Risk reduction | Continue Playwright: promo codes, wishlist, newsletter subscribe, track order, multi-channel switching. |

---

## Phase 2 — Month 1-2 Post-Launch (55-83 hours)

Significant business value and operational maturity.

### Revenue Growth

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 1 | **BNPL integration (Klarna/Afterpay)** | 15-20 hrs | **HIGH** — 20-30% conversion lift | Fashion/shoes is the #1 BNPL category. Israeli market has growing BNPL adoption. Stripe has native Klarna support via PaymentElement. |
| 2 | **Customer loyalty program** | 20-30 hrs | **HIGH** — repeat purchases | Points system, membership tiers, reward vouchers. LTV multiplier for shoe store. Build on Saleor's existing voucher + gift card infrastructure. |

### Operational Maturity

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 3 | **Log aggregation (Loki or CloudWatch)** | 8-12 hrs | **MEDIUM** | Logs only in Docker stdout across 17 services. Can't search, can't alert, can't debug production issues. Set up Grafana Loki or CloudWatch with structured log ingestion. |
| 4 | **Load testing** | 6-8 hrs | **MEDIUM** | No idea what the platform handles under load. Write k6 scripts for: checkout flow, product listing pagination, search, GraphQL API. Run before any sale or promotion. |
| 5 | **Incident response runbooks** | 4-6 hrs | **MEDIUM** | Documented procedures for: Stripe down, DB full, Redis crash, container OOM, deployment rollback. Saves hours during real outages. |
| 6 | **Synthetic monitoring** | 4-6 hrs | **MEDIUM** | No uptime checks. Add scheduled health probes (UptimeRobot, Checkly, or similar) for: storefront, API, checkout, each app. Alert before customers notice downtime. |

---

## Phase 3 — Quarter 1 (55-80 hours)

Strategic improvements for scale and developer experience.

### Conversion Optimization

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 1 | **A/B testing framework** | 10-15 hrs | **MEDIUM** | Can't test headline changes, CTA colors, or checkout layouts. Need: feature flags + variant allocation + GA4 custom events for measurement. |
| 2 | **PayPal integration** | 8-12 hrs | **MEDIUM** | Some customers only trust PayPal. Saleor has PayPal app patterns. Adds payment diversity. |

### Developer Experience

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 3 | **Storybook component library** | 15-20 hrs | **MEDIUM** | Infrastructure configured, 0 stories. Add stories for: table primitives, form components, navigation, product cards. Enables visual regression testing + design system docs. |
| 4 | **Dashboard strict TypeScript** | 10-15 hrs | **MEDIUM** | Currently uses gradual plugin (`typescript-strict-plugin`). Enable global `strict: true` and fix the resulting ~200-300 type errors for full type safety. |
| 5 | **Blue-green deployment** | 8-12 hrs | **MEDIUM** | Zero-downtime deploys. Currently must restart containers = brief downtime during each deploy. |

### SEO Quick Wins

| # | Task | Time | Impact | Detail |
|---|------|------|--------|--------|
| 6 | **BreadcrumbList JSON-LD** | 2-3 hrs | **LOW** | Structured data for navigation breadcrumbs on product, category, and collection pages. |
| 7 | **FAQPage JSON-LD** | 1-2 hrs | **LOW** | FAQ page already exists. Add schema markup for Google FAQ rich results. |

---

## Priority Matrix

```
                        HIGH IMPACT
                            |
     BNPL (P2)              |  ✅ GA4/GTM (P0) — DONE
     Loyalty (P2)           |  Abandoned Cart (P1)
     Reviews UI (P1)        |  E2E Tests (P1)
                            |  CI/CD (P1)
                            |  ✅ Product JSON-LD (P0) — DONE
  ─────────────────────────-+──────────────────────── URGENT
                            |
     A/B Testing (P3)       |  ✅ Cookie Consent (P0) — DONE
     Storybook (P3)         |  GDPR (P1)
     PayPal (P3)            |  Perf Monitoring (P1)
     Log Aggregation (P2)   |  Rate Limiting (P1)
     Load Testing (P2)      |
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
6. Abandoned cart emails (6-8 hrs)
7. Reviews/Ratings UI (8-12 hrs)

### Week 2 Post-Launch
8. Playwright E2E — critical flows (10-15 hrs)
9. CI/CD pipelines for all services (15-20 hrs)

### Week 3-4
10. Performance monitoring + CWV (8-10 hrs)
11. GDPR consent management (4-6 hrs)
12. App-level rate limiting (4-6 hrs)
13. E2E tests — extended coverage (10-15 hrs)

### Month 2
14. BNPL / Klarna integration (15-20 hrs)
15. Log aggregation (8-12 hrs)
16. Load testing scripts (6-8 hrs)
17. Synthetic monitoring (4-6 hrs)
18. Incident runbooks (4-6 hrs)

### Month 3
19. Customer loyalty program (20-30 hrs)
20. A/B testing framework (10-15 hrs)
21. Storybook stories (15-20 hrs)
22. Dashboard strict TypeScript (10-15 hrs)
23. Blue-green deployment (8-12 hrs)
24. PayPal integration (8-12 hrs)
25. BreadcrumbList + FAQPage JSON-LD (3-5 hrs)

---

## Key Revenue Opportunities

| Improvement | Expected Lift | Effort | ROI Rating |
|------------|--------------|--------|-----------|
| Abandoned cart emails | 5-15% cart recovery | 6-8 hrs | Excellent |
| Reviews/Ratings UI | 15-25% conversion lift | 8-12 hrs | Excellent |
| BNPL (Klarna) | 20-30% conversion lift | 15-20 hrs | Excellent |
| Loyalty program | 2-3x customer LTV | 20-30 hrs | High |
| Product JSON-LD | 10-20% organic CTR lift | 3-4 hrs | Excellent |
| A/B testing | Compound 1-5% per test | 10-15 hrs | Medium |
| Performance (CWV) | 1-2% per 100ms improvement | 8-10 hrs | Medium |

---

## Biggest Risks Right Now

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Broken checkout deployed with no tests | High | Critical — lost revenue | E2E tests (Phase 1) |
| ~~No analytics = blind decisions~~ | ~~Certain~~ | ~~High~~ | ~~GA4/GTM (Phase 0)~~ RESOLVED |
| ~~Legal exposure without cookie consent~~ | ~~Certain~~ | ~~Medium~~ | ~~Cookie banner (Phase 0)~~ RESOLVED |
| No CI = broken code ships silently | High | High — customer-facing bugs | CI/CD (Phase 1) |
| No monitoring = outages go unnoticed | Medium | High — silent revenue loss | Synthetic monitoring (Phase 2) |
| No load testing = unknown capacity | Medium | Critical during sales | Load testing (Phase 2) |

---

---

## Changelog

| Date | Update |
|------|--------|
| 2026-02-20 | Initial roadmap created from PLATFORM-STATE.md assessment |
| 2026-02-21 | Phase 0 completed: GA4/GTM (GTM-PWN35T2R), cookie consent, Google Ads conversion tracking. Product JSON-LD was pre-existing. |

*This roadmap should be reviewed and updated after each phase completion.*
