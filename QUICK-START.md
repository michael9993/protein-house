# Aura E-Commerce Platform - Quick Start Guide

## Prerequisites

- **Docker Desktop** (with Docker Compose v2)
- **Git**
- **PowerShell** (Windows) or **pwsh** (macOS/Linux: `brew install powershell` or `snap install powershell`)
- **Node.js >= 22** and **pnpm >= 10** (for host-side scripts only)

## Quick Setup (Recommended)

### 1. Clone the Repository

```bash
git clone --recurse-submodules https://github.com/michael9993/saleor-platform.git
cd saleor-platform
```

> The `--recurse-submodules` flag ensures `saleor/`, `dashboard/`, and `storefront/` submodules are cloned.
> If you forgot it, run: `git submodule update --init --recursive`

### 2. Run Full Setup

```powershell
.\infra\platform.ps1 setup
```

This single command handles **everything**:
1. Checks prerequisites (Docker, cloudflared, powershell-yaml)
2. Creates `.env` from template and auto-generates secrets (SECRET_KEY, RSA key)
3. Runs the store branding wizard (name, colors, domain, etc.)
4. Starts all Docker containers and waits for health
5. Runs database migrations and creates admin user
6. Starts Cloudflare tunnels (ephemeral by default)
7. Installs all 11 Saleor apps

For non-interactive setup (CI/scripting):

```powershell
.\infra\platform.ps1 setup -NonInteractive
```

### 3. Access Your Platform

| Service | URL |
|---------|-----|
| **Storefront** | http://localhost:3000 |
| **Dashboard** | http://localhost:9000 |
| **Saleor API** | http://localhost:8000/graphql/ |

Log into the Dashboard with the admin credentials you set during setup (default: `admin@localhost` / `admin`).

---

## Advanced: Step-by-Step Setup

If you prefer manual control over each step:

### Step 1: Initialize Environment

```powershell
.\infra\platform.ps1 init
```

This checks prerequisites, creates `.env` from `.env.example`, and auto-generates SECRET_KEY, APP_SECRET_KEY, and RSA_PRIVATE_KEY.

### Step 2: Configure Store Brand

```powershell
.\infra\platform.ps1 new-store
```

Interactive wizard collecting 10 inputs (name, type, colors, domain, admin credentials, etc.). Non-interactive:

```powershell
.\infra\platform.ps1 new-store -StoreName "My Store" -PrimaryColor "#E11D48" -Domain "mystore.com"
```

### Step 3: Start Platform

```powershell
.\infra\platform.ps1 up
```

Starts Docker containers, waits for health, auto-detects fresh database and runs migrations if needed, then starts tunnels.

### Step 4: Initialize Database (if not auto-detected)

```powershell
.\infra\platform.ps1 db-init
```

Runs migrations, creates admin user, and exports GraphQL schema. Add `-SeedData` for demo products.

### Step 5: Install Saleor Apps

```powershell
.\infra\platform.ps1 install-apps -Email admin@localhost -Password admin
```

Registers all 11 apps in the Saleor Dashboard.

---

## Self-Hosted (Production with Custom Domain)

```powershell
.\infra\platform.ps1 setup -Mode selfhosted -Domain "mystore.com"
```

Or step by step:

```powershell
.\infra\platform.ps1 new-store -Domain "mystore.com"
.\infra\platform.ps1 generate-tunnel-config
.\infra\platform.ps1 up -Mode selfhosted
.\infra\platform.ps1 install-apps
```

See `infra/SELF-HOSTED.md` for full Cloudflare tunnel setup instructions.

---

## Platform Services

### Core Infrastructure

| Container | Port | Purpose |
|-----------|------|---------|
| `aura-api-dev` | 8000 | Saleor GraphQL API |
| `aura-worker-dev` | - | Celery background worker |
| `aura-scheduler-dev` | - | Celery beat scheduler |
| `aura-dashboard-dev` | 9000 | Admin dashboard |
| `aura-storefront-dev` | 3000 | Customer storefront |
| `aura-postgres-dev` | 5432 | PostgreSQL database |
| `aura-redis-dev` | 6379 | Redis cache/broker |

### Saleor Apps

