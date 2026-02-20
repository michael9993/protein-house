# Aura E-Commerce Platform — State Assessment

> **Last Updated:** February 20, 2026
> **Overall Readiness:** ~90% (Pre-Launch)
> **Platform Version:** Saleor 3.23 + Custom Extensions

---

## 1. Executive Summary

The Aura E-Commerce Platform is a fully-featured, enterprise-grade, multi-tenant e-commerce system built on Saleor. It supports dual-channel commerce (Israel ILS/Hebrew/RTL + International USD/English/LTR), a CMS-driven configuration system with zero hardcoded values, and a modular ecosystem of 10 Saleor apps. The platform includes a modernized admin dashboard (Tailwind CSS v4), AI-powered image editing, dropship orchestration, bulk data management, and comprehensive infrastructure automation. First client: Mansour Shoes.

### Strengths & Gaps at a Glance

| Area | Strength | Critical Gap |
|------|----------|-------------|
| Storefront | 34 routes, full checkout, dual-channel RTL/LTR | Zero unit/E2E tests |
| Configuration | 64 hooks, 20 schema domains, zero hardcoded values | — |
| Dashboard | D6 modernization complete, 348 test files | Strict TS disabled globally |
| Apps | 10 apps covering all commerce needs | Products Feed app incomplete |
| Payments | Stripe PaymentElement + Adyen scaffolding | Adyen not production-ready |
| SEO | Sitemap, robots.txt, JSON-LD, hreflang | Missing Product schema markup |
| Analytics | Sentry error tracking | No GA4/GTM/behavior analytics |
| CI/CD | 1 workflow (storefront) | No CI for dashboard, apps, or backend |
| Testing | 348 dashboard tests | 0 storefront tests, 0 E2E tests |
| Monitoring | Sentry + OpenTelemetry packages | No APM, no synthetic monitoring |

---

## 2. Platform Inventory

### 2.1 Docker Services (17 active)

| # | Service | Container | Port | Purpose |
|---|---------|-----------|------|---------|
| 1 | PostgreSQL 16 | `saleor-postgres-dev` | 5432 | Primary database |
| 2 | Redis | `saleor-redis-dev` | 6379 | Cache & message broker |
| 3 | Saleor API | `saleor-api-dev` | 8000 | Django/GraphQL backend (Uvicorn ASGI) |
| 4 | Celery Worker | `saleor-worker-dev` | — | Background job processing |
| 5 | Celery Beat | `saleor-scheduler-dev` | — | Periodic task scheduling |
| 6 | Dashboard | `saleor-dashboard-dev` | 9000 | Admin UI (React 18 + Vite) |
| 7 | Storefront | `saleor-storefront-dev` | 3000 | Customer UI (Next.js 16 + React 19) |
| 8 | SMTP App | `saleor-smtp-app-dev` | 3001 | Transactional email delivery |
| 9 | Stripe App | `saleor-stripe-app-dev` | 3002 | Payment processing |
| 10 | Invoice App | `saleor-invoice-app-dev` | 3003 | PDF invoice generation |
| 11 | Storefront Control | `saleor-storefront-control-app-dev` | 3004 | CMS configuration admin |
| 12 | Newsletter App | `saleor-newsletter-app-dev` | 3005 | Subscriber management & campaigns |
| 13 | Sales Analytics | `saleor-sales-analytics-app-dev` | 3006 | KPIs, charts, Excel export |
| 14 | Bulk Manager | `saleor-bulk-manager-app-dev` | 3007 | CSV/Excel bulk import/export/delete |
| 15 | Image Studio | `saleor-image-studio-app-dev` | 3008 | AI-powered image editor |
| 16 | Dropship Orchestrator | `saleor-dropship-app-dev` | 3009 | Multi-supplier dropshipping |
| 17 | rembg | `saleor-rembg-dev` | 7000 | AI background removal |
| 18 | Real-ESRGAN | `saleor-esrgan-dev` | 7001 | AI image upscaling |

**Additional:** 24 Docker volumes, 1 bridge network

### 2.2 App Ecosystem (10 apps)

