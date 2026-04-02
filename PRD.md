# Product Requirements Document (PRD)

## Aura E-Commerce Platform

**Version:** 1.9.0
**Last Updated:** March 12, 2026
**Status:** Active Development
**Document Owner:** Development Team

---

> **IMPORTANT: Document Maintenance**
>
> This PRD is the authoritative source of truth for all AI agents and developers working on this project.
>
> - **This document MUST be kept up-to-date** whenever significant changes are made to architecture, features, or workflows.
> - **The `AGENTS.md` file MUST also be updated** in parallel when development patterns, commands, or app behaviors change.
> - Both documents serve as guidelines for AI agents (Claude, Cursor, Copilot, Antigravity, etc.) and human developers.
> - **Review Cycle:** Monthly or after major feature releases.
>
> **CORE PRINCIPLES (See Section 2.3):**
>
> 1. **Scalability First** - Design for 10x growth from day one
> 2. **Configuration Over Code** - Everything configurable via Storefront Control
> 3. **Multi-Tenancy Ready** - Support multiple brands/stores from one codebase
> 4. **Reusability & DRY** - Never duplicate, always extract and share
> 5. **Future-Proof** - Decouple concerns, plan for mobile, API-first

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Core Services & Containers](#5-core-services--containers)
6. [Storefront Application](#6-storefront-application)
7. [Storefront Control Integration](#7-storefront-control-integration)
8. [Admin Dashboard](#8-admin-dashboard)
9. [Saleor Apps Ecosystem](#9-saleor-apps-ecosystem)
10. [Feature Specifications](#10-feature-specifications)
11. [Localization & RTL Support](#11-localization--rtl-support)
12. [Development Workflow (Docker)](#12-development-workflow-docker)
13. [API Reference](#13-api-reference)
14. [Security & Compliance](#14-security--compliance)
15. [Performance Requirements](#15-performance-requirements)
16. [End-to-End Testing](#16-end-to-end-testing)
17. [Appendices](#appendices)

---

## 1. Executive Summary

### 1.1 Product Vision

Aura is a fully-featured, enterprise-grade, multi-tenant e-commerce platform built on the Saleor commerce platform. The system provides a modern, performant, and highly customizable online shopping experience with full support for multi-channel commerce, multi-currency transactions, and bidirectional language support (Hebrew/English with RTL/LTR). The first client storefront is **Mansour Shoes**.

### 1.2 Key Differentiators

- **Headless Commerce Architecture**: Decoupled frontend and backend enabling maximum flexibility
- **Full RTL/LTR Support**: Native bidirectional text support for Hebrew and English markets
- **CMS-Driven Configuration**: Real-time storefront customization without code deployments
- **Modular App Ecosystem**: Extensible via Saleor Apps for payments, analytics, email, and more
- **Enterprise Performance**: Next.js 16 with React 19, optimized for Core Web Vitals

### 1.3 Target Markets

| Market        | Channel | Currency           | Language | Direction |
| ------------- | ------- | ------------------ | -------- | --------- |
| Israel        | ILS     | Israeli Shekel (₪) | Hebrew   | RTL       |
| International | USD     | US Dollar ($)      | English  | LTR       |

---

## 2. Project Overview

### 2.1 Repository Structure

```
saleor-platform/
├── saleor/                    # Django/GraphQL Backend (Python 3.12)
├── dashboard/                 # Admin Dashboard (React 18 + Vite + Tailwind CSS v4)
├── storefront/               # Customer-Facing Storefront (Next.js 16, React 19)
├── apps/                     # Saleor Apps Monorepo (Turborepo)
│   ├── apps/
│   │   ├── storefront-control/   # CMS Configuration App (shadcn/ui + Tailwind)
│   │   ├── bulk-manager/         # Bulk Import/Export Manager
│   │   ├── stripe/               # Stripe Payment Gateway
│   │   ├── smtp/                 # Email Notifications
│   │   ├── invoices/             # PDF Invoice Generation
│   │   ├── newsletter/           # Newsletter & Campaigns
│   │   ├── sales-analytics/      # Sales Analytics Dashboard
│   │   ├── image-studio/         # AI-Powered Image Editor
│   │   ├── dropship-orchestrator/ # AliExpress + CJ Dropshipping
│   │   └── tax-manager/          # Self-Hosted Tax Calculation
│   └── packages/
│       └── storefront-config/    # Shared config schema & types (@saleor/apps-storefront-config)
├── scripts/
│   └── catalog-generator/        # Store infrastructure as code + product catalog generation
├── infra/                    # Docker Compose, Platform CLI & setup scripts
│   ├── platform.ps1              # Unified CLI entry point
│   ├── platform.yml              # Service registry (source of truth)
│   └── docker-compose.dev.yml    # Docker services orchestration
├── PRD.md                    # This document (keep updated!)
├── CLAUDE.md                 # Claude Code guidelines (keep updated!)
├── AGENTS.md                 # Agent guidelines (keep updated!)
└── QUICK-START.md            # Quick start guide for new developers
```

### 2.2 Project Goals

1. **Performance**: Sub-3s LCP, optimized images, streaming SSR
2. **Accessibility**: WCAG 2.1 AA compliance, full keyboard navigation
3. **Scalability**: Handle 10,000+ concurrent users
4. **Maintainability**: Type-safe codebase, comprehensive testing
5. **Flexibility**: Config-driven UI without code changes

### 2.3 Core Design Principles

> **CRITICAL: These principles MUST guide every feature and code change.**

#### Principle 1: Scalability First

Every feature must be designed with scalability in mind from day one:

- **Data Scalability**: Design for 100,000+ products, 1M+ orders, 500k+ customers
- **Traffic Scalability**: Assume 10x traffic spikes during sales/promotions
- **Code Scalability**: Write modular, composable code that can be extended
- **Team Scalability**: Code should be understandable by new developers quickly

**Implementation Guidelines:**

- Use pagination for all list queries (never fetch all records)
- Implement proper database indexing
- Use Redis caching for frequently accessed data
- Design APIs to be stateless
- Use background jobs (Celery) for heavy operations
- Implement proper error boundaries to prevent cascade failures

```typescript
// ❌ BAD: Non-scalable approach
const allProducts = await fetchAllProducts(); // Will fail at scale

// ✅ GOOD: Scalable approach
const { products, pageInfo } = await fetchProducts({
  first: 24,
  after: cursor,
  channel,
});
```

#### Principle 2: Configuration Over Code

The platform must be **highly configurable** to enable:

- Rapid deployment of new store instances
- White-label solutions for different brands
- A/B testing of features and UI
- Quick iterations without code deployments

**Everything should be configurable via Storefront Control:**

| Category         | Configurable Elements                                   |
| ---------------- | ------------------------------------------------------- |
| **Branding**     | Logo, colors (10 tokens), typography, border radius     |
| **Features**     | 19+ feature flags (wishlist, reviews, newsletter, etc.) |
| **Content**      | All UI text, labels, messages, CTAs                     |
| **Layout**       | Homepage sections, header style, footer content         |
| **Behavior**     | Filters, sorting, pagination, related products strategy |
| **SEO**          | Title templates, meta descriptions, OG images           |
| **Localization** | RTL/LTR, date formats, currency display                 |

**When Adding New Features:**

```typescript
// ❌ BAD: Hardcoded behavior
const MAX_RELATED_PRODUCTS = 8;
const RELATED_TITLE = "You May Also Like";

// ✅ GOOD: Configurable via Storefront Control
const { maxItems, title, subtitle, strategy } = useRelatedProductsConfig();
```

**New Feature Checklist:**

1. [ ] Add configuration schema in `schema.ts`
2. [ ] Add defaults in `defaults.ts`
3. [ ] Add TypeScript types in `store.config.ts`
4. [ ] Create/update React hook in `StoreConfigProvider.tsx`
5. [ ] Update sample config JSONs (both languages)
6. [ ] Add UI controls in Storefront Control dashboard (if user-facing)
7. [ ] Document in PRD feature specifications

#### Principle 3: Multi-Tenancy Ready

Design every feature to support multiple stores/brands from a single codebase:

- **Channel-Based Configuration**: All settings are per-channel
- **No Hardcoded Values**: Store name, URLs, branding - all from config
- **Isolated Data**: Each channel's data is logically separated
- **Shared Codebase**: One deployment serves multiple storefronts

**Architecture Pattern:**

```
┌─────────────────────────────────────────────────────────┐
│                    Shared Codebase                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Storefront (Next.js)                │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│           ┌──────────────┼──────────────┐               │
│           ▼              ▼              ▼               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ Channel: ILS│ │ Channel: USD│ │ Channel: EUR│       │
│  │ Brand: A    │ │ Brand: A    │ │ Brand: B    │       │
│  │ Hebrew/RTL  │ │ English/LTR │ │ German/LTR  │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

#### Principle 4: Reusability & DRY

- **Extract common patterns** into reusable components/hooks
- **Use composition** over inheritance
- **Share logic** via custom hooks
- **Never duplicate** business logic

```typescript
// ❌ BAD: Duplicated price formatting in multiple files
const price = `$${product.price.toFixed(2)}`;

// ✅ GOOD: Reusable hook
const { formatPrice } = usePriceFormatter();
const price = formatPrice(product.pricing);
```

#### Principle 5: Future-Proof Architecture

- **Decouple concerns**: UI, business logic, data fetching
- **Use interfaces/types**: Enable easy swapping of implementations
- **Plan for mobile**: Every feature should work on React Native eventually
- **API-first**: All features accessible via GraphQL

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │
│  │   Next.js 16        │    │   React Dashboard   │    │   Mobile Apps   │  │
│  │   Storefront        │    │   (Vite + React)    │    │   (Future)      │  │
│  │   - SSR/ISR         │    │   - SPA             │    │                 │  │
│  │   - React 19        │    │   - Macaw UI        │    │                 │  │
│  │   - Tailwind CSS    │    │                     │    │                 │  │
│  └─────────┬───────────┘    └─────────┬───────────┘    └────────┬────────┘  │
│            │                          │                          │           │
├────────────┼──────────────────────────┼──────────────────────────┼───────────┤
│            │                          │                          │           │
│            ▼                          ▼                          ▼           │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          GraphQL API Gateway                            │ │
│  │                    (Saleor Core - Django/Graphene)                      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                      │
├───────────────────────────────────────┼──────────────────────────────────────┤
│                              SERVICE LAYER                                   │
├───────────────────────────────────────┼──────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌─────┴─────┐ ┌────────────┐ ┌────────────┐  │
│  │ Stripe App │ │ SMTP App   │ │ Invoice   │ │ Newsletter │ │ Sales      │  │
│  │ (Payments) │ │ (Email)    │ │ App       │ │ App        │ │ Analytics  │  │
│  └────────────┘ └────────────┘ └───────────┘ └────────────┘ └────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │                        Tax Manager App                                │   │
│  │  Self-hosted tax calculation with country/state rates, preset libs   │   │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │       Bulk Manager App             │  │  Shared Config Package         │  │
│  │  Import/Export: Products,          │  │  @saleor/apps-storefront-config│  │
│  │  Categories, Collections,          │  │  Schema, Types, Migrations     │  │
│  │  Customers, Orders, Vouchers,      │  │  (20 domain schema files)      │  │
│  │  Gift Cards                        │  │                                │  │
│  └────────────────────────────────────┘  └────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │       Image Studio App             │  │  Dropship Orchestrator App     │  │
│  │  AI-powered product image editor   │  │  AliExpress + CJ Dropshipping │  │
│  │  Canvas, BG removal, upscaling,    │  │  Order forwarding, tracking,  │  │
│  │  generation, templates             │  │  fraud detection, exceptions   │  │
│  └────────────────────────────────────┘  └────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     Storefront Control App (CMS)                        │ │
│  │  Page-based CMS (11 pages): Homepage, PLP, PDP, Cart, Checkout,       │ │
│  │  Account, Auth, Layout, Static Pages, Global Design, Component Dsnr   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                              DATA LAYER                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐    ┌────────────────────────┐                   │
│  │   PostgreSQL 15        │    │   Redis 7              │                   │
│  │   - Products           │    │   - Session Cache      │                   │
│  │   - Orders             │    │   - Celery Broker      │                   │
│  │   - Users              │    │   - Rate Limiting      │                   │
│  │   - App Configs        │    │                        │                   │
│  └────────────────────────┘    └────────────────────────┘                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
Customer Request → CDN → Next.js SSR → GraphQL Query → Saleor API → PostgreSQL
                                                    ↓
                                              Redis Cache
                                                    ↓
                                    Celery Workers (async tasks)
                                                    ↓
                                    Saleor Apps (webhooks)
```

---

## 4. Technology Stack

### 4.1 Frontend Technologies

| Component      | Technology   | Version | Purpose                    |
| -------------- | ------------ | ------- | -------------------------- |
| **Storefront** | Next.js      | 16.1.6  | SSR/ISR, App Router        |
| **React**      | React        | 19.2.4  | UI Components              |
| **Styling**    | Tailwind CSS | 4.1.18  | Utility-first CSS (storefront + dashboard) |
| **State**      | Zustand      | 5.0.11  | Client state management    |
| **Forms**      | Formik + Yup | 2.4.5   | Form handling & validation |
| **Icons**      | Lucide React | 0.358.0 | Icon library               |
| **Payments**   | Stripe.js    | 7.3.0   | Payment UI components      |
| **GraphQL**    | URQL         | 5.0.1   | GraphQL client             |
| **Dashboard**  | Vite + React 18 | 6.4.1 / 18.3.1 | Admin SPA              |
| **Dashboard Styling** | Tailwind CSS v4 | 4.1.18 | Dashboard utility CSS (px overrides for macaw-ui compat) |
| **Dashboard UI** | macaw-ui-next + Lucide | 1.4.1 | Dashboard components + icons |
| **Dashboard Routing** | React Router | 7.13.0 | Client-side routing |

### 4.2 Backend Technologies

| Component     | Technology  | Version | Purpose                   |
| ------------- | ----------- | ------- | ------------------------- |
| **API**       | Saleor Core | 3.23.0  | E-commerce engine         |
| **Framework** | Django      | 5.2.8   | Web framework             |
| **GraphQL**   | Graphene    | 2.x     | GraphQL implementation    |
| **Database**  | PostgreSQL  | 15      | Primary data store        |
| **Cache**     | Redis       | 7       | Caching & message broker  |
| **Tasks**     | Celery      | Latest  | Background job processing |
| **Python**    | Python      | 3.12    | Runtime                   |

### 4.3 Apps Monorepo Technologies

| Component      | Technology | Version | Purpose                     |
| -------------- | ---------- | ------- | --------------------------- |
| **Build**      | Turborepo  | Latest  | Monorepo build system       |
| **Framework**  | Next.js    | 15.x+   | Pages Router for apps       |
| **UI (legacy)**| Macaw UI   | Latest  | Saleor design system (most apps) |
| **UI (new)**   | shadcn/ui + Radix | Latest  | Storefront Control admin UI |
| **Styling**    | Tailwind CSS | Latest | Storefront Control styling  |
| **Forms**      | React Hook Form + Zod | Latest | Storefront Control forms |
| **API**        | tRPC       | Latest  | Type-safe APIs              |
| **Validation** | Zod        | Latest  | Schema validation           |
| **Errors**     | neverthrow | Latest  | Result-based error handling |
| **Charts**     | Tremor     | Latest  | Analytics visualizations    |
| **Drag/Drop**  | @dnd-kit   | Latest  | Homepage section reordering |
| **Search**     | cmdk       | Latest  | Command palette (Cmd+K)     |
| **Shared**     | @saleor/apps-storefront-config | 1.0.0 | Shared config schema & types |

### 4.4 Infrastructure

| Component            | Technology               | Purpose            |
| -------------------- | ------------------------ | ------------------ |
| **Containerization** | Docker Compose           | Local development  |
| **Reverse Proxy**    | Nginx (optional)         | Production routing |
| **CDN**              | Cloudflare (recommended) | Edge caching       |

---

## 5. Core Services & Containers

### 5.1 Docker Compose Services

All development happens inside Docker containers. **Never run npm/pnpm/npx directly on host** — always use `docker exec`.

| Container                           | Port | Description              |
| ----------------------------------- | ---- | ------------------------ |
| `aura-postgres-dev`               | 5432 | PostgreSQL database      |
| `aura-redis-dev`                  | 6379 | Redis cache/broker       |
| `aura-api-dev`                    | 8000 | Saleor GraphQL API       |
| `aura-worker-dev`                 | -    | Celery background worker |
| `aura-scheduler-dev`              | -    | Celery beat scheduler    |
| `aura-dashboard-dev`              | 9000 | Admin dashboard          |
| `aura-storefront-dev`             | 3000 | Customer storefront      |
| `aura-storefront-control-app-dev` | 3004 | CMS configuration        |
| `aura-stripe-app-dev`             | 3002 | Stripe payments          |
| `aura-smtp-app-dev`               | 3001 | Email notifications      |
| `aura-invoice-app-dev`            | 3003 | PDF invoices             |
| `aura-newsletter-app-dev`         | 3005 | Newsletter management    |
| `aura-sales-analytics-app-dev`    | 3006 | Sales analytics          |
| `aura-bulk-manager-app-dev`       | 3007 | Bulk import/export       |
| `aura-image-studio-app-dev`      | 3008 | AI image editor          |
| `aura-dropship-app-dev`          | 3009 | Dropship orchestrator    |
| `aura-tax-manager-app-dev`       | 3010 | Tax calculation engine   |
| `aura-rembg-dev`                 | 7000 | AI background removal    |
| `aura-esrgan-dev`                | 7001 | AI image upscaling       |

### 5.2 Container Dependencies

```
PostgreSQL ─┬─→ Saleor API ─→ Dashboard
            │        │
Redis ──────┤        ├─→ Storefront
            │        │
            └─→ Celery Worker/Scheduler
                     │
                     └─→ Saleor Apps (via webhooks)
```

### 5.3 Docker Compose Commands

```bash
# Start all services
docker compose -f infra/docker-compose.dev.yml up -d

# View logs for a specific container
docker compose -f infra/docker-compose.dev.yml logs -f aura-storefront-dev

# Restart specific service
docker compose -f infra/docker-compose.dev.yml restart aura-storefront-dev

# Check container status
docker compose -f infra/docker-compose.dev.yml ps

# Stop all services
docker compose -f infra/docker-compose.dev.yml down

# Rebuild a specific container (after Dockerfile changes)
docker compose -f infra/docker-compose.dev.yml build aura-storefront-dev
```

---

## 6. Storefront Application

### 6.1 Overview

The storefront is a Next.js 16 application using the App Router, React 19, and Tailwind CSS. It provides a modern, performant, and accessible e-commerce experience.

### 6.2 Directory Structure

```
storefront/src/
├── app/                      # Next.js App Router
│   └── [channel]/           # Dynamic channel routing (ils, usd)
│       ├── (main)/          # Main layout group
│       │   ├── page.tsx     # Homepage
│       │   ├── products/    # Product pages
│       │   ├── categories/  # Category pages
│       │   ├── cart/        # Shopping cart
│       │   ├── account/     # User account
│       │   └── search/      # Search results
│       └── checkout/        # Checkout layout (routes to checkout-v2)
├── checkout-v2/             # Accordion checkout (App Router, React Hook Form + Zod)
│   ├── _actions/            # 11 server actions (create, update, complete checkout)
│   ├── _components/         # Step components (Contact, Shipping, Delivery, Payment)
│   └── confirmation/        # Order confirmation page
├── ui/                      # UI Components
│   └── components/          # Reusable components
├── providers/               # React Context providers
├── lib/                     # Utilities & helpers
│   └── checkout/            # Shared checkout modules (GraphQL types, hooks, utils)
├── graphql/                 # GraphQL queries/mutations
├── gql/                     # Generated GraphQL types
└── config/                  # Static configuration files
```

### 6.3 Key Pages

| Route                | Component                  | Description                                    |
| -------------------- | -------------------------- | ---------------------------------------------- |
| `/`                  | `HomePage.tsx`             | Landing page with hero, products, testimonials |
| `/products`          | `ProductsGrid.tsx`         | Product listing with filters                   |
| `/products/[slug]`   | `ProductDetailClient.tsx`  | Product detail page                            |
| `/categories/[slug]` | `CategoryProductsGrid.tsx` | Category product listing                       |
| `/cart`              | `CartPage.tsx`             | Shopping cart (drawer + page mode)             |
| `/checkout`          | Checkout V2 (accordion)    | Single-page accordion: Contact → Shipping → Delivery → Payment |
| `/account`           | Account dashboard          | User orders, addresses, settings               |
| `/login`             | `LoginClient.tsx`          | Authentication                                 |

### 6.4 Component Library

#### Core Components

| Component         | Location                         | Description                              |
| ----------------- | -------------------------------- | ---------------------------------------- |
| `ProductCard`     | `ui/components/ProductCard/`     | Product tile with image, price, wishlist |
| `CartDrawer`      | `ui/components/CartDrawer/`      | Slide-out shopping cart                  |
| `Header`          | `ui/components/Header.tsx`       | Site header with nav, search, cart       |
| `Footer`          | `ui/components/Footer.tsx`       | Site footer with links, newsletter       |
| `ProductFilters`  | `ui/components/Filters/`         | Sidebar filters                          |
| `ProductReviews`  | `ui/components/ProductReviews/`  | Review list and form                     |
| `RelatedProducts` | `ui/components/RelatedProducts/` | "You May Also Like" carousel             |
| `PromoPopup`      | `ui/components/PromoPopup/`      | Promotional modal                        |

#### Context Providers

| Provider              | File                                | Purpose                   |
| --------------------- | ----------------------------------- | ------------------------- |
| `StoreConfigProvider` | `providers/StoreConfigProvider.tsx` | CMS configuration context |
| `CartDrawerProvider`  | `providers/CartDrawerProvider.tsx`  | Cart drawer state         |
| `QuickViewProvider`   | `providers/QuickViewProvider.tsx`   | Product quick view modal  |
| `DirectionProvider`   | `providers/DirectionProvider.tsx`   | RTL/LTR direction         |

### 6.5 GraphQL Integration

```typescript
// Example: Fetching product details
import { ProductDetailsDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

const { product } = await executeGraphQL(ProductDetailsDocument, {
  variables: { slug: "product-slug", channel: "usd" },
  revalidate: 60, // ISR cache duration
});
```

### 6.6 Key Features

- **Server-Side Rendering (SSR)**: Initial page loads rendered on server
- **Incremental Static Regeneration (ISR)**: Automatic page revalidation (60s default)
- **Streaming**: React Suspense for non-blocking UI
- **Image Optimization**: Next.js Image with WEBP, lazy loading
- **Search Autocomplete**: Real-time product search suggestions
- **Wishlist**: Persistent wishlist with Zustand
- **Related Products**: Category-based product recommendations
- **GA4/GTM Analytics**: Consent-gated Google Tag Manager with full GA4 e-commerce events (view_item, add_to_cart, begin_checkout, purchase, search). Events queue before consent and flush after. Deduplication prevents double-firing.
- **Cookie Consent**: GDPR-compliant banner with 3 categories (essential/analytics/marketing). Configurable via Storefront Control (position, expiry, all text translatable). localStorage-based with `consent-updated` custom event.
- **Product JSON-LD**: Structured data on PDP (Product, Offer, BreadcrumbList) for Google rich results

---

## 7. Storefront Control Integration

### 7.1 Architecture Overview

The Storefront Control App is a Saleor App that acts as a CMS for the storefront. It allows store administrators to customize the storefront UI without deploying code.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STOREFRONT CONTROL ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐                                                    │
│  │ Saleor Dashboard    │                                                    │
│  │ (Admin UI)          │                                                    │
│  │  └─ Apps Section    │──────┐                                             │
│  └─────────────────────┘      │                                             │
│                               ▼                                              │
│  ┌─────────────────────────────────────────┐                                │
│  │ Storefront Control App (Port 3004)       │                                │
│  │ ─────────────────────────────────────── │                                │
│  │ • Page-Based CMS (11 pages like Shopify)  │                                │
│  │ • Component Designer (47 wired components)│                                │
│  │ • shadcn/ui + Tailwind CSS + Radix UI    │                                │
│  │ • Cmd+K Command Palette + Search         │                                │
│  │ • Live Preview (PostMessage iframe bridge)│                                │
│  │ • Homepage Section Drag & Drop + Reorder │                                │
│  └──────────────┬──────────────────────────┘                                │
│                 │                                                            │
│                 │ Saves config via App Metadata API                          │
│                 ▼                                                            │
│  ┌─────────────────────────────────────────┐                                │
│  │ Saleor API (App Metadata Storage)        │                                │
│  │ ─────────────────────────────────────── │                                │
│  │ • Stores JSON config per channel         │                                │
│  │ • Versioned configuration                │                                │
│  │ • Private app metadata                   │                                │
│  └──────────────┬──────────────────────────┘                                │
│                 │                                                            │
│                 │ Storefront fetches on each request                         │
│                 ▼                                                            │
│  ┌─────────────────────────────────────────┐                                │
│  │ Next.js Storefront (Port 3000)           │                                │
│  │ ─────────────────────────────────────── │                                │
│  │ • fetchStorefrontConfig(channel)         │──┐                            │
│  │ • StoreConfigProvider (React Context)    │  │                            │
│  │ • useFeature(), useBranding() hooks      │  │                            │
│  │ • Config-driven component rendering      │  │                            │
│  └─────────────────────────────────────────┘  │                             │
│                                               │                              │
│  ┌────────────────────────────────────────┐   │                             │
│  │ Fallback: Sample Config Files          │◀──┘                             │
│  │ ────────────────────────────────────── │   (if API unavailable)         │
│  │ • sample-config-import.json (Hebrew)   │                                 │
│  │ • sample-config-import-en.json (English)│                                │
│  └────────────────────────────────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Configuration Flow

1. **Admin Access**: Store admin opens Dashboard → Apps → Storefront Control
2. **Channel Selection**: Admin selects channel (ILS or USD)
3. **Configuration**: Admin modifies settings (theme, features, content)
4. **Save**: Config is saved to Saleor API as App Metadata (JSON)
5. **Storefront Load**: On each page request, storefront calls `fetchStorefrontConfig(channel)`
6. **Context Injection**: Config is passed to `StoreConfigProvider`
7. **Component Rendering**: Components read config via hooks (`useFeature`, `useBranding`, etc.)

### 7.3 Configuration Sources (Priority Order)

| Priority    | Source                 | Location                                | Use Case                        |
| ----------- | ---------------------- | --------------------------------------- | ------------------------------- |
| 1 (Highest) | Storefront Control App | Saleor API Metadata                     | Production, runtime config      |
| 2           | Sample Config Files    | `apps/apps/storefront-control/*.json`   | Development fallback            |
| 3           | Static Config          | `storefront/src/config/store.config.ts` | Type definitions, base defaults |

### 7.4 Key Configuration Files

#### Schema Definition (Zod)

**File:** `apps/apps/storefront-control/src/modules/config/schema.ts`

```typescript
// Admin form schema (~227 lines, validates admin inputs)
// Full config schema lives in shared package: @saleor/apps-storefront-config (2,332 lines across 20 files)
export const StorefrontConfigSchema = z.object({
  version: z.number(),
  channelSlug: z.string(),
  store: StoreSchema, // Name, tagline, contact
  branding: BrandingSchema, // Logo, colors, typography
  features: FeaturesSchema, // 19+ feature flags
  ecommerce: EcommerceSchema, // Currency, shipping, tax
  header: HeaderSchema, // Banner, logo position
  footer: FooterSchema, // Links, newsletter
  homepage: HomepageSchema, // Section config
  filters: FiltersSchema, // Product filters
  quickFilters: QuickFiltersSchema,
  promoPopup: PromoPopupSchema,
  ui: UiSchema, // Buttons, badges, inputs
  content: ContentSchema, // All UI text (cart, checkout, etc.)
  localization: LocalizationSchema,
  relatedProducts: RelatedProductsSchema,
});
```

#### Default Values

**File:** `apps/apps/storefront-control/src/modules/config/defaults.ts`

Contains complete default configuration for all schema properties.

#### Sample Configs

| File                           | Channel | Language      | Purpose                 |
| ------------------------------ | ------- | ------------- | ----------------------- |
| `sample-config-import.json`    | ILS     | Hebrew (RTL)  | Hebrew market defaults  |
| `sample-config-import-en.json` | USD     | English (LTR) | English market defaults |

### 7.5 Storefront Integration

#### Fetching Config

**File:** `storefront/src/lib/storefront-control.ts`

```typescript
export async function fetchStorefrontConfig(
  channel: string
): Promise<StoreConfig> {
  // 1. Try to fetch from Storefront Control App API
  // 2. Fall back to sample config files
  // 3. Fall back to static defaults
}
```

#### Provider Setup

**File:** `storefront/src/app/[channel]/(main)/layout.tsx`

```typescript
export default async function RootLayout({ children, params }) {
  const channel = (await params).channel;
  const storeConfig = await fetchStorefrontConfig(channel);

  return (
    <StoreConfigProvider config={storeConfig}>
      <Header />
      {children}
      <Footer />
    </StoreConfigProvider>
  );
}
```

#### Using Config in Components

**File:** `storefront/src/providers/StoreConfigProvider.tsx`

```typescript
// 64 exported hooks — core access patterns:
export function useStoreConfig(): StoreConfig;
export function useConfigSection<K>(key: K): StoreConfig[K];
export function useHomepageSection<K>(id: K): HomepageSectionConfig;
export function useFeature(feature: string): boolean;
export function useBranding(): BrandingConfig;
export function useContentConfig(): ContentConfig;
export function useRelatedProductsConfig(): RelatedProductsConfig;
// ... plus 57 more specialized hooks (see StoreConfigProvider.tsx)
```

**Usage Example:**

```typescript
function ProductCard({ product }) {
  const wishlistEnabled = useFeature("wishlist");
  const { colors } = useBranding();
  const { addToCartButton } = useContentConfig().product;

  return (
    <div style={{ borderColor: colors.primary }}>
      {wishlistEnabled && <WishlistButton />}
      <button>{addToCartButton}</button>
    </div>
  );
}
```

### 7.6 When to Update Configuration

| Change Type          | Files to Update                                             |
| -------------------- | ----------------------------------------------------------- |
| Add new feature flag | `schema.ts`, `defaults.ts`, `store.config.ts`, sample JSONs, `settings-index.ts`, admin page |
| Add new content/text | `schema.ts` (ContentSchema), `defaults.ts`, sample JSONs, `settings-index.ts` |
| Add new UI setting   | `schema.ts` (UiSchema), `defaults.ts`, sample JSONs, `settings-index.ts`, admin page |
| Change default value | `defaults.ts`, sample JSONs |
| Rename a field       | ALL 11 sync locations (see table below) |
| Remove a field       | ALL 11 sync locations + check storefront component references |

### 7.7 Configuration Sync Requirements

> **CRITICAL: All configuration files MUST stay in sync.** A mismatch between any file causes runtime errors, missing fields, or broken admin UI.

The following 11 locations form the configuration pipeline. When modifying any one, check whether the others also need updates:

| # | File / Location | Purpose | Sync Rule |
|---|-----------------|---------|-----------|
| 1 | `apps/packages/storefront-config/src/schema/` | Zod schema (source of truth) | Update for any new, renamed, or type-changed field |
| 2 | `apps/packages/storefront-config/src/types.ts` | Shared TypeScript types | Update for new top-level sections |
| 3 | `apps/apps/storefront-control/src/modules/config/defaults.ts` | Default config values | Every new field MUST have a default |
| 4 | `apps/apps/storefront-control/src/modules/config/schema.ts` | Admin form validation | Update when admin form needs new validation |
| 5 | `storefront/src/config/store.config.ts` | Storefront types & defaults | Update for any field the storefront reads |
| 6 | `storefront/src/providers/StoreConfigProvider.tsx` | React config hooks | Add/update hooks for new config sections |
| 7 | `sample-config-import.json` (Hebrew) | Dev fallback (ILS) | Every new field, with Hebrew translations |
| 8 | `sample-config-import-en.json` (English) | Dev fallback (USD) | Every new field, with English text |
| 9 | `apps/apps/storefront-control/src/lib/settings-index.ts` | Cmd+K search index | Every new admin-visible setting |
| 10 | `apps/apps/storefront-control/src/pages/[channelSlug]/` | Admin UI pages | New sections, tabs, or form fields |
| 11 | `PRD.md` / `CLAUDE.md` / `AGENTS.md` | Documentation | Significant changes |

**Sync Enforcement Rules:**

1. **Never add a schema field** without also adding: default value, sample config entries (both languages), and search index entry.
2. **Never add a storefront hook** without the corresponding schema field in the shared package.
3. **Never add an admin form field** without a search index entry — Cmd+K must find every setting.
4. **When renaming a field**, update ALL 11 locations — partial renames cause silent runtime breakage.
5. **When removing a field**, remove from ALL locations and search the storefront codebase for dangling references.
6. **After any config change**, restart both `aura-storefront-dev` and `aura-storefront-control-app-dev` containers.

---

## 8. Admin Dashboard

### 8.1 Overview

The Saleor Dashboard is a React single-page application built with Vite, providing comprehensive store management capabilities.

**Version:** 3.22.24
**Container:** `aura-dashboard-dev`
**Port:** 9000

### 8.2 Dashboard Modernization (D6 Migration)

The dashboard has been modernized from MUI v5 to a hybrid stack:

| Layer | Before (MUI v5) | After (D6) |
|-------|-----------------|-------------|
| **CSS Framework** | MUI's JSS (`makeStyles`) | Tailwind CSS v4 (`@theme` overrides in px) |
| **UI Components** | `@mui/material` (partially) | `@saleor/macaw-ui-next` + native HTML |
| **Icons** | `@mui/icons-material` | Lucide React |
| **Table Primitives** | MUI `Table`/`TableCell`/etc. | Custom HTML `<table>` components (`dashboard/src/components/Table/`) |
| **Routing** | React Router v5 | React Router v7 (relative paths, no `?` in pathname) |

**Key Technical Decisions:**

- **Root font-size compatibility**: macaw-ui sets `html { font-size: 50.782% }` (1rem = 8px). Tailwind's `@theme` block overrides `--spacing` and `--text-*` with px values so utilities like `text-sm`, `p-4` produce correct pixel sizes regardless of root font-size.
- **URL utility (`withQs`)**: All 26 URL files use `withQs(path, params)` to prevent trailing `?` that React Router v7 rejects in pathname objects.
- **Table link pattern**: Data rows wrap cells in `<Link style={{ all: "inherit", display: "contents" }}>` — inline style guarantees property order (Tailwind CSS generation order can cause `all: inherit` to override `display: contents`).

**Migration Status:** D6a–D6g complete (MUI v7 upgrade, Tailwind CSS v4 setup, makeStyles→Tailwind conversion of 192 files, MUI component replacement, routing fixes, icon migration). Remaining MUI imports (~140 files) are in active use by macaw-ui-next and will be addressed in future phases.

### 8.3 Key Capabilities

| Module            | Features                                                |
| ----------------- | ------------------------------------------------------- |
| **Catalog**       | Products, categories, collections, attributes, variants |
| **Orders**        | Order management, fulfillment, refunds, draft orders    |
| **Customers**     | Customer profiles, addresses, order history             |
| **Discounts**     | Sales, vouchers, promotions                             |
| **Apps**          | Install and manage Saleor Apps                          |
| **Configuration** | Channels, shipping, taxes, payment gateways             |
| **Content**       | Pages, menus, translations                              |
| **Analytics**     | Built-in + Sales Analytics App                          |

### 8.4 App Extensions

Saleor Apps can extend the dashboard via:

- **Navigation Items**: Add menu entries
- **Widgets**: Embed in order details, product pages
- **Full Pages**: Custom app pages within dashboard

---

## 9. Saleor Apps Ecosystem

### 9.1 Storefront Control App

**Purpose:** CMS for storefront configuration without code deployments.

**Container:** `aura-storefront-control-app-dev`
**Port:** 3004

**Admin UI (Page-Based CMS — Shopify Theme Editor pattern):**

| Page | File | Purpose |
|------|------|---------|
| Homepage | `homepage.tsx` | Hero, sections, section ordering (drag & drop) |
| Product Listing | `product-listing.tsx` | Grid layout, filters, quick filters, sort options |
| Product Detail | `product-detail.tsx` | Gallery, variants, tabs, related products |
| Cart | `cart.tsx` | Cart drawer, promo codes, free shipping bar |
| Checkout | `checkout.tsx` | Checkout steps, payment, confirmation |
| Account | `account.tsx` | Dashboard, orders, addresses, wishlist, settings |
| Auth Pages | `auth-pages.tsx` | Login, register, forgot password |
| Layout | `layout.tsx` | Header, footer, mobile nav, cookie consent |
| Static Pages | `static-pages.tsx` | About, contact, FAQ, legal pages |
| Global Design | `global.tsx` | Colors (10 tokens), typography, logos, buttons, badges, dark mode |
| Component Designer | `component-designer.tsx` | Per-component visual style overrides |

**Tech Stack:** shadcn/ui (19 primitives) + Radix UI + Tailwind CSS + React Hook Form + @dnd-kit
**Features:** Cmd+K command palette with settings search, live preview (PostMessage iframe bridge), `useConfigPage` hook for form boilerplate elimination, PAGE_REGISTRY for page→config mapping, ComponentBlock UI (collapsible cards with icon/title/toggle)

**Component Designer:** Visual playground for per-component style overrides. Split-panel UI: component tree (48 components across 7 pages) + dynamic property editor (19 CSS properties: colors, typography, spacing, hover, custom Tailwind classes). Generates CSS custom properties (`--cd-{key}-{prop}`) for instant live preview without React re-renders. Cascade: Component override > Page config > Global branding. Features: "Copy style from..." to duplicate overrides between components, override count badge in sidebar nav, click-to-edit visual overlay with hover highlights and drag-and-drop section reorder.

**Shared Config Package:** `@saleor/apps-storefront-config` — 21 domain schema files, Zod-inferred types, config migrations. Used by both the admin app and the storefront.

See [Section 7](#7-storefront-control-integration) for detailed integration documentation.

### 9.2 Stripe App

**Purpose:** Payment processing via Stripe.

**Container:** `aura-stripe-app-dev`  
**Port:** 3002

**Features:**

- Credit/debit card payments
- Webhook handling for payment events
- Automatic payment confirmation
- Refund support

### 9.3 SMTP App

**Purpose:** Email notifications via SMTP.

**Container:** `aura-smtp-app-dev`  
**Port:** 3001

**Features:**

- Order confirmation emails
- Fulfillment notifications
- Invoice delivery
- Welcome emails
- Password reset emails

### 9.4 Invoice App

**Purpose:** PDF invoice generation.

**Container:** `aura-invoice-app-dev`  
**Port:** 3003

**Features:**

- Automatic invoice creation on order
- PDF generation with company branding
- Download from storefront and dashboard
- Invoice request via GraphQL

### 9.5 Newsletter App

**Purpose:** Newsletter and email campaign management.

**Container:** `aura-newsletter-app-dev`  
**Port:** 3005

**Features:**

- Subscriber management (active/inactive)
- MJML email template editor
- Campaign creation and scheduling
- Branding integration from Storefront Control
- Welcome/welcome-back automation

### 9.6 Sales Analytics App

**Purpose:** Professional sales analytics dashboard.

**Container:** `aura-sales-analytics-app-dev`  
**Port:** 3006

**Features:**

- KPIs: GMV, Total Orders, AOV, Items Sold, Unique Customers
- Visualizations: Revenue trends, top products, category breakdown
- Filters: Time range presets, channel filter
- Excel Export: Multi-sheet professional reports
- Dashboard integration via app extensions

### 9.7 Bulk Manager App

**Purpose:** Full store data migration and batch operations tool. Import entire store data from Shopify, WooCommerce, or Magento via CSV/Excel.

**Container:** `aura-bulk-manager-app-dev`
**Port:** 3007

**Supported Entity Types:**

| Entity | Import | Export | Upsert | Bulk Delete | Template | Match Key |
|--------|--------|--------|--------|-------------|----------|-----------|
| Products | Yes | Yes | Yes | Yes | Yes | slug / externalReference |
| Categories | Yes | Yes | Yes | Yes | Yes | slug / externalReference |
| Collections | Yes | Yes | Yes | Yes | Yes | slug / externalReference |
| Customers | Yes | Yes | Yes | Yes | Yes | email |
| Orders | No | Yes | No | No | No | N/A |
| Vouchers | Yes | Yes | Yes | Yes | Yes | code |
| Gift Cards | Yes | Yes | Yes | Yes | Yes | code |

**Orders** also support: Bulk Fulfill (with warehouse + tracking), Bulk Cancel, Status Filters, Date Range Filters.

**Product Import Features:**

- Multi-image support (up to 5 images via `imageUrl` through `imageUrl5`)
- Generic attributes via `attr:AttributeName` column prefixes
- Variant attributes via `variantAttr:AttributeName` column prefixes
- Multi-warehouse stock via `stock:WarehouseName` column prefixes
- SEO fields, metadata, externalReference
- Tax class assignment, collection assignment
- Variant grouping (rows sharing same product name are grouped as variants)
- Batch processing (5 products per batch)

**CSV Conventions:**

- Semicolons (`;`) for multi-value fields (e.g., `collections: "summer-sale;new-arrivals"`)
- `key:value;key:value` format for metadata
- Column prefixes: `attr:`, `variantAttr:`, `stock:` for dynamic fields
- Boolean fields accept: `Yes/No`, `true/false`, `1/0`

**Permissions:** MANAGE_PRODUCTS, MANAGE_ORDERS, MANAGE_USERS, MANAGE_APPS, MANAGE_DISCOUNTS, MANAGE_GIFT_CARD

### 9.8 Catalog Generator & Store Infrastructure (`scripts/catalog-generator/`)

**Purpose:** Infrastructure-as-code tool for managing store setup (product types, attributes, warehouses, shipping zones) via YAML, plus product catalog generation for Bulk Manager import. Enables reproducible store setup after DB resets and across environments.

**Tech Stack:** `@saleor/configurator` v1.1.0 (patched), TypeScript, tsx, graphql-request, exceljs, patch-package

**Pipeline (`npm run setup`):**

1. **Deploy** (`config.yml` → Saleor) — Creates/updates product types, attributes with values, channels, warehouses, shipping zones, shop settings
2. **Translate** — Applies Hebrew translations to categories/collections using existing bilingual data from TypeScript config files
3. **Generate** — Produces product Excel (100 products) + category/collection CSVs for Bulk Manager import

**Infrastructure Managed by `config.yml`:**

| Entity | Details |
|--------|---------|
| Channels | `ils` (ILS/Israel), `usd` (USD/International) |
| Product Types | Shoes, Tops, Bottoms, Accessories |
| Product Attributes | Brand (SINGLE_REFERENCE to page models), Gender, Material, Style, Apparel Type |
| Variant Attributes | Shoe size (36-45), Apparel Size (XS-XXXL), Color (10 colors) |
| Warehouses | Main Warehouse (Sakhnin, IL), International Warehouse (New York, US) |
| Shipping Zones | Israel Domestic (3 methods), International (3 methods) |
| Shipping Methods | Standard, Express, Free (with minimum order thresholds) |

**Patches Applied (`patch-package`):**
- SINGLE_REFERENCE / MULTI_REFERENCE attribute type support (not in upstream v1.1.0)
- Shipping zone `minimumOrderPrice` format fix (sends decimal string instead of object)

**Generated Output Files:**

| File | Purpose |
|------|---------|
| `output/mansour-catalog-100products.xlsx` | Product data for Bulk Manager import |
| `output/categories.csv` | Category hierarchy for Bulk Manager import |
| `output/collections.csv` | Collections for Bulk Manager import |

**Commands:**

```bash
cd scripts/catalog-generator
npm run setup         # Full pipeline: deploy + translate + generate
npm run deploy:ci     # Apply config.yml (non-interactive)
npm run diff          # Preview changes
npm run introspect    # Capture current Saleor state
npm run translate     # Hebrew translations
npm run generate      # Product Excel + CSVs
```

**Runs on host machine** (not Docker). Connects to Saleor via `SALEOR_URL` + `SALEOR_TOKEN` in `.env`.

### 9.9 Image Studio App

**Purpose**: AI-powered product image editor embedded in Saleor Dashboard for creating professional e-commerce product images without external design tools.

**Container**: `aura-image-studio-app-dev` | **Port**: 3008

**Key Features**:
- **Canvas Editor** (Fabric.js v6): Full image manipulation — add images/text/shapes, select/move/resize/rotate, undo/redo (50-state history), zoom, export PNG/JPEG
- **Saleor Product Integration**: Browse product catalog, edit existing product images, save finished work back to products via GraphQL multipart upload
- **AI Background Removal**: Self-hosted rembg service removes backgrounds to transparent PNG (~3-8s/image on CPU)
- **AI Background Generation**: Nano Banana / Google Gemini (cloud API) generates photorealistic backgrounds from text prompts
- **AI Upscaling**: Self-hosted Real-ESRGAN upscales images 2x/3x/4x (~30-120s on CPU)
- **Image Enhancement**: Server-side Sharp for brightness/saturation adjustment, resize, format conversion
- **Template System**: 12 built-in templates across 4 categories (Product, Social Media, Banner, Lifestyle) with typed layers (image/text/rect/circle)
- **Layers Panel**: Visual layer list with drag-to-reorder, visibility toggle, lock toggle
- **Auto-Save**: IndexedDB draft persistence with session recovery dialog
- **Context Menu**: Right-click for copy/paste/duplicate/delete/layer ordering
- **Keyboard Shortcuts**: Ctrl+Z/Y, Ctrl+C/V/D, Ctrl+S, Ctrl+E, Ctrl+[/], Del, Escape, zoom controls

**AI Services** (separate Docker containers):
- `aura-rembg-dev` (port 7000): danielgatis/rembg, ~2GB memory, CPU-based
- `aura-esrgan-dev` (port 7001): Real-ESRGAN wrapper, ~3GB memory, CPU-based
- Nano Banana / Gemini (external): Google Gemini 2.5 Flash Image, requires `GEMINI_API_KEY` env var (free 50 req/day)

**Tech Stack**: Next.js (Pages Router), tRPC (4 sub-routers: ai, products, media, enhance), Fabric.js v6, Sharp, idb-keyval, shadcn/ui + Tailwind CSS

**tRPC Routers**:
- `ai-router`: removeBackground, generateBackground, upscale, checkHealth
- `products-router`: list (paginated with search), getDetail, channels
- `media-router`: uploadToProduct, updateAlt, delete, downloadOriginal
- `enhance-router`: resize, adjustColors, convertFormat

### 9.10 Dropship Orchestrator App

**Purpose**: Multi-supplier dropshipping middleware for mixed inventory stores. Auto-forwards dropship-tagged orders to AliExpress/CJ Dropshipping, syncs tracking/fulfillment back to Saleor, with fraud detection, financial safety controls, exception queue, and admin dashboard. Toggleable — when disabled, store operates normally with concrete inventory.

**Container**: `aura-dropship-app-dev` | **Port**: 3009

**Key Features**:
- **Supplier Adapter Pattern**: Pluggable `SupplierAdapter` interface with `SupplierRegistry` singleton. Two adapters: AliExpress (OAuth, RPC gateway, MD5 signing, polling-based tracking) + CJ Dropshipping (API Key, REST, webhook-based tracking)
- **Order Flow**: ORDER_PAID webhook → classify lines (concrete vs dropship via product metadata) → fraud checks (4 rules, composite score < 50) → cost ceiling check → daily spend check → auto-forward to supplier → audit trail entry
- **Background Jobs**: BullMQ + Redis — tracking-sync (every 2h), reconciliation (every 6h), AliExpress token refresh (every 12d)
- **Fraud Detection**: 4 rules (velocity, address validation, value threshold, blacklist), composite score, configurable thresholds
- **Financial Safety**: Margin calculator, cost ceiling (default 70%), daily spend limit, price drift detector (default 15% threshold)
- **Security**: EncryptedMetadataManager for credentials, IP whitelist (CIDR) for CJ webhooks, HMAC verification, idempotency (djb2 hash), audit trail (17 event types)
- **Admin Dashboard**: 8 pages — overview (stats + recent orders), suppliers (list + AliExpress OAuth config + CJ API key config), orders (forwarded order list), exceptions (manual resolution queue), settings (global config), audit log (searchable event history)
- **Product Tagging**: Products tagged via Saleor metadata `dropship.supplier`, `dropship.supplierSku`, etc. Untagged products are concrete inventory (ignored by the app)

**Tech Stack**: Next.js (Pages Router), tRPC (6 sub-routers: suppliers, orders, exceptions, settings, audit, dashboard), BullMQ, ioredis, neverthrow, Zod

**tRPC Routers**:
- `suppliers-router`: list, getConfig, updateConfig (per-supplier), testConnection
- `orders-router`: list (paginated with filters), getDetail, retry, cancel
- `exceptions-router`: list, resolve, escalate
- `settings-router`: get, update (fraud thresholds, financial limits, feature toggles)
- `audit-router`: list (paginated, filterable by event type)
- `dashboard-router`: stats (order counts, spend, exception count)

**Permissions**: MANAGE_PRODUCTS, MANAGE_ORDERS, MANAGE_APPS, MANAGE_SHIPPING, MANAGE_CHECKOUTS

**UI Note**: Uses plain HTML primitives (`src/components/ui/primitives.tsx`) instead of macaw-ui Box/Text/Button — macaw-ui Sprinkles crash in Saleor Dashboard iframe. ThemeProvider/ThemeSynchronizer kept in `_app.tsx` only.

### 9.11 Tax Manager App

**Purpose**: Self-hosted tax calculation engine that replaces external tax services (AvaTax, TaxJar). Configurable country/state tax rates with preset libraries for common jurisdictions.

**Container**: `aura-tax-manager-app-dev` | **Port**: 3010

**Key Features**:
- **Tax Rate Configuration**: Per-country and per-state/province tax rates with effective dates
- **Preset Libraries**: Pre-built tax rate templates for Israel (17% VAT), EU (country-specific VAT), and US (state sales tax)
- **Export Zero-Rating**: Automatic 0% tax for export orders (shipping address outside taxable jurisdiction)
- **Tax Class Support**: Maps Saleor tax classes to different rate schedules (standard, reduced, zero-rated)
- **Channel-Aware**: Different tax configurations per sales channel

**Permissions**: MANAGE_APPS, HANDLE_TAXES

---

## 10. Feature Specifications

### 10.1 Feature Flags

The following features can be toggled via Storefront Control:

| Feature               | Default | Description                |
| --------------------- | ------- | -------------------------- |
| `wishlist`            | true    | Product wishlist           |
| `compareProducts`     | false   | Product comparison         |
| `productReviews`      | true    | Product reviews & ratings  |
| `recentlyViewed`      | true    | Recently viewed products   |
| `scrollToTop`         | true    | Scroll-to-top button       |
| `guestCheckout`       | true    | Checkout without account   |
| `expressCheckout`     | false   | One-click checkout         |
| `savePaymentMethods`  | true    | Save cards for later       |
| `digitalDownloads`    | false   | Downloadable products      |
| `subscriptions`       | false   | Subscription products      |
| `giftCards`           | true    | Gift card support          |
| `productBundles`      | false   | Product bundles            |
| `newsletter`          | true    | Newsletter signup          |
| `promotionalBanners`  | true    | Header promo banner        |
| `abandonedCartEmails` | false   | Cart recovery emails       |
| `socialLogin`         | false   | OAuth login (Google, etc.) |
| `shareButtons`        | true    | Social sharing             |
| `instagramFeed`       | false   | Instagram integration      |
| `relatedProducts`     | true    | Related products carousel  |

### 10.2 Homepage Product Sections & Badges (Data-Driven)

Homepage product sections use **data-driven logic** where possible; collections remain optional for merchant curation.

| Section          | Primary source                 | Fallback when collection empty / missing                                                                   |
| ---------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Featured**     | Collection `featured-products` | None (section can be empty)                                                                                |
| **New Arrivals** | Collection `new-arrivals`      | Products sorted by **CREATED_AT DESC** (newest first)                                                      |
| **Best Sellers** | Collection `best-sellers`      | Products sorted by **RATING DESC** (top-rated). Saleor does not expose "sold count" in the storefront API. |
| **On Sale**      | Collection `sale`              | None (section can be empty)                                                                                |

**Badges (data-driven):**

| Badge            | Logic                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sale**         | Product has discount (price &lt; undiscounted price).                                                                                       |
| **Out of stock** | Total variant stock = 0.                                                                                                                    |
| **Low stock**    | Total variant stock &gt; 0 and ≤ 5.                                                                                                         |
| **New**          | Product `created` date is within the last **30 days** (configurable via `NEW_PRODUCT_DAYS` in `ProductGrid.tsx`). No longer position-based. |

**GraphQL:** `storefront/src/graphql/HomepageProducts.graphql` defines `ProductsNewest` (CREATED_AT DESC) and `ProductsTopRated` (RATING DESC). `ProductListItem` fragment includes `created` for the New badge.

### 10.3 Related Products Feature

**Specification:**

| Property  | Value                               |
| --------- | ----------------------------------- |
| Strategy  | Category-based (same category)      |
| Fallback  | Popular products if < 4 in category |
| Max Items | 8 (configurable: 4-16)              |
| Minimum   | 2 products required to display      |
| Position  | Below product tabs                  |
| Loading   | Suspense with skeleton              |
| RTL       | Full support                        |

**Configuration Schema:**

```typescript
relatedProducts: {
  enabled: boolean;
  strategy: "category" | "collection";
  maxItems: number; // 4-16
  showOnMobile: boolean;
  title: string; // "You May Also Like"
  subtitle: string | null; // "Customers also viewed..."
}
```

### 10.4 Product Reviews Feature

- Star ratings (1-5)
- Written reviews with title
- Image uploads (up to 5)
- Verified purchase badge
- Helpful votes
- Admin moderation
- Rating filter
- Sort by date/rating/helpful

### 10.5 Cart & Checkout

**Cart Features:**

- Drawer (slide-out) or page mode
- Quantity adjustment with inline controls
- Promo code / voucher support with validation
- Free shipping progress bar
- Save for later / wishlist integration
- Selection-based checkout

**Checkout V2 Architecture** (`storefront/src/checkout-v2/`):

Single-page accordion checkout built with App Router, React Hook Form + Zod validation, `useReducer` + Context state management.

| Step | ID | Component | Description |
|------|----|-----------|-------------|
| 0 | Contact | `ContactStep` | Email + optional password for deferred registration |
| 1 | Shipping | `ShippingStep` | Address form with country/region autocomplete |
| 2 | Delivery | `DeliveryStep` | Shipping method selection with rates |
| 3 | Payment | `PaymentStep` | Stripe Elements integration, places order |

- **Server Actions**: 11 actions in `_actions/` (createCheckout, updateEmail, setShippingAddress, setDeliveryMethod, completeCheckout, etc.)
- **Deferred Registration**: Account creation happens AFTER order placement (conversion-first). Password stored in `pendingAccount` context, `registerAccount` called post-`completeCheckout`.
- **Payment**: Stripe (`@stripe/react-stripe-js`) and Adyen (`@adyen/adyen-web`) integrations
- **Order Confirmation**: `confirmation/` with OrderSummary, OrderNextSteps, purchase GA4 event
- **RTL Support**: Full RTL layout with logical CSS properties
- **Shared Modules**: `storefront/src/lib/checkout/` (GraphQL types, `useCheckoutText`, `UserContext`, country data, address utils)
- **E2E Tests**: `storefront/e2e/checkout-v2.spec.ts` — 6 tests (guest checkout, step locking, auth, CJ display, promo UX, RTL)

---

## 11. Localization & RTL Support

### 11.1 Supported Locales

| Locale  | Language | Direction | Channel |
| ------- | -------- | --------- | ------- |
| `he`    | Hebrew   | RTL       | ILS     |
| `en-US` | English  | LTR       | USD     |

### 11.2 RTL Implementation

**Direction Detection:**

```typescript
// Automatic detection from locale
const rtlLocales = ["he", "ar", "fa", "ur", "yi", "ps"];
const direction = rtlLocales.includes(locale) ? "rtl" : "ltr";

// Applied via document.documentElement.dir
```

**CSS Strategy:**

- Use logical properties (`margin-inline-start` instead of `margin-left`)
- Tailwind classes: `start-0`, `end-0`, `ms-4`, `me-4`
- RTL-specific classes: `rtl:rotate-180`

### 11.3 Content Localization

All UI text is configurable per-channel via Storefront Control:

- Cart messages
- Checkout steps
- Account pages
- Error messages
- Filter labels
- Button text

**Example (Hebrew):**

```json
{
  "relatedProducts": {
    "title": "אולי תאהבו גם",
    "subtitle": "לקוחות צפו גם במוצרים הבאים"
  }
}
```

---

## 12. Development Workflow (Docker)

> **CRITICAL: All development commands run inside Docker containers.**
>
> Never run `npm`, `pnpm`, `npx`, or `python` directly on the host machine.
> Always use `docker exec` to run commands inside the appropriate container.

### 12.1 Platform CLI

All platform management goes through `.\infra\platform.ps1`:

```powershell
.\infra\platform.ps1 status                    # Health dashboard
.\infra\platform.ps1 up                        # Start platform (Docker + tunnels)
.\infra\platform.ps1 up -Mode selfhosted       # Start with named tunnels
.\infra\platform.ps1 down                      # Stop everything
.\infra\platform.ps1 restart <service>         # Restart a service
.\infra\platform.ps1 backup -Compress          # Database backup
.\infra\platform.ps1 install-apps              # Register all Saleor apps
.\infra\platform.ps1 logs <service>            # Tail container logs
.\infra\platform.ps1 codegen                   # Run GraphQL codegen
.\infra\platform.ps1 new-store                 # Rebrand for a new store
.\infra\platform.ps1 generate-tunnel-config    # Regenerate cloudflared-config.yml
```

Service registry: `infra/platform.yml` — single source of truth for all ports, containers, tunnels, and store identity.

### 12.2 Starting the Development Environment

```bash
# Navigate to project root
cd saleor-platform

# Start all services (via Platform CLI)
.\infra\platform.ps1 up

# Or directly with Docker Compose
docker compose -f infra/docker-compose.dev.yml up -d

# Verify health
.\infra\platform.ps1 status

# Access applications:
# - Storefront: http://localhost:3000
# - Dashboard: http://localhost:9000
# - GraphQL Playground: http://localhost:8000/graphql/
```

### 12.3 Storefront Commands

**Container:** `aura-storefront-dev`

```bash
# Install dependencies
docker exec -it aura-storefront-dev pnpm install

# Run development server (usually auto-started)
docker exec -it aura-storefront-dev pnpm dev

# Build for production
docker exec -it aura-storefront-dev pnpm build

# Run linter
docker exec -it aura-storefront-dev pnpm lint

# Run TypeScript type check
docker exec -it aura-storefront-dev pnpm type-check

# Generate GraphQL types (after schema changes)
docker exec -it aura-storefront-dev pnpm generate

# Interactive shell
docker exec -it aura-storefront-dev sh
```

### 12.4 Dashboard Commands

**Container:** `aura-dashboard-dev`

```bash
# Install dependencies
docker exec -it aura-dashboard-dev pnpm install

# Run development server
docker exec -it aura-dashboard-dev pnpm dev

# Build for production
docker exec -it aura-dashboard-dev pnpm build

# Run linter
docker exec -it aura-dashboard-dev pnpm lint

# Run TypeScript type check
docker exec -it aura-dashboard-dev pnpm check-types

# Generate GraphQL types
docker exec -it aura-dashboard-dev pnpm generate

# Run tests
docker exec -it aura-dashboard-dev pnpm test
```

### 12.5 Apps Monorepo Commands

**Container:** `aura-storefront-control-app-dev` (or other app containers)

```bash
# Storefront Control App
docker exec -it aura-storefront-control-app-dev pnpm install
docker exec -it aura-storefront-control-app-dev pnpm dev
docker exec -it aura-storefront-control-app-dev pnpm build
docker exec -it aura-storefront-control-app-dev pnpm lint

# Newsletter App
docker exec -it aura-newsletter-app-dev pnpm install
docker exec -it aura-newsletter-app-dev pnpm dev

# Sales Analytics App
docker exec -it aura-sales-analytics-app-dev pnpm install
docker exec -it aura-sales-analytics-app-dev pnpm dev

# SMTP App
docker exec -it aura-smtp-app-dev pnpm install
docker exec -it aura-smtp-app-dev pnpm dev

# Invoice App
docker exec -it aura-invoice-app-dev pnpm install
docker exec -it aura-invoice-app-dev pnpm dev

# Stripe App
docker exec -it aura-stripe-app-dev pnpm install
docker exec -it aura-stripe-app-dev pnpm dev
```

### 12.6 Saleor API (Python/Django) Commands

**Container:** `aura-api-dev`

```bash
# Run migrations
docker exec -it aura-api-dev python manage.py migrate

# Create migrations
docker exec -it aura-api-dev python manage.py makemigrations

# Build GraphQL schema
docker exec -it aura-api-dev python manage.py build_schema

# Create superuser
docker exec -it aura-api-dev python manage.py createsuperuser

# Run tests
docker exec -it aura-api-dev pytest --reuse-db

# Run specific test file
docker exec -it aura-api-dev pytest --reuse-db saleor/graphql/product/tests/test_product.py

# Interactive Django shell
docker exec -it aura-api-dev python manage.py shell

# Interactive bash shell
docker exec -it aura-api-dev bash
```

### 12.7 Database Commands

**Container:** `aura-postgres-dev`

```bash
# Connect to PostgreSQL
docker exec -it aura-postgres-dev psql -U saleor -d saleor

# Backup database
docker exec aura-postgres-dev pg_dump -U saleor saleor > backup.sql

# Restore database
docker exec -i aura-postgres-dev psql -U saleor saleor < backup.sql
```

### 12.8 Container Restart Guidelines

| Change Location                 | Container(s) to Restart                                       |
| ------------------------------- | ------------------------------------------------------------- |
| `saleor/` (Python code)         | `aura-api-dev`, `aura-worker-dev`, `aura-scheduler-dev` |
| `saleor/` (migrations)          | Run migrate first, then restart `aura-api-dev`              |
| `dashboard/`                    | `aura-dashboard-dev`                                        |
| `storefront/`                   | `aura-storefront-dev`                                       |
| `apps/apps/storefront-control/` | `aura-storefront-control-app-dev`                           |
| `apps/apps/stripe/`             | `aura-stripe-app-dev`                                       |
| `apps/apps/smtp/`               | `aura-smtp-app-dev`                                         |
| `apps/apps/invoices/`           | `aura-invoice-app-dev`                                      |
| `apps/apps/newsletter/`         | `aura-newsletter-app-dev`                                   |
| `apps/apps/sales-analytics/`    | `aura-sales-analytics-app-dev`                              |
| `apps/apps/bulk-manager/`       | `aura-bulk-manager-app-dev`                                 |
| `apps/apps/image-studio/`      | `aura-image-studio-app-dev`                                 |
| `apps/apps/dropship-orchestrator/` | `aura-dropship-app-dev`                                 |
| `apps/apps/tax-manager/`        | `aura-tax-manager-app-dev`                                |

**Restart command:**

```bash
docker compose -f infra/docker-compose.dev.yml restart <container-name>
```

### 12.9 Viewing Logs

```bash
# All containers
docker compose -f infra/docker-compose.dev.yml logs -f

# Specific container
docker compose -f infra/docker-compose.dev.yml logs -f aura-storefront-dev

# Last 100 lines
docker compose -f infra/docker-compose.dev.yml logs --tail=100 aura-api-dev
```

### 12.10 Code Style Guidelines

#### TypeScript/React

- Use TypeScript everywhere; avoid `any`
- Functional components with hooks
- Named exports (not default)
- Prettier formatting
- ESLint rules as source of truth

#### Python

- Black-style formatting (88 columns)
- Ruff linting
- Type hints required for public functions
- pytest for testing with fixtures

---

## 13. API Reference

### 13.1 GraphQL Endpoint

**URL:** `http://localhost:8000/graphql/`

**Authentication:**

- JWT tokens via `Authorization: Bearer <token>`
- App tokens for webhooks

### 13.2 Key Queries

```graphql
# Product List
query ProductList($channel: String!, $first: Int) {
  products(first: $first, channel: $channel) {
    edges {
      node {
        id
        name
        slug
        pricing { ... }
        thumbnail { url }
      }
    }
  }
}

# Product Details
query ProductDetails($slug: String!, $channel: String!) {
  product(slug: $slug, channel: $channel) {
    id
    name
    description
    variants { ... }
    pricing { ... }
    category { ... }
  }
}

# Checkout Flow
mutation CheckoutCreate($channel: String!) {
  checkoutCreate(input: { channel: $channel }) {
    checkout { id token }
    errors { ... }
  }
}
```

### 13.3 Webhook Events

| Event              | Trigger            | App Usage     |
| ------------------ | ------------------ | ------------- |
| `ORDER_CREATED`    | New order placed   | Invoice, SMTP |
| `ORDER_FULFILLED`  | Order shipped      | SMTP          |
| `CHECKOUT_CREATED` | Checkout started   | Analytics     |
| `PAYMENT_CAPTURED` | Payment successful | Stripe        |

---

## 14. Security & Compliance

### 14.1 Security Measures

- **Authentication**: JWT tokens with refresh
- **HTTPS**: Required for production
- **CORS**: Configured allowed origins
- **CSRF**: Protection enabled
- **Input Validation**: Zod schemas, GraphQL types
- **XSS Prevention**: xss library for user content

### 14.2 Data Protection

- **PCI Compliance**: Payment data handled by Stripe
- **Password Hashing**: bcrypt via Django
- **Sensitive Data**: Environment variables, never committed
- **Cookie Consent**: GDPR + Israeli Privacy Protection Law compliant. 3 consent categories (essential always on, analytics and marketing opt-in). GTM/GA4 scripts blocked until analytics consent granted. Consent stored in localStorage per channel with configurable expiry.

### 14.3 Rate Limiting

- **Redis-backed**: Request rate limiting
- **Per-endpoint**: Configurable limits
- **Auth endpoints**: Stricter limits

---

## 15. Performance Requirements

### 15.1 Core Web Vitals Targets

| Metric   | Target  | Description              |
| -------- | ------- | ------------------------ |
| **LCP**  | < 2.5s  | Largest Contentful Paint |
| **INP**  | < 200ms | Interaction to Next Paint (replaced FID in 2024) |
| **CLS**  | < 0.1   | Cumulative Layout Shift  |
| **TTFB** | < 800ms | Time to First Byte       |

### 15.2 Optimization Strategies

- **Image Optimization**: Next.js Image, WEBP, lazy loading
- **Code Splitting**: Dynamic imports, route-based
- **Caching**: ISR (60s default), Redis, CDN
- **Streaming SSR**: React Suspense boundaries
- **Bundle Size**: Tree shaking, minimal dependencies

### 15.3 Load Testing Requirements

| Scenario          | Target        |
| ----------------- | ------------- |
| Concurrent Users  | 10,000+       |
| Product Catalog   | 100,000+ SKUs |
| Orders/Hour       | 1,000+        |
| API Response Time | < 200ms (p95) |

---

## 16. End-to-End Testing

### 16.1 Overview

The storefront has a Playwright E2E test suite covering 5 critical user flows with 23 tests. Tests run on the **host machine** (not Docker) against the live dev environment at `http://localhost:3000`.

**Prerequisites:**
- Storefront running at `http://localhost:3000`
- Saleor API running at `http://localhost:8000/graphql/`
- Test user `e2e-test@example.com` / `Test1234!` exists (created via Django shell)
- Playwright browsers installed (`npx playwright install chromium`)

### 16.2 Test Suite

| Spec | Tests | Flows Covered |
|------|-------|---------------|
| `cart.spec.ts` | 5 | Add to cart from PDP, drawer count, quantity +/-, remove item, empty state |
| `checkout.spec.ts` | 3 | Full Stripe guest checkout (test card 4242...), order summary, email required |
| `checkout-shipping.spec.ts` | 7 | CJ dropship shipping methods (desktop + mobile), shipping price updates on method change, free shipping threshold |
| `checkout-v2.spec.ts` | 6 | V2 accordion: guest checkout, step locking, auth pre-fill, CJ dropship methods display (no order placed), promo code UX, RTL dir=rtl |
| `auth.spec.ts` | 5 | Login processing state, wrong password error, register, forgot password, access guard |
| `search.spec.ts` | 4 | No results, page load, header search, products listing |
| `account.spec.ts` | 5 + setup | Auth redirect for all sections, redirect URL preservation |

> **checkout-v2.spec.ts** requires `E2E_CHECKOUT_V2=true` env var. Enable with: `E2E_CHECKOUT_V2=true pnpm test:e2e`
> The dropship test verifies shipping methods display only — no CJ order is created.

### 16.3 Architecture

- **Page Object pattern**: `storefront/e2e/pages/` — 8 page objects (BasePage, CartPage, CheckoutPage, CheckoutV2Page, LoginPage, ProductDetailPage, SearchPage, AccountPage)
- **Fixtures**: `storefront/e2e/fixtures/` — GraphQL client for test setup, test data constants, Stripe test card
- **Auth setup**: Cookie injection via `tokenCreate` API + `context.addCookies()` (bypasses JWT ISS mismatch in dev)
- **Global setup**: `storefront/e2e/global-setup.ts` — verifies storefront + API reachable, checks test user
- **Cookie consent**: Suppressed via `localStorage.setItem` in `addInitScript` before every test

### 16.4 Running Tests

```bash
cd storefront
pnpm test:e2e          # Headless (CI)
pnpm test:e2e:headed   # With browser visible
pnpm test:e2e:ui       # Playwright UI mode (interactive)
```

### 16.5 Known Limitations

- **JWT ISS mismatch**: Server-side auth doesn't work in dev because JWT `iss` (production URL) doesn't match `SALEOR_API_URL` (Docker internal). Auth tests use cookie injection workaround.
- **Search not indexed**: Saleor full-text search returns 0 results. Search tests verify page structure, not search results.
- **CI not automated**: Tests require running Saleor API + storefront. CI integration needs service containers (future work).

### 16.6 Key Files

| File | Purpose |
|------|---------|
| `storefront/playwright.config.ts` | Playwright config (Chrome desktop, 60s timeout, traces on failure) |
| `storefront/e2e/global-setup.ts` | Pre-flight checks (storefront + API reachable, test user exists) |
| `storefront/e2e/auth.setup.ts` | Auth cookie injection for authenticated test project |
| `storefront/e2e/fixtures/graphql-client.ts` | Direct Saleor API client for test setup |
| `storefront/e2e/fixtures/test-data.ts` | Test constants (channel, credentials, addresses, Stripe test card) |

---

## Appendices

### A. Environment Variables

See `infra/.env.example` for full list.

**Critical Variables:**

```env
# Database
POSTGRES_USER=saleor
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=saleor

# API
SECRET_KEY=<django-secret-key>
ALLOWED_HOSTS=localhost,127.0.0.1

# Apps
STRIPE_SECRET_KEY=sk_test_...
SMTP_HOST=smtp.example.com
```

### B. Glossary

| Term            | Definition                                |
| --------------- | ----------------------------------------- |
| **Channel**     | Sales channel with currency and settings  |
| **Variant**     | Product variation (size, color)           |
| **Checkout**    | Shopping cart in checkout state           |
| **Fulfillment** | Order shipment record                     |
| **Webhook**     | HTTP callback for events                  |
| **App**         | Saleor extension via App protocol         |
| **ISR**         | Incremental Static Regeneration (Next.js) |
| **RSC**         | React Server Components                   |

### C. Reference Links

- [Saleor Documentation](https://docs.saleor.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

### D. Related Documentation

| Document                       | Purpose                                 | Update Frequency            |
| ------------------------------ | --------------------------------------- | --------------------------- |
| `PRD.md` (this file)           | Complete project specification          | Monthly / Major releases    |
| `AGENTS.md`                    | AI agent guidelines, commands, patterns | With every workflow change  |
| `CLAUDE.md`                    | Project instructions for Claude Code    | With architecture changes   |
| `QUICK-START.md`               | Getting started guide (clone → run)     | With setup changes          |
| `infra/PLATFORM-CLI.md`        | Platform CLI reference guide            | With CLI changes            |
| `infra/DEPLOY.md`              | Production deployment guide             | With deployment changes     |
| `infra/DEPLOYMENT-OPTIONS.md`  | Deployment architecture options         | With infrastructure changes |
| `infra/docker-compose.dev.yml` | Service definitions                     | With infrastructure changes |
| `infra/platform.yml`           | Service registry (single source of truth) | With service changes      |
| `IMPROVEMENT-ROADMAP.md`       | Prioritized improvement roadmap         | Monthly                     |

### E. Version History

| Version | Date       | Changes                                                                                 |
| ------- | ---------- | --------------------------------------------------------------------------------------- |
| 1.0.0   | 2026-02-02 | Initial PRD release                                                                     |
| 1.1.0   | 2026-02-02 | Added Storefront Control integration details, Docker commands, maintenance requirements |
| 1.2.0   | 2026-02-02 | Added Core Design Principles (Scalability, Configurability, Multi-Tenancy, Reusability) |
| 1.3.0   | 2026-02-08 | Platform state review: Added shared config package, Storefront Control admin redesign (6-section nav, shadcn/ui, Cmd+K, live preview), Bulk Manager in architecture diagram, updated INP metric, 64 config hooks, account UI refurbish |
| 1.4.0   | 2026-02-11 | Added Catalog Generator & Store Infrastructure tool (section 9.8): @saleor/configurator integration with SINGLE_REFERENCE patch, config.yml for infrastructure-as-code, product catalog generation pipeline, Hebrew translation script |
| 1.5.0   | 2026-02-20 | Documentation audit: Updated tech stack versions (Next.js 16, React 19.2, Tailwind 4.1, Zustand 5, URQL 5), added Dropship Orchestrator app (section 9.10), added missing containers (Image Studio, Dropship, rembg, esrgan), updated architecture diagram |
| 1.6.0   | 2026-02-21 | Phase 0 pre-launch blockers: Added GA4/GTM analytics integration (consent-gated, 5 e-commerce events), GDPR cookie consent banner (3 categories, configurable via Storefront Control), Google Ads conversion tracking. Updated security section with cookie consent compliance. |
| 1.7.0   | 2026-02-22 | Added E2E testing section (16): 23 Playwright tests across 5 critical flows (cart, checkout, auth, search, account). Page object pattern, cookie injection auth, global setup. Updated TOC. |
| 1.8.0   | 2026-03-04 | Checkout V2 complete (Phases 0-6): Single-page accordion checkout with server actions, deferred registration, Stripe/Adyen integration. Page-based CMS refurbish (11 pages like Shopify Theme Editor). Component Designer with 47 wired components and visual overlay. |
| 1.9.0   | 2026-03-12 | Major cleanup: Deleted ~161 stale files (~24,500 lines), removed deprecated scripts (superseded by platform.ps1), dissolved backend/ directory (moved docs to saleor/). Added Tax Manager App (section 9.11), Platform CLI section (12.1). Updated architecture diagram, Checkout V2 details, directory structure, Appendix D documentation table. |

---

**Document Classification:** Internal Use  
**Review Cycle:** Monthly  
**Next Review:** April 2026

---

> **REMINDER FOR AI AGENTS:**
>
> 1. **Docker First**: Always use `docker exec` for running npm/pnpm/python commands - NEVER run on host
> 2. **Scalability**: Design every feature to handle 10x current load
> 3. **Configurability**: Make everything configurable via Storefront Control - no hardcoded values
> 4. **Multi-Tenancy**: Assume the code will power multiple stores/brands
> 5. **Documentation**: Update PRD.md and AGENTS.md when making significant changes
> 6. **Reusability**: Extract common patterns into hooks/components - DRY principle
> 7. **Container Names**: Use `-dev` suffix in development (e.g., `aura-storefront-dev`)
