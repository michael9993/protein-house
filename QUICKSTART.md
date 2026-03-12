# Quick Start: Create Your Store

Clone the repo, run one command, and have a fully branded e-commerce platform running locally.

## Prerequisites

- **Docker Desktop** — [Install](https://www.docker.com/products/docker-desktop/)
- **PowerShell 7+** — [Install](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell)
- **Node.js 22+** — Only needed for catalog generator ([Install](https://nodejs.org/))

## 1. Clone & Configure

```bash
git clone <repo-url> my-store
cd my-store
```

### Interactive wizard (recommended)

```powershell
.\infra\platform.ps1 new-store
```

The wizard asks 6-9 questions (store name, colors, domain, etc.) and propagates your answers to all config files across the platform.

### Non-interactive

```powershell
.\infra\platform.ps1 new-store `
  -StoreName "My Boutique" `
  -PrimaryColor "#E11D48" `
  -Domain "myboutique.com"
```

### What gets configured

The wizard updates these files automatically:

| File | What Changes |
|------|-------------|
| `infra/platform.yml` | Platform name, domain, store identity |
| `infra/.env` | Domain, store name env vars |
| Sample config JSONs (×2) | Store name, email, colors, branding |
| `storefront/storefront-cms-config.json` | Store identity for all channels |
| `cloudflared-config.yml` | Tunnel subdomains (if domain provided) |
| `storefront/src/config/stores/` | TypeScript config file |

## 2. Start Services

```powershell
.\infra\platform.ps1 up
```

This starts all Docker containers (API, dashboard, storefront, apps, database, Redis).

## 3. Install Apps

```powershell
.\infra\platform.ps1 install-apps
```

Registers all Saleor apps (Stripe, SMTP, Storefront Control, etc.) with the API.

## 4. (Optional) Generate Starter Catalog

If you want sample products to work with:

```bash
cd scripts/catalog-generator
npm install
```

```powershell
# Generic starter catalog (20 products, 8 categories, 4 collections)
$env:CATALOG_TEMPLATE="starter"; npm run generate

# Upload via Dashboard > Apps > Bulk Manager
# Import order: Categories → Collections → Products
```

## Access Points

| Service | URL |
|---------|-----|
| Storefront | http://localhost:3000 |
| Dashboard | http://localhost:9000 |
| API Playground | http://localhost:8000/graphql/ |

## Useful Commands

```powershell
.\infra\platform.ps1 status            # Health dashboard
.\infra\platform.ps1 restart storefront # Restart a service
.\infra\platform.ps1 backup            # Database backup
.\infra\platform.ps1 logs api          # Tail service logs
.\infra\platform.ps1 help              # All commands
```

## Restoring Default (Pawzen) Branding

Run the wizard again with Pawzen values to restore:

```powershell
.\infra\platform.ps1 new-store `
  -StoreName "Pawzen" `
  -PrimaryColor "#1B2838" `
  -Domain "halacosmetics.org"
```

## Full Documentation

- **[CLAUDE.md](CLAUDE.md)** — Architecture, commands, conventions
- **[PRD.md](PRD.md)** — Product requirements
- **[infra/PLATFORM-CLI.md](infra/PLATFORM-CLI.md)** — Platform CLI reference
