# Saleor Platform - Quick Start Guide

## 🚀 Choose Your Setup

### Option 1: Localhost Development (Easiest)

Perfect for development when you don't need external access.

```powershell
# 1. Clear tunnel URLs (if any)
cd infra
# Edit .env and comment out tunnel URLs

# 2. Start services
docker compose -f docker-compose.dev.yml up -d

# 3. Wait for services to be ready (2-3 minutes)

# 4. Access your platform
# API:        http://localhost:8000/graphql/
# Dashboard:  http://localhost:9000
# Storefront: http://localhost:3000
# Stripe App: http://localhost:3002
```

### Option 2: Tunnel Development (For External Access)

Use this when you need to:

- Test webhooks from Stripe
- Access from mobile devices
- Share with others

```powershell
# 1. Start tunnels (keep these terminals open)
# Terminal 1 - API
cloudflared tunnel --url http://localhost:8000

# Terminal 2 - Stripe App
cloudflared tunnel --url http://localhost:3002

# Terminal 3 - Storefront (optional)
cloudflared tunnel --url http://localhost:3000

# 2. Update .env with tunnel URLs
cd infra
# Edit .env and set:
# SALEOR_API_TUNNEL_URL=https://your-api-url.trycloudflare.com
# STRIPE_APP_TUNNEL_URL=https://your-stripe-url.trycloudflare.com

# 3. Restart services
docker compose -f docker-compose.dev.yml restart

# 4. Install Stripe app in Dashboard
# Go to: http://localhost:9000 or your dashboard tunnel
# Apps → Install → Install from manifest → Use your stripe app tunnel URL

# 5. Configure Stripe
# In the installed app, add your Stripe keys
```

## 📝 Configuration Files

### infra/.env

Your main configuration file. Contains:

- Tunnel URLs (when using tunnels)
- Stripe API keys
- Other optional settings

**Template**:

```env
# Tunnel URLs (leave empty for localhost)
SALEOR_API_TUNNEL_URL=https://your-api.trycloudflare.com
STRIPE_APP_TUNNEL_URL=https://your-stripe.trycloudflare.com
STOREFRONT_TUNNEL_URL=https://your-storefront.trycloudflare.com

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_APP_TOKEN=
```

### docker-compose.dev.yml

Service definitions. **No need to edit** - uses `.env` variables.

## 🔧 Helper Scripts

### Update Tunnel URLs

```powershell
cd infra/scripts
.\update-tunnel-urls.ps1
```

Interactive script to update tunnel URLs.

### Verify Configuration

```powershell
cd infra/scripts
.\verify-configuration.ps1
```

Checks that all services are using correct URLs.

## 🎯 Common Tasks

### Switch from Localhost to Tunnel

1. Update `.env` with tunnel URLs
2. Restart services:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart
   ```
3. Reinstall Stripe app in Dashboard

### Switch from Tunnel to Localhost

1. Comment out tunnel URLs in `.env`:
   ```env
   # SALEOR_API_TUNNEL_URL=...
   # STRIPE_APP_TUNNEL_URL=...
   ```
2. Restart services:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart
   ```
3. Reinstall Stripe app in Dashboard

### Update Tunnel URLs (When They Change)

1. Update `.env` with new URLs
2. Restart services:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart
   ```
3. **Important**: Reinstall Stripe app (webhooks need new URLs)

### View Service Logs

```powershell
# All services
docker compose -f infra/docker-compose.dev.yml logs -f

# Specific service
docker compose -f infra/docker-compose.dev.yml logs -f saleor-api
docker compose -f infra/docker-compose.dev.yml logs -f saleor-stripe-app
docker compose -f infra/docker-compose.dev.yml logs -f saleor-dashboard
```

### Restart a Single Service

```powershell
docker compose -f infra/docker-compose.dev.yml restart saleor-api
docker compose -f infra/docker-compose.dev.yml restart saleor-stripe-app
```

### Stop All Services

```powershell
docker compose -f infra/docker-compose.dev.yml down
```

### Start All Services

```powershell
docker compose -f infra/docker-compose.dev.yml up -d
```

## 🐛 Troubleshooting

### Stripe Webhook 401 Errors

**Symptom**: Payment fails with 401 Unauthorized

**Fix**:

1. Ensure `SALEOR_API_TUNNEL_URL` is set in `.env`
2. Restart Saleor API:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart saleor-api
   ```
3. Reinstall Stripe app in Dashboard

### Dashboard Can't Connect to API

**Symptom**: Dashboard shows "Cannot connect to API"

**Fix**:

1. Check `SALEOR_API_TUNNEL_URL` in `.env`
2. Verify tunnel is running:
   ```powershell
   curl https://your-api-url.trycloudflare.com/graphql/
   ```
3. Restart Dashboard:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart saleor-dashboard
   ```

### Stripe App Installation Fails

**Symptom**: "App installation failed"

**Fix**:

1. Ensure `STRIPE_APP_TUNNEL_URL` is set correctly in `.env`
2. Test manifest endpoint:
   ```powershell
   curl https://your-stripe-url.trycloudflare.com/api/manifest
   ```
3. Check Stripe app logs:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app
   ```

### Services Won't Start

**Fix**:

```powershell
# Stop everything
docker compose -f infra/docker-compose.dev.yml down

# Remove volumes (WARNING: deletes database)
docker compose -f infra/docker-compose.dev.yml down -v

# Start fresh
docker compose -f infra/docker-compose.dev.yml up -d
```

## 📚 Documentation

- **Full Configuration Guide**: `UNIFIED-CONFIGURATION-SUMMARY.md`
- **Tunnel Setup Guide**: `infra/README-TUNNEL-SETUP.md`
- **Stripe App Docs**: `docs/STRIPE_EXTENSIONS_INSTALL_FIX.md`

## ✅ Verification Checklist

After setup, verify:

- [ ] All services are running:

  ```powershell
  docker compose -f infra/docker-compose.dev.yml ps
  ```

- [ ] API is accessible:

  ```powershell
  curl http://localhost:8000/graphql/ (or tunnel URL)
  ```

- [ ] Dashboard loads and connects to API

  - Open http://localhost:9000 (or tunnel URL)
  - Should see login screen

- [ ] Stripe app is accessible:

  ```powershell
  curl http://localhost:3002/api/manifest (or tunnel URL)
  ```

- [ ] Environment variables are correct:
  ```powershell
  cd infra/scripts
  .\verify-configuration.ps1
  ```

## 🎉 Success!

Your Saleor platform is ready. Next steps:

1. **Create admin user** (if first time):

   ```powershell
   docker compose -f infra/docker-compose.dev.yml exec saleor-api python manage.py createsuperuser
   ```

2. **Login to Dashboard**: http://localhost:9000 (or tunnel URL)

3. **Install Stripe app**:

   - Go to Apps → Install
   - Install from manifest
   - Use your Stripe app URL

4. **Configure Stripe**:

   - Open installed app
   - Add Stripe API keys
   - Configure payment settings

5. **Test a payment**:
   - Go to Storefront
   - Add product to cart
   - Complete checkout with Stripe

## 💡 Tips

- **Keep tunnels running** in separate terminals when using tunnel mode
- **Reinstall Stripe app** whenever tunnel URLs change
- **Use verification script** to check configuration
- **Check logs** if something doesn't work
- **Switch to localhost** if you don't need external access (faster)

## 🆘 Need Help?

1. Run verification script:

   ```powershell
   cd infra/scripts
   .\verify-configuration.ps1
   ```

2. Check service logs:

   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs -f
   ```

3. Review documentation in repository

4. Check Saleor Discord for community support