| App | Container | Port | Purpose |
|-----|-----------|------|---------|
| Storefront Control | `aura-storefront-control-app-dev` | 3004 | CMS configuration & live preview |
| SMTP | `aura-smtp-app-dev` | 3001 | Email notifications |
| Stripe | `aura-stripe-app-dev` | 3002 | Payment processing |
| Invoices | `aura-invoice-app-dev` | 3003 | PDF invoice generation |
| Newsletter | `aura-newsletter-app-dev` | 3005 | Subscriber management & campaigns |
| Sales Analytics | `aura-sales-analytics-app-dev` | 3006 | KPIs, charts, Excel export |
| Bulk Manager | `aura-bulk-manager-app-dev` | 3007 | Bulk import/export/delete |
| Image Studio | `aura-image-studio-app-dev` | 3008 | AI-powered image editor |
| Dropship Orchestrator | `aura-dropship-app-dev` | 3009 | AliExpress + CJ dropshipping |
| Tax Manager | `aura-tax-manager-app-dev` | 3010 | Self-hosted tax calculation |
| PayPal | `aura-paypal-app-dev` | 3011 | PayPal Commerce payments |

### AI Services (Image Studio)

| Container | Port | Purpose |
|-----------|------|---------|
| `aura-rembg-dev` | 7000 | AI background removal |
| `aura-esrgan-dev` | 7001 | AI image upscaling |

## Platform CLI Commands

```powershell
.\infra\platform.ps1 setup                    # Full guided setup (recommended)
.\infra\platform.ps1 status                   # Health dashboard
.\infra\platform.ps1 up                       # Start platform (Docker + tunnels)
.\infra\platform.ps1 up -Mode selfhosted      # Start with named tunnels
.\infra\platform.ps1 up -Profile prod         # Start with production compose
.\infra\platform.ps1 down                     # Stop everything
.\infra\platform.ps1 restart <service>        # Restart a service
.\infra\platform.ps1 db-init                  # Initialize DB (migrate + admin + schema)
.\infra\platform.ps1 db-init -SeedData        # DB init with demo products
.\infra\platform.ps1 backup -Compress         # Database backup
.\infra\platform.ps1 install-apps             # Register all Saleor apps
.\infra\platform.ps1 logs <service>           # Tail container logs
.\infra\platform.ps1 codegen                  # Run GraphQL codegen
.\infra\platform.ps1 new-store                # Rebrand for a new store
.\infra\platform.ps1 init                     # Prereqs + .env + secrets
.\infra\platform.ps1 generate-tunnel-config   # Regenerate cloudflared-config.yml
```

## Getting to a Fully Working Store (A-to-Z)

After `platform.ps1 setup` completes, your platform is running but the store is **empty** — no products, no categories, no shipping methods. Follow these steps to get a fully functional store:

### Step A: Deploy Store Infrastructure + Product Catalog

The catalog generator creates channels, product types, attributes, categories, collections, warehouses, shipping zones, and products — all from code.

```bash
# From the host machine (NOT Docker) — requires Node.js 22+ and pnpm
cd scripts/catalog-generator
npm install
npm run setup          # Full pipeline: deploy infra + translate + generate catalog
```

This runs 3 phases:
1. **Deploy** — Creates Saleor channels (USD, ILS), product types, attributes, warehouses, shipping zones via GraphQL
2. **Translate** — Adds Hebrew translations for categories and collections
3. **Generate** — Creates product Excel + CSV files for bulk import

For a minimal starter catalog instead of the full 100-product set:
```bash
CATALOG_TEMPLATE=starter npm run generate
```

See `scripts/catalog-generator/SETUP.md` for full documentation.

### Step B: Import Products via Bulk Manager

1. Open Dashboard at http://localhost:9000
2. Go to **Apps** → **Bulk Manager**
3. Import the generated Excel file from `scripts/catalog-generator/output/`
4. Products, variants, and prices are created across both channels

### Step C: Configure Storefront Control (Branding + CMS)

1. In Dashboard → **Apps** → **Storefront Control**
2. Go to the **Import/Export** page
3. Import `apps/apps/storefront-control/sample-config-import-en.json` for the **USD** channel
4. Import `apps/apps/storefront-control/sample-config-import.json` for the **ILS** channel
5. Review and customize: Homepage sections, hero banner, navigation menus, footer, etc.

### Step D: Add Logo and Favicon

Replace the placeholder files:
- `storefront/public/logo.svg` — Your store logo (used in header/footer)
- `storefront/public/favicon.ico` — Browser tab icon