| App | Status | Key Features |
|-----|--------|-------------|
| Storefront Control | Production | 6-section admin, shadcn/ui, Cmd+K palette, live preview, 20 schema domains |
| Stripe | Production | PaymentElement v2, webhook handling |
| SMTP | Production | MJML templates, transactional emails (order, invoice, welcome) |
| Invoices | Production | PDF generation per order |
| Newsletter | Production | Subscribers, MJML templates, campaigns, BullMQ queue |
| Sales Analytics | Production | Revenue KPIs, charts, date ranges, Excel export |
| Bulk Manager | Production | 7 entity types (Products, Categories, Collections, Customers, Orders, Vouchers, Gift Cards), upsert mode, auto-create product types |
| Image Studio | Production | Fabric.js canvas, AI bg removal/generation/upscaling, templates, layers panel |
| Dropship Orchestrator | Production | AliExpress + CJ adapters, fraud detection, cost ceiling, audit trail, BullMQ jobs |
| Products Feed | Incomplete | Feed generation scaffolding only |

### 2.3 Shared Packages (14)

| Package | Purpose |
|---------|---------|
| `storefront-config` | Zod schema + types for CMS configuration (20 domain files, 2,332 lines) |
| `shared` | GraphQL client, theme sync, iframe utils, metadata manager, permissions |
| `ui` | macaw-ui wrappers + shared React components |
| `logger` | Structured logging with OpenTelemetry + tslog |
| `errors` | BaseError class using modern-errors |
| `domain` | Saleor API URL validation, branded Zod types |
| `trpc` | tRPC context helpers, HTTP batch link |
| `otel` | OpenTelemetry traces, metrics, AWS SDK instrumentation |
| `dynamo-config-repository` | DynamoDB-backed repository pattern |
| `webhook-utils` | Webhook validation, GraphQL operations |
| `react-hook-form-macaw` | React Hook Form + Macaw UI integration |
| `sentry-utils` | Sentry error tracking utilities |
| `eslint-config` | Shared ESLint configuration |
| `typescript-config` | Shared TypeScript configuration |

### 2.4 Storefront Routes (34 total)

**Channel-Aware Routes (`/[channel]/(main)/`):**

| Category | Count | Routes |
|----------|-------|--------|
| Homepage | 1 | `/` |
| Account | 6 | Dashboard, Orders, Order Detail, Addresses, Wishlist, Settings |
| Authentication | 7 | Login, Forgot Password, Reset Password, Confirm Email, Confirm Email Change, Verify Email, Auth |
| Catalog | 4 | Products List, Product Detail, Category, Collection |
| CMS Pages | 9 | About, Contact, FAQ, Dynamic Pages, Privacy, Returns, Shipping, Store Terms, ToS |
| Utility | 4 | Cart, Search, Track Order, Unsubscribe |
| Checkout | 1 | Channel-aware checkout |

**Plus:** 2 root routes (homepage redirect, legacy checkout redirect)

---

## 3. Feature Completeness Assessment

### 3.1 Storefront

| Feature | Score | Notes |
|---------|-------|-------|
| Product Catalog | 95% | List, detail, search, filters, categories, collections, badges |
| Checkout Flow | 95% | Multi-step, address forms, promo codes, Zustand state |
| Payment Integration | 85% | Stripe PaymentElement v2 production-ready; Adyen scaffolded only |
| User Accounts | 95% | Login, register, orders, addresses, wishlist, settings |
| SEO | 80% | Sitemap, robots.txt, hreflang, JSON-LD (Organization + WebSite); missing Product/BreadcrumbList schema |
| Internationalization | 95% | Dual-channel RTL/LTR, Hebrew + English, logical CSS properties |
| Search | 90% | Full-text search with GraphQL, quick filters, category filtering |
| Performance | 85% | Turbopack, image optimization, Sentry tree-shaking; no Core Web Vitals monitoring |
| Accessibility | 70% | Semantic HTML, keyboard navigation; no formal WCAG audit |
| Mobile Experience | 90% | Responsive design, mobile tab bar, touch-friendly |
| Analytics | 10% | Sentry error tracking only; no behavioral analytics |

