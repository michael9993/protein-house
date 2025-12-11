# How to Identify Tunnel URLs

When you run `tunnel-all.ps1`, cloudflared creates tunnels for all three services, but it can be confusing to know which URL is for which service.

## Quick Answer

**The URLs appear in the order you specified them:**

1. **First URL** = Port 8000 (Saleor API)
2. **Second URL** = Port 9000 (Dashboard)
3. **Third URL** = Port 3002 (Stripe App)

## Better Solution: Use Individual Scripts

For clarity, use the individual tunnel scripts:

```powershell
# Saleor API - you'll see ONE URL clearly labeled
.\infra\scripts\tunnel-api.ps1

# Dashboard - you'll see ONE URL clearly labeled
.\infra\scripts\tunnel-dashboard.ps1

# Stripe App - you'll see ONE URL clearly labeled
.\infra\scripts\tunnel-stripe.ps1
```

## How to Test Which URL is Which

Once you have the URLs, test them:

### Test Saleor API (Port 8000)

```powershell
# Should return GraphQL playground or schema
curl https://your-tunnel-url.trycloudflare.com/graphql/
```

### Test Dashboard (Port 9000)

```powershell
# Should return the dashboard HTML
curl https://your-tunnel-url.trycloudflare.com
```

### Test Stripe App (Port 3002)

```powershell
# Should return JSON manifest
curl https://your-tunnel-url.trycloudflare.com/api/manifest
```

## Alternative: Sequential Script

Use the sequential script that creates tunnels one at a time:

```powershell
.\infra\scripts\tunnel-all-simple.ps1
```

This creates each tunnel separately so you can see which URL belongs to which service.

## Visual Guide

When you see output like this:

```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                         |
|  https://first-url.trycloudflare.com                                                       |
+--------------------------------------------------------------------------------------------+
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                         |
|  https://second-url.trycloudflare.com                                                      |
+--------------------------------------------------------------------------------------------+
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                         |
|  https://third-url.trycloudflare.com                                                       |
+--------------------------------------------------------------------------------------------+
```

**The order matches the ports you specified:**

- First = 8000 (API)
- Second = 9000 (Dashboard)
- Third = 3002 (Stripe App)

## Pro Tip

**Write down the URLs as they appear:**

1. First URL → Saleor API
2. Second URL → Dashboard
3. Third URL → Stripe App

Or use individual scripts to avoid confusion!
