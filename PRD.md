# Product Requirements Document (PRD)

## Aura E-Commerce Platform

**Version:** 1.5.0
**Last Updated:** February 20, 2026
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
16. [Appendices](#appendices)

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
├── dashboard/                 # Admin Dashboard (React 18 + Vite)
├── storefront/               # Customer-Facing Storefront (Next.js 16, React 19)
├── apps/                     # Saleor Apps Monorepo (Turborepo)
│   ├── apps/
│   │   ├── storefront-control/   # CMS Configuration App (shadcn/ui + Tailwind)
│   │   ├── bulk-manager/         # Bulk Import/Export Manager
│   │   ├── stripe/               # Stripe Payment Gateway
│   │   ├── smtp/                 # Email Notifications
│   │   ├── invoices/             # PDF Invoice Generation
│   │   ├── newsletter/           # Newsletter & Campaigns
│   │   └── sales-analytics/      # Sales Analytics Dashboard
│   └── packages/
│       └── storefront-config/    # Shared config schema & types (@saleor/apps-storefront-config)
├── infra/                    # Docker Compose & Infrastructure
│   └── docker-compose.dev.yml    # Main development orchestration
├── PRD.md                    # This document (keep updated!)
├── CLAUDE.md                 # Claude Code guidelines (keep updated!)
└── AGENTS.md                 # Agent guidelines (keep updated!)
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
│  │         Theme | Features | Content | Filters | SEO | Sections           │ │
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
| `saleor-postgres-dev`               | 5432 | PostgreSQL database      |
| `saleor-redis-dev`                  | 6379 | Redis cache/broker       |
| `saleor-api-dev`                    | 8000 | Saleor GraphQL API       |
| `saleor-worker-dev`                 | -    | Celery background worker |
| `saleor-scheduler-dev`              | -    | Celery beat scheduler    |
| `saleor-dashboard-dev`              | 9000 | Admin dashboard          |
| `saleor-storefront-dev`             | 3000 | Customer storefront      |
| `saleor-storefront-control-app-dev` | 3004 | CMS configuration        |
| `saleor-stripe-app-dev`             | 3002 | Stripe payments          |
| `saleor-smtp-app-dev`               | 3001 | Email notifications      |
| `saleor-invoice-app-dev`            | 3003 | PDF invoices             |
| `saleor-newsletter-app-dev`         | 3005 | Newsletter management    |
| `saleor-sales-analytics-app-dev`    | 3006 | Sales analytics          |
| `saleor-bulk-manager-app-dev`       | 3007 | Bulk import/export       |
| `saleor-image-studio-app-dev`      | 3008 | AI image editor          |
| `saleor-dropship-app-dev`          | 3009 | Dropship orchestrator    |
| `saleor-rembg-dev`                 | 7000 | AI background removal    |
| `saleor-esrgan-dev`                | 7001 | AI image upscaling       |

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
docker compose -f infra/docker-compose.dev.yml logs -f saleor-storefront-dev

# Restart specific service
docker compose -f infra/docker-compose.dev.yml restart saleor-storefront-dev

# Check container status
docker compose -f infra/docker-compose.dev.yml ps

# Stop all services
docker compose -f infra/docker-compose.dev.yml down

# Rebuild a specific container (after Dockerfile changes)
docker compose -f infra/docker-compose.dev.yml build saleor-storefront-dev
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
│       │   └── checkout/    # Checkout flow
│       └── checkout/        # Checkout layout
├── ui/                      # UI Components
│   └── components/          # Reusable components
├── providers/               # React Context providers
├── lib/                     # Utilities & helpers
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
| `/cart`              | `CartPage.tsx`             | Shopping cart                                  |
| `/checkout`          | Checkout flow              | Multi-step checkout                            |
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
│  │ • 6-Section Admin: Store, Design, Pages,  │                                │
│  │   Commerce, Content, Integrations         │                                │
│  │ • shadcn/ui + Tailwind CSS + Radix UI    │                                │
│  │ • Cmd+K Command Palette + Search         │                                │
│  │ • Live Preview (PostMessage bridge)       │                                │
│  │ • Homepage Section Drag & Drop           │                                │
│  │ • Content Editor (6 sub-tabs)            │                                │
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
│  │ • storefront-cms-config.json (runtime) │                                 │
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
6. **After any config change**, restart both `saleor-storefront-dev` and `saleor-storefront-control-app-dev` containers.

---

## 8. Admin Dashboard

### 8.1 Overview

The Saleor Dashboard is a React single-page application built with Vite, providing comprehensive store management capabilities.

**Version:** 3.22.24
**Container:** `saleor-dashboard-dev`
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

**Container:** `saleor-storefront-control-app-dev`
**Port:** 3004

**Admin UI (Redesigned):**

| Section | Page | Purpose |
|---------|------|---------|
| Store | `store.tsx` | Store info, name, description, legal links |
| Design | `design.tsx` | Colors (10 tokens), typography, logos, card styles, homepage section ordering (drag & drop) |
| Pages | `pages-config.tsx` | Landing page SEO, layout configuration |
| Commerce | `commerce.tsx` | Currency, shipping, tax, filters, quick filters, promo popup |
| Content | `content/` (6 tabs) | Global text, Shop text, Catalog text, Page text, Checkout text, Account text |
| Integrations | `integrations.tsx` | Newsletter, SMTP, Stripe, social links |

**Tech Stack:** shadcn/ui (19 primitives) + Radix UI + Tailwind CSS + React Hook Form + @dnd-kit
**Features:** Cmd+K command palette, live preview (PostMessage iframe bridge), `useConfigPage` hook for form boilerplate elimination

**Shared Config Package:** `@saleor/apps-storefront-config` — 20 domain schema files (2,332 lines), Zod-inferred types, config migrations. Used by both the admin app and the storefront.

See [Section 7](#7-storefront-control-integration) for detailed integration documentation.

### 9.2 Stripe App

**Purpose:** Payment processing via Stripe.

**Container:** `saleor-stripe-app-dev`  
**Port:** 3002

**Features:**

- Credit/debit card payments
- Webhook handling for payment events
- Automatic payment confirmation
- Refund support

### 9.3 SMTP App

**Purpose:** Email notifications via SMTP.

**Container:** `saleor-smtp-app-dev`  
**Port:** 3001

**Features:**

- Order confirmation emails
- Fulfillment notifications
- Invoice delivery
- Welcome emails
- Password reset emails

### 9.4 Invoice App

**Purpose:** PDF invoice generation.

**Container:** `saleor-invoice-app-dev`  
**Port:** 3003

**Features:**

- Automatic invoice creation on order
- PDF generation with company branding
- Download from storefront and dashboard
- Invoice request via GraphQL

### 9.5 Newsletter App

**Purpose:** Newsletter and email campaign management.

**Container:** `saleor-newsletter-app-dev`  
**Port:** 3005

**Features:**

- Subscriber management (active/inactive)
- MJML email template editor
- Campaign creation and scheduling
- Branding integration from Storefront Control
- Welcome/welcome-back automation

### 9.6 Sales Analytics App

**Purpose:** Professional sales analytics dashboard.

**Container:** `saleor-sales-analytics-app-dev`  
**Port:** 3006

**Features:**

- KPIs: GMV, Total Orders, AOV, Items Sold, Unique Customers
- Visualizations: Revenue trends, top products, category breakdown
- Filters: Time range presets, channel filter
- Excel Export: Multi-sheet professional reports
- Dashboard integration via app extensions

### 9.7 Bulk Manager App

**Purpose:** Full store data migration and batch operations tool. Import entire store data from Shopify, WooCommerce, or Magento via CSV/Excel.

**Container:** `saleor-bulk-manager-app-dev`
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

**Container**: `saleor-image-studio-app-dev` | **Port**: 3008

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
- `saleor-rembg-dev` (port 7000): danielgatis/rembg, ~2GB memory, CPU-based
- `saleor-esrgan-dev` (port 7001): Real-ESRGAN wrapper, ~3GB memory, CPU-based
- Nano Banana / Gemini (external): Google Gemini 2.5 Flash Image, requires `GEMINI_API_KEY` env var (free 50 req/day)

**Tech Stack**: Next.js (Pages Router), tRPC (4 sub-routers: ai, products, media, enhance), Fabric.js v6, Sharp, idb-keyval, shadcn/ui + Tailwind CSS

**tRPC Routers**:
- `ai-router`: removeBackground, generateBackground, upscale, checkHealth
- `products-router`: list (paginated with search), getDetail, channels
- `media-router`: uploadToProduct, updateAlt, delete, downloadOriginal
- `enhance-router`: resize, adjustColors, convertFormat

### 9.10 Dropship Orchestrator App

**Purpose**: Multi-supplier dropshipping middleware for mixed inventory stores. Auto-forwards dropship-tagged orders to AliExpress/CJ Dropshipping, syncs tracking/fulfillment back to Saleor, with fraud detection, financial safety controls, exception queue, and admin dashboard. Toggleable — when disabled, store operates normally with concrete inventory.

**Container**: `saleor-dropship-app-dev` | **Port**: 3009

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
- Quantity adjustment
- Promo code / voucher support
- Free shipping progress bar
- Save for later
- Selection-based checkout

**Checkout Flow:**

1. Contact information (email)
2. Shipping address
3. Delivery method
4. Payment (Stripe)
5. Order confirmation

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

### 12.1 Starting the Development Environment

```bash
# Navigate to project root
cd saleor-platform

# Start all services
docker compose -f infra/docker-compose.dev.yml up -d

# Wait for all services to be healthy
docker compose -f infra/docker-compose.dev.yml ps

# Access applications:
# - Storefront: http://localhost:3000
# - Dashboard: http://localhost:9000
# - GraphQL Playground: http://localhost:8000/graphql/
```

### 12.2 Storefront Commands

**Container:** `saleor-storefront-dev`

```bash
# Install dependencies
docker exec -it saleor-storefront-dev pnpm install

# Run development server (usually auto-started)
docker exec -it saleor-storefront-dev pnpm dev

# Build for production
docker exec -it saleor-storefront-dev pnpm build

# Run linter
docker exec -it saleor-storefront-dev pnpm lint

# Run TypeScript type check
docker exec -it saleor-storefront-dev pnpm type-check

# Generate GraphQL types (after schema changes)
docker exec -it saleor-storefront-dev pnpm generate

# Interactive shell
docker exec -it saleor-storefront-dev sh
```

### 12.3 Dashboard Commands

**Container:** `saleor-dashboard-dev`

```bash
# Install dependencies
docker exec -it saleor-dashboard-dev pnpm install

# Run development server
docker exec -it saleor-dashboard-dev pnpm dev

# Build for production
docker exec -it saleor-dashboard-dev pnpm build

# Run linter
docker exec -it saleor-dashboard-dev pnpm lint

# Run TypeScript type check
docker exec -it saleor-dashboard-dev pnpm check-types

# Generate GraphQL types
docker exec -it saleor-dashboard-dev pnpm generate

# Run tests
docker exec -it saleor-dashboard-dev pnpm test
```

### 12.4 Apps Monorepo Commands

**Container:** `saleor-storefront-control-app-dev` (or other app containers)

```bash
# Storefront Control App
docker exec -it saleor-storefront-control-app-dev pnpm install
docker exec -it saleor-storefront-control-app-dev pnpm dev
docker exec -it saleor-storefront-control-app-dev pnpm build
docker exec -it saleor-storefront-control-app-dev pnpm lint

# Newsletter App
docker exec -it saleor-newsletter-app-dev pnpm install
docker exec -it saleor-newsletter-app-dev pnpm dev

# Sales Analytics App
docker exec -it saleor-sales-analytics-app-dev pnpm install
docker exec -it saleor-sales-analytics-app-dev pnpm dev

# SMTP App
docker exec -it saleor-smtp-app-dev pnpm install
docker exec -it saleor-smtp-app-dev pnpm dev

# Invoice App
docker exec -it saleor-invoice-app-dev pnpm install
docker exec -it saleor-invoice-app-dev pnpm dev

# Stripe App
docker exec -it saleor-stripe-app-dev pnpm install
docker exec -it saleor-stripe-app-dev pnpm dev
```

### 12.5 Saleor API (Python/Django) Commands

**Container:** `saleor-api-dev`

```bash
# Run migrations
docker exec -it saleor-api-dev python manage.py migrate

# Create migrations
docker exec -it saleor-api-dev python manage.py makemigrations

# Build GraphQL schema
docker exec -it saleor-api-dev python manage.py build_schema

# Create superuser
docker exec -it saleor-api-dev python manage.py createsuperuser

# Run tests
docker exec -it saleor-api-dev pytest --reuse-db

# Run specific test file
docker exec -it saleor-api-dev pytest --reuse-db saleor/graphql/product/tests/test_product.py

# Interactive Django shell
docker exec -it saleor-api-dev python manage.py shell

# Interactive bash shell
docker exec -it saleor-api-dev bash
```

### 12.6 Database Commands

**Container:** `saleor-postgres-dev`

```bash
# Connect to PostgreSQL
docker exec -it saleor-postgres-dev psql -U saleor -d saleor

# Backup database
docker exec saleor-postgres-dev pg_dump -U saleor saleor > backup.sql

# Restore database
docker exec -i saleor-postgres-dev psql -U saleor saleor < backup.sql
```

### 12.7 Container Restart Guidelines

| Change Location                 | Container(s) to Restart                                       |
| ------------------------------- | ------------------------------------------------------------- |
| `saleor/` (Python code)         | `saleor-api-dev`, `saleor-worker-dev`, `saleor-scheduler-dev` |
| `saleor/` (migrations)          | Run migrate first, then restart `saleor-api-dev`              |
| `dashboard/`                    | `saleor-dashboard-dev`                                        |
| `storefront/`                   | `saleor-storefront-dev`                                       |
| `apps/apps/storefront-control/` | `saleor-storefront-control-app-dev`                           |
| `apps/apps/stripe/`             | `saleor-stripe-app-dev`                                       |
| `apps/apps/smtp/`               | `saleor-smtp-app-dev`                                         |
| `apps/apps/invoices/`           | `saleor-invoice-app-dev`                                      |
| `apps/apps/newsletter/`         | `saleor-newsletter-app-dev`                                   |
| `apps/apps/sales-analytics/`    | `saleor-sales-analytics-app-dev`                              |
| `apps/apps/bulk-manager/`       | `saleor-bulk-manager-app-dev`                                 |
| `apps/apps/image-studio/`      | `saleor-image-studio-app-dev`                                 |
| `apps/apps/dropship-orchestrator/` | `saleor-dropship-app-dev`                                 |

**Restart command:**

```bash
docker compose -f infra/docker-compose.dev.yml restart <container-name>
```

### 12.8 Viewing Logs

```bash
# All containers
docker compose -f infra/docker-compose.dev.yml logs -f

# Specific container
docker compose -f infra/docker-compose.dev.yml logs -f saleor-storefront-dev

# Last 100 lines
docker compose -f infra/docker-compose.dev.yml logs --tail=100 saleor-api-dev
```

### 12.9 Code Style Guidelines

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
| `infra/docker-compose.dev.yml` | Service definitions                     | With infrastructure changes |

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

---

**Document Classification:** Internal Use  
**Review Cycle:** Monthly  
**Next Review:** March 2026

---

> **REMINDER FOR AI AGENTS:**
>
> 1. **Docker First**: Always use `docker exec` for running npm/pnpm/python commands - NEVER run on host
> 2. **Scalability**: Design every feature to handle 10x current load
> 3. **Configurability**: Make everything configurable via Storefront Control - no hardcoded values
> 4. **Multi-Tenancy**: Assume the code will power multiple stores/brands
> 5. **Documentation**: Update PRD.md and AGENTS.md when making significant changes
> 6. **Reusability**: Extract common patterns into hooks/components - DRY principle
> 7. **Container Names**: Use `-dev` suffix in development (e.g., `saleor-storefront-dev`)
