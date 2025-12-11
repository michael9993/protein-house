# Saleor Platform - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Configure Environment

```powershell
cd infra
.\scripts\setup-environment.ps1
```

**Or manually**:

```powershell
copy .env.example .env
# Edit .env with your Stripe keys
```

### Step 2: Start Services

```powershell
docker compose -f docker-compose.dev.yml up -d
```

### Step 3: Access Services

- **Saleor API**: http://localhost:8000/graphql/
- **Dashboard**: http://localhost:9000
- **Storefront**: http://localhost:3000
- **Stripe App**: http://localhost:3002

## 📋 Required Configuration

### Minimum Required

```env
# In infra/.env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### With Tunnels (For Webhooks)

```env
# In infra/.env
SALEOR_API_TUNNEL_URL=https://your-api.trycloudflare.com
STRIPE_APP_TUNNEL_URL=https://your-stripe.trycloudflare.com
```

## 🔧 Common Commands

### Start Services

```powershell
docker compose -f docker-compose.dev.yml up -d
```

### Stop Services

```powershell
docker compose -f docker-compose.dev.yml down
```

### Restart a Service

```powershell
docker compose -f docker-compose.dev.yml restart saleor-api
```

### View Logs

```powershell
docker compose -f docker-compose.dev.yml logs -f saleor-stripe-app
```

### Check Service Status

```powershell
docker compose -f docker-compose.dev.yml ps
```

## 🌐 Setting Up Tunnels

### Start Tunnels

**Required (for webhooks)**:

```powershell
# Terminal 1: API tunnel
cloudflared tunnel --url localhost:8000

# Terminal 2: Stripe app tunnel
cloudflared tunnel --url localhost:3002
```

**Optional (for external access to frontends)**:

```powershell
# Terminal 3: Dashboard tunnel (optional)
cloudflared tunnel --url localhost:9000

# Terminal 4: Storefront tunnel (optional)
cloudflared tunnel --url localhost:3000
```

### Update Configuration

```powershell
# Add tunnel URLs to infra/.env

# Required for webhooks:
SALEOR_API_TUNNEL_URL=https://abc123.trycloudflare.com
STRIPE_APP_TUNNEL_URL=https://def456.trycloudflare.com

# Optional for external frontend access:
DASHBOARD_TUNNEL_URL=https://ghi789.trycloudflare.com
STOREFRONT_TUNNEL_URL=https://jkl012.trycloudflare.com
```

### Restart Services

```powershell
docker compose -f docker-compose.dev.yml restart saleor-api saleor-stripe-app
```

## 💳 Installing Stripe App

1. Open Dashboard: http://localhost:9000
2. Go to **Apps** → **Install App**
3. Enter manifest URL:
   - Localhost: `http://localhost:3002/api/manifest`
   - Tunnel: `https://your-stripe-app.trycloudflare.com/api/manifest`
4. Copy the app token
5. Add to `infra/.env`: `STRIPE_APP_TOKEN=your-token`
6. Restart: `docker compose -f docker-compose.dev.yml restart saleor-stripe-app`

## 🔍 Troubleshooting

### Webhook 401 Errors

**Problem**: Payment webhooks failing with 401

**Fix**:

1. Set `SALEOR_API_TUNNEL_URL` in `.env`
2. Restart Saleor API
3. Reinstall Stripe app
4. See: `infra/CRITICAL-JWT-FIX.md`

### Can't Connect to API

**Problem**: Dashboard/Storefront can't reach API

**Fix**:

1. Verify `ALLOWED_GRAPHQL_ORIGINS=*` in API
2. Check API is running: `docker compose -f docker-compose.dev.yml ps saleor-api`
3. Test API: `curl http://localhost:8000/graphql/`

### Stripe Payments Not Working

**Problem**: Payments fail or hang

**Fix**:

1. Verify Stripe keys in `.env`
2. Check Stripe webhook secret
3. Use tunnel URLs for external webhooks
4. Check logs: `docker compose -f docker-compose.dev.yml logs -f saleor-stripe-app`

## 📚 Documentation

- **Complete Guide**: `infra/CONFIGURATION.md` (16 pages)
- **JWT Fix**: `infra/CRITICAL-JWT-FIX.md`
- **Summary**: `UNIFIED-CONFIGURATION-SUMMARY.md`
- **Setup Script**: `infra/scripts/setup-environment.ps1`

## 🎯 Environment Variables Quick Reference

| Variable                 | Purpose           | Example                            |
| ------------------------ | ----------------- | ---------------------------------- |
| `SALEOR_API_TUNNEL_URL`  | API public URL    | `https://api.trycloudflare.com`    |
| `STRIPE_APP_TUNNEL_URL`  | Stripe app URL    | `https://stripe.trycloudflare.com` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_test_...`                      |
| `STRIPE_SECRET_KEY`      | Stripe secret     | `sk_test_...`                      |
| `STRIPE_WEBHOOK_SECRET`  | Webhook secret    | `whsec_...`                        |
| `STRIPE_APP_TOKEN`       | App auth token    | (from Dashboard)                   |

**Important**:

- Use **base URLs** (no `/graphql/` for API tunnel)
- Restart services after changing `.env`
- Reinstall apps after changing API URL

## ✨ Features

✅ **Unified Configuration** - One `.env` file for everything  
✅ **No Hardcoded Values** - All secrets in environment  
✅ **Tunnel Support** - Works with Cloudflare, ngrok, etc.  
✅ **Self-Hosted** - No dependency on Saleor Cloud  
✅ **Automated Setup** - Interactive configuration script  
✅ **Complete Docs** - Comprehensive guides included

## 🆘 Getting Help

- **Saleor Discord**: https://saleor.io/discord
- **Saleor Docs**: https://docs.saleor.io/
- **Saleor GitHub**: https://github.com/saleor/saleor

## 🎉 Next Steps

1. ✅ Configure environment (`.env`)
2. ✅ Start services (`docker compose up`)
3. ✅ Install Stripe app (Dashboard)
4. ✅ Test payment (Storefront)
5. ✅ Read full docs (`CONFIGURATION.md`)

---

**Ready to build amazing e-commerce experiences!** 🚀
