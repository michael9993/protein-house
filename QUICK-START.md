# Aura E-Commerce Platform - Quick Start Guide

## Prerequisites

- **Docker Desktop** (with Docker Compose v2)
- **Git**
- **PowerShell** (Windows) or **pwsh** (macOS/Linux)
- **Node.js >= 22** and **pnpm >= 10** (for host-side scripts only)

## Step 1: Clone the Repository

```bash
git clone --recurse-submodules https://github.com/michael9993/saleor-platform.git
cd saleor-platform
```

> The `--recurse-submodules` flag ensures `saleor/`, `dashboard/`, and `storefront/` submodules are cloned.

## Step 2: Configure for Your Store

```powershell
.\infra\platform.ps1 new-store
```

This interactive wizard collects ~9 inputs (store name, domain, colors, etc.) and propagates them across all config files. For non-interactive setup:

```powershell
.\infra\platform.ps1 new-store -StoreName "My Store" -PrimaryColor "#E11D48" -Domain "mystore.com"
```

Or manually copy the env template:

```powershell
copy infra\env-template.txt infra\.env
# Edit infra/.env with your settings
```

## Step 3: Start the Platform

```powershell
.\infra\platform.ps1 up
```

Or directly with Docker Compose:

```bash
docker compose -f infra/docker-compose.dev.yml up -d
docker compose -f infra/docker-compose.dev.yml ps    # Verify health
```

## Step 4: Install Saleor Apps

```powershell
.\infra\platform.ps1 install-apps
```

This registers all apps in the Saleor Dashboard automatically.

## Step 5: Access Services

| Service | URL | Port |
|---------|-----|------|
| **Storefront** | http://localhost:3000 | 3000 |
| **Dashboard** | http://localhost:9000 | 9000 |
| **Saleor API** | http://localhost:8000/graphql/ | 8000 |

## Platform Services

### Core Infrastructure

| Container | Port | Purpose |
|-----------|------|---------|
| `saleor-api-dev` | 8000 | Saleor GraphQL API |
| `saleor-worker-dev` | - | Celery background worker |
| `saleor-scheduler-dev` | - | Celery beat scheduler |
| `saleor-dashboard-dev` | 9000 | Admin dashboard |
| `saleor-storefront-dev` | 3000 | Customer storefront |
| `saleor-postgres-dev` | 5432 | PostgreSQL database |
| `saleor-redis-dev` | 6379 | Redis cache/broker |

### Saleor Apps

| App | Container | Port | Purpose |
|-----|-----------|------|---------|
| Storefront Control | `saleor-storefront-control-app-dev` | 3004 | CMS configuration & live preview |
| SMTP | `saleor-smtp-app-dev` | 3001 | Email notifications |
| Stripe | `saleor-stripe-app-dev` | 3002 | Payment processing |
| Invoices | `saleor-invoice-app-dev` | 3003 | PDF invoice generation |
| Newsletter | `saleor-newsletter-app-dev` | 3005 | Subscriber management & campaigns |
| Sales Analytics | `saleor-sales-analytics-app-dev` | 3006 | KPIs, charts, Excel export |
| Bulk Manager | `saleor-bulk-manager-app-dev` | 3007 | Bulk import/export/delete |
| Image Studio | `saleor-image-studio-app-dev` | 3008 | AI-powered image editor |
| Dropship Orchestrator | `saleor-dropship-app-dev` | 3009 | AliExpress + CJ dropshipping |
| Tax Manager | `saleor-tax-manager-app-dev` | 3010 | Self-hosted tax calculation |

### AI Services (Image Studio)

| Container | Port | Purpose |
|-----------|------|---------|
| `saleor-rembg-dev` | 7000 | AI background removal |
| `saleor-esrgan-dev` | 7001 | AI image upscaling |

## Platform CLI Commands

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

## Required Configuration

### Minimum (infra/.env)

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### With Tunnels (for webhooks & external access)

```env
SALEOR_API_TUNNEL_URL=https://your-api.trycloudflare.com
STRIPE_APP_TUNNEL_URL=https://your-stripe.trycloudflare.com
```

Use `.\infra\platform.ps1 up` to auto-start ephemeral tunnels, or `.\infra\platform.ps1 up -Mode selfhosted` for named tunnels.

## Troubleshooting

### Webhook 401 Errors

1. Set `SALEOR_API_TUNNEL_URL` in `infra/.env`
2. Restart Saleor API: `.\infra\platform.ps1 restart api`
3. Reinstall apps: `.\infra\platform.ps1 install-apps`

### Can't Connect to API

1. Verify `ALLOWED_GRAPHQL_ORIGINS=*` in `infra/.env`
2. Check API status: `.\infra\platform.ps1 status`
3. View logs: `.\infra\platform.ps1 logs api`

### Container Won't Start

1. Check logs: `.\infra\platform.ps1 logs <service>`
2. Rebuild: `docker compose -f infra/docker-compose.dev.yml up -d --build <service>`
3. Check disk space: Docker Desktop may need more resources

## Documentation

- **Architecture & Commands**: `CLAUDE.md`
- **Product Requirements**: `PRD.md`
- **Platform CLI Reference**: `infra/scripts/README.md`
- **Self-Hosted Deployment**: `infra/SELF-HOSTED.md`
- **Production Deployment**: `infra/DEPLOY.md`
- **Catalog Generator**: `scripts/catalog-generator/SETUP.md`

## Next Steps

1. Create admin user: `docker exec -it saleor-api-dev python manage.py createsuperuser`
2. Log into Dashboard at http://localhost:9000
3. Configure Storefront Control app for your branding
4. Set up Stripe keys for payment processing
5. Generate product catalog: `cd scripts/catalog-generator && npm run setup`
