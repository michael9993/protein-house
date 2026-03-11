# Self-Hosted Deployment Guide

Deploy the Aura E-Commerce Platform on your own machine using Docker + Cloudflare Tunnel.
Zero monthly cost, full control, production-ready security.

## Architecture

```
Internet -> Cloudflare Edge (SSL + CDN + DDoS protection)
               | (encrypted tunnel, zero-trust)
Your PC (Docker Desktop)
  |-- PostgreSQL + Redis
  |-- Saleor API + Worker + Scheduler
  |-- Storefront (Next.js)
  |-- Dashboard (React SPA)
  |-- 8 Apps (Stripe, SMTP, Invoices, Control, Newsletter, Analytics, Bulk Manager, Image Studio)
```

**Domain:** halacosmetics.org (or your own domain)
**Cost:** $0/month (domain ~$10/year)

---

## Prerequisites

1. **Windows 10/11** with 16GB+ RAM
2. **Docker Desktop** installed and running
3. **cloudflared** CLI: `winget install Cloudflare.cloudflared`
4. **A domain** pointed to Cloudflare nameservers (free plan)

---

## Step 1: Cloudflare Account & Domain Setup

### 1.1 Create Cloudflare Account
1. Go to https://dash.cloudflare.com/sign-up
2. Create a free account

### 1.2 Add Your Domain
1. In Cloudflare Dashboard, click **Add a site**
2. Enter your domain (e.g., `halacosmetics.org`)
3. Select **Free plan**
4. Cloudflare will scan existing DNS records
5. Update your domain registrar's nameservers to the ones Cloudflare provides
6. Wait for DNS propagation (can take up to 24 hours, usually ~30 minutes)

### 1.3 Cloudflare Security Settings
In Cloudflare Dashboard, configure:

| Setting | Location | Value |
|---------|----------|-------|
| SSL mode | SSL/TLS > Overview | **Full (strict)** |
| Always Use HTTPS | SSL/TLS > Edge Certificates | **On** |
| HSTS | SSL/TLS > Edge Certificates | **Enable** (max-age 1 year) |
| Minimum TLS | SSL/TLS > Edge Certificates | **TLS 1.2** |
| Bot Fight Mode | Security > Bots | **On** |
| Browser Integrity Check | Security > Settings | **On** |

---

## Step 2: Create Cloudflare Named Tunnel

### 2.1 Authenticate
```powershell
cloudflared tunnel login
```
This opens a browser to authorize cloudflared with your Cloudflare account.

### 2.2 Create the Tunnel
```powershell
cloudflared tunnel create aura-platform
```
**Save the Tunnel ID** (UUID) from the output. You'll need it in the next step.

The credentials file is auto-created at:
`C:\Users\<username>\.cloudflared\<TUNNEL_ID>.json`

### 2.3 Update Tunnel Config
Edit `infra/cloudflared-config.yml`:
- Replace `<TUNNEL_ID>` in the `credentials-file` path with your actual tunnel ID

### 2.4 Create DNS Records
In Cloudflare Dashboard > DNS > Records, create CNAME records for each subdomain:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | shop | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | api | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | dash | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | stripe | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | smtp | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | invoices | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | control | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | newsletter | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | analytics | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | bulk | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |
| CNAME | studio | `<TUNNEL_ID>.cfargotunnel.com` | Proxied |

Replace `<TUNNEL_ID>` with the UUID from step 2.2.

---

## Step 3: Configure Environment

### 3.1 Update .env.self-hosted
Edit `infra/.env.self-hosted` and fill in:

1. **SECRET_KEY** - Generate a random 50+ character string:
   ```powershell
   python -c "import secrets; print(secrets.token_hex(32))"
   # Or use: openssl rand -hex 32
   ```

2. **RSA_PRIVATE_KEY** - Generate if you don't have one:
   ```powershell
   openssl genrsa 2048
   ```
   Paste the entire PEM key (including BEGIN/END lines, use `\n` for newlines in .env).

3. **Stripe Keys** - From https://dashboard.stripe.com/test/apikeys:
   - `STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - `STRIPE_SECRET_KEY` (starts with `sk_test_`)
   - `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)

4. **SMTP Credentials** - For email sending:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
   - For Gmail: use App Password from https://myaccount.google.com/apppasswords

5. **Google OAuth** (optional):
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - From https://console.cloud.google.com/apis/credentials

6. **SALEOR_APP_TOKEN** - Generate via Saleor Dashboard > Configuration > Service Accounts

### 3.2 Domain Substitution
If using a domain other than `halacosmetics.org`, update these files:
- `infra/.env.self-hosted` - All `*.halacosmetics.org` URLs
- `infra/cloudflared-config.yml` - All hostname entries
- `infra/scripts/launch-self-hosted.ps1` - The `$domain` variable and `$urls` hash