### 3.2 Dashboard

| Feature | Score | Notes |
|---------|-------|-------|
| D6 Modernization | 98% | Tailwind CSS v4, Lucide icons, custom table primitives, `withQs` routing |
| MUI Migration | 100% | 0 files importing `@mui/material` directly (macaw-ui-next still uses MUI internally) |
| TypeScript | 80% | Strict mode disabled globally; uses `typescript-strict-plugin` for gradual enforcement |
| Test Coverage | 75% | 348 test files; complex filters and utilities well-covered |
| Storybook | 5% | Infrastructure configured; 0 story files implemented |
| Code Quality | 85% | 77 TODO/FIXME comments; 79 eslint-disable in active code |

### 3.3 Backend

| Feature | Score | Notes |
|---------|-------|-------|
| GraphQL API | 100% | Stock Saleor 3.23 |
| Authentication | 100% | Custom auth backend + OpenID Connect |
| Media Serving | 100% | Fixed DEBUG-mode dependency; serves via Django static files |
| Background Jobs | 100% | Celery worker + beat scheduler |
| Database | 100% | PostgreSQL 16 with migrations |

### 3.4 Infrastructure

| Feature | Score | Notes |
|---------|-------|-------|
| Docker Orchestration | 100% | 17 services, 24 volumes, health checks |
| Cloudflare Tunnels | 100% | 12 ingress rules for all services |
| Automation Scripts | 95% | 52 PowerShell + 22 bash scripts |
| CI/CD | 15% | Only storefront-ci.yml; no pipeline for dashboard, apps, or backend |
| Backup/Restore | 80% | pg_dump scripts; no automated schedule |
| Nginx Proxy | 100% | Rate limiting, SSL, CSP headers, health checks |

---

## 4. E-Commerce Readiness Audit

### 4.1 Cart & Checkout

| Criterion | Status | Detail |
|-----------|--------|--------|
| Guest Checkout | Partial | Checkout works without login; customer attach available |
| Price Transparency | Yes | Prices shown with tax, shipping calculated at checkout |
| Cart Recovery | No | No abandoned cart email sequence |
| Promo Codes | Yes | Wired in CartClient.tsx with add/remove support |
| Order Tracking | Yes | Track order page with order number + email lookup |
| Multi-currency | Yes | ILS + USD channels with proper formatting |

### 4.2 Payment Coverage

| Method | Status | Detail |
|--------|--------|--------|
| Credit/Debit Cards | Yes | Stripe PaymentElement |
| Apple Pay / Google Pay | Yes | Via Stripe PaymentElement (auto-detected) |
| BNPL (Buy Now Pay Later) | No | Not integrated; 20-30% potential conversion lift |
| Regional Methods | No | No Bit/PayBox (Israel), iDEAL, etc. |
| PayPal | No | Not integrated |

### 4.3 SEO Readiness

| Element | Status | Detail |
|---------|--------|--------|
| Sitemap | Yes | Dynamic, paginated, multi-channel with hreflang |
| Robots.txt | Yes | Strict rules blocking auth/checkout/cart |
| JSON-LD (Organization) | Yes | Homepage — name, logo, contact |
| JSON-LD (WebSite + Search) | Yes | Homepage — SearchAction |
| JSON-LD (Product) | No | Missing on product detail pages |
| JSON-LD (BreadcrumbList) | No | Missing across all pages |
| JSON-LD (FAQPage) | No | FAQ page exists but no schema |
| Open Graph / Twitter Cards | Partial | Basic meta tags via Next.js metadata |
| Canonical URLs | Yes | Via Next.js default behavior |
| hreflang | Yes | Hebrew (he), English (en), x-default |

### 4.4 Trust & Conversion Signals

| Signal | Status | Detail |
|--------|--------|--------|
| Customer Reviews | Partial | GraphQL operations exist (CreateProductReview, etc.); UI needs completion |
| Trust Badges | Yes | Configurable via Storefront Control |
| SSL Indicators | Yes | HTTPS via Cloudflare tunnels |
| Return Policy | Yes | Dedicated CMS page |
| Stock Alerts | Yes | Subscribe/unsubscribe GraphQL operations |
| Wishlist | Yes | Full implementation with persistence |
| Newsletter Signup | Yes | Homepage section + dedicated app |
| Social Proof | No | No real-time "X people viewing" or purchase notifications |

