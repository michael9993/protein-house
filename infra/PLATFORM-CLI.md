# Platform CLI Reference

Complete guide to `platform.ps1` — the unified CLI for managing the Aura E-Commerce Platform.

---

## Prerequisites

| Requirement | Install | Purpose |
|-------------|---------|---------|
| **Windows 10/11** | — | Host OS |
| **Docker Desktop** | https://www.docker.com/products/docker-desktop/ | Container runtime |
| **cloudflared** | `winget install Cloudflare.cloudflared` | Tunnel management |
| **PowerShell 5.1+** | Built into Windows | Script runtime |
| **powershell-yaml** | Auto-installed on first run | YAML config parsing |

Run `.\infra\platform.ps1 init` to verify all prerequisites are met.

---

## Quick Start

```powershell
# 1. First-time setup — checks Docker, cloudflared, creates .env, generates RSA key
.\infra\platform.ps1 init

# 2. Start the platform (Docker containers + ephemeral tunnels)
.\infra\platform.ps1 up

# 3. Register all Saleor apps in the Dashboard (first time only)
.\infra\platform.ps1 install-apps

# 4. Check health of everything
.\infra\platform.ps1 status

# 5. When done, shut everything down
.\infra\platform.ps1 down
```

---

## Commands

### `init` — First-Time Setup

Checks prerequisites and creates initial configuration.

```powershell
.\infra\platform.ps1 init
```

**What it does:**
1. Checks Docker is installed and in PATH
2. Checks cloudflared is installed (warns if missing — not required for dev mode)
3. Installs `powershell-yaml` PowerShell module if missing
4. Creates `.env` from `.env.example` if it doesn't exist
5. Generates RSA private key for JWT signing (if `openssl` is available)

---

### `new-store` — Rebrand for a New Store

Interactive wizard that collects store identity and propagates to all config files across the platform.

```powershell
# Interactive — asks 9 questions
.\infra\platform.ps1 new-store

# Non-interactive — pass params directly
.\infra\platform.ps1 new-store -StoreName "My Boutique" -PrimaryColor "#E11D48" -Domain "myboutique.com"
```

**Parameters:**

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-StoreName` | Store display name | "My Awesome Store" |
| `-PrimaryColor` | Brand color (hex) | "#2563EB" |
| `-Domain` | Production domain | (empty = localhost only) |
| `-Tagline` | Store slogan | "Your Perfect Shopping Destination" |
| `-GtmId` | GTM Container ID | (empty = disabled) |
| `-Ga4Id` | GA4 Property ID | (empty = disabled) |

**Hydrated files:**
- `infra/platform.yml` — platform name, domain, store identity section
- `infra/.env` — domain, store name env vars
- `apps/apps/storefront-control/sample-config-import*.json` — store name, email, colors
- `storefront/storefront-cms-config.json` — store identity for all channels
- `infra/cloudflared-config.yml` — tunnel subdomains (if domain provided)
- `storefront/src/config/stores/{slug}.config.ts` — TypeScript config

---

### `up` — Start Platform

Starts Docker containers, waits for health checks, starts tunnels, opens browser.

```powershell
# Development mode (default) — ephemeral tunnels via trycloudflare.com
.\infra\platform.ps1 up

# Self-hosted mode — named Cloudflare tunnel with your domain
.\infra\platform.ps1 up -Mode selfhosted

# Start containers only (no tunnels)
.\infra\platform.ps1 up -SkipTunnel

# Start tunnels only (containers already running)
.\infra\platform.ps1 up -SkipDocker

# Don't open browser after starting
.\infra\platform.ps1 up -NoBrowser

# Override domain (instead of platform.yml default)
.\infra\platform.ps1 up -Mode selfhosted -Domain mystore.com
```

**Startup sequence:**
1. Verify Docker Desktop is running (auto-starts if `-AutoStart` and Desktop is found)
2. If selfhosted mode: swap `.env` → `.env.self-hosted` (backs up original to `.env.dev-backup`)
3. `docker compose up -d` all containers
4. Wait for core services: PostgreSQL → Redis → Saleor API
5. Start tunnels (ephemeral or named depending on mode)
6. Capture ephemeral tunnel URLs → write to `.env` (updates `PUBLIC_URL`, `API_URL`, `ALLOWED_HOSTS`, etc.)
7. Print service status table
8. Open storefront + dashboard in browser

---

### `down` — Stop Platform

Stops all tunnels and Docker containers.

```powershell
.\infra\platform.ps1 down

