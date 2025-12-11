# Saleor Platform - Infrastructure

This directory contains Docker Compose configuration and setup scripts for running the Saleor platform in development mode.

## Quick Start

### Option 1: Local Development (Localhost URLs)

```powershell
# 1. Setup environment (choose localhost option)
.\setup-tunnel-urls.ps1

# 2. Start all services
docker compose -f docker-compose.dev.yml up -d

# 3. Access services
# - Saleor API: http://localhost:8000/graphql/
# - Dashboard: http://localhost:9000
# - Storefront: http://localhost:3000
# - Stripe App: http://localhost:3002
```

### Option 2: With Tunnels (External Access)

```powershell
# 1. Start tunnel services (in separate terminals)
cloudflared tunnel --url http://localhost:8000  # API
cloudflared tunnel --url http://localhost:9000  # Dashboard
cloudflared tunnel --url http://localhost:3000  # Storefront
cloudflared tunnel --url http://localhost:3002  # Stripe App

# 2. Setup environment with tunnel URLs
.\setup-tunnel-urls.ps1  # Choose tunnel option, enter URLs

# 3. Start all services
docker compose -f docker-compose.dev.yml up -d

# 4. Access via tunnel URLs (from .env)
```

## Directory Structure

```
infra/
├── docker-compose.dev.yml     # Main Docker Compose configuration
├── docker-compose.prod.yml    # Production configuration (optional)
├── .env.example               # Environment variable template
├── .env                       # Your environment variables (create this)
├── setup-tunnel-urls.ps1      # Interactive setup wizard
├── nginx.conf                 # Nginx configuration (if needed)
├── scripts/
│   ├── sync-tunnel-urls.ps1   # Sync URLs and restart services
│   └── init-stripe-database.sh # Initialize Stripe app database
└── README.md                  # This file
```

## Scripts

### `setup-tunnel-urls.ps1`

**Purpose:** First-time configuration wizard

**Usage:**
```powershell
.\setup-tunnel-urls.ps1
```

**What it does:**
- Prompts for URL configuration (localhost or tunnel)
- Creates `.env` file with your URLs
- Optionally configures Stripe API keys

### `scripts/sync-tunnel-urls.ps1`

**Purpose:** Apply URL changes to running services

**Usage:**
```powershell
.\scripts\sync-tunnel-urls.ps1
```

**What it does:**
- Loads URLs from `.env`
- Restarts affected services
- Verifies URLs in containers
- Tests Stripe app manifest

**When to run:**
- After changing tunnel URLs
- After editing `.env` file
- When URLs are not updating

## Configuration Files

### `.env` (You create this)

Contains all your environment variables. Create from `.env.example`:

```powershell
copy .env.example .env
# Edit .env with your values
```

**Key variables:**
- `SALEOR_API_URL` - GraphQL API endpoint
- `PUBLIC_URL` - JWT issuer URL (CRITICAL for tunnels)
- `STRIPE_APP_URL` - Stripe app URL (CRITICAL for webhooks)
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key

### `.env.example`

Template with all available variables and documentation.

### `docker-compose.dev.yml`

Main Docker Compose configuration. Uses variables from `.env`.

**DO NOT hardcode URLs in this file!** Always use environment variables.

## Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis cache |
| `saleor-api` | 8000 | Saleor GraphQL API |
| `saleor-worker` | - | Celery background worker |
| `saleor-scheduler` | - | Celery beat scheduler |
| `saleor-dashboard` | 9000 | Admin interface |
| `saleor-storefront` | 3000 | Customer storefront |
| `saleor-stripe-app` | 3002 | Stripe payment app |

## Common Commands

### Start all services
```powershell
docker compose -f docker-compose.dev.yml up -d
```

### Stop all services
```powershell
docker compose -f docker-compose.dev.yml down
```

### Restart specific service
```powershell
docker compose -f docker-compose.dev.yml restart saleor-api
```

### View logs
```powershell
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f saleor-stripe-app
```

### Execute command in container
```powershell
# Open shell in Saleor API
docker compose -f docker-compose.dev.yml exec saleor-api bash

# Run Django management command
docker compose -f docker-compose.dev.yml exec saleor-api python manage.py migrate
```

### Check service status
```powershell
docker compose -f docker-compose.dev.yml ps
```

### Rebuild and restart
```powershell
docker compose -f docker-compose.dev.yml up -d --force-recreate --build
```

## Troubleshooting

### Services won't start

```powershell
# Check logs
docker compose -f docker-compose.dev.yml logs

# Check if ports are already in use
netstat -ano | findstr "8000 9000 3000 3002"

# Reset everything
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### Stripe app not working

```powershell
# Verify URLs
.\scripts\sync-tunnel-urls.ps1

# Check Stripe app logs
docker compose -f docker-compose.dev.yml logs -f saleor-stripe-app

# Verify database
docker compose -f docker-compose.dev.yml exec postgres psql -U saleor -d stripe_app -c "\dt"
```

### URL changes not applying

```powershell
# Force recreation of containers
docker compose -f docker-compose.dev.yml up -d --force-recreate

# Verify environment in container
docker compose -f docker-compose.dev.yml exec saleor-stripe-app printenv | grep URL
```

### Database errors

```powershell
# Check PostgreSQL status
docker compose -f docker-compose.dev.yml ps postgres

# Connect to database
docker compose -f docker-compose.dev.yml exec postgres psql -U saleor

# View Saleor API logs
docker compose -f docker-compose.dev.yml logs saleor-api
```

## Development Workflow

### Making Code Changes

The services use volume mounts for hot-reload:

**Saleor API:**
- Edit files in `../saleor/saleor/`
- Changes reload automatically (uvicorn --reload)

**Dashboard:**
- Edit files in `../dashboard/`
- Vite dev server hot-reloads

**Storefront:**
- Edit files in `../storefront/`
- Next.js hot-reloads

**Stripe App:**
- Edit files in `../apps/apps/stripe/`
- Next.js dev mode hot-reloads

### Changing URLs

1. Edit `.env` file with new URLs
2. Run: `.\scripts\sync-tunnel-urls.ps1`
3. Reinstall Stripe app in Dashboard (if applicable)

### Adding Environment Variables

1. Add variable to `.env.example` with documentation
2. Use variable in `docker-compose.dev.yml`:
   ```yaml
   environment:
     MY_NEW_VAR: ${MY_NEW_VAR:-default_value}
   ```
3. Add value to your `.env` file
4. Restart services

## Best Practices

1. ✅ **Always use `.env` file** for configuration
2. ✅ **Never commit `.env`** (it's in `.gitignore`)
3. ✅ **Keep `.env.example` updated** with new variables
4. ✅ **Use `localhost` URLs** for local development
5. ✅ **Use tunnel URLs** only when needed for external access
6. ✅ **Restart services** after changing URLs
7. ✅ **Check logs** when debugging issues

## Documentation

- [URL Configuration Guide](../docs/URL_CONFIGURATION.md) - Complete URL setup guide
- [Stripe App Setup](../docs/STRIPE_EXTENSIONS_INSTALL_FIX.md) - Stripe app installation
- [Docker Compose Reference](https://docs.docker.com/compose/) - Official Docker Compose docs

## Support

For issues:
1. Check logs: `docker compose -f docker-compose.dev.yml logs -f`
2. Review [URL Configuration Guide](../docs/URL_CONFIGURATION.md)
3. Try: `.\scripts\sync-tunnel-urls.ps1`
4. Restart services: `docker compose -f docker-compose.dev.yml restart`