### 4.5 Performance

| Metric | Status | Detail |
|--------|--------|--------|
| Server-Side Rendering | Yes | Next.js App Router with server components |
| Image Optimization | Yes | Next.js Image with Docker-aware remote patterns |
| Bundle Optimization | Yes | Turbopack, tree-shaking, code splitting |
| Core Web Vitals Monitoring | No | No RUM, no Lighthouse CI, no performance budgets |
| CDN | Partial | Cloudflare tunnel provides edge caching |
| Lazy Loading | Yes | Next.js dynamic imports, image lazy loading |

---

## 5. Technical Debt & Quality

### 5.1 Code Quality Metrics

| Metric | Dashboard | Storefront | Apps |
|--------|-----------|------------|------|
| TypeScript Files | 3,313 | 537 | ~500 |
| Lines of Code | ~115,000 | ~50,000 | ~30,000 |
| TODO/FIXME Comments | 77 | 3 | ~10 |
| eslint-disable (active code) | ~60 | ~10 | ~9 |
| Test Files | 348 | 0 | ~20 |
| Storybook Stories | 0 | — | — |

### 5.2 TypeScript Strict Mode

| Project | Strict | Notes |
|---------|--------|-------|
| Storefront | Yes | Fully enforced |
| Dashboard | No | Uses `typescript-strict-plugin` for gradual migration |
| Apps (monorepo) | Yes | Workspace-level strict |

### 5.3 Notable Technical Debt

1. **Dashboard strict mode**: Global `strict: false` — the strict plugin provides gradual enforcement but doesn't catch everything
2. **Storybook**: Infrastructure configured, zero stories — no visual regression testing possible
3. **Storefront tests**: Zero unit or integration tests; relies solely on TypeScript + ESLint
4. **Checkout Root.tsx**: 12,341 lines — largest single file in the codebase
5. **macaw-ui dependency**: ~140 files still use macaw-ui-next components (which internally use MUI)
6. **Adyen payment**: Scaffolded but not production-ready

### 5.4 Large Files (>1,000 lines)

| File | Lines | Notes |
|------|-------|-------|
| `storefront/src/checkout/Root.tsx` | 12,341 | Checkout mini-app (client component) |
| `storefront/src/providers/StoreConfigProvider.tsx` | 1,975 | 64 config hooks |
| `storefront/src/config/store.config.ts` | 1,475 | Type definitions + defaults |
| `apps/apps/storefront-control/.../defaults.ts` | 1,665 | Default config values |
| `apps/packages/storefront-config/src/schema/` | 2,332 | Across 20 files (acceptable) |

---

## 6. Security & Compliance

### 6.1 Authentication & Authorization

| Area | Status | Detail |
|------|--------|--------|
| User Auth | Secure | `@saleor/auth-sdk` with httpOnly cookies |
| Admin Auth | Secure | Saleor dashboard authentication |
| App Auth | Secure | App tokens + webhook HMAC verification |
| CSRF Protection | Yes | Django CSRF middleware |
| Rate Limiting | Yes | Nginx: 10 req/s API, 5 req/s GraphQL |

### 6.2 Data Protection

| Area | Status | Detail |
|------|--------|--------|
| .env Files | Safe | Not in git; examples/templates only |
| Secret Management | Basic | Environment variables; no vault service |
| CSP Headers | Yes | Nginx config with strict policy |
| HSTS | Yes | Strict-Transport-Security header |
| X-Frame-Options | Yes | DENY for dashboard |

### 6.3 Compliance Readiness

| Standard | Status | Gaps |
|----------|--------|------|
| PCI DSS | Delegated | Stripe handles card data; no PAN touches server |
| GDPR | Partial | Account deletion available; no explicit consent management UI, no data export |
| Cookie Consent | No | No cookie consent banner |
| Accessibility (WCAG) | Partial | Semantic HTML; no formal audit |

