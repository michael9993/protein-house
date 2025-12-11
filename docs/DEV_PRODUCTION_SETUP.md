# Dev Production Mode Setup

This guide explains how to run the Saleor platform in "dev production" mode - a development environment with production-like optimizations and tunneling support.

## Overview

Dev production mode allows you to:

- Run Next.js apps in development mode (hot reload, fast refresh)
- Skip static generation to avoid build errors
- Use production-like optimizations (Turbo mode)
- Create tunnels for external webhook testing

## Fixed Issues

### Html Import Error

The error `<Html> should not be imported outside of pages/_document` was occurring because Next.js was trying to statically generate pages during build. This has been fixed by:

1. **Ensuring dev mode**: The Stripe app now runs in `dev` mode which skips static generation
2. **Environment variables**: `NODE_ENV=development` prevents build-time prerendering
3. **No build step**: Dev mode compiles on-demand, avoiding problematic routes

## Running in Dev Production Mode

### Storefront

```bash
# Standard dev mode
cd storefront
pnpm dev

# Dev production mode (with Turbo)
pnpm dev:prod
```

### Stripe App

The Stripe app automatically runs in dev mode via Docker Compose. No build step is performed, which prevents the Html import error.

```bash
# Start all services (including Stripe app in dev mode)
cd infra
docker-compose -f docker-compose.dev.yml up
```

## Tunneling Setup

To expose your local Stripe app for webhook testing, use one of these tools:

### Option 1: Cloudflared (Recommended - Free, No Signup)

```powershell
# Windows PowerShell
.\infra\scripts\tunnel-stripe.ps1

# Or specify port/tool
.\infra\scripts\tunnel-stripe.ps1 -Port 3002 -Tool cloudflared
```

```bash
# Linux/Mac
./infra/scripts/tunnel-stripe.sh 3002 cloudflared
```

### Option 2: Ngrok (Requires Account)

```powershell
# Windows PowerShell
.\infra\scripts\tunnel-stripe.ps1 -Tool ngrok
```

```bash
# Linux/Mac
./infra/scripts/tunnel-stripe.sh 3002 ngrok
```

### Manual Setup

**Cloudflared:**

```bash
# Install (Windows)
winget install --id Cloudflare.cloudflared -e

# Run tunnel
cloudflared tunnel --url http://localhost:3002
```

**Ngrok:**

```bash
# Install from https://ngrok.com/download
# Then run
ngrok http 3002
```

## Configuration

### Environment Variables

Key environment variables for dev production mode:

- `NODE_ENV=development` - Prevents static generation
- `PORT=3000` - Next.js server port (mapped to 3002 for Stripe app)
- `HOSTNAME=0.0.0.0` - Allows external connections

### Docker Compose

The `docker-compose.dev.yml` is configured to:

- Run Stripe app in dev mode (not build mode)
- Skip static generation
- Enable hot reload
- Preserve build cache for faster restarts

## Troubleshooting

### Still Getting Html Import Error?

1. **Check NODE_ENV**: Ensure it's set to `development`
2. **Verify command**: Make sure you're running `pnpm dev`, not `pnpm build`
3. **Clear cache**: Remove `.next` directory and restart
4. **Check Docker**: Ensure the container is running `dev` command, not `build`

### Tunnel Not Working?

1. **Check port**: Verify the app is running on the expected port (3002 for Stripe)
2. **Firewall**: Ensure your firewall allows the tunnel tool
3. **Tool installation**: Verify cloudflared or ngrok is properly installed

## Next Steps

1. Start services: `docker-compose -f docker-compose.dev.yml up`
2. Start tunnel: `.\infra\scripts\tunnel-stripe.ps1`
3. Update webhook URL: Use the tunnel URL in your Stripe dashboard/webhook configuration
