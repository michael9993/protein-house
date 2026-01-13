# Storefront Build Mode Toggle

This guide explains how to switch between development and production build modes for the storefront.

## Quick Start

### Switch to Production Mode (for speed testing)

**Windows (PowerShell):**
```powershell
cd infra
.\scripts\toggle-storefront-mode.ps1 production
docker compose -f docker-compose.dev.yml restart saleor-storefront
```

**Linux/Mac:**
```bash
cd infra
./scripts/toggle-storefront-mode.sh production
docker compose -f docker-compose.dev.yml restart saleor-storefront
```

### Switch Back to Dev Mode

**Windows (PowerShell):**
```powershell
cd infra
.\scripts\toggle-storefront-mode.ps1 dev
docker compose -f docker-compose.dev.yml restart saleor-storefront
```

**Linux/Mac:**
```bash
cd infra
./scripts/toggle-storefront-mode.sh dev
docker compose -f docker-compose.dev.yml restart saleor-storefront
```

### Toggle Mode (switches between dev/production)

**Windows (PowerShell):**
```powershell
cd infra
.\scripts\toggle-storefront-mode.ps1
docker compose -f docker-compose.dev.yml restart saleor-storefront
```

**Linux/Mac:**
```bash
cd infra
./scripts/toggle-storefront-mode.sh
docker compose -f docker-compose.dev.yml restart saleor-storefront
```

## Manual Method

You can also manually edit `infra/.env` and set:

```env
STOREFRONT_MODE=production  # For production build
STOREFRONT_MODE=dev         # For dev server (default)
```

Then restart the container:
```bash
docker compose -f docker-compose.dev.yml restart saleor-storefront
```

## What's the Difference?

### Dev Mode (`STOREFRONT_MODE=dev`)
- ✅ Hot-reload enabled (instant code changes)
- ✅ Fast startup
- ✅ Better for development
- ❌ Slower runtime performance
- ❌ Larger bundle sizes

### Production Mode (`STOREFRONT_MODE=production`)
- ✅ Optimized build (minified, tree-shaken)
- ✅ Faster runtime performance
- ✅ Smaller bundle sizes
- ✅ Better for speed testing
- ❌ No hot-reload (requires rebuild)
- ❌ Slower initial build

## Notes

- The production build will take longer to start (builds the entire app)
- After switching modes, you need to restart the container
- The build cache is preserved, so subsequent builds are faster
- Production mode uses `next build` + `next start`
- Dev mode uses `next dev` with hot-reload

