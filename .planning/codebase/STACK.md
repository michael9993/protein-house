# Technology Stack

**Analysis Date:** 2026-02-15

## Languages

**Primary:**
- Python 3.12 - Backend (Saleor GraphQL API)
- TypeScript 5.3+ - Frontend (React, Next.js, Dashboard, Apps)
- JavaScript - Configuration and build scripts

**Secondary:**
- GraphQL - API query language for all frontend-backend communication

## Runtime

**Backend:**
- Python 3.12.x runtime
- Django 5.2.8 - Web framework with GraphQL via Graphene
- ASGI via uvicorn for async support (port 8000 in Docker)

**Frontend:**
- Node.js 22.x (required, see `.nvmrc` and `package.json` engines)
- pnpm 10.x+ - Package manager for monorepo workspaces
- Next.js 15.1.4 - React framework (App Router + Pages Router)
- React 19.1.0 - UI library

**Background Jobs:**
- Celery 4.4.5+ - Distributed task queue
- Redis 7-alpine - Message broker and result backend
- Celery Beat - Scheduler for periodic tasks

**Databases:**
- PostgreSQL 15-alpine - Primary relational database
- DynamoDB (AWS SDK) - Optional for app configuration storage (Stripe, Klaviyo apps)

**Caching:**
- Redis 7-alpine - Session cache, Celery broker

## Frameworks & Build Tools

**API & Backend:**
- Django 5.2.8 - REST/GraphQL framework
- Graphene 2.x - GraphQL schema definition (Python)
- Saleor 3.23.0-a.0 - E-commerce platform (customized)

**Frontend Frameworks:**
- Next.js 15.1.4 - React meta-framework with SSR/SSG
- React 19.1.0 - Component library
- React Dom 19.1.0 - DOM rendering

**State Management:**
- Zustand 4.4.6 - Lightweight state (checkout form validation, cart drawer)
- React Context API - Global state (store config, auth, wishlist)
- @saleor/auth-sdk - Auth state via cookies

**API Communication:**
- urql 4.0.6 - GraphQL client for storefront (server-side + client-side)
- Apollo Client 3.4.17 - GraphQL client for dashboard
- tRPC - Type-safe API layer for apps

**Styling & UI:**
- Tailwind CSS 3.4.0 - Utility-first CSS framework
- shadcn/ui - Component library (used in admin apps)
- Macaw UI (@saleor/macaw-ui 0.7.4, 1.4.1) - Saleor design system
- PostCSS 8.4.32 - CSS processing
- autoprefixer 10.4.16 - Vendor prefixes

**Form Handling:**
- React Hook Form 7.x - Form state management
- Zod 3.23.8 - TypeScript-first schema validation
- Formik 2.4.5 - Alternative form library (storefront legacy)
- Yup 1.3.2 - Schema validation (storefront)

**UI Components & Icons:**
- Radix UI - Headless component primitives (Dialog, Select, Tabs, etc.)
- Lucide React 0.358.0 - SVG icon library
- Headless UI 1.7.18 - Unstyled components
- Material-UI 4.12.4, 5.x - Component library (dashboard legacy)

**Payment UI:**
- @stripe/react-stripe-js 3.7.0 - Stripe React components
- @stripe/stripe-js 7.3.0 - Stripe.js SDK
- @adyen/adyen-web 5.53.3 - Adyen payment components

**Rich Text & Editors:**
- Editor.js 2.30.7 - Block editor for CMS content
- EditorJS plugins (Header, List, Paragraph, Quote) - Rich text blocks
- React Editor JS - React wrapper for Editor.js
- editorjs-html 3.4.3 - HTML conversion

**Data Visualization (Analytics):**
- Tremor - Analytics charts (Sales Analytics app)

**Checkout & E-Commerce:**
- Swiper 12.0.0 - Touch carousel (product sliders)
- react-slider 2.0.6 - Range slider for filters
- sharp 0.33.2 - Image processing (server-side)

**Image Processing (Image Studio App):**
- Fabric.js 6.6.1 - Canvas manipulation and editing
- sharp 0.33.2 - Server-side image optimization
- idb-keyval 6.2.1 - IndexedDB storage for auto-save
- react-colorful 5.6.1 - Color picker component

**Build & Dev Tools:**
- Vite 4/5 - Build tool for dashboard
- Turbo 2.4.4 - Monorepo task orchestration (apps)
- tsc (TypeScript Compiler) - Type checking
- ESLint 8.56.0 - JavaScript linting
- Prettier 3.1.1 - Code formatting
- Husky 8.0.3 - Git hooks
- lint-staged 15.1.0 - Pre-commit hooks

**Code Generation:**
- @graphql-codegen/cli 5.0.0 - GraphQL type generation
- @graphql-codegen/client-preset 4.1.0 - Client codegen preset
- graphql-tag 2.12.6 - GraphQL template literals

**Monorepo & Workspaces:**
- pnpm 10.x - Workspace monorepo manager
- Turborepo 2.4.4 - Build orchestration (apps/)