Then restart the storefront:
```powershell
.\infra\platform.ps1 restart storefront
```

### Step E: Configure Payment Processing

**Stripe** (credit/debit cards):
1. Get test keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Add to `infra/.env`:
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Restart: `.\infra\platform.ps1 restart aura-stripe-app`
4. In Dashboard → **Apps** → **Stripe** → configure the payment channels

**PayPal** (optional):
1. Get API credentials from [PayPal Developer](https://developer.paypal.com/)
2. The PayPal app uses file-based config — see `apps/apps/paypal/README.md`
3. Restart: `.\infra\platform.ps1 restart aura-paypal-app`

### Step F: Configure Email (SMTP)

Without SMTP, emails print to the console log. For real delivery:

```env
# Add to infra/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_ENCRYPTION=TLS
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password        # Gmail: use App Password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

> **Gmail note**: Use an [App Password](https://myaccount.google.com/apppasswords), not your account password. Gmail overrides the "From" address — configure "Send mail as" alias if needed.

Restart: `.\infra\platform.ps1 restart aura-smtp-app`

In Dashboard → **Apps** → **SMTP** → enable event templates (order confirmation, shipping, etc.)

### Step G: Verify Everything Works

1. Open storefront: http://localhost:3000
2. Browse products, add to cart
3. Complete a test checkout (use Stripe test card `4242 4242 4242 4242`)
4. Check Dashboard for the new order
5. Verify email was sent (console log or real inbox)

```powershell
.\infra\platform.ps1 status    # All services should show "running"
```

### Optional: Additional Configuration

| Feature | Where | Notes |
|---------|-------|-------|
| **Tax rates** | Dashboard → Apps → Tax Manager | Configure country/state rates |
| **Analytics** | `infra/.env` → `GTM_ID` / `GA4_ID` | Set during `new-store` wizard or edit `.env` |
| **Sentry** | `infra/.env` → `SENTRY_DSN` | Free tier at [sentry.io](https://sentry.io) |
| **Newsletter** | Dashboard → Apps → Newsletter | Create signup forms and campaigns |
| **Dropshipping** | Dashboard → Apps → Dropship | Configure AliExpress/CJ suppliers |
| **AI Image Studio** | Dashboard → Apps → Image Studio | Requires `GEMINI_API_KEY` in `.env` |

---

## Troubleshooting

### Webhook 401 Errors

1. Ensure tunnels are running: `.\infra\platform.ps1 status`
2. Restart API: `.\infra\platform.ps1 restart api`
3. Reinstall apps: `.\infra\platform.ps1 install-apps`

### Can't Connect to API

1. Check API status: `.\infra\platform.ps1 status`
2. View logs: `.\infra\platform.ps1 logs api`
3. Verify `ALLOWED_GRAPHQL_ORIGINS=*` in `infra/.env`

### Container Won't Start

1. Check logs: `.\infra\platform.ps1 logs <service>`
2. Rebuild: `docker compose -f infra/docker-compose.dev.yml up -d --build <service>`
3. Check Docker Desktop resources (increase memory if needed)

### Empty Storefront (No Products)

You need to deploy the store infrastructure first:
```bash
cd scripts/catalog-generator && npm install && npm run setup
```
Then import products via Bulk Manager in the Dashboard.

### Storefront Shows Raw/Unstyled Content

Import the sample configs in Storefront Control:
1. Dashboard → Apps → Storefront Control → Import/Export
2. Import both `sample-config-import-en.json` (USD) and `sample-config-import.json` (ILS)

### Linux/macOS

The CLI requires PowerShell. Install with `brew install powershell` (macOS) or `snap install powershell` (Linux), then run with `pwsh -f infra/platform.ps1 <command>`. Alternatively, use `infra/scripts/init-dev.sh` for a bash-based dev setup.

## Documentation

- **Architecture & Commands**: `CLAUDE.md`
- **Product Requirements**: `PRD.md`
- **Platform CLI Reference**: `infra/PLATFORM-CLI.md`
- **Self-Hosted Deployment**: `infra/SELF-HOSTED.md`
- **Production Deployment**: `infra/DEPLOY.md`
- **Configuration Guide**: `infra/CONFIGURATION.md`
- **Catalog Generator**: `scripts/catalog-generator/SETUP.md`