# If you were in selfhosted mode, restore dev .env
.\infra\platform.ps1 down -Mode selfhosted
```

**What it does:**
1. Kills all `cloudflared` processes
2. `docker compose down` all containers
3. If selfhosted mode was specified: restores `.env` from `.env.dev-backup`

---

### `status` — Health Dashboard

Shows container status, ports, URLs, and backup history.

```powershell
.\infra\platform.ps1 status

# Show selfhosted URLs (with domain)
.\infra\platform.ps1 status -Mode selfhosted
```

**Output includes:**
- Docker running status
- Table of all 18 services with: container status (running/stopped/not-found), port, URL
- Most recent backup file with age

---

### `restart` — Restart Services

```powershell
# Restart a single service by key
.\infra\platform.ps1 restart storefront
.\infra\platform.ps1 restart api
.\infra\platform.ps1 restart stripe

# Restart all Saleor apps (11 apps)
.\infra\platform.ps1 restart apps

# Restart everything (compose down + up)
.\infra\platform.ps1 restart all
```

**Service keys** (from `platform.yml`):
`api`, `dashboard`, `storefront`, `worker`, `scheduler`, `postgres`, `redis`, `stripe`, `smtp`, `invoices`, `control`, `newsletter`, `analytics`, `bulk`, `studio`, `dropship`, `tax`

---

### `logs` — Tail Container Logs

```powershell
# Default: last 100 lines, follow mode
.\infra\platform.ps1 logs api

# More lines
.\infra\platform.ps1 logs storefront -Lines 500
```

---

### `backup` — Database Backup

Creates a timestamped `pg_dump` with automatic rotation of old backups.

```powershell
# Plain SQL backup
.\infra\platform.ps1 backup

# Gzip-compressed backup
.\infra\platform.ps1 backup -Compress

# Override retention (default: 30 backups)
.\infra\platform.ps1 backup -Compress -Retain 60

# Silent mode (for Windows Task Scheduler)
.\infra\platform.ps1 backup -Compress -Quiet
```

**Backup location** (in priority order):
1. `SALEOR_BACKUP_DIR` environment variable
2. `backup.directory` from `platform.yml`
3. Default: `C:\Users\<username>\saleor-backups\`

**Backup files**: `saleor-YYYY-MM-DD_HH-mm-ss.sql` or `.sql.gz`

**Rotation**: After each backup, files older than the retention count are deleted (newest kept).

### Automated Backups (Windows Task Scheduler)

1. Open **Task Scheduler** (search in Start menu)
2. Click **Create Task** (not "Create Basic Task")
3. Configure:

| Tab | Setting | Value |
|-----|---------|-------|
| General | Name | `Saleor Daily Backup` |
| General | Run whether user is logged on or not | Check |
| Triggers | New > Daily | 2:00 AM |
| Actions | New > Start a program | `powershell.exe` |
| Actions | Arguments | `-File "C:\Users\micha\saleor-platform\infra\platform.ps1" backup -Compress -Quiet` |
| Conditions | Start only if on AC power | Check |
| Settings | If task fails, restart every | 30 minutes, up to 3 times |

---

### `restore` — Restore Database

Restores from a `.sql` or `.sql.gz` backup file. **Drops and recreates** the database.

```powershell
.\infra\platform.ps1 restore C:\Users\micha\saleor-backups\saleor-2026-03-12.sql.gz

# Tilde paths work too
.\infra\platform.ps1 restore ~/saleor-backups/saleor-2026-03-12.sql
```

**Prompts for confirmation** before dropping the database. After restore, restart the API:
```powershell
.\infra\platform.ps1 restart api
```

---

### `install-apps` — Register Saleor Apps

Authenticates with the Saleor API and installs all 11 apps defined in `platform.yml`.

```powershell
# Interactive (prompts for credentials)
.\infra\platform.ps1 install-apps

