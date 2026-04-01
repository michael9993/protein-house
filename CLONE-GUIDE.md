# Clone & Rebrand Guide

How to clone this repository and set up a completely different store.

## Prerequisites

- **Docker Desktop** (with Docker Compose v2)
- **PowerShell 7+** (`winget install Microsoft.PowerShell`)
- **Node.js 22+** (for catalog-generator, runs on host)
- **pnpm 10+** (`npm install -g pnpm`)
- **cloudflared** (optional, for public tunnel access: `winget install Cloudflare.cloudflared`)

## Quick Start

```powershell
# 1. Clone the repo
git clone <repo-url> my-store
cd my-store/infra

# 2. Initialize (generates secrets, copies .env.example -> .env)
.\platform.ps1 init

# 3. Rebrand (interactive wizard — sets store name, colors, domain, Docker prefix)
.\platform.ps1 new-store

# 4. Start Docker (auto-detects fresh DB, runs migrations, creates admin)
.\platform.ps1 up

# 5. Install all Saleor apps
.\platform.ps1 install-apps
```

After these 5 steps, your store is running at `http://localhost:3000` with the admin dashboard at `http://localhost:9000`.

## What the Wizard Does

`platform.ps1 new-store` asks for ~10 inputs and updates these files:

| File | What Changes |
|------|-------------|
| `infra/platform.yml` | Store name, slug, domain, colors, analytics, container names |
| `infra/.env` | Domain, store name, COMPOSE_PREFIX, tunnel URLs |
| `apps/apps/storefront-control/sample-config-import-en.json` | English store branding |
| `apps/apps/storefront-control/sample-config-import.json` | Hebrew store branding (partial — update tagline manually) |
| `storefront/storefront-cms-config.json` | Both channel configs |
| `infra/cloudflared-config.yml` | Tunnel routes (if domain provided) |
| `scripts/catalog-generator/config.yml` | Shop name |

## Docker Namespacing

Container names are parameterized via `COMPOSE_PREFIX` in `.env`:

```env
# Default for new clones
COMPOSE_PREFIX=aura

# Sets volume/network namespace
COMPOSE_PROJECT_NAME=aura
```

This means your containers are named `aura-api-dev`, `aura-postgres-dev`, etc. The wizard sets this from your store slug (e.g., "Cool Shoes" -> `COMPOSE_PREFIX=cool-shoes`).

### Running Multiple Stores on the Same Machine

Each clone needs a different `COMPOSE_PREFIX` and different ports:

| Setting | Store A | Store B |
|---------|---------|---------|
| `COMPOSE_PREFIX` | `aura` | `coolshoes` |
| `COMPOSE_PROJECT_NAME` | `aura` | `coolshoes` |
| `SALEOR_API_PORT` | `8000` | `8100` |
| `DASHBOARD_PORT` | `9000` | `9100` |
| `STOREFRONT_PORT` | `3000` | `3100` |
| `POSTGRES_PORT` | `5432` | `5433` |

Containers: `aura-api-dev` vs `coolshoes-api-dev`. Volumes are auto-namespaced by `COMPOSE_PROJECT_NAME`.

### Fresh Database

New clones start with an empty database. The `platform.ps1 up` command auto-detects this and runs migrations + creates an admin user. To reset an existing database:

```powershell
docker compose -f infra/docker-compose.dev.yml down -v   # Removes volumes (ALL data)
.\platform.ps1 up                                         # Recreates fresh
```

## Product Catalog

After the platform is running, you need products. Two approaches:

### Option A: Starter Template (Generic)

```bash
cd scripts/catalog-generator
npm install
CATALOG_TEMPLATE=starter npm run generate    # Creates generic 20-product catalog
```

Then import via Bulk Manager app in the Dashboard.

### Option B: Custom Catalog

1. Edit `scripts/catalog-generator/config.yml` — define your product types, attributes, warehouses, and shipping zones
2. Create product definitions in `scripts/catalog-generator/src/config/templates/` (see `starter/` for format)
3. Run `npm run deploy:ci` to apply infrastructure
4. Run `npm run generate` to create Excel/CSV files
5. Import via Bulk Manager app

## Cloudflare Tunnel Setup (Optional)