**Testing:**
- Jest 29.x - Unit test runner (dashboard, apps)
- Vitest - Unit test runner (apps, modern alternative)
- React Testing Library - Component testing
- Playwright - E2E browser testing (dashboard, apps)
- PactumJS - API E2E testing (apps)
- pytest 8.3.2+ - Python test framework
- pytest-django 4.11.1 - Django integration
- pytest-celery 1.0.1+ - Celery task testing

**Type Safety & Validation:**
- TypeScript 5.3.3 - Static typing
- Zod 3.23.8 - Schema validation
- Pydantic 2.11.0+ - Python data validation
- MyPy - Python type checker

**Environment & Config:**
- dj-database-url 2.x - Parse DATABASE_URL
- dj-email-url 1.x - Parse EMAIL_URL
- django-cache-url 3.1.2+ - Parse CACHE_URL
- dotenv - .env file support
- @next/env - Next.js environment loading

**Utilities:**
- lodash-es 4.17.21 - Utility functions
- clsx 2.1.0 - Class name merging
- query-string 8.1.0 - URL query string parsing
- url-join 5.0.0 - URL path joining
- ts-invariant 0.10.3 - Runtime assertions
- xss 1.0.15 - XSS sanitization
- libphonenumber-js 1.10.58 - Phone number formatting
- text-unidecode 1.2 - Unicode text normalization

**Observability:**
- Sentry 8.55.0 - Error tracking and monitoring
- OpenTelemetry 1.32.1+ - Distributed tracing and instrumentation
- python-json-logger 0.1.11+ - Structured JSON logging
- Pydantic JSON Schema - API documentation

**AI & ML Services (Image Studio):**
- rembg (Docker service on port 7000) - Background removal AI
- Real-ESRGAN (Docker service on port 7001) - Image upscaling AI
- Gemini API - Image generation (Google)
- Google Cloud Storage - Cloud file storage option

## Configuration

**Environment Variables:**
- `.env` file in `infra/` - Docker Compose configuration
- `.env.local` in frontend projects - Build-time environment
- Environment variables passed to Docker containers via `env_file` in compose
- All critical secrets managed via environment variables (never hardcoded)

**Build Configuration:**
- `tsconfig.json` - TypeScript compiler settings (strict mode enabled)
- `next.config.js` - Next.js configuration (storefront)
- `vitest.config.ts` - Vitest configuration (apps)
- `.eslintrc.js`, `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier formatting rules
- `turbo.json` - Turborepo task pipeline (apps)
- `pyproject.toml` - Python project metadata and dependencies (Saleor)
- `setup.py` / `requirements.txt` - Python dependency management

**Docker Configuration:**
- `infra/docker-compose.dev.yml` - Development environment (14+ services)
- `Dockerfile` in `saleor/` - Backend image build
- Node.js images used for frontend services (node:22-alpine)
- Custom ESRGAN Dockerfile in `infra/esrgan/`

**GraphQL:**
- GraphQL schema sourced from Saleor API
- `.graphqlrc.ts` - GraphQL Code Generator configuration
- `codegen-main.ts`, `codegen-staging.ts` - Dashboard codegen configs
- Schema versioning: Saleor 3.22 (dashboard), 3.20 (image-studio), 3.23 (backend)

## Platform Requirements

**Development:**
- Node.js >= 22.0.0 (required across all frontend workspaces)
- pnpm >= 10.0.0 (package manager for Node.js)
- Python 3.12.x (for Saleor backend, see pyproject.toml)
- Docker + Docker Compose (all services run in containers)
- Git (version control)

**Docker Services (Development):**
- aura-api-dev (port 8000) - GraphQL API
- aura-worker-dev - Celery background worker
- aura-scheduler-dev - Celery Beat scheduler
- aura-postgres-dev (port 5432) - PostgreSQL
- aura-redis-dev (port 6379) - Redis cache/broker
- aura-dashboard-dev (port 9000) - Admin dashboard
- aura-storefront-dev (port 3000) - Customer storefront
- aura-smtp-app-dev (port 3001) - Email/SMTP app
- aura-stripe-app-dev (port 3002) - Stripe payments
- aura-invoice-app-dev (port 3003) - Invoice generation
- aura-storefront-control-app-dev (port 3004) - CMS admin
- aura-newsletter-app-dev (port 3005) - Newsletter campaigns
- aura-sales-analytics-app-dev (port 3006) - Sales analytics
- aura-bulk-manager-app-dev (port 3007) - Bulk import/export
- aura-image-studio-app-dev (port 3008) - AI image editor
- aura-rembg-dev (port 7000) - Background removal AI
- aura-esrgan-dev (port 7001) - Image upscaling AI

**Production:**
- Docker or Kubernetes for orchestration
- AWS (EC2, RDS, S3, DynamoDB, Lambda) - Recommended cloud provider
- PostgreSQL managed database (RDS or equivalent)
- Redis managed (ElastiCache or equivalent)
- S3 or equivalent for file storage
- CloudFront or CDN for static assets
- Stripe/Adyen merchant accounts for payments
- SendGrid or equivalent for transactional email
- Sentry.io for error tracking (optional)

---

*Stack analysis: 2026-02-15*
