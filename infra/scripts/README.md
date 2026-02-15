# Infrastructure Scripts

## Overview

Collection of PowerShell and Bash scripts for platform management, database operations, tunneling, and environment setup. Located in `infra/scripts/`.

## Quick Start

**Platform Launch:**
```powershell
# Start all Docker containers with health checks
.\infra\scripts\launch-platform.ps1

# Register apps in Dashboard
.\infra\scripts\install-dashboard-apps.ps1
```

**Database Backup/Restore:**
```bash
# Backup to file
./infra/scripts/backup-db.sh > backup-$(date +%Y%m%d).sql

# Restore from backup
./infra/scripts/restore-db.sh backup-20260215.sql
```

**Tunneling (for webhooks):**
```powershell
# All services with labeled tunnels
.\infra\scripts\tunnel-all-labeled.ps1

# Individual service
.\infra\scripts\tunnel-stripe.ps1
```

## Key Features

- **Platform Management** — Automated startup, health checks, app registration
- **Database Utilities** — Backup, restore, migration, multi-database init
- **Cloudflare Tunneling** — Expose local services for external webhooks (Stripe, etc.)
- **Environment Setup** — RSA key generation, OpenID config, Stripe credentials
- **Development Tools** — GraphQL codegen, mode switching, diagnostics

## Script Categories

### Platform Management

| Script | Purpose |
|--------|---------|
| `launch-platform.ps1` | Start all Docker containers with health checks |
| `install-dashboard-apps.ps1` | Register all Saleor apps in the Dashboard |
| `install-bulk-manager-app.ps1` | Register Bulk Manager app separately |

### Database Operations

| Script | Purpose |
|--------|---------|
| `init-dev.sh` | Initialize dev environment with migrations |
| `init-dev-with-postgres.sh` | Initialize with custom Postgres config |
| `init-multiple-databases.sh` | Set up multiple app databases |
| `init-stripe-database.sh` | Initialize Stripe app's Postgres database |
| `wait-for-db-and-migrate.sh` / `.py` | Docker entrypoint: wait for Postgres then migrate |
| `backup-db.sh` | pg_dump backup to file/S3 |
| `restore-db.sh` | Restore from pg_dump backup |

### Tunneling (for External Webhooks)

| Script | Purpose |
|--------|---------|
| `tunnel-all-labeled.ps1` | Named tunnels for all services (recommended) |
| `tunnel-all.ps1` / `.sh` | Start Cloudflare tunnels for all services |
| `tunnel-api.ps1` | API tunnel only |
| `tunnel-stripe.ps1` / `.sh` | Stripe app tunnel |
| `tunnel-dashboard.ps1` | Dashboard tunnel |
| `tunnel-storefront.ps1` | Storefront tunnel |
| `tunnel-smtp.ps1` | SMTP app tunnel |
| `tunnel-invoice.ps1` | Invoice app tunnel |
| `tunnel-bulk-manager.ps1` | Bulk Manager app tunnel |
| `tunnel-image-studio.ps1` | Image Studio app tunnel |

### Setup & Configuration

| Script | Purpose |
|--------|---------|
| `setup-environment.ps1` | Configure environment variables |
| `generate-rsa-key-for-env.ps1` | Generate RSA keys for JWT webhook signing |
| `activate-openid-plugin.ps1` | Enable OpenID Connect auth plugin |
| `add-stripe-credentials.ps1` | Configure Stripe API keys |
| `setup-stripe-env.ps1` | Set up Stripe environment variables |
| `setup-stripe-postgres.ps1` | Set up Stripe database |
| `init-new-store.ps1` / `init-store.mjs` | Initialize a new store channel |

### Utilities

| Script | Purpose |
|--------|---------|
| `deploy-prod.sh` | Production deployment script |
| `run-storefront-codegen.ps1` | GraphQL codegen for storefront |
| `toggle-storefront-mode.ps1` / `.sh` | Toggle storefront between dev/prod modes |
| `stripe-dev-prod.sh` | Switch Stripe between dev/prod modes |
| `compare-files.ps1` | Diff utility for config comparison |
| `full-diagnostic.ps1` | System health diagnostics |

## Development

**Running Scripts:**

```powershell
# PowerShell scripts (Windows)
.\infra\scripts\<script-name>.ps1

# Bash scripts (Linux/macOS or Git Bash on Windows)
./infra/scripts/<script-name>.sh
```

**Prerequisites:**
- Docker Desktop running
- PowerShell 5.1+ (Windows) or Bash (Linux/macOS)
- Cloudflare CLI (`cloudflared`) for tunneling scripts

**Common Workflows:**

```powershell
# First-time setup
.\infra\scripts\setup-environment.ps1
.\infra\scripts\launch-platform.ps1
.\infra\scripts\install-dashboard-apps.ps1

# Daily development
docker compose -f infra/docker-compose.dev.yml up -d
.\infra\scripts\tunnel-stripe.ps1  # If testing webhooks

# Database maintenance
./infra/scripts/backup-db.sh > backups/daily-backup.sql
./infra/scripts/restore-db.sh backups/daily-backup.sql

# Troubleshooting
.\infra\scripts\full-diagnostic.ps1
docker compose -f infra/docker-compose.dev.yml logs -f <container>
```

## Related Docs

- **infra/DEPLOY.md** — Production deployment guide
- **CLAUDE.md** — Docker-first development patterns, container restart rules
- **AGENTS.md** — Detailed command reference, verification workflows