---

## Step 4: Set Up Sentry Error Monitoring (Free)

### 4.1 Create Sentry Account & Project
1. Go to https://sentry.io/signup/ and create a free account
2. Click **Create Project**
3. Select platform: **Next.js**
4. Give it a name (e.g., `aura-storefront`)
5. Click **Create Project**

### 4.2 Get Your DSN
1. After project creation, Sentry shows your DSN
2. Or find it at: **Settings > Projects > [your project] > Client Keys (DSN)**
3. It looks like: `https://abc123@o456789.ingest.us.sentry.io/1234567`

### 4.3 Configure DSN
Add to `infra/.env.self-hosted`:
```env
SENTRY_DSN=https://your-dsn-here@o123456.ingest.us.sentry.io/7890123
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn-here@o123456.ingest.us.sentry.io/7890123
```
Both values should be the same DSN string.

### 4.4 (Optional) Source Maps
For readable stack traces in Sentry:
1. Go to **Settings > Auth Tokens** in Sentry
2. Create a new token with `project:releases` and `org:read` scopes
3. Add to `.env.self-hosted`:
   ```env
   SENTRY_AUTH_TOKEN=sntrys_your_auth_token_here
   ```

### 4.5 Sentry Free Tier Limits
- 5,000 errors/month
- 10,000 performance transactions/month
- 50 session replays/month
- 1 user included

These limits are generous for a beta/early-stage store.

---

## Step 5: Launch

### First Launch
```powershell
.\infra\scripts\launch-self-hosted.ps1
```

This will:
1. Verify Docker Desktop is running
2. Switch to self-hosted environment config
3. Start all Docker containers
4. Wait for health checks (DB, Redis, API)
5. Start Cloudflare named tunnel
6. Print all service URLs
7. Open dashboard and storefront in browser

### First-Time App Registration
After the first launch, you need to register all Saleor apps in the Dashboard:
```powershell
.\infra\scripts\install-dashboard-apps.ps1
```

This registers all 8 apps (Stripe, SMTP, Invoices, Control, Newsletter, Analytics, Bulk Manager, Image Studio) with their tunnel URLs.

---

## Step 6: Daily Operations

### Start Platform
```powershell
.\infra\scripts\launch-self-hosted.ps1
```

### Stop Platform
```powershell
.\infra\scripts\stop-self-hosted.ps1              # Stop tunnel + containers
.\infra\scripts\stop-self-hosted.ps1 -TunnelOnly   # Stop tunnel, keep containers
.\infra\scripts\stop-self-hosted.ps1 -Backup        # Backup DB before stopping
.\infra\scripts\stop-self-hosted.ps1 -RestoreDev    # Restore dev .env after stopping
```

### Check Status
```powershell
.\infra\scripts\status-self-hosted.ps1
```
Shows: container health, tunnel status, CPU/RAM usage, DB size, last backup.

### Restart a Service
```powershell
.\infra\scripts\restart-service.ps1 storefront     # Restart storefront only
.\infra\scripts\restart-service.ps1 api            # Restart Saleor API
.\infra\scripts\restart-service.ps1 all            # Restart everything
.\infra\scripts\restart-service.ps1 apps           # Restart all 8 apps
.\infra\scripts\restart-service.ps1 tunnel         # Restart Cloudflare tunnel
```

### Manual Backup
```powershell
.\infra\scripts\backup-self-hosted.ps1                    # Basic backup
.\infra\scripts\backup-self-hosted.ps1 -Compress          # Compressed backup
.\infra\scripts\backup-self-hosted.ps1 -Retain 60         # Keep 60 days
```

