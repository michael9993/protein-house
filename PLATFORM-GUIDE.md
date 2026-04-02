# Aura Platform Guide

> **Single authoritative reference for the Aura E-Commerce Platform.**
> Supersedes SETUP-GUIDE.md, CLONE-GUIDE.md, and UPGRADE-EXISTING-CLONE.md.
> Covers architecture, setup, git workflow, Docker, operations, and troubleshooting.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Creating a New Store](#2-creating-a-new-store)
3. [Git Workflow](#3-git-workflow)
4. [Docker Architecture](#4-docker-architecture)
5. [Environment Variables](#5-environment-variables)
6. [Platform CLI Reference](#6-platform-cli-reference)
7. [Catalog & Products](#7-catalog--products)
8. [Storefront Configuration (3-Tier)](#8-storefront-configuration-3-tier)
9. [Apps & Webhooks](#9-apps--webhooks)
10. [Domain & Tunnels](#10-domain--tunnels)
11. [Database & Redis](#11-database--redis)
12. [Deployment](#12-deployment)
13. [Troubleshooting](#13-troubleshooting)
14. [File Reference](#14-file-reference)

---

## 1. Architecture Overview

### Template + Downstream Store Pattern

```
┌──────────────────────────────────────────────────────────┐
│                  aura-platform (TEMPLATE)                │
│         github.com/michael9993/aura-platform             │
│                                                          │
│   Platform code: saleor/, dashboard/, storefront/src/,   │
│   apps/apps/*/src/, infra/platform.ps1, docker-compose   │
│                                                          │
│   Syncs TO downstream stores via `platform.ps1 sync`     │
└───────────────┬──────────────────────┬───────────────────┘
                │ git clone + rebrand  │ git clone + rebrand
                ▼                      ▼
┌──────────────────────┐  ┌──────────────────────────┐
│  Pawzen Pets (STORE)  │  │  Protein House (STORE)    │
│  Container prefix:    │  │  Container prefix:        │
│  pawzen-*-dev         │  │  protein-*-dev            │
│                       │  │                           │
│  Store-specific:      │  │  Store-specific:          │
│  - sample configs     │  │  - sample configs         │
│  - catalog data       │  │  - catalog data           │
│  - .env, platform.yml │  │  - .env, platform.yml     │
│  - PRD.md             │  │  - PRD.md                 │
└──────────────────────┘  └──────────────────────────┘
```

### Three Repositories

| Repo | Role | URL |
|------|------|-----|
| **aura-platform** | Template — all platform code, bug fixes, new features | `github.com/michael9993/aura-platform` |
| **Pawzen Pets** | Downstream store — pet supplies (reference implementation) | Store-specific repo |
| **Protein House** | Downstream store — sports supplements | Store-specific repo |

Each downstream store is a full clone of the template, rebranded via the setup wizard, with store-specific files protected from upstream overwrites.

### File Classification

| Category | Behavior | Examples |
|----------|----------|---------|
| **Platform Code** (sync) | Always pulled from upstream | `saleor/**`, `dashboard/**`, `storefront/src/**`, `apps/apps/*/src/**`, `infra/platform.ps1`, `infra/lib/**`, `infra/docker-compose.*.yml`, `*.config.*`, `package.json` |
| **Store-Specific** (protect) | Never overwritten during sync (`merge=ours` in `.gitattributes`) | `sample-config-import*.json`, `storefront-cms-config.json`, `products.ts`, `categories.ts`, `collections.ts`, `PRD.md`, `pnpm-lock.yaml` |
| **Gitignored** (ignore) | Never in git, never conflict | `infra/.env`, `infra/platform.yml`, `infra/cloudflared-config.yml`, `scripts/catalog-generator/config.yml`, `.saleor-app-auth.json`, `output/` |

---

## 2. Creating a New Store

### Quick Start

```powershell
git clone https://github.com/michael9993/aura-platform.git my-store
cd my-store/infra
.\platform.ps1 setup
```

This single command runs through **9 steps** automatically.

### Prerequisites

| Requirement | Install Command | Purpose |
|-------------|-----------------|---------|
| **Docker Desktop** (Compose v2) | [docker.com](https://www.docker.com/products/docker-desktop/) | Runs all 20+ containers |
| **PowerShell 7+** | `winget install Microsoft.PowerShell` | Platform CLI |
| **Git** | `winget install Git.Git` | Source control, upstream sync |
| **Node.js 22+** | `winget install OpenJS.NodeJS` | Catalog generator (host-side only) |
| **pnpm 10+** | `npm install -g pnpm` | Package manager for host scripts |
| **cloudflared** (optional) | `winget install Cloudflare.cloudflared` | Tunnel access for public URLs |

### 9-Step Setup Flow

| Step | Command | Required? | What Happens |
|------|---------|-----------|--------------|
| 1 | `init` | Yes | Verifies Docker, PowerShell, cloudflared; copies `.env.example` to `.env`; auto-generates `SECRET_KEY`, `APP_SECRET_KEY`, `RSA_PRIVATE_KEY`, `WEBHOOK_SECRET_KEY` |
| 2 | `new-store` | Yes | Interactive wizard collecting ~10 inputs for store identity |
| 3 | Port allocation | Yes | Auto-detects available ports (defaults: 8000/9000/3000) |
| 4 | Connectivity mode | Yes | Chooses localhost, ephemeral tunnel, or custom domain |
| 5 | Generate `.env` | Yes | Creates `infra/.env` with all variables populated |
| 6 | `up` + `db-init` | Yes | Starts containers, runs Django migrations, creates admin superuser, exports GraphQL schema |
| 7 | `install-apps` | Optional (default: yes) | Registers all 11 Saleor apps via manifest URLs |
| 8 | Catalog setup | Optional (default: no) | Deploys store infrastructure + generates product catalog |
| 9 | Git upstream | Optional (default: yes) | Configures upstream tracking and `merge=ours` strategy |

Non-interactive: `.\infra\platform.ps1 setup -NonInteractive`
Self-hosted: `.\infra\platform.ps1 setup -Mode selfhosted -Domain "mystore.com"`

### Store Identity Wizard Fields

| Field | Required | Default | Example | Description |
|-------|----------|---------|---------|-------------|
| Store Name | Yes | -- | `Cool Shoes` | Dashboard header, emails, page titles |
| Store Slug | Auto | From name | `cool-shoes` | `COMPOSE_PREFIX`, container names, volumes |
| Store Type | No | `physical` | `physical` / `digital` | Shipping/checkout defaults |
| Tagline | No | -- | `Step into style` | Storefront hero section |
| Primary Color | No | `#1B2838` | `#E11D48` | Main brand color |
| Secondary Color | No | `#1E4D3A` | `#3B82F6` | Supporting brand color |
| Accent Color | No | `#C9A962` | `#F59E0B` | Badges, promotions |
| Domain | No | -- | `coolshoes.com` | Tunnel/production URLs |
| Admin Email | No | `admin@{domain}` | `admin@coolshoes.com` | Initial superuser |
| Admin Password | No | Auto-generated | -- | Initial superuser |
| GTM Container ID | No | -- | `GTM-XXXXXXX` | Google Tag Manager |
| GA4 Measurement ID | No | -- | `G-XXXXXXXXXX` | Google Analytics 4 |

### What Gets Generated

| File | What Changes |
|------|-------------|
| `infra/platform.yml` | Store name, slug, domain, colors, analytics, container names |
| `infra/.env` | Domain, store name, `COMPOSE_PREFIX`, tunnel URLs, admin credentials |
| `apps/apps/storefront-control/sample-config-import-en.json` | English store branding |
| `apps/apps/storefront-control/sample-config-import.json` | Hebrew store branding (partial -- update tagline manually) |
| `storefront/storefront-cms-config.json` | Both channel configs |
| `infra/cloudflared-config.yml` | Tunnel routes (if domain provided) |
| `scripts/catalog-generator/config.yml` | Shop name |

### Manual Steps After Wizard

1. **Hebrew translations** -- Update tagline/description in `sample-config-import.json`
2. **Logo upload** -- Storefront Control app > Design > Branding
3. **SMTP email templates** -- Dashboard > Extensions > SMTP > Templates
4. **SEO metadata** -- Storefront Control app > SEO page
5. **Payment provider API keys** -- Stripe/PayPal in `.env` or Dashboard
6. **Google Analytics** -- Set GTM/GA4 IDs in Storefront Control or via wizard

---

## 3. Git Workflow

### Remote Setup for a Downstream Store

```bash
# origin = your store's repo
git remote add origin https://github.com/your-org/your-store.git

# upstream = aura-platform template (for pulling updates)
git remote add upstream https://github.com/michael9993/aura-platform.git

# template = aura-platform (for pushing fixes back)
git remote add template https://github.com/michael9993/aura-platform.git

# Enable merge=ours driver (one-time per clone)
git config merge.ours.driver true
```

### Pushing Fixes from Store to Template

When you fix a bug or add a feature in a downstream store that should go upstream:

```bash
# 1. Create a template branch tracking upstream
git checkout -b template upstream/main

# 2. Cherry-pick the fix commit(s)
git cherry-pick <hash>

# 3. Push to the template repo
git push template template:main

# 4. Return to your store branch
git checkout main
```

### When to Cherry-pick vs Keep Store-only

| Change Type | Action | Examples |
|-------------|--------|---------|
| Bug fix in platform code | Cherry-pick to template | Fix in `storefront/src/`, `saleor/`, `apps/*/src/` |
| New platform feature | Cherry-pick to template | New checkout step, new app, new CLI command |
| Infrastructure improvement | Cherry-pick to template | Docker compose fix, CI/CD, build config |
| Store branding/config | Keep store-only | Sample configs, catalog data, PRD, .env |
| Store-specific customization | Keep store-only | Custom product type, unique homepage section |
| Mixed commit (platform + store) | **Split into two commits** | Never cherry-pick a mixed commit |

### Pulling Template Updates to a Store

```powershell
# Preview what would change
.\infra\platform.ps1 sync -DryRun

# Apply upstream changes
.\infra\platform.ps1 sync
```

**What happens during sync:**

1. `git fetch upstream` -- Gets latest template commits
2. `git merge upstream/main` -- Merges platform code into store
3. `.gitattributes merge=ours` -- Automatically keeps store version of protected files
4. Post-merge: Review changes, restart affected containers, regenerate types if needed

### Conflict Resolution

| Scenario | Resolution |
|----------|-----------|
| Protected file conflict | Should not happen (merge=ours). If it does, run `git config merge.ours.driver true` and retry |
| Platform code conflict | Manual merge -- upstream likely changed same file you customized. Prefer upstream version for platform code |
| Lockfile conflict | Accept either version, then run `pnpm install` in container to regenerate |
| New files from upstream | Auto-merged, no conflict |

### Protected Files (`.gitattributes merge=ours`)

```
apps/apps/storefront-control/sample-config-import.json        merge=ours
apps/apps/storefront-control/sample-config-import-en.json     merge=ours
storefront/storefront-cms-config.json                         merge=ours
scripts/catalog-generator/src/config/products.ts              merge=ours
scripts/catalog-generator/src/config/categories.ts            merge=ours
scripts/catalog-generator/src/config/collections.ts           merge=ours
PRD.md                                                        merge=ours
**/pnpm-lock.yaml                                             merge=ours
```

---

## 4. Docker Architecture

### Container Naming

Container names are parameterized via `COMPOSE_PREFIX` in `.env`:

```env
COMPOSE_PREFIX=aura          # Container names: aura-api-dev, aura-storefront-dev, etc.
COMPOSE_PROJECT_NAME=aura    # Volume/network namespace
```

The wizard sets both from your store slug (e.g., "Cool Shoes" becomes `cool-shoes`).

**Naming distinction:**
- `docker exec` uses **container names** (with `-dev`): `docker exec -it aura-api-dev sh`
- `docker compose restart` uses **compose service names** (no prefix, no `-dev`): `docker compose restart saleor-api`

### Internal Hostnames vs Container Names

| Type | Pattern | Same Across Stores? | Example |
|------|---------|---------------------|---------|
| **Internal hostname** (Docker DNS) | Fixed compose service name | Yes -- FIXED | `saleor-api`, `saleor-storefront`, `postgres` |
| **Container name** | `${COMPOSE_PREFIX}-*-dev` | No -- UNIQUE per instance | `aura-api-dev`, `pawzen-api-dev` |

Internal hostnames are used in `DATABASE_URL`, app manifest URLs, and inter-container communication. They never change regardless of `COMPOSE_PREFIX`.

### All 20 Containers

#### Core Infrastructure

| Container Name | Port | Compose Service | Purpose |
|----------------|------|-----------------|---------|
| `{prefix}-api-dev` | 8000 | `saleor-api` | Saleor GraphQL API (Django/uvicorn) |
| `{prefix}-worker-dev` | -- | `saleor-worker` | Celery background worker |
| `{prefix}-scheduler-dev` | -- | `saleor-scheduler` | Celery beat scheduler |
| `{prefix}-dashboard-dev` | 9000 | `saleor-dashboard` | Admin Dashboard (Vite/React) |
| `{prefix}-storefront-dev` | 3000 | `saleor-storefront` | Customer Storefront (Next.js) |
| `{prefix}-postgres-dev` | 5432 | `postgres` | PostgreSQL 16 |
| `{prefix}-redis-dev` | 6379 | `redis` | Redis 7 cache/broker |

#### Saleor Apps

| Container Name | Port | Compose Service | Purpose |
|----------------|------|-----------------|---------|
| `{prefix}-smtp-app-dev` | 3001 | `saleor-smtp-app` | Email notifications |
| `{prefix}-stripe-app-dev` | 3002 | `saleor-stripe-app` | Stripe payments |
| `{prefix}-invoice-app-dev` | 3003 | `saleor-invoice-app` | PDF invoices |
| `{prefix}-storefront-control-app-dev` | 3004 | `saleor-storefront-control-app` | CMS config & live preview |
| `{prefix}-newsletter-app-dev` | 3005 | `saleor-newsletter-app` | Subscribers & campaigns |
| `{prefix}-sales-analytics-app-dev` | 3006 | `saleor-sales-analytics-app` | KPIs, charts, Excel export |
| `{prefix}-bulk-manager-app-dev` | 3007 | `saleor-bulk-manager-app` | Bulk import/export/delete |
| `{prefix}-image-studio-app-dev` | 3008 | `saleor-image-studio-app` | AI-powered image editor |
| `{prefix}-dropship-app-dev` | 3009 | `saleor-dropship-app` | AliExpress + CJ dropshipping |
| `{prefix}-tax-manager-app-dev` | 3010 | `saleor-tax-manager-app` | Self-hosted tax calculation |
| `{prefix}-paypal-app-dev` | 3011 | `saleor-paypal-app` | PayPal Commerce payments |

#### AI Microservices (Image Studio)

| Container Name | Port | Compose Service | Purpose |
|----------------|------|-----------------|---------|
| `{prefix}-rembg-dev` | 7000 | `saleor-rembg` | AI background removal |
| `{prefix}-esrgan-dev` | 7001 | `saleor-esrgan` | AI image upscaling |

### Running Multiple Stores

Each clone needs a unique `COMPOSE_PREFIX`, `COMPOSE_PROJECT_NAME`, and non-conflicting ports.

**Port offset table:**

| Service | Instance 1 | Instance 2 (+100) | Instance 3 (+200) |
|---------|-----------|-------------------|-------------------|
| API | 8000 | 8100 | 8200 |
| Dashboard | 9000 | 9100 | 9200 |
| Storefront | 3000 | 3100 | 3200 |
| Apps (3001-3011) | 3001-3011 | 3101-3111 | 3201-3211 |
| PostgreSQL | 5432 | 5433 | 5434 |
| Redis | 6379 | 6380 | 6381 |
| AI Services | 7000-7001 | 7100-7101 | 7200-7201 |

> Internal container ports are fixed (8000, 9000, 3000, etc.). The `*_PORT` variables control the HOST side only.

**Example side-by-side config:**

| Setting | Store A (shoes) | Store B (jewelry) |
|---------|-----------------|-------------------|
| `COMPOSE_PREFIX` | `shoes` | `jewelry` |
| `COMPOSE_PROJECT_NAME` | `shoes` | `jewelry` |
| `SALEOR_API_PORT` | `8000` | `8100` |
| `DASHBOARD_PORT` | `9000` | `9100` |
| `STOREFRONT_PORT` | `3000` | `3100` |
| `POSTGRES_PORT` | `5432` | `5433` |

Containers: `shoes-api-dev` vs `jewelry-api-dev`. Volumes fully isolated by `COMPOSE_PROJECT_NAME`.

### Container Restart Map

| Change Location | Container(s) to Restart |
|-----------------|------------------------|
| `saleor/` (code) | `saleor-api` |
| `saleor/` (schema/models) | `saleor-api`, `saleor-worker`, `saleor-scheduler` |
| `saleor/` (migrations) | Run migrate first, then restart `saleor-api` |
| `dashboard/` | `saleor-dashboard` |
| `storefront/` | `saleor-storefront` |
| `apps/apps/storefront-control/` | `saleor-storefront-control-app` |
| `apps/apps/stripe/` | `saleor-stripe-app` |
| `apps/apps/smtp/` | `saleor-smtp-app` |
| `apps/apps/invoices/` | `saleor-invoice-app` |
| `apps/apps/newsletter/` | `saleor-newsletter-app` |
| `apps/apps/sales-analytics/` | `saleor-sales-analytics-app` |
| `apps/apps/bulk-manager/` | `saleor-bulk-manager-app` |
| `apps/apps/image-studio/` | `saleor-image-studio-app` |
| `apps/apps/dropship-orchestrator/` | `saleor-dropship-app` |
| `apps/apps/tax-manager/` | `saleor-tax-manager-app` |
| `apps/apps/paypal/` | `saleor-paypal-app` |

```bash
# Restart uses compose SERVICE names (no prefix, no -dev):
docker compose -f infra/docker-compose.dev.yml restart saleor-storefront

# Exec uses CONTAINER names (with prefix and -dev):
docker exec -it aura-storefront-dev sh
```

---

## 5. Environment Variables

### Overview

`infra/.env.example` contains all variables (~188 across 22 sections). During setup, `platform.ps1 init` copies it to `infra/.env` and populates auto-generated values.

### Value Population Markers

| Marker | Meaning | Examples |
|--------|---------|---------|
| `__AUTO__` | Generated by `platform.ps1 init` | `SECRET_KEY`, `RSA_PRIVATE_KEY`, `APP_SECRET_KEY` |
| `__WIZARD__` | Set by `platform.ps1 new-store` | `STORE_NAME`, `PLATFORM_DOMAIN`, `COMPOSE_PREFIX` |
| `__MANUAL__` | You must set yourself | `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID`, `GEMINI_API_KEY` |
| (no marker) | Sensible development default | `DEBUG=True`, `SALEOR_API_PORT=8000` |

### Key Variable Groups

| Section | Key Variables | Notes |
|---------|-------------|-------|
| Docker Namespacing | `COMPOSE_PREFIX`, `COMPOSE_PROJECT_NAME` | Set from store slug |
| Service Ports | `SALEOR_API_PORT`, `DASHBOARD_PORT`, `STOREFRONT_PORT`, + 15 more | Host-side only |
| Database | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL` | Uses Docker service names |
| Redis | `REDIS_URL`, `CELERY_BROKER_URL` | DB 0=cache, 1=broker, 2=results |
| Secrets | `SECRET_KEY`, `APP_SECRET_KEY`, `RSA_PRIVATE_KEY` | Auto-generated; API+Worker+Scheduler MUST share same RSA key |
| Django | `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOW_ALL_ORIGINS` | |
| Internal URLs | `SALEOR_INTERNAL_URL` | Docker service hostnames (never expose to browsers) |
| Public URLs | `STOREFRONT_URL`, `DASHBOARD_URL` | Must be browser-reachable |
| Store Identity | `STORE_NAME`, `STORE_EMAIL`, `PLATFORM_DOMAIN` | Set by wizard |
| Admin | `AURA_ADMIN_EMAIL`, `AURA_ADMIN_PASSWORD` | Initial superuser |
| Email/SMTP | `EMAIL_URL`, `DEFAULT_FROM_EMAIL`, `SMTP_HOST/PORT/USER/PASSWORD` | |
| Storefront | `NEXT_PUBLIC_SALEOR_API_URL`, `NEXT_PUBLIC_DEFAULT_CHANNEL` | **Build-time!** |
| Dashboard | `VITE_API_URL`, `VITE_STORE_NAME` | **Build-time!** |
| Payments | `STRIPE_*`, `PAYPAL_*` | Manual setup |
| Tunnels | `*_TUNNEL_URL` | Only for tunnel/production mode |
| AI Services | `GEMINI_API_KEY`, `STABILITY_API_KEY` | Optional, for Image Studio |
| Media Storage | `MEDIA_URL`, `AWS_*`, `GS_*` | Default: local Docker volume |

### Build-Time vs Runtime Variables

**CRITICAL:** Variables prefixed with `NEXT_PUBLIC_*` (storefront) or `VITE_*` (dashboard) are embedded into the JavaScript bundle at **build time**, not runtime.

- Changing them requires **rebuilding** the container, not just restarting
- They are **visible to end users** in the browser (never put secrets here)
- In dev Docker: entrypoint runs build, so `docker compose restart` effectively rebuilds
- In production: you MUST `docker compose up --build <service>`

**Storefront build-time variables (`NEXT_PUBLIC_*`):**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SALEOR_API_URL` | Browser-side API URL |
| `NEXT_PUBLIC_STOREFRONT_URL` | Public storefront URL (og:url, canonical, sitemap) |
| `NEXT_PUBLIC_DEFAULT_CHANNEL` | Default channel slug |
| `NEXT_PUBLIC_COMING_SOON` | `true` to show coming soon page |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps for store locator |
| `NEXT_PUBLIC_SMTP_APP_URL` | SMTP app URL for contact forms |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking |

**Dashboard build-time variables (`VITE_*`):**

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API URL for dashboard GraphQL |
| `VITE_STORE_NAME` | Store name in dashboard header |
| `VITE_PLATFORM_NAME` | Platform name in dashboard sidebar |
| `VITE_DISABLE_STRICT_MODE` | Disable React StrictMode |
| `VITE_AI_ASSISTANT_ENABLED` | Enable Claude AI assistant in sidebar |
| `VITE_AI_API_KEY` | Claude API key for AI assistant |
| `VITE_AI_MODEL` | Claude model to use |

**How to update:**

```powershell
# 1. Edit infra/.env
# 2. Rebuild the affected container:
docker compose -f infra/docker-compose.dev.yml up --build saleor-storefront   # For NEXT_PUBLIC_*
docker compose -f infra/docker-compose.dev.yml up --build saleor-dashboard    # For VITE_*
```

---

## 6. Platform CLI Reference

All commands run from the repository root as `.\infra\platform.ps1 <command>`.

| Command | Parameters | Description |
|---------|------------|-------------|
| `setup` | `-NonInteractive`, `-Mode`, `-Domain` | Full guided setup (init + new-store + up + db-init + install-apps) |
| `init` | -- | Prerequisites check + `.env` creation + secret generation |
| `new-store` | `-StoreName`, `-PrimaryColor`, `-Domain`, `-StoreType` | Rebrand platform for a new store (wizard) |
| `up` | `-Mode [localhost|selfhosted]`, `-Profile [dev|prod]`, `-NoBrowser` | Start platform (Docker + tunnels) |
| `down` | -- | Stop all containers + tunnels |
| `restart` | `<service|all>` | Restart specific service or all services |
| `status` | -- | Health dashboard (containers, ports, tunnels, CPU/RAM, DB size) |
| `db-init` | `-SeedData` | Initialize database (migrate + admin user + schema export) |
| `install-apps` | `-Include`, `-Exclude`, `-SkipDelete`, `-Email`, `-Password` | Register/reinstall Saleor apps |
| `cleanup-apps` | -- | Remove duplicate app installations, fix permissions |
| `backup` | `-Compress`, `-Retain <int>` | Database backup with rotation |
| `restore` | `<file>` | Restore database from backup file |
| `logs` | `<service>` | Tail container logs (follows output) |
| `codegen` | -- | Run GraphQL codegen in all frontend containers |
| `tunnels` | -- | Start tunnels only (skip Docker) |
| `generate-tunnel-config` | -- | Regenerate `cloudflared-config.yml` from `.env` |
| `sync` | `-DryRun` | Pull upstream template changes + merge |
| `refresh-urls` | -- | Update webhook URLs after tunnel/domain change |
| `help` | -- | Show all available commands |

### Common Workflows

```powershell
# Daily start
.\infra\platform.ps1 up

# Check everything is healthy
.\infra\platform.ps1 status

# Restart storefront after code changes
.\infra\platform.ps1 restart storefront

# View API logs
.\infra\platform.ps1 logs api

# Backup before risky changes
.\infra\platform.ps1 backup -Compress

# Update from upstream template
.\infra\platform.ps1 sync -DryRun      # Preview first
.\infra\platform.ps1 sync              # Apply

# After changing tunnel/domain
.\infra\platform.ps1 refresh-urls
.\infra\platform.ps1 install-apps

# Stop everything
.\infra\platform.ps1 down
```

---

## 7. Catalog & Products

The catalog generator (`scripts/catalog-generator/`) manages store infrastructure as code and generates product files. It runs on the **host machine** (not Docker), connecting to Saleor via the GraphQL API.

### Pipeline

```
config.yml + products.ts + categories.ts + collections.ts
    |
    v
[1] npm run deploy:ci    --> Creates channels, product types, attributes,
                              warehouses, shipping zones in Saleor
    |
    v
[2] npm run translate    --> Adds Hebrew translations for categories/collections
    |
    v
[3] npm run generate     --> Creates product Excel + CSV files in output/
    |
    v
[4] Dashboard > Extensions > Bulk Manager --> Upload and import files
```

### config.yml Structure

Defines the complete store infrastructure:
- **Shop settings**: name, description, default currency
- **Channels**: ILS (Israel) and USD (International) with warehouse/shipping zone assignments
- **Product types**: Each with attributes, variant attributes, and product attributes
- **Attributes**: Text, numeric, dropdown (with values), boolean, etc.
- **Warehouses**: Physical warehouse definitions with addresses
- **Shipping zones**: Per-country shipping methods with pricing

### Catalog Templates

```bash
cd scripts/catalog-generator
npm install                                  # First time only

npm run setup                                # Full pipeline: deploy + translate + generate
npm run generate                             # Default catalog (100 products, 7 brands)
CATALOG_TEMPLATE=starter npm run generate    # Starter template (20 generic products)
```

### All Commands

| Command | Purpose |
|---------|---------|
| `npm run setup` | Full pipeline: deploy + translate + generate |
| `npm run deploy:ci` | Apply config.yml to Saleor (non-interactive) |
| `npm run diff` | Preview changes (dry run) |
| `npm run introspect` | Pull current Saleor state into config.yml |
| `npm run translate` | Add Hebrew translations |
| `npm run generate` | Generate product Excel + CSVs |

### Import via Bulk Manager

Products are **NOT auto-uploaded**. After generation:

1. Open Dashboard > Extensions > Bulk Manager
2. Select **Products** > **Import**
3. Upload the generated Excel file from `scripts/catalog-generator/output/`
4. Map columns and confirm import

### Key Files

| File | Purpose |
|------|---------|
| `scripts/catalog-generator/config.yml` | Store infrastructure YAML (product types, attributes, warehouses, shipping) |
| `scripts/catalog-generator/config.yml.example` | Template with generic product types |
| `scripts/catalog-generator/src/config/products.ts` | Product definitions |
| `scripts/catalog-generator/src/config/categories.ts` | 35+ bilingual categories with hierarchy |
| `scripts/catalog-generator/src/config/collections.ts` | 18 bilingual collections |
| `scripts/catalog-generator/src/add-translations.ts` | Hebrew translation script |
| `scripts/catalog-generator/output/` | Generated Excel/CSV files (gitignored) |
| `scripts/catalog-generator/patches/` | Patches for @saleor/configurator (SINGLE_REFERENCE + shipping fix) |

---

## 8. Storefront Configuration (3-Tier)

| Priority | Source | Location | Use Case |
|----------|--------|----------|----------|
| 1 (Highest) | Storefront Control App | Saleor API Metadata | Production, runtime config |
| 2 | Sample Config Files | `apps/apps/storefront-control/sample-config-import*.json` | Development fallback |
| 3 | Static Config | `storefront/src/config/store.config.ts` | Type definitions, base defaults |

### Initial Configuration

1. **Import sample config:** Storefront Control > Settings > Import Config -- upload `sample-config-import.json` (Hebrew/ILS) or `sample-config-import-en.json` (English/USD)
2. **Configure homepage sections:** Storefront Control > Design -- drag-and-drop section ordering
3. **Set up navigation:** Storefront Control > Header/Footer -- menu items, social links
4. **Customize branding:** Storefront Control > Design > Branding -- colors, typography, logos

### Color Tokens (10 Configurable)

| Token | Used For |
|-------|----------|
| Primary | Main buttons, links, active states |
| Secondary | Supporting elements, hover states |
| Accent | Badges, promotions, highlights |
| Background | Page background |
| Surface | Card and panel backgrounds |
| Text Primary | Main body text |
| Text Secondary | Muted text, captions |
| Border | Dividers, input borders |
| Success | Success messages, in-stock |
| Error | Error messages, out-of-stock |

### What the Wizard Updates

The `new-store` wizard populates store name, tagline, and colors in both sample config files. After importing, the storefront immediately reflects your branding. For full customization (homepage sections, navigation, feature flags, UI text), use the Storefront Control admin UI.

### Config Sections

Store info, branding (10 color tokens, typography, logos), features (19+ toggles), ecommerce (currency, shipping, tax), header/footer, homepage (12+ configurable sections), filters, UI customization, all UI text/translations, localization (RTL/LTR), dark mode, SEO, promo popup.

---

## 9. Apps & Webhooks

### All 11 Apps

| App | Port | Container | Purpose |
|-----|------|-----------|---------|
| **Storefront Control** | 3004 | `{prefix}-storefront-control-app-dev` | Page-based CMS admin, ComponentBlock UI, Cmd+K, live preview |
| **SMTP** | 3001 | `{prefix}-smtp-app-dev` | Email delivery (fulfillment, invoices, welcome) |
| **Stripe** | 3002 | `{prefix}-stripe-app-dev` | Stripe payment processing |
| **Invoices** | 3003 | `{prefix}-invoice-app-dev` | PDF invoice generation |
| **Newsletter** | 3005 | `{prefix}-newsletter-app-dev` | Subscribers, MJML templates, campaigns |
| **Sales Analytics** | 3006 | `{prefix}-sales-analytics-app-dev` | KPIs, charts, Excel export |
| **Bulk Manager** | 3007 | `{prefix}-bulk-manager-app-dev` | CSV/Excel bulk import/export/delete |
| **Image Studio** | 3008 | `{prefix}-image-studio-app-dev` | AI-powered image editor (Fabric.js, bg removal, upscaling) |
| **Dropship Orchestrator** | 3009 | `{prefix}-dropship-app-dev` | Multi-supplier dropshipping (AliExpress + CJ) |
| **Tax Manager** | 3010 | `{prefix}-tax-manager-app-dev` | Self-hosted tax calculation with country/state rates |
| **PayPal** | 3011 | `{prefix}-paypal-app-dev` | PayPal Commerce payments (cards + wallet) |

### App Installation

```powershell
.\infra\platform.ps1 install-apps                              # All 11 apps
.\infra\platform.ps1 install-apps -Include "smtp","stripe"     # Specific apps only
.\infra\platform.ps1 install-apps -Exclude "newsletter"        # All except specific
.\infra\platform.ps1 install-apps -SkipDelete                  # Don't delete existing first
.\infra\platform.ps1 cleanup-apps                              # Remove duplicates, fix permissions
```

### App Manifest URLs (Internal Docker Network)

All apps expose their manifests at `http://<service-name>:3000/api/manifest` using internal Docker service names:

| App | Manifest URL |
|-----|-------------|
| SMTP | `http://saleor-smtp-app:3000/api/manifest` |
| Stripe | `http://saleor-stripe-app:3000/api/manifest` |
| Invoices | `http://saleor-invoice-app:3000/api/manifest` |
| Storefront Control | `http://saleor-storefront-control-app:3000/api/manifest` |
| Newsletter | `http://saleor-newsletter-app:3000/api/manifest` |
| Sales Analytics | `http://saleor-sales-analytics-app:3000/api/manifest` |
| Bulk Manager | `http://saleor-bulk-manager-app:3000/api/manifest` |
| Image Studio | `http://saleor-image-studio-app:3000/api/manifest` |
| Dropship Orchestrator | `http://saleor-dropship-app:3000/api/manifest` |
| Tax Manager | `http://saleor-tax-manager-app:3000/api/manifest` |
| PayPal | `http://saleor-paypal-app:3000/api/manifest` |

### Webhook URLs & Connectivity Mode

Webhook URLs are tied to the connectivity mode:

| Mode | Webhook Base URL | Notes |
|------|-----------------|-------|
| Localhost | `http://<service>:3000` | Internal Docker network -- works only inside Docker |
| Ephemeral Tunnel | `https://<random>.trycloudflare.com` | Changes on every restart -- must re-register apps |
| Custom Domain | `https://<subdomain>.yourdomain.com` | Permanent -- register once |

### APP_API_BASE_URL Pattern

Each app has an `APP_API_BASE_URL` env var in `.env` that tells it its own public URL. Used for:
- Generating webhook callback URLs in the manifest
- Self-referencing in API responses

In localhost mode, this uses `http://localhost:<port>`. In tunnel mode, it uses the tunnel URL.

### After Changing URLs

```powershell
.\infra\platform.ps1 refresh-urls      # Update webhook registrations
.\infra\platform.ps1 install-apps      # Re-register all apps with new URLs
```

---

## 10. Domain & Tunnels

### Localhost (Default)

No setup needed. Access services at:
- Storefront: `http://localhost:3000`
- Dashboard: `http://localhost:9000`
- API: `http://localhost:8000/graphql/`

### Ephemeral Tunnels

Auto-created by `platform.ps1 up` when cloudflared is installed. Random `*.trycloudflare.com` URLs generated and printed to console. URLs change on every restart.

```powershell
.\infra\platform.ps1 up    # Starts Docker + ephemeral tunnels
```

### Custom Domain: Full Step-by-Step

#### Step 1: Cloudflare Account & Domain

1. Create account at https://dash.cloudflare.com/sign-up
2. Add your domain and select Free plan
3. Update registrar nameservers to Cloudflare's
4. Wait for DNS propagation (~30 min)

Recommended security settings:

| Setting | Location | Value |
|---------|----------|-------|
| SSL mode | SSL/TLS > Overview | **Full (strict)** |
| Always Use HTTPS | SSL/TLS > Edge Certificates | **On** |
| HSTS | SSL/TLS > Edge Certificates | **Enable** |
| Bot Fight Mode | Security > Bots | **On** |

#### Step 2: Install & Authenticate cloudflared

```powershell
winget install Cloudflare.cloudflared
cloudflared tunnel login          # Opens browser to authorize
```

#### Step 3: Create Named Tunnel

```powershell
cloudflared tunnel create mystore-platform
```

Save the **Tunnel ID** (UUID). Credentials auto-saved to `C:\Users\<username>\.cloudflared\<TUNNEL_ID>.json`.

#### Step 4: Create 14 DNS CNAME Records

In Cloudflare Dashboard > DNS > Records:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `shop` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `api` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `dash` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `stripe` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `smtp` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `invoices` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `control` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `newsletter` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `analytics` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `bulk` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `studio` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `dropship` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `tax` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | `ext1` | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |

All 14 records point to the same tunnel.

#### Step 5: Update .env with Tunnel URLs

```env
PLATFORM_DOMAIN=mystore.com
SALEOR_API_TUNNEL_URL=https://api.mystore.com
DASHBOARD_TUNNEL_URL=https://dash.mystore.com
STOREFRONT_TUNNEL_URL=https://shop.mystore.com
STRIPE_APP_TUNNEL_URL=https://stripe.mystore.com
SMTP_APP_TUNNEL_URL=https://smtp.mystore.com
INVOICE_APP_TUNNEL_URL=https://invoices.mystore.com
STOREFRONT_CONTROL_APP_TUNNEL_URL=https://control.mystore.com
NEWSLETTER_APP_TUNNEL_URL=https://newsletter.mystore.com
SALES_ANALYTICS_APP_TUNNEL_URL=https://analytics.mystore.com
BULK_MANAGER_APP_TUNNEL_URL=https://bulk.mystore.com
IMAGE_STUDIO_APP_TUNNEL_URL=https://studio.mystore.com
DROPSHIP_APP_TUNNEL_URL=https://dropship.mystore.com
TAX_MANAGER_APP_TUNNEL_URL=https://tax.mystore.com
PAYPAL_APP_TUNNEL_URL=https://ext1.mystore.com

# Also update for CORS/CSRF:
ALLOWED_HOSTS=localhost,saleor-api,api.mystore.com,mystore.com
```

#### Step 6: Generate Tunnel Config

```powershell
.\infra\platform.ps1 generate-tunnel-config
```

Creates/updates `infra/cloudflared-config.yml` with routes for all 14 subdomains.

#### Step 7: Launch

```powershell
.\infra\platform.ps1 up -Mode selfhosted
.\infra\platform.ps1 install-apps          # First time -- registers apps with tunnel URLs
```

---

## 11. Database & Redis

### Per-Instance Isolation

Each store instance gets its own PostgreSQL and Redis containers, fully isolated via `COMPOSE_PROJECT_NAME`.

### Default Credentials

| Setting | Value |
|---------|-------|
| PostgreSQL user | `aura` |
| PostgreSQL password | `aura` |
| PostgreSQL database | `aura` |
| Redis | No authentication (localhost only) |

### Migrations

- **Automatic during setup:** `platform.ps1 up` auto-detects empty DB and runs migrations + admin creation
- **Manual:** `.\infra\platform.ps1 db-init` or `docker exec -it {prefix}-api-dev python manage.py migrate`

### Backup & Restore

```powershell
.\infra\platform.ps1 backup -Compress          # Creates timestamped .sql.gz
.\infra\platform.ps1 backup -Retain 5          # Keep only last 5 backups
.\infra\platform.ps1 restore backup-2026-03-31.sql.gz
```

Direct access:
```bash
docker exec -it {prefix}-postgres-dev psql -U aura -d aura
docker exec {prefix}-postgres-dev pg_dump -U aura aura > backup.sql
```

### Stripe App Database

The Stripe app uses a separate SQLite database initialized by `infra/scripts/init-stripe-database.sh`. This runs automatically during container startup.

### Database Reset

```powershell
docker compose -f infra/docker-compose.dev.yml down -v   # Removes ALL volumes (data lost!)
.\infra\platform.ps1 up                                   # Recreates fresh
```

### Redis Database Allocation

| DB | Purpose |
|----|---------|
| 0 | Django cache |
| 1 | Celery broker |
| 2 | Celery results |

---

## 12. Deployment

### Development (docker-compose.dev.yml)

- Volume mounts for live code editing
- Entrypoint runs build on startup (effectively rebuilds on restart)
- HMR configured but **unreliable on Windows** -- always restart containers after changes
- All 20 containers including AI microservices

```powershell
docker compose -f infra/docker-compose.dev.yml up -d
```

### Production (docker-compose.prod.yml)

- Pre-built images (no volume mounts)
- Resource limits configured
- 14 containers (no AI microservices in default prod)
- Requires explicit `--build` for code changes

```powershell
docker compose -f infra/docker-compose.prod.yml up -d --build
# Or via CLI:
.\infra\platform.ps1 up -Profile prod
```

### Post-Change Verification

| What Changed | Verification Command | Container |
|--------------|---------------------|-----------|
| Storefront code | `docker exec {prefix}-storefront-dev pnpm type-check` | storefront |
| Storefront code | `docker exec {prefix}-storefront-dev pnpm lint` | storefront |
| Storefront Control app | `docker exec {prefix}-storefront-control-app-dev pnpm build` | storefront-control |
| Any app in `apps/` | `docker exec <app-container> pnpm build` | per-app |
| Dashboard code | `docker exec {prefix}-dashboard-dev pnpm check-types` | dashboard |
| Python backend | `docker exec {prefix}-api-dev ruff check .` | api |
| Python backend | `docker exec {prefix}-api-dev mypy saleor` | api |

### GraphQL Schema Change Workflow

```bash
docker exec -it {prefix}-api-dev python manage.py build_schema
docker exec -it {prefix}-dashboard-dev pnpm generate
docker exec -it {prefix}-storefront-dev pnpm generate
```

---

## 13. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Container name conflict | Another store using same `COMPOSE_PREFIX` | Set unique `COMPOSE_PREFIX` in `.env` |
| Port already in use | Another service on same port | Change `*_PORT` values in `.env` (see port offset table) |
| Container won't start | Missing env vars, syntax errors, port conflict | `docker compose -f infra/docker-compose.dev.yml logs <service>` |
| Database empty after restart | `COMPOSE_PROJECT_NAME` changed (volumes namespaced) | Set `COMPOSE_PROJECT_NAME` to match original, or `down -v` and re-init |
| `docker exec` "no such container" | Container name changed (COMPOSE_PREFIX) | `docker ps` to see current names |
| Apps not installing | API not healthy or app container not ready | `platform.ps1 status`, wait, retry |
| App shows "Error" in Dashboard | Lost auth token after container recreate | Delete app in Dashboard, re-run `install-apps` |
| Duplicate apps in Extensions | Multiple `install-apps` without cleanup | `platform.ps1 cleanup-apps` |
| Tunnel not connecting | DNS records missing or incorrect | Verify CNAMEs point to `<TUNNEL_ID>.cfargotunnel.com` |
| Dashboard "Blocked request" on tunnel | `DASHBOARD_TUNNEL_URL` not set | Add `DASHBOARD_TUNNEL_URL=https://dash.yourdomain.com`, rebuild dashboard |
| `NEXT_PUBLIC_*` not taking effect | Build-time variable needs rebuild | `docker compose up --build saleor-storefront` |
| `VITE_*` not taking effect | Build-time variable needs rebuild | `docker compose up --build saleor-dashboard` |
| `401 SIGNATURE_VERIFICATION_FAILED` | API/Worker/Scheduler have different RSA keys | Ensure all three share same `RSA_PRIVATE_KEY`, restart all three |
| Webhook URLs stale | Apps registered with old URLs | `platform.ps1 refresh-urls` then `install-apps` |
| Upstream sync conflicts | Protected files not configured | Run `git config merge.ours.driver true`, check `.gitattributes` |
| `Module not found` in storefront | Shared package not mounted | `docker compose up --force-recreate saleor-storefront` |
| GraphQL type errors | Stale types after schema change | Run `build_schema` in API, then `pnpm generate` in dashboard + storefront |
| Contact emails wrong address | `CONTACT_EMAIL` not set | Add to `.env`, restart API |
| Gmail overrides From address | Gmail SMTP behavior | Configure "Send mail as" alias in Gmail Settings > Accounts |
| Bezeq ISP blocks subdomains | ISP DNS caching | Wait 24h, or use `host.docker.internal` for local dev |
| HMR not working | Docker volume watchers unreliable on Windows | Always `docker compose restart` -- never rely on HMR |
| macaw-ui build failure on fresh clone | Missing `_error.tsx`/`404.tsx` in apps | Add plain HTML error pages to all app `src/pages/` dirs (see UPGRADE-EXISTING-CLONE.md) |
| Containers renamed to `aura-*` unexpectedly | Missing `COMPOSE_PREFIX` in `.env` | Add `COMPOSE_PREFIX=<your-prefix>` to `.env`, `down && up` |
| Scripts fail finding containers | Hardcoded fallbacks in lib scripts | Set `COMPOSE_PREFIX` env var, or update fallbacks in `infra/lib/` |

---

## 14. File Reference

### Infrastructure & Configuration

| File | Purpose | Store-specific? |
|------|---------|-----------------|
| `infra/docker-compose.dev.yml` | Dev Docker orchestration (20 containers) | No (syncs) |
| `infra/docker-compose.prod.yml` | Prod Docker orchestration (14 containers) | No (syncs) |
| `infra/platform.ps1` | Platform CLI (all commands) | No (syncs) |
| `infra/lib/**` | CLI helper modules (Backup, Config, etc.) | No (syncs) |
| `infra/scripts/**` | Container init scripts | No (syncs) |
| `infra/.env` | All environment variables | **Gitignored** |
| `infra/.env.example` | Env template with all variables | No (syncs) |
| `infra/platform.yml` | Service registry (ports, containers, store identity) | **Gitignored** |
| `infra/platform.yml.example` | Service registry template | No (syncs) |
| `infra/cloudflared-config.yml` | Tunnel routing config | **Gitignored** |
| `infra/cloudflared-config.yml.example` | Tunnel config template | No (syncs) |

### Storefront Config Pipeline

| File | Purpose | Store-specific? |
|------|---------|-----------------|
| `apps/packages/storefront-config/src/schema/` | Zod schemas (source of truth) | No (syncs) |
| `apps/packages/storefront-config/src/types.ts` | Shared TypeScript types | No (syncs) |
| `apps/apps/storefront-control/src/modules/config/defaults.ts` | Default values | No (syncs) |
| `apps/apps/storefront-control/sample-config-import.json` | Hebrew/ILS dev fallback | **Yes (protected)** |
| `apps/apps/storefront-control/sample-config-import-en.json` | English/USD dev fallback | **Yes (protected)** |
| `storefront/src/config/store.config.ts` | Storefront-side types & defaults | No (syncs) |
| `storefront/src/providers/StoreConfigProvider.tsx` | Config context + all hooks | No (syncs) |
| `storefront/storefront-cms-config.json` | Channel configs | **Yes (protected)** |

### Catalog

| File | Purpose | Store-specific? |
|------|---------|-----------------|
| `scripts/catalog-generator/config.yml` | Store infrastructure YAML | **Gitignored** |
| `scripts/catalog-generator/config.yml.example` | Infrastructure template | No (syncs) |
| `scripts/catalog-generator/src/config/products.ts` | Product definitions | **Yes (protected)** |
| `scripts/catalog-generator/src/config/categories.ts` | Category hierarchy | **Yes (protected)** |
| `scripts/catalog-generator/src/config/collections.ts` | Collection definitions | **Yes (protected)** |
| `scripts/catalog-generator/output/` | Generated Excel/CSVs | **Gitignored** |

### Sync & Git

| File | Purpose | Store-specific? |
|------|---------|-----------------|
| `.aura-sync` | Upstream sync policy (sync/protect/gitignored lists) | No (syncs) |
| `.gitattributes` | Line endings + `merge=ours` protection rules | No (syncs) |
| `CLAUDE.md` | Architecture reference for Claude agents | No (syncs) |
| `PRD.md` | Product requirements document | **Yes (protected)** |

### Template Files (`.example`)

These show expected structure for generated configs. Synced from upstream, never store-specific:

| Template | Purpose |
|----------|---------|
| `infra/.env.example` | Full environment template with all variables |
| `infra/platform.yml.example` | Service registry with generic values |
| `infra/cloudflared-config.yml.example` | Tunnel config with placeholder domain |
| `scripts/catalog-generator/config.yml.example` | Infrastructure with generic product types |

### Files You Can Ignore

| Path | Description |
|------|-------------|
| `apps/apps/storefront-control/mansour configs/` | Another client's config samples |
| `.planning/`, `.serena/`, `.agents/` | Development planning artifacts |
| `SEO-AUDIT-REPORT.md`, `STOREFRONT-AUDIT-SCORECARD.md` | Original store audits |
| `scripts/catalog-generator/src/config/templates/pawzen/` | Original store's product catalog |
| `scripts/catalog-generator/src/config/mansour/` | Another client's catalog data |

---

## Appendix: Payment & Email Setup

### Stripe Setup

1. Get API keys from https://dashboard.stripe.com/test/apikeys
2. Add to `infra/.env`:
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Restart: `docker compose -f infra/docker-compose.dev.yml restart saleor-stripe-app`
4. Configure in Dashboard > Extensions > Stripe

### PayPal Setup

1. Get credentials from https://developer.paypal.com/dashboard/applications
2. Add to `infra/.env`:
   ```env
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_SECRET_KEY=your_secret_key
   PAYPAL_ENVIRONMENT=sandbox    # 'live' for production
   ```
3. Restart: `docker compose -f infra/docker-compose.dev.yml restart saleor-paypal-app`

### Email Setup

**Development (console backend -- emails printed to logs):**
```env
EMAIL_URL=consolemail://
```

**Gmail SMTP:**
```env
EMAIL_URL=smtp://your.email@gmail.com:APP_PASSWORD@smtp.gmail.com:587/?ssl=tls
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
CONTACT_EMAIL=support@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_app_password    # Generate at https://myaccount.google.com/apppasswords
```

> **Gmail gotcha:** Gmail overrides the From address with the authenticated account. To send as `noreply@yourdomain.com`, configure "Send mail as" alias in Gmail Settings > Accounts.

**Custom SMTP:**
```env
EMAIL_URL=smtp://user:password@smtp.provider.com:587/?ssl=tls
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASSWORD=your_password
```

---

## Appendix: Verification Checklist

After setup, verify everything is working:

- [ ] **Storefront loads** at `http://localhost:3000` with your store name
- [ ] **Dashboard loads** at `http://localhost:9000`
- [ ] **Admin login works** (credentials from wizard or `AURA_ADMIN_EMAIL`/`AURA_ADMIN_PASSWORD` in `.env`)
- [ ] **API responds** at `http://localhost:8000/graphql/`
- [ ] **All apps Active** in Dashboard > Extensions (11 apps)
- [ ] **Channels exist** in Dashboard > Configuration > Channels (after catalog deploy)
- [ ] **Products visible** in Dashboard > Catalog > Products (after catalog import)
- [ ] **Storefront Control works** in Dashboard > Extensions
- [ ] **Sample config imported** -- storefront shows your branding
- [ ] **Hebrew tagline updated** in `sample-config-import.json`

Quick health check:
```powershell
.\infra\platform.ps1 status
```

---

## Appendix: Upgrading an Existing Clone

If your clone was created **before** Docker namespacing was introduced:

1. **Add `COMPOSE_PREFIX` to `.env` BEFORE restarting** -- without it, containers rename and you lose volume access
2. To keep existing `saleor-*` names: set `COMPOSE_PREFIX=saleor` and `COMPOSE_PROJECT_NAME=saleor-platform`
3. Parameterize all `container_name:` directives in docker-compose: replace `aura-` with `${COMPOSE_PREFIX:-aura}-`
4. Run `docker compose down && docker compose up -d`
5. Re-run wizard (`platform.ps1 new-store`) to update `platform.yml` container references

For full details, see `UPGRADE-EXISTING-CLONE.md`.