---

## 7. Observability & Monitoring

### 7.1 Current State

| Tool | Scope | Status |
|------|-------|--------|
| Sentry | Error tracking | Storefront + Dashboard + 3 apps (Stripe, SMTP, Invoices) |
| OpenTelemetry | Tracing | Package ready (`@saleor/apps-otel`); disabled in dev (`OTEL_ENABLED=false`) |
| JSON Logging | Structured logs | `@saleor/apps-logger` with tslog |
| Docker Health Checks | Container health | All services configured |

### 7.2 Gaps

| Need | Status | Impact |
|------|--------|--------|
| APM (Application Performance Monitoring) | Missing | No request latency tracking, no slow query detection |
| Distributed Tracing | Configured, not active | OpenTelemetry packages installed but disabled |
| Synthetic Monitoring | Missing | No uptime checks, no scheduled health probes |
| Log Aggregation | Missing | No ELK/Loki/CloudWatch; logs only in Docker stdout |
| Alerting | Missing | No PagerDuty/OpsGenie; Sentry alerts only |
| Business Metrics Dashboard | Missing | No real-time conversion/revenue dashboard |
| Core Web Vitals RUM | Missing | No field performance data collection |

---

## 8. Deployment & Operations

### 8.1 Current Infrastructure

| Component | Technology | Status |
|-----------|-----------|--------|
| Development | Docker Compose (17 services) | Production-grade |
| Tunneling | Cloudflare (12 ingress rules) | All services exposed |
| Reverse Proxy | Nginx | Rate limiting, SSL, CSP |
| Database Backup | pg_dump scripts | Manual trigger |
| CI/CD | GitHub Actions | 1 workflow (storefront only) |

### 8.2 Automation Scripts

| Category | Count | Examples |
|----------|-------|---------|
| Launch & Deploy | 8 | `launch-platform.ps1`, `install-dashboard-apps.ps1` |
| Tunneling | 12 | Per-service tunnel scripts + `tunnel-all.ps1` |
| Database | 6 | `backup-db.sh`, `restore-db.sh`, init scripts |
| Stripe Setup | 3 | `setup-stripe-env.ps1`, credentials |
| Utilities | 10+ | RSA key gen, service restart, mode toggle |
| Catalog Generator | 5 | `npm run setup`, deploy, translate, generate |
| **Total** | **74** | 52 PowerShell + 22 bash |

### 8.3 CI/CD Coverage

| Service | CI Pipeline | CD Pipeline |
|---------|-------------|-------------|
| Storefront | Yes (type-check, lint, build) | No |
| Dashboard | No | No |
| Apps (10) | No | No |
| Backend (Saleor) | No | No |

### 8.4 Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| PRD.md | Root | Authoritative product spec |
| CLAUDE.md | Root | AI assistant instructions (comprehensive) |
| AGENTS.md | Root | Agent guidelines & workflows |
| QUICK-START.md | Root | Developer setup guide |
| MVP-ROADMAP.md | Root | Feature roadmap |
| DEPLOYMENT-OPTIONS.md | Root | Deployment strategies |
| PRODUCTION-LAUNCH-PLAN.md | Root | Go-live checklist |
| SELF-HOSTED-PLAN.md | Root | Self-hosted infrastructure |
| SETUP.md | `scripts/catalog-generator/` | Catalog generator docs |

---

## 9. Improvement Roadmap (Prioritized)

### P0 — Pre-Launch Blockers

These must be resolved before going live:

| Item | Effort | Impact | Detail |
|------|--------|--------|--------|
| Analytics Integration (GA4/GTM) | 4-6 hrs | Critical | No behavioral analytics, no conversion tracking, no traffic attribution |
| Staging Environment Validation | 2-3 hrs | Critical | Verify all services in staging; currently dev-only |
| Email Flow Verification | 1-2 hrs | Critical | Verify all SMTP transactional emails (order confirm, shipping, welcome) |
| Cookie Consent Banner | 2-3 hrs | Legal | Required for EU/IL privacy compliance |
| Product JSON-LD Schema | 3-4 hrs | SEO | Missing structured data on product pages hurts search visibility |

