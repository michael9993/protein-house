# Infrastructure Scripts

## Overview

Platform management is handled by the **unified CLI** (`infra/platform.ps1`), which replaced the previous collection of individual scripts. The legacy scripts have been deleted.

## Quick Start

```powershell
# First-time setup
.\infra\platform.ps1 init

# Start platform (Docker + tunnels)
.\infra\platform.ps1 up

# Check health of all services
.\infra\platform.ps1 status

# Install/reinstall Saleor apps in Dashboard
.\infra\platform.ps1 install-apps

# Stop everything
.\infra\platform.ps1 down
```

## Platform CLI Commands

| Command | Description | Replaces |
|---------|-------------|----------|
| `platform.ps1 status` | Health dashboard (containers, tunnel, DB, backups) | `status-self-hosted.ps1` |
| `platform.ps1 up` | Start platform (Docker + tunnels) | `launch-platform.ps1`, `launch-self-hosted.ps1` |
| `platform.ps1 up -Mode selfhosted` | Self-hosted launch with named tunnels | `launch-self-hosted.ps1` |
| `platform.ps1 down` | Stop tunnel + containers | `stop-self-hosted.ps1` |
| `platform.ps1 restart <service>` | Restart a service | `restart-service.ps1` |
| `platform.ps1 backup` | Database backup with rotation | `backup-self-hosted.ps1` |
| `platform.ps1 restore <file>` | Restore database from backup | N/A |
| `platform.ps1 install-apps` | Register all Saleor apps | `install-dashboard-apps.ps1` |
| `platform.ps1 tunnels` | Start tunnels only | `launch-platform.ps1` |
| `platform.ps1 codegen` | Run GraphQL codegen | `run-storefront-codegen.ps1` |
| `platform.ps1 logs <service>` | Tail container logs | N/A |
| `platform.ps1 init` | First-time environment setup | `setup-environment.ps1` |
| `platform.ps1 generate-tunnel-config` | Generate cloudflared-config.yml | N/A |

## Options

```
-Mode dev|selfhosted    Dev = ephemeral tunnels, selfhosted = named tunnels (default: dev)
-Domain <domain>        Override domain (default: from platform.yml / PLATFORM_DOMAIN env var)
-SkipTunnel             Don't start tunnels
-SkipDocker             Assume containers already running
-NoBrowser              Don't open browser after launch
-Compress               Compress database backup (gzip)
-Retain <n>             Number of backups to keep (default: 30)
-Quiet                  Suppress output (for scheduled tasks)
-Lines <n>              Number of log lines to show (default: 100)
```

## Configuration

All service definitions are in **`infra/platform.yml`** — the single source of truth for:
- Service ports, containers, and compose service names
- Tunnel subdomains and env var names
- Saleor app IDs and manifest paths
- Backup settings

Environment variables in `infra/.env`:
- `PLATFORM_DOMAIN` — override domain (default: from platform.yml)
- `SALEOR_BACKUP_DIR` — override backup directory (default: ~/saleor-backups)

## Architecture

```
infra/
├── platform.ps1              # Unified CLI entry point
├── platform.yml              # Service registry (source of truth)
├── lib/                      # PowerShell modules
│   ├── Config.ps1            # YAML config loader
│   ├── Display.ps1           # Formatted output helpers
│   ├── Docker.ps1            # Container lifecycle management
│   ├── Health.ps1            # Health checks and URL reachability
│   ├── Tunnels.ps1           # Cloudflare tunnel management
│   ├── EnvManager.ps1        # .env file read/write/propagation
│   ├── Apps.ps1              # Saleor app installation via GraphQL
│   └── Backup.ps1            # Database backup/restore/rotation
├── docker-compose.dev.yml    # Docker services orchestration
├── cloudflared-config.yml    # Cloudflare tunnel routing (auto-generated)
├── .env                      # Active environment variables
├── .env.self-hosted          # Self-hosted environment (secrets, domain URLs)
└── env-template.txt          # Environment variable template
```

## Legacy Scripts (Removed)

The following legacy scripts were deleted after the `platform.ps1` migration was complete:

| Deleted Script | Replaced By |
|----------------|-------------|
| `launch-platform.ps1` | `platform.ps1 up` |
| `launch-self-hosted.ps1` | `platform.ps1 up -Mode selfhosted` |
| `status-self-hosted.ps1` | `platform.ps1 status` |
| `stop-self-hosted.ps1` | `platform.ps1 down` |
| `backup-self-hosted.ps1` | `platform.ps1 backup` |
| `restart-service.ps1` | `platform.ps1 restart <service>` |
| `install-dashboard-apps.ps1` | `platform.ps1 install-apps` |
| `run-storefront-codegen.ps1` | `platform.ps1 codegen` |
| `setup-environment.ps1` | `platform.ps1 init` |

## Docker Entrypoint Scripts (Not Deprecated)

These bash scripts are used as Docker entrypoints and remain active:

| Script | Purpose |
|--------|---------|
| `init-dev.sh` | Docker entrypoint: initialize dev environment |
| `init-dev-with-postgres.sh` | Docker entrypoint: init with custom Postgres |
| `init-multiple-databases.sh` | Docker entrypoint: multi-database setup |
| `init-stripe-database.sh` | Docker entrypoint: Stripe app database |
| `wait-for-db-and-migrate.sh` / `.py` | Docker entrypoint: wait for DB then migrate |
| `backup-db.sh` / `restore-db.sh` | Linux production backup/restore |
| `deploy-prod.sh` | Linux production deployment |
| `toggle-storefront-mode.ps1` / `.sh` | Toggle storefront dev/prod mode |

## Related Docs

- **infra/SELF-HOSTED.md** — Self-hosted deployment guide
- **infra/platform.yml** — Service registry
- **CLAUDE.md** — Docker-first development patterns
- **AGENTS.md** — Agent guidelines and commands