# With credentials
.\infra\platform.ps1 install-apps -Email admin@example.com -Password mypassword

# Skip deleting existing installations first
.\infra\platform.ps1 install-apps -SkipDelete
```

**What it does per app:**
1. Reads tunnel URL from `.env` (falls back to `http://localhost:<port>`)
2. Deletes any existing installation with the same `app_id` (unless `-SkipDelete`)
3. Calls `appInstall` mutation with the manifest URL

**Apps installed** (from `platform.yml`):
Stripe, SMTP, Invoices, Storefront Control, Newsletter, Sales Analytics, Bulk Manager, Image Studio, Dropship Orchestrator, Tax Manager

---

### `tunnels` — Start Tunnels Only

Starts tunnels without touching Docker containers (assumes containers are already running).

```powershell
# Ephemeral tunnels (dev mode)
.\infra\platform.ps1 tunnels

# Named tunnel (selfhosted mode)
.\infra\platform.ps1 tunnels -Mode selfhosted
```

---

### `codegen` — GraphQL Code Generation

Runs `pnpm generate` in both storefront and dashboard containers.

```powershell
.\infra\platform.ps1 codegen
```

Run this after any GraphQL schema changes in the API:
```powershell
docker exec saleor-api-dev python manage.py build_schema
.\infra\platform.ps1 codegen
```

---

### `generate-tunnel-config` — Generate Cloudflare Config

Auto-generates `infra/cloudflared-config.yml` from `platform.yml` services.

```powershell
.\infra\platform.ps1 generate-tunnel-config

# With a different domain
.\infra\platform.ps1 generate-tunnel-config -Domain mystore.com
```

**Output**: Writes `infra/cloudflared-config.yml` with ingress rules for all services that have a `subdomain` field in `platform.yml`.

**After generating**, you still need to:
1. Replace `<TUNNEL_ID>` in the `credentials-file` path with your actual tunnel UUID
2. Create DNS CNAME records pointing to `<TUNNEL_ID>.cfargotunnel.com`

---

## Options Reference

| Option | Commands | Default | Description |
|--------|----------|---------|-------------|
| `-Mode` | up, down, status, tunnels | `dev` | `dev` = ephemeral tunnels, `selfhosted` = named tunnel |
| `-Domain` | up, generate-tunnel-config | from platform.yml | Override domain |
| `-SkipTunnel` | up | `$false` | Skip tunnel startup |
| `-SkipDocker` | up | `$false` | Skip Docker startup |
| `-NoBrowser` | up | `$false` | Don't open browser |
| `-Compress` | backup | from platform.yml | Gzip compress backup |
| `-Retain` | backup | 30 | Backups to keep |
| `-Quiet` | backup | `$false` | Suppress output |
| `-Email` | install-apps | (prompts) | Admin email |
| `-Password` | install-apps | (prompts) | Admin password |
| `-SkipDelete` | install-apps | `$false` | Don't delete existing apps |
| `-Lines` | logs | 100 | Lines to tail |

---

## Configuration

### `platform.yml` — Service Registry

The single source of truth for all services. Located at `infra/platform.yml`.

```yaml
platform:
  name: "Aura E-Commerce"
  domain: "halacosmetics.org"       # Default domain for self-hosted mode
  tunnel_name: "aura-platform"      # Cloudflare tunnel name

backup:
  directory: "~/saleor-backups"     # Default backup directory
  retain: 30                        # Backups to keep
  compress: true                    # Default compression

services:
  api:
    port: 8000                      # Local port
    container: "saleor-api-dev"     # Docker container name
    compose_service: "saleor-api"   # docker-compose service name
    subdomain: "api"                # Tunnel subdomain (api.domain.com)
    health_path: "/graphql/"        # Health check endpoint
    health_check: true              # Include in startup health wait
    tunnel_env_var: "SALEOR_API_TUNNEL_URL"  # .env variable for tunnel URL
    description: "Saleor GraphQL API"

  # App services also have:
  stripe:
    app_id: "saleor.app.stripe"           # Saleor app identifier
    app_manifest_path: "/api/manifest"     # Manifest URL path
    # ... port, container, subdomain, etc.
```

