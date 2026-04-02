# Aura Platform — Setup Guide

> **Single authoritative setup document.** Replaces CLONE-GUIDE.md and UPGRADE-EXISTING-CLONE.md.
> Detailed enough for a Claude agent or new developer to reproduce the entire setup from a fresh clone with zero guesswork.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (One Command)](#quick-start-one-command)
- [Setup Steps Detail](#setup-steps-detail)
  - [Step 1: Prerequisites Check](#step-1-prerequisites-check-required)
  - [Step 2: Store Identity](#step-2-store-identity-required)
  - [Step 3: Port Allocation](#step-3-port-allocation-required)
  - [Step 4: Connectivity Mode](#step-4-connectivity-mode-required)
  - [Step 5: Generate .env](#step-5-generate-env-required)
  - [Step 6: Docker + Database](#step-6-docker--database-required)
  - [Step 7: Install Apps](#step-7-install-apps-optional-default-yes)
  - [Step 8: Catalog Setup](#step-8-catalog-setup-optional-default-no)
  - [Step 9: Git Upstream](#step-9-git-upstream-optional-default-yes)
- [Docker Container Reference](#docker-container-reference)
- [Running Multiple Stores](#running-multiple-stores)
- [Catalog & Products](#catalog--products)
- [Storefront Configuration](#storefront-configuration)
- [Payment Setup](#payment-setup)
- [Email Setup](#email-setup)
- [Domain & Tunnels](#domain--tunnels)
- [Upstream Sync (Keeping Up to Date)](#upstream-sync-keeping-up-to-date)
- [Build-Time vs Runtime Variables](#build-time-vs-runtime-variables)
- [Verification Checklist](#verification-checklist)
- [Troubleshooting](#troubleshooting)
- [CLI Reference](#cli-reference)

---

## Prerequisites

| Requirement | Install Command | Purpose |
|-------------|-----------------|---------|
| **Docker Desktop** (with Compose v2) | [Install](https://www.docker.com/products/docker-desktop/) | Runs all 20+ containers |
| **PowerShell 7+** | `winget install Microsoft.PowerShell` | Platform CLI (`platform.ps1`) |
| **Git** | `winget install Git.Git` | Source control, upstream sync |
| **Node.js 22+** | `winget install OpenJS.NodeJS` or [nvm-windows](https://github.com/coreybutler/nvm-windows) | Catalog generator (runs on host, not Docker) |
| **pnpm 10+** | `npm install -g pnpm` | Package manager for host-side scripts |
| **cloudflared** (optional) | `winget install Cloudflare.cloudflared` | Tunnel access for public URLs |

> **Note:** Node.js and pnpm are only needed for the catalog generator (`scripts/catalog-generator/`), which runs on the host machine. All other development happens inside Docker containers.

---

## Quick Start (One Command)

```powershell
git clone https://github.com/michael9993/aura-platform.git my-store
cd my-store/infra
.\platform.ps1 setup
```

This single command runs through **9 steps** automatically:

1. **Prerequisites check** — Verifies Docker, PowerShell, cloudflared, and the `powershell-yaml` module are present
2. **Store identity** — Interactive wizard collecting store name, type, colors, domain, and admin credentials (~10 inputs)
3. **Port allocation** — Auto-detects available ports (or uses defaults 8000/9000/3000)
4. **Connectivity mode** — Chooses localhost, ephemeral tunnel, or custom domain
5. **Generate .env** — Creates `infra/.env` from `.env.example` with auto-generated secrets (SECRET_KEY, APP_SECRET_KEY, RSA_PRIVATE_KEY)
6. **Docker + Database** — Starts all containers, runs Django migrations, creates admin superuser, exports GraphQL schema
7. **Install apps** — Registers all 11 Saleor apps via their manifest URLs
8. **Catalog setup** — (Skipped by default) Optionally deploy store infrastructure and product catalog
9. **Git upstream** — Configures upstream tracking and `.gitattributes` merge strategy

For non-interactive setup (CI/scripting):

```powershell
.\infra\platform.ps1 setup -NonInteractive
```

For self-hosted with custom domain:

```powershell
.\infra\platform.ps1 setup -Mode selfhosted -Domain "mystore.com"
```

---

## Setup Steps Detail

### Step 1: Prerequisites Check (REQUIRED)

```powershell
.\infra\platform.ps1 init
```

**What it checks:**

| Check | Passes When | If Missing |
|-------|-------------|------------|
| Docker Desktop | `docker info` succeeds | Install from https://www.docker.com/products/docker-desktop/ |
| Docker Compose v2 | `docker compose version` returns v2+ | Included with Docker Desktop |
| PowerShell 7+ | `$PSVersionTable.PSVersion.Major -ge 7` | `winget install Microsoft.PowerShell` |
| `powershell-yaml` module | `Get-Module -ListAvailable powershell-yaml` | Auto-installed by `platform.ps1 init` |
| cloudflared (optional) | `cloudflared --version` succeeds | `winget install Cloudflare.cloudflared` (only needed for tunnels) |

**What it does after checks pass:**
- Copies `infra/.env.example` to `infra/.env` (if `.env` doesn't exist)
- Auto-generates `SECRET_KEY` (Django session signing, CSRF, password hashing)
- Auto-generates `APP_SECRET_KEY` (shared encryption key for all Saleor apps)
- Auto-generates `RSA_PRIVATE_KEY` (webhook JWS signing — API, Worker, and Scheduler MUST share the same key, otherwise apps get `401 SIGNATURE_VERIFICATION_FAILED`)
- Auto-generates `WEBHOOK_SECRET_KEY` (optional additional webhook payload signing)

> **Manual secret generation:** If you need to generate secrets yourself:
> ```bash
> openssl rand -hex 32          # For SECRET_KEY, APP_SECRET_KEY
> openssl genrsa 2048           # For RSA_PRIVATE_KEY (PEM format)
> ```

---

### Step 2: Store Identity (REQUIRED)

```powershell
.\infra\platform.ps1 new-store
```

Interactive wizard collecting ~10 inputs. Non-interactive alternative:

```powershell
.\infra\platform.ps1 new-store -StoreName "My Store" -PrimaryColor "#E11D48" -Domain "mystore.com"
```

**Wizard fields:**

| Field | Required | Default | Example | Description |
|-------|----------|---------|---------|-------------|
| Store Name | Yes | — | `Cool Shoes` | Displayed in dashboard header, emails, page titles |
| Store Slug | Auto | Derived from name | `cool-shoes` | Used for `COMPOSE_PREFIX`, container names, volumes |
| Store Type | No | `physical` | `physical` or `digital` | Affects shipping/checkout defaults |
| Tagline | No | — | `Step into style` | Used in storefront hero section |
| Primary Color | No | `#1B2838` | `#E11D48` | Main brand color (buttons, accents) |
| Secondary Color | No | `#1E4D3A` | `#3B82F6` | Supporting brand color |
| Accent Color | No | `#C9A962` | `#F59E0B` | Highlight color (badges, promotions) |
| Domain | No | — | `coolshoes.com` | For tunnel/production URLs |
| Admin Email | No | `admin@{domain}` | `admin@coolshoes.com` | Initial superuser email |
| Admin Password | No | Auto-generated | — | Initial superuser password |
| GTM Container ID | No | — | `GTM-XXXXXXX` | Google Tag Manager |
| GA4 Measurement ID | No | — | `G-XXXXXXXXXX` | Google Analytics 4 |

**Files updated by the wizard:**

| File | What Changes |
|------|-------------|
| `infra/platform.yml` | Store name, slug, domain, colors, analytics, container names |
| `infra/.env` | Domain, store name, COMPOSE_PREFIX, tunnel URLs, admin credentials |
| `apps/apps/storefront-control/sample-config-import-en.json` | English store branding |
| `apps/apps/storefront-control/sample-config-import.json` | Hebrew store branding (partial) |
| `storefront/storefront-cms-config.json` | Both channel configs |
| `infra/cloudflared-config.yml` | Tunnel routes (if domain provided) |
| `scripts/catalog-generator/config.yml` | Shop name |

**Manual steps the wizard does NOT handle:**
1. Hebrew translations — Update tagline/description in `sample-config-import.json`
2. Logo upload — Via Storefront Control app (Design > Branding)
3. SMTP email templates — In Dashboard > Extensions > SMTP > Templates
4. SEO metadata — In Storefront Control app (SEO page)
5. Payment provider API keys — Stripe/PayPal in `.env` or Dashboard

---

### Step 3: Port Allocation (REQUIRED)

Ports are configured in `infra/.env` via `*_PORT` variables. The wizard auto-detects available ports, falling back to defaults.

**Default port allocation (Instance 1):**

| Variable | Port | Service |
|----------|------|---------|
| `SALEOR_API_PORT` | 8000 | Saleor GraphQL API |
| `DASHBOARD_PORT` | 9000 | Admin Dashboard |
| `STOREFRONT_PORT` | 3000 | Customer Storefront |
| `SMTP_APP_PORT` | 3001 | SMTP Email App |
| `STRIPE_APP_PORT` | 3002 | Stripe Payments |
| `INVOICE_APP_PORT` | 3003 | Invoice Generator |
| `STOREFRONT_CONTROL_APP_PORT` | 3004 | Storefront Control CMS |
| `NEWSLETTER_APP_PORT` | 3005 | Newsletter App |
| `SALES_ANALYTICS_APP_PORT` | 3006 | Sales Analytics |
| `BULK_MANAGER_APP_PORT` | 3007 | Bulk Import/Export |
| `IMAGE_STUDIO_APP_PORT` | 3008 | AI Image Studio |
| `DROPSHIP_APP_PORT` | 3009 | Dropship Orchestrator |
| `TAX_MANAGER_APP_PORT` | 3010 | Tax Manager |
| `PAYPAL_APP_PORT` | 3011 | PayPal Commerce |
| `POSTGRES_PORT` | 5432 | PostgreSQL |
| `REDIS_PORT` | 6379 | Redis |
| `REMBG_PORT` | 7000 | AI Background Removal |
| `ESRGAN_PORT` | 7001 | AI Image Upscaling |

**Multi-instance port offset** (see [Running Multiple Stores](#running-multiple-stores)):

| Service | Instance 1 | Instance 2 (+100) | Instance 3 (+200) |
|---------|-----------|-------------------|-------------------|
| API | 8000 | 8100 | 8200 |
| Dashboard | 9000 | 9100 | 9200 |
| Storefront | 3000 | 3100 | 3200 |
| Apps (3001-3011) | 3001-3011 | 3101-3111 | 3201-3211 |
| PostgreSQL | 5432 | 5433 | 5434 |
| Redis | 6379 | 6380 | 6381 |
| AI Services | 7000-7001 | 7100-7101 | 7200-7201 |

> **Important:** Internal container ports are fixed (8000, 9000, 3000, etc.). The `*_PORT` variables control the HOST side only.

---

### Step 4: Connectivity Mode (REQUIRED)

Three options, selected during `platform.ps1 setup` or via the `-Mode` parameter on `platform.ps1 up`:

| Mode | Command | URLs | Use Case |
|------|---------|------|----------|
| **Localhost** (default) | `platform.ps1 up` | `http://localhost:8000`, etc. | Local development |
| **Ephemeral Tunnel** | `platform.ps1 up` (with cloudflared) | `*.trycloudflare.com` (random) | Quick sharing, testing webhooks |
| **Custom Domain** | `platform.ps1 up -Mode selfhosted` | `api.yourdomain.com`, etc. | Production, permanent access |

**Localhost:** No additional setup. All services accessible at `http://localhost:<port>`. Saleor apps communicate via Docker service names internally (`http://saleor-api:8000/graphql/`).

**Ephemeral Tunnel:** Auto-created by `platform.ps1 up` when cloudflared is installed. Generates random `*.trycloudflare.com` URLs that change on every restart. Good for webhook testing but URLs are temporary.

**Custom Domain:** Requires a domain, Cloudflare account, and named tunnel. See [Domain & Tunnels](#domain--tunnels) for full setup. URLs are permanent (e.g., `api.mystore.com`).

---

### Step 5: Generate .env (REQUIRED)

```powershell
.\infra\platform.ps1 init
```

Creates `infra/.env` from `infra/.env.example`. The `.env` file is **the single source of truth** for all container configuration.

**How values are populated:**

| Marker | Meaning | Example |
|--------|---------|---------|
| `__AUTO__` | Auto-generated by `platform.ps1 init` | `SECRET_KEY`, `RSA_PRIVATE_KEY` |
| `__WIZARD__` | Set by `platform.ps1 new-store` wizard | `STORE_NAME`, `PLATFORM_DOMAIN` |
| `__MANUAL__` | You must set this yourself | `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID` |
| (no marker) | Sensible development default | `DEBUG=True`, `SALEOR_API_PORT=8000` |

**Key variable groups in `.env`:**

| Section | Variables | Notes |
|---------|-----------|-------|
| Docker Namespacing | `COMPOSE_PREFIX`, `COMPOSE_PROJECT_NAME` | Set from store slug |
| Service Ports | `SALEOR_API_PORT`, `DASHBOARD_PORT`, etc. | Host-side only |
| Database | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL` | Uses Docker service names |
| Redis | `REDIS_URL`, `CELERY_BROKER_URL` | DB 0=cache, 1=broker, 2=results |
| Secrets | `SECRET_KEY`, `APP_SECRET_KEY`, `RSA_PRIVATE_KEY` | Auto-generated |
| Django | `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOW_ALL_ORIGINS` | |
| Internal URLs | `SALEOR_INTERNAL_URL` | Docker service hostnames (never expose to browsers) |
| Public URLs | `STOREFRONT_URL`, `DASHBOARD_URL` | Must be browser-reachable |
| Store Identity | `STORE_NAME`, `STORE_EMAIL`, `PLATFORM_DOMAIN` | Set by wizard |
| Admin | `AURA_ADMIN_EMAIL`, `AURA_ADMIN_PASSWORD` | For initial superuser |
| Email/SMTP | `EMAIL_URL`, `DEFAULT_FROM_EMAIL`, `SMTP_HOST/PORT/USER/PASSWORD` | |
| Storefront | `NEXT_PUBLIC_SALEOR_API_URL`, `NEXT_PUBLIC_DEFAULT_CHANNEL` | Build-time! |
| Dashboard | `VITE_API_URL`, `VITE_STORE_NAME` | Build-time! |
| Payments | `STRIPE_*`, `PAYPAL_*` | Manual setup |
| Tunnels | `*_TUNNEL_URL` | Only for tunnel/production |
| AI Services | `GEMINI_API_KEY`, `STABILITY_API_KEY` | Optional, for Image Studio |
| Media Storage | `MEDIA_URL`, `AWS_*`, `GS_*` | Default: local Docker volume |

---

### Step 6: Docker + Database (REQUIRED)

```powershell
.\infra\platform.ps1 up
```

**What happens:**

1. **Docker Compose up** — Starts all containers defined in `infra/docker-compose.dev.yml`
2. **Health checks** — Waits for PostgreSQL and Redis to be healthy
3. **Fresh DB detection** — If the database is empty, automatically runs `db-init`:
   - Django migrations (`python manage.py migrate`)
   - Admin superuser creation (using `AURA_ADMIN_EMAIL` / `AURA_ADMIN_PASSWORD` from `.env`)
   - GraphQL schema export (`python manage.py build_schema`)
4. **Tunnel start** — If cloudflared is available, starts ephemeral tunnels (or named tunnel with `-Mode selfhosted`)
5. **URL display** — Prints all service URLs and opens browser

**Manual database initialization** (if not auto-detected):

```powershell
.\infra\platform.ps1 db-init              # Migrate + admin user + schema
.\infra\platform.ps1 db-init -SeedData    # Same + demo products
```

**Build-time vs runtime note:** In the dev Docker setup, containers rebuild on startup (the entrypoint runs `pnpm build` or equivalent). So a `docker compose restart` IS effectively a rebuild. But in production with pre-built images, you MUST rebuild: `docker compose up --build <service>`.

---

### Step 7: Install Apps (OPTIONAL, default: yes)

```powershell
.\infra\platform.ps1 install-apps
```

Registers all 11 Saleor apps by calling each app's manifest URL via the Saleor GraphQL API (`appInstall` mutation).

**Apps registered:**

| App | Manifest URL | Key Permissions |
|-----|-------------|-----------------|
| SMTP | `http://saleor-smtp-app:3000/api/manifest` | `MANAGE_ORDERS`, `MANAGE_USERS` |
| Stripe | `http://saleor-stripe-app:3000/api/manifest` | `HANDLE_PAYMENTS`, `MANAGE_ORDERS` |
| Invoices | `http://saleor-invoice-app:3000/api/manifest` | `MANAGE_ORDERS` |
| Storefront Control | `http://saleor-storefront-control-app:3000/api/manifest` | `MANAGE_APPS` |
| Newsletter | `http://saleor-newsletter-app:3000/api/manifest` | `MANAGE_USERS` |
| Sales Analytics | `http://saleor-sales-analytics-app:3000/api/manifest` | `MANAGE_ORDERS`, `MANAGE_PRODUCTS`, `MANAGE_CHANNELS` |
| Bulk Manager | `http://saleor-bulk-manager-app:3000/api/manifest` | `MANAGE_PRODUCTS`, `MANAGE_ORDERS`, `MANAGE_USERS`, + more |
| Image Studio | `http://saleor-image-studio-app:3000/api/manifest` | `MANAGE_PRODUCTS`, `MANAGE_APPS` |
| Dropship Orchestrator | `http://saleor-dropship-app:3000/api/manifest` | `MANAGE_PRODUCTS`, `MANAGE_ORDERS`, `MANAGE_APPS` |
| Tax Manager | `http://saleor-tax-manager-app:3000/api/manifest` | `MANAGE_APPS`, `HANDLE_TAXES` |
| PayPal | `http://saleor-paypal-app:3000/api/manifest` | `HANDLE_PAYMENTS`, `MANAGE_ORDERS` |

**Selective installation:**

```powershell
.\infra\platform.ps1 install-apps -Include "smtp","stripe"     # Install only specific apps
.\infra\platform.ps1 install-apps -Exclude "newsletter"         # Install all except specific apps
.\infra\platform.ps1 install-apps -SkipDelete                   # Don't delete existing apps first
```

**Verify apps:** Dashboard > Extensions — all apps should show as **Active**.

**Fix duplicate apps:**

```powershell
.\infra\platform.ps1 cleanup-apps
```

This runs `python manage.py cleanup_apps` which removes duplicate installations and sets correct manifest permissions.

---

### Step 8: Catalog Setup (OPTIONAL, default: no)

After `platform.ps1 setup`, the store is running but **empty** — no products, categories, or shipping methods. The catalog generator creates everything from code.

```bash
# From the host machine (NOT Docker) — requires Node.js 22+ and pnpm
cd scripts/catalog-generator
npm install
npm run setup          # Full pipeline: deploy infra + translate + generate catalog
```

See [Catalog & Products](#catalog--products) for full details.

---

### Step 9: Git Upstream (OPTIONAL, default: yes)

The setup configures the upstream sync strategy:

1. **Sets `merge.ours.driver`** — `git config merge.ours.driver true`
2. **Configures `.gitattributes`** — Marks store-specific files with `merge=ours` so they survive upstream merges
3. **Creates `.aura-sync`** — Manifest defining which files sync vs which are protected

See [Upstream Sync](#upstream-sync-keeping-up-to-date) for full details.

---

## Docker Container Reference

All container names use the pattern `{COMPOSE_PREFIX}-*-dev`, where `COMPOSE_PREFIX` defaults to `aura`.

### Core Infrastructure

| Container | Port | Compose Service | Purpose |
|-----------|------|-----------------|---------|
| `{prefix}-api-dev` | 8000 | `saleor-api` | Saleor GraphQL API (Django/uvicorn) |
| `{prefix}-worker-dev` | — | `saleor-worker` | Celery background worker |
| `{prefix}-scheduler-dev` | — | `saleor-scheduler` | Celery beat scheduler |
| `{prefix}-dashboard-dev` | 9000 | `saleor-dashboard` | Admin Dashboard (Vite/React) |
| `{prefix}-storefront-dev` | 3000 | `saleor-storefront` | Customer Storefront (Next.js) |
| `{prefix}-postgres-dev` | 5432 | `postgres` | PostgreSQL 16 database |
| `{prefix}-redis-dev` | 6379 | `redis` | Redis 7 cache/broker |

### Saleor Apps

| Container | Port | Compose Service | Purpose |
|-----------|------|-----------------|---------|
| `{prefix}-smtp-app-dev` | 3001 | `saleor-smtp-app` | Email notifications (fulfillment, invoices, welcome) |
| `{prefix}-stripe-app-dev` | 3002 | `saleor-stripe-app` | Stripe payment processing |
| `{prefix}-invoice-app-dev` | 3003 | `saleor-invoice-app` | PDF invoice generation |
| `{prefix}-storefront-control-app-dev` | 3004 | `saleor-storefront-control-app` | CMS configuration & live preview |
| `{prefix}-newsletter-app-dev` | 3005 | `saleor-newsletter-app` | Subscriber management & campaigns |
| `{prefix}-sales-analytics-app-dev` | 3006 | `saleor-sales-analytics-app` | KPIs, charts, Excel export |
| `{prefix}-bulk-manager-app-dev` | 3007 | `saleor-bulk-manager-app` | Bulk import/export/delete |
| `{prefix}-image-studio-app-dev` | 3008 | `saleor-image-studio-app` | AI-powered image editor |
| `{prefix}-dropship-app-dev` | 3009 | `saleor-dropship-app` | AliExpress + CJ dropshipping |
| `{prefix}-tax-manager-app-dev` | 3010 | `saleor-tax-manager-app` | Self-hosted tax calculation |
| `{prefix}-paypal-app-dev` | 3011 | `saleor-paypal-app` | PayPal Commerce payments |

### AI Microservices (Image Studio)

| Container | Port | Compose Service | Purpose |
|-----------|------|-----------------|---------|
| `{prefix}-rembg-dev` | 7000 | `saleor-rembg` | AI background removal (rembg) |
| `{prefix}-esrgan-dev` | 7001 | `saleor-esrgan` | AI image upscaling (Real-ESRGAN) |

> **Important naming distinction:**
> - `docker exec` uses **container names** (with `-dev` suffix): `docker exec -it aura-api-dev sh`
> - `docker compose restart` uses **compose service names** (no `-dev`): `docker compose restart saleor-api`

---

## Running Multiple Stores

You can run two or more stores on the same machine. Each store needs:
1. **A separate clone** of the repository
2. **A unique `COMPOSE_PREFIX`** (sets container names)
3. **A unique `COMPOSE_PROJECT_NAME`** (isolates Docker volumes and networks)
4. **Non-conflicting ports**

### Configuration Example

**Store A (shoes):**
```env
# In store-a/infra/.env
COMPOSE_PREFIX=shoes
COMPOSE_PROJECT_NAME=shoes
SALEOR_API_PORT=8000
DASHBOARD_PORT=9000
STOREFRONT_PORT=3000
SMTP_APP_PORT=3001
STRIPE_APP_PORT=3002
INVOICE_APP_PORT=3003
STOREFRONT_CONTROL_APP_PORT=3004
NEWSLETTER_APP_PORT=3005
SALES_ANALYTICS_APP_PORT=3006
BULK_MANAGER_APP_PORT=3007
IMAGE_STUDIO_APP_PORT=3008
DROPSHIP_APP_PORT=3009
TAX_MANAGER_APP_PORT=3010
PAYPAL_APP_PORT=3011
POSTGRES_PORT=5432
REDIS_PORT=6379
REMBG_PORT=7000
ESRGAN_PORT=7001
```

**Store B (jewelry):**
```env
# In store-b/infra/.env
COMPOSE_PREFIX=jewelry
COMPOSE_PROJECT_NAME=jewelry
SALEOR_API_PORT=8100
DASHBOARD_PORT=9100
STOREFRONT_PORT=3100
SMTP_APP_PORT=3101
STRIPE_APP_PORT=3102
INVOICE_APP_PORT=3103
STOREFRONT_CONTROL_APP_PORT=3104
NEWSLETTER_APP_PORT=3105
SALES_ANALYTICS_APP_PORT=3106
BULK_MANAGER_APP_PORT=3107
IMAGE_STUDIO_APP_PORT=3108
DROPSHIP_APP_PORT=3109
TAX_MANAGER_APP_PORT=3110
PAYPAL_APP_PORT=3111
POSTGRES_PORT=5433
REDIS_PORT=6380
REMBG_PORT=7100
ESRGAN_PORT=7101
```

### Running Side by Side

```powershell
# Terminal 1: Start store A
cd store-a/infra
.\platform.ps1 up

# Terminal 2: Start store B
cd store-b/infra
.\platform.ps1 up
```

Containers will appear as `shoes-api-dev`, `shoes-dashboard-dev`, etc. for Store A and `jewelry-api-dev`, `jewelry-dashboard-dev`, etc. for Store B. Volumes are fully isolated by `COMPOSE_PROJECT_NAME`.

> **Database URL:** When using custom ports, the `DATABASE_URL` in `.env` uses Docker service names (e.g., `postgres://aura:aura@aura-postgres:5432/aura`). The internal port is always 5432 — only the host-side port changes. The service name in the URL must match the service name in docker-compose, which includes the `COMPOSE_PREFIX`.

---

## Catalog & Products

The catalog generator (`scripts/catalog-generator/`) manages store infrastructure as code and generates product files. It runs on the **host machine** (not Docker), connecting to Saleor via the GraphQL API.

### Pipeline Overview

```
config.yml + products.ts + categories.ts + collections.ts
    |
    v
[1] npm run deploy:ci    → Creates channels, product types, attributes,
                            warehouses, shipping zones in Saleor
    |
    v
[2] npm run translate    → Adds Hebrew translations for categories/collections
    |
    v
[3] npm run generate     → Creates product Excel + CSV files in output/
    |
    v
[4] Dashboard > Extensions > Bulk Manager → Upload and import files
```

### Commands

```bash
cd scripts/catalog-generator
npm install              # First time only

npm run setup            # Full pipeline: deploy + translate + generate
npm run deploy:ci        # Apply config.yml to Saleor (non-interactive)
npm run diff             # Preview changes (dry run)
npm run introspect       # Pull current Saleor state into config.yml
npm run translate        # Add Hebrew translations
npm run generate         # Generate product Excel + CSVs
```

### Catalog Templates

```bash
npm run generate                        # Default catalog (100 products, 7 brands)
CATALOG_TEMPLATE=starter npm run generate   # Starter template (20 generic products)
```

### Key Files

| File | Purpose |
|------|---------|
| `scripts/catalog-generator/config.yml` | Store infrastructure YAML (product types, attributes, warehouses, shipping) |
| `scripts/catalog-generator/src/config/products.ts` | Product definitions |
| `scripts/catalog-generator/src/config/categories.ts` | 35+ bilingual categories with hierarchy |
| `scripts/catalog-generator/src/config/collections.ts` | 18 bilingual collections |
| `scripts/catalog-generator/src/add-translations.ts` | Hebrew translation script |
| `scripts/catalog-generator/output/` | Generated Excel/CSV files (gitignored) |

### Import via Bulk Manager

1. Open Dashboard > Extensions > Bulk Manager
2. Select **Products** > **Import**
3. Upload the generated Excel file from `scripts/catalog-generator/output/`
4. Map columns and confirm import

---

## Storefront Configuration

The storefront uses a 3-tier configuration system:

| Priority | Source | Description |
|----------|--------|-------------|
| 1 (Highest) | Storefront Control App | Runtime config stored in Saleor API metadata |
| 2 | Sample Config Files | `apps/apps/storefront-control/sample-config-import*.json` |
| 3 | Static Config | `storefront/src/config/store.config.ts` |

### Initial Configuration

1. **Import sample config:** In Storefront Control app > Settings > Import Config, upload `sample-config-import.json` (Hebrew/ILS) or `sample-config-import-en.json` (English/USD)
2. **Configure homepage sections:** Storefront Control > Design page — drag-and-drop section ordering, enable/disable sections (Hero, TrustStrip, Marquee, BrandGrid, Categories, etc.)
3. **Set up navigation:** Storefront Control > Header/Footer pages — menu items, social links
4. **Customize branding:** Storefront Control > Design > Branding — colors, typography, logos

### Logo Upload

Upload your logo via Storefront Control > Design > Branding. Supported formats: SVG (recommended), PNG, JPEG. The logo appears in the header, emails, and invoice PDFs.

### Color Customization

10 color tokens are configurable:

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
| Success | Success messages, in-stock indicators |
| Error | Error messages, out-of-stock indicators |

---

## Payment Setup

### Stripe

1. Get API keys from https://dashboard.stripe.com/test/apikeys (use test keys for development)
2. Add to `infra/.env`:
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Restart the Stripe app: `docker compose -f infra/docker-compose.dev.yml restart saleor-stripe-app`
4. Configure in Dashboard > Extensions > Stripe app

### PayPal

1. Get credentials from https://developer.paypal.com/dashboard/applications (use Sandbox for development)
2. Add to `infra/.env`:
   ```env
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_SECRET_KEY=your_secret_key
   PAYPAL_ENVIRONMENT=sandbox    # Change to 'live' for production
   ```
3. Restart the PayPal app: `docker compose -f infra/docker-compose.dev.yml restart saleor-paypal-app`

---

## Email Setup

### Development (Console Backend)

By default, emails are printed to the API container logs (no actual sending):

```env
EMAIL_URL=consolemail://
```

View emails: `docker compose -f infra/docker-compose.dev.yml logs saleor-api | grep -A 20 "Subject:"`

### Gmail SMTP

```env
EMAIL_URL=smtp://your.email@gmail.com:APP_PASSWORD@smtp.gmail.com:587/?ssl=tls
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
CONTACT_EMAIL=support@yourdomain.com

# SMTP app credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_app_password    # Generate at https://myaccount.google.com/apppasswords
```

> **Gmail gotcha:** Gmail overrides the From address with the authenticated account. To send as `noreply@yourdomain.com`, configure "Send mail as" alias in Gmail Settings > Accounts.

### Custom SMTP Provider

```env
EMAIL_URL=smtp://user:password@smtp.provider.com:587/?ssl=tls
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
CONTACT_EMAIL=support@yourdomain.com

SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASSWORD=your_password
```

### SMTP Templates

Customize email templates in Dashboard > Extensions > SMTP > Templates. Available templates: order confirmation, fulfillment notification, invoice, password reset, welcome email, etc.

---

## Domain & Tunnels

### Localhost (Default)

No setup needed. Access services at:
- Storefront: `http://localhost:3000`
- Dashboard: `http://localhost:9000`
- API: `http://localhost:8000/graphql/`

### Ephemeral Tunnels

Auto-created by `platform.ps1 up` when cloudflared is installed. Random `*.trycloudflare.com` URLs are generated and printed to the console. URLs change on every restart.

```powershell
.\infra\platform.ps1 up    # Starts Docker + ephemeral tunnels
```

### Custom Domain (Self-Hosted)

Full step-by-step for permanent public access via Cloudflare Tunnel:

#### 1. Cloudflare Account & Domain

1. Create account at https://dash.cloudflare.com/sign-up
2. Add your domain (e.g., `mystore.com`) and select Free plan
3. Update your domain registrar's nameservers to Cloudflare's
4. Wait for DNS propagation (~30 minutes)
5. Recommended security settings:

| Setting | Location | Value |
|---------|----------|-------|
| SSL mode | SSL/TLS > Overview | **Full (strict)** |
| Always Use HTTPS | SSL/TLS > Edge Certificates | **On** |
| HSTS | SSL/TLS > Edge Certificates | **Enable** |
| Bot Fight Mode | Security > Bots | **On** |

#### 2. Install & Authenticate cloudflared

```powershell
winget install Cloudflare.cloudflared
cloudflared tunnel login          # Opens browser to authorize
```

#### 3. Create Named Tunnel

```powershell
cloudflared tunnel create mystore-platform
```

Save the **Tunnel ID** (UUID) from the output. Credentials auto-saved to `C:\Users\<username>\.cloudflared\<TUNNEL_ID>.json`.

#### 4. Create DNS Records

In Cloudflare Dashboard > DNS > Records, create CNAME records for each subdomain:

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

That's **14 CNAME records**, all pointing to the same tunnel.

#### 5. Update .env with Tunnel URLs

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

# Also update these for CORS/CSRF:
ALLOWED_HOSTS=localhost,saleor-api,api.mystore.com,mystore.com
```

#### 6. Generate Tunnel Config

```powershell
.\infra\platform.ps1 generate-tunnel-config
```

This creates/updates `infra/cloudflared-config.yml` with routes for all 14 subdomains.

#### 7. Launch

```powershell
.\infra\platform.ps1 up -Mode selfhosted
.\infra\platform.ps1 install-apps          # First time only — registers apps with tunnel URLs
```

---

## Upstream Sync (Keeping Up to Date)

The platform uses a **template + downstream** pattern. The upstream repository contains platform improvements (bug fixes, new features, infrastructure updates). Your clone (downstream) contains store-specific customizations. The sync system merges upstream changes while protecting your store data.

### How It Works

Three file categories defined in `.aura-sync`:

| Category | Behavior | Examples |
|----------|----------|---------|
| **sync** | Always pulled from upstream | `saleor/**`, `dashboard/**`, `storefront/src/**`, `apps/apps/*/src/**`, `infra/platform.ps1`, docker-compose files |
| **protect** | Never overwritten (via `.gitattributes merge=ours`) | Sample config JSONs, catalog data (`products.ts`, `categories.ts`, `collections.ts`), `PRD.md`, audit reports |
| **gitignored** | Never in git, never conflict | `infra/.env`, `infra/platform.yml`, `infra/cloudflared-config.yml`, `.saleor-app-auth.json` |

### Sync Commands

```powershell
.\infra\platform.ps1 sync              # Pull upstream + merge (respects merge=ours)
.\infra\platform.ps1 sync -DryRun      # Preview what would change without applying
```

### Protected Files (merge=ours)

These files in `.gitattributes` keep YOUR version during upstream merges:

```
apps/apps/storefront-control/sample-config-import.json        merge=ours
apps/apps/storefront-control/sample-config-import-en.json     merge=ours
storefront/storefront-cms-config.json                         merge=ours
scripts/catalog-generator/src/config/products.ts              merge=ours
scripts/catalog-generator/src/config/categories.ts            merge=ours
scripts/catalog-generator/src/config/collections.ts           merge=ours
PRD.md                                                        merge=ours
pnpm-lock.yaml                                               merge=ours
```

### One-Time Setup (done automatically by `platform.ps1 setup`)

```bash
git config merge.ours.driver true
```

### Post-Sync Automation

After a successful sync:
1. Review changed files with `git diff HEAD~1`
2. Restart affected containers
3. If GraphQL schema changed: run `build_schema` in API, then `pnpm generate` in dashboard + storefront
4. Run `pnpm install` in any container with changed `package.json`

---

## Build-Time vs Runtime Variables

**CRITICAL:** Variables prefixed with `NEXT_PUBLIC_*` (storefront) or `VITE_*` (dashboard) are embedded into the JavaScript bundle at **build time**, NOT at runtime.

### What This Means

1. Changing these in `.env` requires **rebuilding** the container, not just restarting
2. They are **visible to end users** in the browser (never put secrets here)
3. In the dev Docker setup, the entrypoint runs the build step, so `docker compose restart` effectively rebuilds
4. In production (pre-built images), you MUST `docker compose up --build <service>`

### Build-Time Variables List

**Storefront (`NEXT_PUBLIC_*`):**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SALEOR_API_URL` | Browser-side API URL (e.g., `http://localhost:8000/graphql/`) |
| `NEXT_PUBLIC_STOREFRONT_URL` | Public storefront URL (for og:url, canonical, sitemap) |
| `NEXT_PUBLIC_DEFAULT_CHANNEL` | Default channel slug (e.g., `default-channel`) |
| `NEXT_PUBLIC_COMING_SOON` | Set to `true` to show coming soon page |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps for store locator |
| `NEXT_PUBLIC_SMTP_APP_URL` | SMTP app URL for contact forms |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking |

**Dashboard (`VITE_*`):**

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API URL for dashboard GraphQL |
| `VITE_STORE_NAME` | Store name in dashboard header |
| `VITE_PLATFORM_NAME` | Platform name in dashboard sidebar |
| `VITE_DISABLE_STRICT_MODE` | Disable React StrictMode (helps RichTextEditor stability) |
| `VITE_AI_ASSISTANT_ENABLED` | Enable Claude AI assistant in dashboard sidebar |
| `VITE_AI_API_KEY` | Claude API key for AI assistant |
| `VITE_AI_MODEL` | Claude model to use |

### How to Update Build-Time Variables

```powershell
# 1. Edit infra/.env
# 2. Rebuild and restart the affected container:
docker compose -f infra/docker-compose.dev.yml up --build saleor-storefront     # For NEXT_PUBLIC_*
docker compose -f infra/docker-compose.dev.yml up --build saleor-dashboard      # For VITE_*
```

---

## Verification Checklist

After setup, verify everything is working:

- [ ] **Storefront loads** at `http://localhost:3000` (or configured URL) with your store name
- [ ] **Dashboard loads** at `http://localhost:9000` (or configured URL)
- [ ] **Admin login works** with credentials from wizard (or `AURA_ADMIN_EMAIL`/`AURA_ADMIN_PASSWORD` in `.env`)
- [ ] **API responds** — `http://localhost:8000/graphql/` shows the GraphQL Playground
- [ ] **All apps Active** in Dashboard > Extensions (11 apps should be listed)
- [ ] **Channels exist** — Dashboard > Configuration > Channels shows ILS and USD channels (after catalog deploy)
- [ ] **Products visible** — At least one product in Dashboard > Catalog > Products (after catalog import)
- [ ] **Storefront Control works** — Dashboard > Extensions > Storefront Control opens the admin UI
- [ ] **Email works** — If SMTP configured, check container logs: `docker compose logs saleor-smtp-app`
- [ ] **Sample config imported** — Storefront shows your branding (not defaults)
- [ ] **Hebrew tagline updated** — Check `apps/apps/storefront-control/sample-config-import.json` for proper Hebrew text

**Quick health check:**

```powershell
.\infra\platform.ps1 status
```

Shows container health, ports, tunnel status, CPU/RAM usage, and DB size.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Container name conflict | Another store using same `COMPOSE_PREFIX` | Set unique `COMPOSE_PREFIX` in `.env` |
| Port already in use | Another service on the same port | Change `*_PORT` values in `.env` (see [Port Allocation](#step-3-port-allocation-required)) |
| Container won't start | Missing env vars, syntax errors, port conflict | `docker compose -f infra/docker-compose.dev.yml logs <service>` |
| Database is empty after restart | `COMPOSE_PROJECT_NAME` changed (volumes are namespaced) | Set `COMPOSE_PROJECT_NAME` to match original, or `docker compose down -v` and re-init |
| `docker exec` fails "no such container" | Container name changed (COMPOSE_PREFIX) | `docker ps` to see current names, update your commands |
| Apps not installing | API not healthy, or app container not ready | `platform.ps1 status` to check health, wait for all containers, retry |
| App shows "Error" in Dashboard | App lost auth token after container recreate | Delete app in Dashboard, then `platform.ps1 install-apps` to re-register |
| Duplicate apps in Extensions | Multiple `install-apps` runs without cleanup | `platform.ps1 cleanup-apps` to remove duplicates |
| Tunnel not connecting | DNS records missing or incorrect | Verify CNAME records in Cloudflare point to `<TUNNEL_ID>.cfargotunnel.com` |
| Dashboard "Blocked request" on tunnel | `DASHBOARD_TUNNEL_URL` not set | Add `DASHBOARD_TUNNEL_URL=https://dash.yourdomain.com` to `.env`, rebuild dashboard |
| `NEXT_PUBLIC_*` change not taking effect | Build-time variable — needs rebuild, not restart | `docker compose up --build saleor-storefront` (see [Build-Time vs Runtime](#build-time-vs-runtime-variables)) |
| `401 SIGNATURE_VERIFICATION_FAILED` on webhooks | API/Worker/Scheduler have different RSA keys | Ensure all three share the same `RSA_PRIVATE_KEY` in `.env`, restart all three |
| Webhook URLs stale after tunnel change | Apps registered with old URLs | `platform.ps1 install-apps` to re-register with new URLs |
| Upstream sync conflicts | Protected files not configured | Run `git config merge.ours.driver true` and check `.gitattributes` |
| `Module not found` in storefront | Shared package not mounted in Docker | `docker compose up --force-recreate saleor-storefront` |
| GraphQL type errors | Stale generated types after schema change | `docker exec {prefix}-api-dev python manage.py build_schema` then `docker exec {prefix}-storefront-dev pnpm generate` |
| Contact form emails go to wrong address | `CONTACT_EMAIL` not set | Add `CONTACT_EMAIL=support@yourdomain.com` to `.env`, restart API |
| Gmail overrides From address | Gmail SMTP behavior | Configure "Send mail as" alias in Gmail Settings > Accounts |
| Bezeq ISP blocks new subdomains | ISP DNS caching | Wait 24h, or use `host.docker.internal` for local dev |
| HMR not working | Docker volume watchers unreliable on Windows | Always `docker compose restart` after code changes — do NOT rely on HMR |

---

## CLI Reference

All commands run from the repository root as `.\infra\platform.ps1 <command>`.

| Command | Parameters | Description |
|---------|------------|-------------|
| `setup` | `-NonInteractive`, `-Mode`, `-Domain` | Full guided setup (init + new-store + up + db-init + install-apps) |
| `init` | — | Prerequisites check + `.env` creation + secret generation |
| `new-store` | `-StoreName`, `-PrimaryColor`, `-Domain`, `-StoreType` | Rebrand platform for a new store (wizard) |
| `up` | `-Mode [localhost\|selfhosted]`, `-Profile [dev\|prod]`, `-NoBrowser` | Start platform (Docker + tunnels) |
| `down` | — | Stop all containers + tunnels |
| `restart` | `<service\|all>` | Restart specific service or all services |
| `status` | — | Health dashboard (containers, ports, tunnels, CPU/RAM, DB size) |
| `db-init` | `-SeedData` | Initialize database (migrate + admin user + schema export) |
| `install-apps` | `-Include`, `-Exclude`, `-SkipDelete`, `-Email`, `-Password` | Register/reinstall Saleor apps |
| `cleanup-apps` | — | Remove duplicate app installations, fix permissions |
| `backup` | `-Compress`, `-Retain <int>` | Database backup with rotation |
| `restore` | `<file>` | Restore database from backup file |
| `logs` | `<service>` | Tail container logs (follows output) |
| `codegen` | — | Run GraphQL codegen in all frontend containers |
| `tunnels` | — | Start tunnels only (skip Docker) |
| `generate-tunnel-config` | — | Regenerate `cloudflared-config.yml` from `.env` |
| `sync` | `-DryRun` | Pull upstream template changes + merge |
| `refresh-urls` | — | Update webhook URLs after tunnel/domain change |
| `help` | — | Show all available commands |

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

## Files You Can Ignore

After running the wizard, these files from the reference store are overwritten or irrelevant to your store:

| Path | Description |
|------|-------------|
| `apps/apps/storefront-control/mansour configs/` | Another client's config samples |
| `.planning/`, `.serena/`, `.agents/` | Development planning artifacts |
| `SEO-AUDIT-REPORT.md`, `STOREFRONT-AUDIT-SCORECARD.md` | Original store audits |
| `scripts/catalog-generator/src/config/templates/pawzen/` | Original store's product catalog |
| `scripts/catalog-generator/src/config/mansour/` | Another client's catalog data |

## Template Files Reference

These `.example` files show the expected structure for generated configs. They are synced from upstream and never contain store-specific data:

| Template | Purpose |
|----------|---------|
| `infra/.env.example` | Full environment template with all variables and documentation |
| `infra/platform.yml.example` | Service registry with generic store values |
| `infra/cloudflared-config.yml.example` | Tunnel config with placeholder domain |
| `scripts/catalog-generator/config.yml.example` | Store infrastructure with generic product types |
