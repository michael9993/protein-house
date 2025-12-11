# Dashboard Installation Status

## Current Status: Installing Dependencies ⏳

The dashboard is currently installing **1580 npm packages**. This is a one-time process that takes **10-15 minutes**.

## What's Happening

1. ✅ **Container Started** - Dashboard container is running
2. ⏳ **Installing Dependencies** - Currently installing packages (this takes time!)
3. ⏸️ **Waiting for Installation** - Server will start after installation completes
4. ⏸️ **GraphQL Codegen** - Will generate types after install
5. ⏸️ **Vite Dev Server** - Will start on port 5173 after codegen

## How to Monitor Progress

```powershell
# From infra/ directory
docker compose -f docker-compose.dev.yml logs -f saleor-dashboard
```

## What to Look For

### Installation Complete

Look for: `Progress: resolved 1580, reused X, downloaded Y, added 1580`

### Codegen Starting

Look for: `> saleor-dashboard@3.22.18 generate:main /app`

### Server Starting

Look for: `Local: http://localhost:5173` or `VITE vX.X.X ready`

## When Installation Completes

Once you see "Local: http://localhost:5173" in the logs:

1. **Dashboard will be available at**: http://localhost:9000
2. **GraphQL API**: http://localhost:8000/graphql/

## Current Progress

Check current progress:

```powershell
docker compose -f docker-compose.dev.yml logs saleor-dashboard --tail=5
```

Look for the "added X" number - when it reaches 1580, installation is complete!

## Troubleshooting

### ERR_EMPTY_RESPONSE

- **Cause**: Server hasn't started yet (still installing)
- **Solution**: Wait for installation to complete (10-15 minutes)

### Installation Stuck

- Check logs for errors
- Restart: `docker compose -f docker-compose.dev.yml restart saleor-dashboard`

### Want to Speed Up?

- First install always takes time
- Future restarts will be faster (dependencies cached in volume)