**Adding a new service**: Add an entry to `platform.yml` and it automatically appears in `status`, `restart`, `logs`, `install-apps`, and `generate-tunnel-config`.

### Environment Variables

Set in `infra/.env` or as system environment variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `PLATFORM_DOMAIN` | Override domain from platform.yml | `halacosmetics.org` |
| `SALEOR_BACKUP_DIR` | Override backup directory | `~/saleor-backups` |
| `SALEOR_API_TUNNEL_URL` | API tunnel URL (auto-set by `up`) | — |
| `STOREFRONT_TUNNEL_URL` | Storefront tunnel URL | — |
| `DASHBOARD_TUNNEL_URL` | Dashboard tunnel URL | — |
| `*_APP_TUNNEL_URL` | App tunnel URLs (11 apps) | — |

The `up` command automatically captures ephemeral tunnel URLs and writes them to `.env`, along with derived variables (`PUBLIC_URL`, `API_URL`, `NEXT_PUBLIC_SALEOR_API_URL`, `ALLOWED_HOSTS`, etc.).

---

## Architecture

```
infra/
├── platform.ps1              # Unified CLI entry point (618 lines)
├── platform.yml              # Service registry — 18 services (170 lines)
├── lib/                      # PowerShell modules
│   ├── Config.ps1            # YAML loader, Get-PlatformConfig, Get-Services, etc.
│   ├── Display.ps1           # Write-Banner, Write-Step, Write-Success, Write-ServiceTable
│   ├── Docker.ps1            # Test-DockerRunning, Start/Stop/Restart-Container
│   ├── Health.ps1            # Wait-ForHealthy, Test-UrlReachable, Get-AllServiceHealth
│   ├── Tunnels.ps1           # Find-Cloudflared, Start-EphemeralTunnel, Start-NamedTunnel
│   ├── EnvManager.ps1        # Read/Write-EnvFile, Update-TunnelUrls, Switch-EnvMode
│   ├── Apps.ps1              # Invoke-GraphQL, Install-SaleorApp, Install-AllApps
│   └── Backup.ps1            # New-DatabaseBackup, Restore-Database, Get-BackupHistory
├── docker-compose.dev.yml    # Docker services orchestration
├── cloudflared-config.yml    # Cloudflare tunnel routing (can be auto-generated)
├── .env                      # Active environment variables
├── .env.self-hosted          # Self-hosted environment (secrets, domain URLs)
├── .env.dev-backup           # Auto-backup of dev .env (created by selfhosted mode switch)
└── env-template.txt          # All environment variables documented
```

### How Modules Are Loaded

`platform.ps1` dot-sources all lib modules at startup:
```powershell
. "$scriptDir\lib\Config.ps1"
. "$scriptDir\lib\Display.ps1"
# ... etc.
```

`Config.ps1` loads `platform.yml` via the `powershell-yaml` module and returns a structured hashtable. All other modules accept this config as a parameter.

### Dev Mode vs Self-Hosted Mode

| Aspect | Dev Mode | Self-Hosted Mode |
|--------|----------|-----------------|
| Tunnels | Ephemeral (random `*.trycloudflare.com` URLs) | Named tunnel with your domain |
| .env | Uses `infra/.env` as-is | Swaps to `infra/.env.self-hosted` |
| URLs | Change every restart | Stable (`subdomain.yourdomain.com`) |
| Account | No Cloudflare account needed | Requires Cloudflare account + tunnel |
| Use case | Local development, webhook testing | Production self-hosting |

---

## Services (18 Total)

### Core Infrastructure

| Key | Container | Port | Description |
|-----|-----------|------|-------------|
| `api` | saleor-api-dev | 8000 | Saleor GraphQL API |
| `dashboard` | saleor-dashboard-dev | 9000 | Admin Dashboard |
| `storefront` | saleor-storefront-dev | 3000 | Customer Storefront |
| `worker` | saleor-worker-dev | — | Celery background worker |
| `scheduler` | saleor-scheduler-dev | — | Celery beat scheduler |
| `postgres` | saleor-postgres-dev | 5432 | PostgreSQL database |
| `redis` | saleor-redis-dev | 6379 | Redis cache/broker |

### Saleor Apps (11)