Backups are saved to `C:\Users\micha\saleor-backups\`.

---

## Step 7: Automated Backups (Task Scheduler)

### Create Scheduled Task
1. Open **Task Scheduler** (search in Start menu)
2. Click **Create Task** (not "Create Basic Task")
3. Configure:

| Tab | Setting | Value |
|-----|---------|-------|
| General | Name | `Saleor Daily Backup` |
| General | Run whether user is logged on or not | Check |
| Triggers | New > Daily | 2:00 AM |
| Actions | New > Start a program | `powershell.exe` |
| Actions | Arguments | `-File "C:\Users\micha\saleor-platform\infra\scripts\backup-self-hosted.ps1" -Compress -Quiet` |
| Conditions | Start only if on AC power | Check |
| Settings | If task fails, restart every | 30 minutes, up to 3 times |

---

## Step 8: Windows Configuration

### Prevent Sleep
Settings > System > Power & Sleep:
- Screen: 15 minutes
- Sleep: **Never** (when plugged in)

### Auto-Start Docker Desktop
Docker Desktop > Settings > General:
- Check **Start Docker Desktop when you sign in**

### Auto-Start Tunnel on Login (Optional)
Create a scheduled task:
- Trigger: **At log on**
- Action: `cloudflared tunnel --config C:\Users\micha\saleor-platform\infra\cloudflared-config.yml run`

### Windows Update Hours
Settings > Windows Update > Active Hours:
- Set to 8:00 AM - 2:00 AM (to prevent restarts during the night)

---

## Service URLs

| Service | URL |
|---------|-----|
| Storefront | https://shop.halacosmetics.org |
| Dashboard | https://dash.halacosmetics.org |
| GraphQL API | https://api.halacosmetics.org/graphql/ |
| Stripe App | https://stripe.halacosmetics.org |
| SMTP App | https://smtp.halacosmetics.org |
| Invoice App | https://invoices.halacosmetics.org |
| Control App | https://control.halacosmetics.org |
| Newsletter App | https://newsletter.halacosmetics.org |
| Analytics App | https://analytics.halacosmetics.org |
| Bulk Manager App | https://bulk.halacosmetics.org |
| Image Studio App | https://studio.halacosmetics.org |
| Dropship App | https://dropship.halacosmetics.org |
| Tax Manager App | https://tax.halacosmetics.org |

---

## Troubleshooting

### Tunnel won't start
```powershell
# Check if cloudflared is installed
cloudflared --version

# Test tunnel manually
cloudflared tunnel --config infra/cloudflared-config.yml run

# Check credentials file exists
ls $HOME\.cloudflared\
```

### Container keeps restarting
```powershell
# Check logs for the failing container
docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-api-dev
docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-storefront-dev
```

### Apps return 401 SIGNATURE_VERIFICATION_FAILED
This means the API's `PUBLIC_URL` doesn't match the URL apps use for webhook verification.
- Verify `SALEOR_API_TUNNEL_URL` in `.env.self-hosted` matches `api.halacosmetics.org`
- Verify `RSA_PRIVATE_KEY` is set (both API and Worker must use the same key)
- Restart API + Worker: `.\infra\scripts\restart-service.ps1 api`

### Storefront shows blank page
```powershell
# Check if the container is running
docker ps | grep storefront

# Check for build errors
docker compose -f infra/docker-compose.dev.yml logs --tail=100 saleor-storefront-dev

# Verify GraphQL connectivity
docker exec saleor-storefront-dev wget -qO- http://saleor-api:8000/graphql/ --post-data='{"query":"{shop{name}}"}' --header='Content-Type: application/json'
```

### Database backup is empty or small
```powershell
# Check if PostgreSQL is healthy
docker exec saleor-postgres-dev pg_isready -U saleor

# Run manual dump to check
docker exec saleor-postgres-dev pg_dump -U saleor saleor | wc -l
```

### Switching back to development mode
```powershell
.\infra\scripts\stop-self-hosted.ps1 -RestoreDev
# This restores infra/.env from .env.dev-backup
```

---

## Migrating to VPS

When you're ready for proper hosting:

1. **Choose a VPS** — Hetzner ($5/mo), DigitalOcean ($12/mo), or AWS Lightsail ($10/mo)
2. **Install Docker** on the VPS
3. **Copy your project** (or git clone)
4. **Restore database backup:**
   ```bash
   cat backup.sql | docker exec -i saleor-postgres-dev psql -U saleor saleor
   ```
5. **Update DNS** — Point CNAME records to the VPS IP instead of the tunnel
6. **Set up nginx + certbot** — Use the existing `infra/nginx.conf` as a starting point
7. **Start containers:** `docker compose -f infra/docker-compose.dev.yml up -d`

Migration effort: ~2-3 hours.

---

## File Reference

| File | Purpose |
|------|---------|
| `infra/.env.self-hosted` | Self-hosted environment variables (secrets, URLs) |
| `infra/.env.dev-backup` | Backup of dev .env (auto-created by launch script) |
| `infra/cloudflared-config.yml` | Cloudflare tunnel routing config |
| `infra/scripts/launch-self-hosted.ps1` | Start everything (Docker + tunnel) |
| `infra/scripts/stop-self-hosted.ps1` | Stop everything gracefully |
| `infra/scripts/status-self-hosted.ps1` | Health check dashboard |
| `infra/scripts/restart-service.ps1` | Restart individual services |
| `infra/scripts/backup-self-hosted.ps1` | Database backup with rotation |
| `infra/scripts/install-dashboard-apps.ps1` | Register all apps in Dashboard |