For public access (not just localhost):

```powershell
# 1. Login to Cloudflare
cloudflared tunnel login

# 2. Create a tunnel (use your store name)
cloudflared tunnel create mystore-platform

# 3. Note the tunnel UUID from the output

# 4. The wizard already generated cloudflared-config.yml if you provided a domain.
#    If not, copy the template:
cp infra/cloudflared-config.yml.example infra/cloudflared-config.yml
#    Then edit: replace <TUNNEL_UUID>, <YOUR_CREDENTIALS_PATH>, and example.com

# 5. Create DNS CNAME records in Cloudflare Dashboard
#    Point each subdomain to: <TUNNEL_UUID>.cfargotunnel.com
#    Subdomains needed:
#      - yourdomain.com (storefront)
#      - api.yourdomain.com
#      - dash.yourdomain.com
#      - stripe.yourdomain.com
#      - smtp.yourdomain.com
#      - invoices.yourdomain.com
#      - control.yourdomain.com
#      - newsletter.yourdomain.com
#      - analytics.yourdomain.com
#      - bulk.yourdomain.com
#      - studio.yourdomain.com
#      - dropship.yourdomain.com
#      - tax.yourdomain.com
#      - ext1.yourdomain.com (PayPal)

# 6. Update .env with tunnel URLs
.\platform.ps1 up -Mode selfhosted

# 7. Run the tunnel
cloudflared tunnel --config infra/cloudflared-config.yml run
```

## Post-Setup Checklist

After initial setup, verify these:

- [ ] Storefront loads at `http://localhost:3000` with your store name
- [ ] Dashboard loads at `http://localhost:9000`
- [ ] Admin login works (credentials from wizard or `AURA_ADMIN_EMAIL`/`AURA_ADMIN_PASSWORD` in `.env`)
- [ ] All apps show as "Active" in Dashboard > Extensions
- [ ] Sample config shows your branding in Storefront Control app
- [ ] Hebrew tagline updated in `sample-config-import.json` (wizard skips this for manual translation)

## Manual Steps the Wizard Doesn't Handle

1. **Hebrew translations** — Update tagline/description in `apps/apps/storefront-control/sample-config-import.json`
2. **SMTP email templates** — Customize email branding in Dashboard > Extensions > SMTP > Templates
3. **Logo upload** — Upload your logo via Storefront Control app (Design > Branding)
4. **SEO metadata** — Configure in Storefront Control app (SEO page)
5. **Payment providers** — Configure Stripe/PayPal API keys in Dashboard > Extensions
6. **Google Analytics** — Set GTM/GA4 IDs in Storefront Control app or via wizard

## Files You Can Ignore

This repo contains data from the original reference store (Pawzen). After running the wizard, these are overwritten or irrelevant:

- `apps/apps/storefront-control/mansour configs/` — Another client's config samples
- `.planning/`, `.serena/`, `.agents/` — Development planning artifacts
- `SEO-AUDIT-REPORT.md`, `STOREFRONT-AUDIT-SCORECARD.md` — Original store audits
- `scripts/catalog-generator/src/config/templates/pawzen/` — Original store's product catalog template
- `scripts/catalog-generator/src/config/mansour/` — Another client's catalog data

## Template Files Reference

These `.example` files show the expected structure for generated configs:

| Template | Purpose |
|----------|---------|
| `infra/platform.yml.example` | Service registry with generic store values |
| `infra/cloudflared-config.yml.example` | Tunnel config with placeholder domain |
| `scripts/catalog-generator/config.yml.example` | Store infrastructure with generic product types |
| `infra/.env.example` | Full environment template with all variables |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Container name conflict | Set unique `COMPOSE_PREFIX` in `.env` |
| Port already in use | Change port numbers in `.env` (see "Running Multiple Stores") |
| Database has old data | `docker compose -f infra/docker-compose.dev.yml down -v` then `platform.ps1 up` |
| Apps not installing | Ensure API is healthy: `platform.ps1 status`, then retry `platform.ps1 install-apps` |
| Tunnel not connecting | Verify DNS CNAME records point to `<TUNNEL_UUID>.cfargotunnel.com` |
| Wizard missed a file | Check this guide's "Manual Steps" section |