| Key | Container | Port | Subdomain | App ID |
|-----|-----------|------|-----------|--------|
| `stripe` | saleor-stripe-app-dev | 3002 | stripe | saleor.app.stripe |
| `smtp` | saleor-smtp-app-dev | 3001 | smtp | saleor.app.smtp |
| `invoices` | saleor-invoice-app-dev | 3003 | invoices | saleor.app.invoices |
| `control` | saleor-storefront-control-app-dev | 3004 | control | saleor.app.storefront-control |
| `newsletter` | saleor-newsletter-app-dev | 3005 | newsletter | saleor.app.newsletter |
| `analytics` | saleor-sales-analytics-app-dev | 3006 | analytics | saleor.app.sales-analytics |
| `bulk` | saleor-bulk-manager-app-dev | 3007 | bulk | saleor.app.bulk-manager |
| `studio` | saleor-image-studio-app-dev | 3008 | studio | saleor.app.image-studio |
| `dropship` | saleor-dropship-app-dev | 3009 | dropship | saleor.app.dropship |
| `tax` | saleor-tax-manager-app-dev | 3010 | tax | saleor.app.tax-manager |

---

## Troubleshooting

### `powershell-yaml` won't install
```powershell
# Try with admin PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Install-Module powershell-yaml -Scope CurrentUser -Force -AllowClobber
```

### Docker not detected
The CLI checks if `docker info` succeeds. If Docker Desktop is installed but not running, use:
```powershell
.\infra\platform.ps1 up   # Auto-starts Docker Desktop if found
```

### Ephemeral tunnel URL not captured
Ephemeral tunnels take 5-30 seconds to assign a URL. If it fails:
```powershell
# Check the tunnel log file (path shown in warning)
# Retry with tunnels-only mode
.\infra\platform.ps1 tunnels
```

### App installation fails with auth error
```powershell
# Verify your credentials work
.\infra\platform.ps1 install-apps -Email admin@example.com -Password yourpass

# Make sure the API is running
.\infra\platform.ps1 status
```

### Backup directory permissions
```powershell
# The CLI creates the directory automatically if it doesn't exist
# Override location if needed
.\infra\platform.ps1 backup -Compress
# Or set SALEOR_BACKUP_DIR in .env
```

### Selfhosted mode: .env not restored after crash
If the platform crashes in selfhosted mode, your dev `.env` may still be swapped:
```powershell
# Manually restore
Copy-Item infra\.env.dev-backup infra\.env
```

### Container logs show errors after restart
```powershell
.\infra\platform.ps1 logs api -Lines 200
.\infra\platform.ps1 logs storefront -Lines 200
```

---

## Common Workflows

### Development Day

```powershell
.\infra\platform.ps1 up -SkipTunnel     # Start containers only
# ... develop ...
.\infra\platform.ps1 restart storefront   # After storefront changes
.\infra\platform.ps1 restart api          # After backend changes
.\infra\platform.ps1 down                 # End of day
```

### Testing Webhooks (Stripe, etc.)

```powershell
.\infra\platform.ps1 up                  # Starts with ephemeral tunnels
# Tunnel URLs are auto-written to .env
# Use the Stripe tunnel URL for Stripe CLI or webhook config
.\infra\platform.ps1 status              # See all URLs
```

### Self-Hosted Production

```powershell
# One-time: generate tunnel config
.\infra\platform.ps1 generate-tunnel-config
# Edit cloudflared-config.yml to set your tunnel UUID

# Daily
.\infra\platform.ps1 up -Mode selfhosted
.\infra\platform.ps1 install-apps         # First time only
.\infra\platform.ps1 status               # Verify everything
```

### Database Operations

```powershell
.\infra\platform.ps1 backup -Compress        # Create backup
.\infra\platform.ps1 status                  # See backup history
.\infra\platform.ps1 restore ~/saleor-backups/saleor-2026-03-12.sql.gz
.\infra\platform.ps1 restart api             # After restore
```

### After GraphQL Schema Changes

```powershell
docker exec saleor-api-dev python manage.py build_schema
.\infra\platform.ps1 codegen                 # Runs in storefront + dashboard
.\infra\platform.ps1 restart storefront
.\infra\platform.ps1 restart dashboard
```