### P1 — First Month Post-Launch

| Item | Effort | Impact | Detail |
|------|--------|--------|--------|
| E2E Testing (Playwright) | 20-30 hrs | High | Zero tests for critical flows (checkout, auth, cart) |
| CI/CD for All Services | 15-20 hrs | High | Only storefront has CI; dashboard, apps, backend unprotected |
| Rate Limiting (App-Level) | 4-6 hrs | Medium | Nginx rate limiting exists but no app-level throttling |
| Reviews/Ratings UI | 8-12 hrs | High | GraphQL operations exist; UI needs implementation |
| Performance Monitoring | 8-10 hrs | High | Core Web Vitals RUM, Lighthouse CI, performance budgets |
| Abandoned Cart Emails | 6-8 hrs | High | 3-email recovery sequence; proven 5-15% recovery rate |
| GDPR Consent Management | 4-6 hrs | Legal | Data export, explicit consent, cookie preferences |

### P2 — Quarter 1

| Item | Effort | Impact | Detail |
|------|--------|--------|--------|
| BNPL Integration (Klarna/Afterpay) | 15-20 hrs | High | 20-30% conversion lift for fashion/shoes |
| A/B Testing Framework | 10-15 hrs | Medium | Feature flags + variant allocation + analytics |
| Blue-Green Deployment | 8-12 hrs | Medium | Zero-downtime deployments |
| Storybook Component Library | 15-20 hrs | Medium | 0 stories currently; infrastructure ready |
| Dashboard Strict TypeScript | 10-15 hrs | Medium | Gradual migration from plugin to global strict |
| Load Testing Automation | 6-8 hrs | Medium | k6 or Artillery scripts for checkout/API |
| Incident Response Runbooks | 4-6 hrs | Medium | Documented procedures for outages |
| Customer Loyalty Program | 20-30 hrs | High | Points, tiers, rewards — drives repeat purchases |
| BreadcrumbList JSON-LD | 2-3 hrs | Low | Structured data for navigation breadcrumbs |
| FAQPage JSON-LD | 1-2 hrs | Low | Structured data for FAQ page |
| Log Aggregation (Loki/ELK) | 8-12 hrs | Medium | Centralized log search and alerting |
| Synthetic Monitoring | 4-6 hrs | Medium | Uptime checks, scheduled health probes |

---

## 10. Key Metrics Dashboard

| Category | Metric | Value |
|----------|--------|-------|
| **Codebase** | TypeScript files (storefront) | 537 |
| | TypeScript files (dashboard) | 3,313 |
| | Lines of code (storefront) | ~50,000 |
| | Lines of code (dashboard) | ~115,000 |
| **Configuration** | Config schema domains | 20 |
| | Config hooks | 64 |
| | Config sync locations | 11 |
| | Sample config files | 2 (Hebrew + English) |
| **Routes** | Storefront pages | 34 |
| | GraphQL operations | 58 |
| | GraphQL fragments | 3 |
| **Testing** | Dashboard test files | 348 |
| | Storefront test files | 0 |
| | Storybook stories | 0 |
| **Quality** | TODO/FIXME (dashboard) | 77 |
| | TODO/FIXME (storefront) | 3 |
| | eslint-disable (active code) | 79 |
| **Infrastructure** | Docker services | 17 |
| | Docker volumes | 24 |
| | Cloudflare ingress rules | 12 |
| | Automation scripts | 74 |
| | CI/CD workflows | 1 |
| **Apps** | Saleor apps | 10 |
| | Shared packages | 14 |
| | Sentry-integrated packages | 7 |
| | OpenTelemetry packages | 6 |
| **Commerce** | Payment methods | Stripe (Cards, Apple/Google Pay) |
| | Channels | 2 (ILS/Hebrew/RTL + USD/English/LTR) |
| | Supported currencies | 2 (ILS, USD) |
| | Bulk import entity types | 7 |

---

*This document should be updated quarterly or after significant platform changes.*
