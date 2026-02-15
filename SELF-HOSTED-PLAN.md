# Self-Hosted Production Plan — Aura E-Commerce Platform

## Context

The platform is feature-complete (8 apps, 64 config hooks, full checkout, multi-channel). An 8-phase codebase cleanup removed 613K lines of dead code. The goal now is to **self-host on your Windows PC for the first few weeks** for beta testing, demos, and early customers — at $0/month — then migrate to a VPS when ready.

**Key discovery:** Your existing `launch-platform.ps1` already creates Cloudflare tunnels for all 11 services and auto-injects URLs into `.env`. The tunnel infrastructure is 95% production-ready. This plan covers the remaining 5% plus all storefront code fixes.

**Architecture:**
```
Internet → Cloudflare Edge (SSL + CDN + DDoS protection)
              ↓ (encrypted tunnel, zero-trust)
Your Windows PC (Docker Desktop)
  ├── PostgreSQL + Redis (data stores)
  ├── Saleor API + Worker + Scheduler (Python backend)
  ├── Storefront (Next.js SSR)
  ├── Dashboard (React SPA)
  └── 7 Apps (Stripe, SMTP, Invoices, Control, Newsletter, Analytics, Bulk Manager)
```

**Cost: $0/month** (+ ~$10/year for a domain, optional)

---

## Phase 1: Storefront Code Fixes (Before Deployment)

All code changes that must be made before deploying.

### 1.1 Fix Hardcoded `lang="en"` in Root Layout
- **File:** `storefront/src/app/layout.tsx` line 81
- **Current:** `<html lang="en" className="min-h-dvh">`
- **Problem:** Hebrew channel users get `lang="en"`, hurting SEO + screen readers
- **Fix:** Make `lang` dynamic. Since root layout can't access `[channel]` param, use a client component wrapper or move `lang`/`dir` to `storefront/src/app/[channel]/layout.tsx` where channel is available. Map channel → locale (`default-channel` → `he`, `usd` → `en`).

### 1.2 Remove `unoptimized={true}` from 9 Image Components
- **Problem:** These override `next.config.js` global setting and disable WebP/AVIF conversion + resizing in production
- **Files to fix:**
  - `storefront/src/components/home/BrandGrid.tsx`
  - `storefront/src/app/[channel]/(main)/account/wishlist/WishlistClient.tsx`
  - `storefront/src/ui/components/Logo.tsx`
  - `storefront/src/components/home/Testimonials.tsx`
  - `storefront/src/app/[channel]/checkout/CheckoutPageClient.tsx`
  - `storefront/src/app/[channel]/(main)/track-order/TrackOrderClient.tsx`
  - `storefront/src/app/[channel]/(main)/contact/ContactPage.tsx`
  - `storefront/src/ui/components/FooterClient.tsx`
  - `storefront/src/ui/atoms/ProductImageWrapper.tsx`
- **Action:** Remove `unoptimized={true}` prop from each. Ensure each `<Image>` has explicit `width`/`height`.

### 1.3 Restrict Image Remote Patterns
- **File:** `storefront/next.config.js` lines 27-29
- **Current:** `remotePatterns: [{ hostname: "*" }]` — allows any domain
- **Fix:** Restrict to known domains:
  ```js
  remotePatterns: [
    { hostname: "localhost" },
    { hostname: "saleor-api" },
    { hostname: "*.yourdomain.com" },
    { hostname: "*.saleor.cloud" },
  ]
  ```

### 1.4 Fix ESLint Build Config (Inverted Logic)
- **File:** `storefront/next.config.js` line 48
- **Current:** `ignoreDuringBuilds: process.env.NODE_ENV === "production"` — ignores lint in PRODUCTION (wrong)
- **Fix:** Remove this line entirely. Lint errors should fail CI, not be silenced.

### 1.5 Clean Up Remaining Console Logs (~50 calls)
- **Previous cleanup removed 82 but ~50 remain in:**
  - `storefront/src/app/actions.ts` — 23 calls (reviews debugging)
  - `storefront/src/app/page.tsx` — 14 calls (redirect logic debugging)
  - `storefront/src/app/cart-actions.ts` — 5 calls
  - `storefront/src/app/api/webhooks/auto-confirm-oauth/route.ts` — 8 calls
  - `storefront/src/app/error.tsx` — 1 call (keep as console.error)
  - `storefront/src/app/[channel]/(main)/error.tsx` — 1 call (keep as console.error)
- **Action:** Remove all `console.log` and `console.warn`. Keep only `console.error` in error boundaries.

### 1.6 Add Hreflang Tags for Multi-Channel SEO
- **Where:** `storefront/src/app/[channel]/layout.tsx` metadata
- **Action:** Add `alternates.languages` to Next.js metadata:
  ```ts
  alternates: {
    languages: {
      'he': '/default-channel/...',
      'en': '/usd/...',
    }
  }
  ```
- Also update `storefront/src/app/sitemap.ts` to include alternates per URL.

### 1.7 Tighten robots.txt
- **File:** `storefront/src/app/robots.ts`
- **Current:** Allows crawling everything (`allow: "/"`)
- **Fix:** Add disallow rules:
  ```ts
  disallow: ["/api/", "/checkout/", "/account/", "/cart"]
  ```

### 1.8 Add Skip-to-Content Link (Accessibility)
- **File:** `storefront/src/app/layout.tsx`
- **Action:** Add `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>` as first child of `<body>`.

### 1.9 Enable Standalone Output for Docker
- **File:** `storefront/next.config.js`
- **Action:** Set `output: "standalone"` (currently conditional via env var). For Docker production builds, this is required for efficient image size.

**Commit:** `fix: storefront production readiness (lang, images, SEO, console cleanup)`

---

## Phase 2: Self-Hosted Infrastructure (Cloudflare Tunnel)

### What Already Works (95% done)

Your `infra/scripts/launch-platform.ps1` (470 lines) already:
- Creates Cloudflare tunnels for all 11 services automatically
- Captures tunnel URLs from cloudflared output
- Writes them to `infra/.env` as env vars (`SALEOR_API_TUNNEL_URL`, `STOREFRONT_TUNNEL_URL`, etc.)
- Updates dashboard `vite.config.js` with tunnel domain
- Has manual URL fallback if auto-capture fails

Your `storefront/src/lib/graphql.ts` already:
- Uses Docker internal URL (`http://saleor-api:8000/graphql/`) for server-side rendering (fast, no tunnel hop)
- Uses tunnel URL (`NEXT_PUBLIC_SALEOR_API_URL`) for browser/client requests
- Has 4-retry exponential backoff for flaky connections

Your `docker-compose.dev.yml` already:
- Uses cascading env vars: `${SALEOR_API_TUNNEL_URL:-${PUBLIC_URL:-http://localhost:8000}}`
- All apps use tunnel URLs for registration when available

### 2.1 Cloudflare Free Tier Limits (What You Need to Know)

| Resource | Free Tier Limit | Your Usage | Risk |
|----------|----------------|------------|------|
| Quick Tunnels (ephemeral) | Unlimited | 11 tunnels | None |
| Named Tunnels | Unlimited | 0 (upgrade later) | None |
| Bandwidth | Unlimited (no cap) | Low for beta | None |
| Requests | Unlimited | Low for beta | None |
| DNS records | 100 per zone | 5-6 needed | None |
| SSL certificates | Unlimited (auto) | 1 wildcard | None |
| Tunnel connections | 4 per tunnel | 1 per service | None |
| Websocket support | Yes | Needed for HMR/live updates | None |
| Max upload size | 100MB (free plan) | Product images < 10MB | None |
| **Tunnel timeout** | **100 seconds** | GraphQL queries | **Low risk** — most queries < 10s |
| **Rate limiting** | Not included free | DDoS protection only | **None for beta** |
| **Caching** | Basic (respects headers) | Next.js sets proper Cache-Control | None |
| **Analytics** | Basic (24h retention) | Sufficient for beta | None |

**Key limitation:** Ephemeral tunnel URLs change every time you restart cloudflared. For beta testing this is fine (just share new URLs). For a real domain, upgrade to Named Tunnels (still free) in Phase 2.3.

### 2.2 Quick Start Mode (Ephemeral Tunnels — Day 1)

No changes needed. Just run what you already have:

```powershell
# 1. Start Docker Desktop
# 2. Start all containers
docker compose -f infra/docker-compose.dev.yml up -d
# 3. Start tunnels (existing script)
.\infra\scripts\launch-platform.ps1
# 4. Wait 2-3 minutes for all 11 tunnel URLs
# 5. Register apps in Dashboard using tunnel URLs
# 6. Share storefront URL with testers
```

**Pros:** Zero setup, works immediately, you're already doing this.
**Cons:** URLs change on restart, must re-register apps each time.

### 2.3 Named Tunnel Mode (Stable URLs — Week 1)

Create a Cloudflare Named Tunnel with your own domain for stable URLs that survive restarts.

**Step 1: Buy domain** (~$10/year from Cloudflare Registrar, Namecheap, or Porkbun)

**Step 2: Add domain to Cloudflare** (free plan, point nameservers)

**Step 3: Create named tunnel:**
```powershell
cloudflared tunnel login                    # One-time browser auth
cloudflared tunnel create aura-platform     # Creates tunnel + credentials
```

**Step 4: Create** `infra/cloudflared-config.yml`:
```yaml
tunnel: aura-platform
credentials-file: C:\Users\micha\.cloudflared\<tunnel-id>.json

ingress:
  - hostname: shop.yourdomain.com
    service: http://localhost:3000
  - hostname: api.yourdomain.com
    service: http://localhost:8000
  - hostname: dashboard.yourdomain.com
    service: http://localhost:9000
  - hostname: stripe.yourdomain.com
    service: http://localhost:3002
  - hostname: smtp.yourdomain.com
    service: http://localhost:3001
  - hostname: invoices.yourdomain.com
    service: http://localhost:3003
  - hostname: control.yourdomain.com
    service: http://localhost:3004
  - hostname: newsletter.yourdomain.com
    service: http://localhost:3005
  - hostname: analytics.yourdomain.com
    service: http://localhost:3006
  - hostname: bulk.yourdomain.com
    service: http://localhost:3007
  - hostname: studio.yourdomain.com
    service: http://localhost:3008
  - service: http_status:404
```

**Step 5: Create DNS CNAME records** (Cloudflare dashboard):
```
CNAME  shop        → <tunnel-id>.cfargotunnel.com  (proxied)
CNAME  api         → <tunnel-id>.cfargotunnel.com  (proxied)
CNAME  dashboard   → <tunnel-id>.cfargotunnel.com  (proxied)
... (one per subdomain)
```

**Step 6: Create** `infra/.env.self-hosted` with stable URLs:
```bash
# Stable tunnel URLs (don't change on restart)
SALEOR_API_TUNNEL_URL=https://api.yourdomain.com
NEXT_PUBLIC_SALEOR_API_URL=https://api.yourdomain.com/graphql/
NEXT_PUBLIC_STOREFRONT_URL=https://shop.yourdomain.com
DASHBOARD_URL=https://dashboard.yourdomain.com
STOREFRONT_TUNNEL_URL=https://shop.yourdomain.com

# App URLs (for registration + webhooks)
STRIPE_APP_URL=https://stripe.yourdomain.com
SMTP_APP_URL=https://smtp.yourdomain.com
INVOICES_APP_URL=https://invoices.yourdomain.com
STOREFRONT_CONTROL_APP_URL=https://control.yourdomain.com
NEWSLETTER_APP_URL=https://newsletter.yourdomain.com
ANALYTICS_APP_URL=https://analytics.yourdomain.com
BULK_MANAGER_APP_URL=https://bulk.yourdomain.com
IMAGE_STUDIO_APP_URL=https://studio.yourdomain.com

# Security (same as prod)
DEBUG=False
SECRET_KEY=<generate-50-char-random-string>
ALLOWED_HOSTS=api.yourdomain.com,localhost,saleor-api
ALLOWED_GRAPHQL_ORIGINS=https://shop.yourdomain.com,https://dashboard.yourdomain.com
GRAPHQL_PLAYGROUND_ENABLED=False
```

**Step 7: Create** `infra/scripts/launch-self-hosted.ps1`:
```powershell
# 1. Verify Docker Desktop is running
# 2. Start containers: docker compose -f infra/docker-compose.dev.yml --env-file infra/.env.self-hosted up -d
# 3. Start named tunnel: cloudflared tunnel --config infra/cloudflared-config.yml run
# 4. Print all URLs
# 5. Open dashboard in browser
```

**Result:** `https://shop.yourdomain.com` works permanently. Restart PC → restart script → same URLs, apps stay registered.

### 2.4 Nginx: NOT Needed for Self-Hosting

The existing `infra/nginx.conf` is designed for VPS deployment (Linux host with certbot SSL). With Cloudflare Tunnel:
- SSL is handled by Cloudflare automatically
- Routing is handled by the tunnel config (hostname → localhost:port)
- Security headers are set via Cloudflare dashboard
- Rate limiting available via Cloudflare (free tier has basic DDoS protection)

**No nginx needed. No changes to nginx.conf.** Keep it for future VPS migration.

### 2.5 Windows-Specific Considerations

| Concern | Solution |
|---------|----------|
| Windows Updates auto-restart | Settings → Windows Update → Active Hours (set 8AM-2AM) + pause updates during critical periods |
| Sleep mode | Settings → Power → Never sleep when plugged in |
| Docker Desktop auto-start | Settings → General → Start Docker Desktop when you sign in |
| Cloudflared auto-start | Create Windows Task Scheduler task to run tunnel on login |
| Power outage | UPS battery backup ($50-100 one-time) for 15-30 min protection |
| PC fan noise 24/7 | Docker idle uses < 5% CPU — fans should be quiet |
| Electricity cost | ~50-100W idle = ~$5-15/month depending on local rates |

**Commit:** `infra: add self-hosted tunnel config, env template, launch script`

---

## Phase 3: Security for Self-Hosting

### 3.1 Environment Variables (No Code Changes — Just Config)

| Setting | Dev Value | Self-Hosted Value | Why |
|---------|-----------|-------------------|-----|
| `DEBUG` | `True` | `False` | Hides error details from users |
| `SECRET_KEY` | random | 50+ char fixed string | JWT signing, session security |
| `ALLOWED_HOSTS` | `*` | `api.yourdomain.com,localhost` | Prevents host header attacks |
| `ALLOWED_GRAPHQL_ORIGINS` | `*` | `https://shop.yourdomain.com,...` | Restricts which sites can call API |
| `GRAPHQL_PLAYGROUND_ENABLED` | `True` | `False` | Hides API schema explorer |
| Stripe keys | Test keys (`sk_test_...`) | Test keys (switch to live when ready) | Keep test mode for beta |

### 3.2 Cloudflare Security Settings (Free Tier, No Cost)

| Setting | Where | Value |
|---------|-------|-------|
| SSL mode | Cloudflare Dashboard → SSL/TLS | Full (strict) |
| Always Use HTTPS | SSL/TLS → Edge Certificates | On |
| HSTS | SSL/TLS → Edge Certificates | Enable (1 year) |
| Minimum TLS version | SSL/TLS → Edge Certificates | TLS 1.2 |
| Bot Fight Mode | Security → Bots | On |
| Browser Integrity Check | Security → Settings | On |
| Email Address Obfuscation | Scrape Shield | On |

### 3.3 What Self-Hosting Does NOT Protect Against

| Risk | Mitigation |
|------|-----------|
| Your PC getting hacked | Keep Windows updated, use antivirus, don't run sketchy software |
| Database on local disk | Regular backups (Phase 4). Encrypted drive (BitLocker) recommended |
| Someone on your LAN | Cloudflare Tunnel means no open ports — your LAN is NOT exposed |
| Cloudflare outage | Rare (<0.01% downtime) but possible. No mitigation needed for beta. |

**Commit:** `infra: add self-hosted security configuration`

---

## Phase 4: Backups (Self-Hosted)

### 4.1 Local Database Backup (Existing Script Works)

The existing `infra/scripts/backup-db.sh` works inside Docker:
```powershell
# Run from Windows (executes inside container)
docker exec saleor-postgres-dev pg_dump -U saleor saleor | gzip > "backups/saleor-$(Get-Date -Format 'yyyy-MM-dd').sql.gz"
```

### 4.2 Create PowerShell Backup Script

**New file:** `infra/scripts/backup-self-hosted.ps1`
- Dump PostgreSQL database from container
- Copy to `C:\Users\micha\saleor-backups\` (local folder)
- Optionally upload to Google Drive / OneDrive / Dropbox (free cloud storage)
- Keep last 30 days locally
- Run via Windows Task Scheduler (daily at 2 AM)

### 4.3 Task Scheduler Auto-Backup
```
Name: Saleor Daily Backup
Trigger: Daily at 2:00 AM
Action: PowerShell -File "C:\Users\micha\saleor-platform\infra\scripts\backup-self-hosted.ps1"
Conditions: Start only if computer is ON (skip if sleeping)
```

**Commit:** `infra: add self-hosted backup script and Task Scheduler setup`

---

## Phase 5: Easy Configuration Workflow Enhancement

### 5.1 One-Command Launch Script

Create `infra/scripts/launch-self-hosted.ps1`:
```powershell
# Master script that does everything:
# 1. Check Docker Desktop is running (start if not)
# 2. Check .env.self-hosted exists (create from template if not)
# 3. Pull latest code (if git remote configured)
# 4. Start all Docker containers
# 5. Wait for health checks (API, DB, Redis)
# 6. Start Cloudflare tunnel (named or ephemeral)
# 7. Print all service URLs in a nice table
# 8. Open storefront in browser
# 9. Optionally open dashboard
```

### 5.2 One-Command Stop Script

Create `infra/scripts/stop-self-hosted.ps1`:
```powershell
# 1. Stop Cloudflare tunnel gracefully
# 2. Stop Docker containers
# 3. Optionally take backup before stopping
```

### 5.3 Status Check Script

Create `infra/scripts/status-self-hosted.ps1`:
```powershell
# Shows:
# - Docker container status (running/stopped/unhealthy)
# - Tunnel status (connected/disconnected)
# - RAM/CPU usage per container
# - Database size
# - Last backup date
# - All service URLs
```

### 5.4 Quick Restart Script

Create `infra/scripts/restart-service.ps1`:
```powershell
# Usage: .\restart-service.ps1 storefront
# Usage: .\restart-service.ps1 api
# Usage: .\restart-service.ps1 all
# Restarts specific container + waits for health check
```

**Commit:** `infra: add self-hosted workflow scripts (launch, stop, status, restart)`

---

## Phase 6: Sentry Error Monitoring (Free Tier)

### 6.1 Storefront Sentry Integration
- **Install:** `@sentry/nextjs` in storefront (already in pnpm catalog)
- **Create:** `storefront/sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- **Update:** `storefront/next.config.js` — wrap with `withSentryConfig()`
- **Update error boundaries** to call `Sentry.captureException(error)`
- **Env var:** `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` (free Sentry account = 5K errors/month)

### 6.2 Saleor API Sentry (Optional)
- Already has Sentry support built in — just set `SENTRY_DSN` env var in Django settings
- Zero code changes needed for the API

**Commit:** `feat: add Sentry error monitoring`

---

## Self-Hosting Pros & Cons Summary

### Pros

| Pro | Details |
|-----|---------|
| **$0/month** | No server costs, no hosting fees |
| **Your hardware is powerful** | Your PC likely has 16-32GB RAM, 8+ CPU cores — far more than any $100/mo VPS |
| **Zero latency** | All services on same machine, Docker internal network < 1ms |
| **Familiar environment** | Same Docker setup you use for development |
| **Instant iteration** | Edit code → restart container → live in seconds |
| **Full control** | No provider limits, no bandwidth caps, no ToS restrictions |
| **Cloudflare security** | Free DDoS protection, SSL, CDN, bot protection |
| **No port forwarding** | Tunnel connects outward — your router stays closed |
| **IP hidden** | Nobody sees your home IP address |
| **Easy to migrate** | When ready for VPS, just `docker compose up` on new server |

### Cons

| Con | Details | Mitigation |
|-----|---------|-----------|
| **PC must stay ON** | Shutdown = store down | Disable sleep, set auto-login, Task Scheduler to restart Docker on boot |
| **Windows Updates** | Can force restart | Pause updates, set active hours, defer feature updates |
| **Power outage** | Everything goes down | UPS battery ($50-100) gives 15-30 min protection |
| **ISP outage** | Tunnel disconnects | Nothing you can do. For beta, this is acceptable. |
| **Not enterprise-grade** | No SLA, no redundancy | This is for beta/testing only — migrate to VPS for production |
| **Electricity** | ~$5-15/month extra | Still cheaper than any VPS |
| **Disk failure** | Database lost if SSD dies | Daily backups to cloud storage |
| **Upload bandwidth** | Home internet is slower upload | Cloudflare CDN caches static assets, reducing origin requests |

### When to Migrate to VPS

Migrate when any of these happen:
- You have real paying customers who need 99.9% uptime
- Traffic exceeds ~200 visitors/day consistently
- You're tired of keeping your PC on
- You need a staging environment
- Client/investor requires "professional hosting"

Migration effort: **1-2 hours** (copy .env, restore DB backup, `docker compose up` on VPS).

---

## Execution Order & Effort

| Phase | Description | Effort | Dependencies |
|-------|-------------|--------|--------------|
| 1 | Storefront code fixes (lang, images, SEO, console logs) | 3-4 hours | None |
| 2 | Self-hosted tunnel infrastructure (config, scripts, env) | 2-3 hours | None |
| 3 | Security configuration | 30 min | Phase 2 |
| 4 | Backup setup (script + Task Scheduler) | 1 hour | Phase 2 |
| 5 | Workflow scripts (launch, stop, status, restart) | 2 hours | Phase 2 |
| 6 | Sentry monitoring | 1-2 hours | None |

**Total: ~10-13 hours (~2 days focused work)**

Phases 1, 2, and 6 can run in parallel. Phases 3-5 depend on Phase 2.

---

## Verification Checklist

After all phases:
```
[ ] launch-self-hosted.ps1 starts all containers + tunnel
[ ] All 11 tunnel URLs accessible from phone/another device
[ ] Storefront loads, Hebrew + English channels work
[ ] Dashboard accessible, can manage products
[ ] All 8 apps registered and visible in Dashboard
[ ] Add to cart → checkout works (Stripe test mode)
[ ] Account registration + login works
[ ] Sentry receives test error
[ ] Backup script produces valid .sql.gz file
[ ] stop-self-hosted.ps1 cleanly stops everything
[ ] Restarting PC → running launch script → everything comes back up
```

---

## Areas at 100% (No Changes Needed)

| Area | Why It's Complete |
|------|-------------------|
| Config System | 64 hooks, 3-tier fallback, shared Zod schema |
| All 8 Apps | Fully functional |
| Checkout Flow | Stripe + Adyen, multi-step, promo codes |
| Auth System | JWT, cookies, OAuth, server sessions |
| Multi-Channel | ILS/Hebrew/RTL + USD/English/LTR |
| RTL Support | Logical CSS properties throughout |
| Error Boundaries | Root + channel level |
| XSS Protection | `xss` library for Editor.js |
| Webhook Verification | HMAC-SHA256 + RS256/JWKS |
| GraphQL Client | Already tunnel-aware with retry logic |
| Tunnel URL Injection | `launch-platform.ps1` auto-captures all 11 URLs |

---

## Appendix A: New Store Deployment Playbook

A step-by-step template for duplicating this platform for a new brand/client. Follow in order — each step depends on the previous ones.

### Prerequisites (Before You Start)

```
[ ] Domain name purchased (~$10/year — Cloudflare Registrar, Namecheap, or Porkbun)
[ ] Cloudflare account (free) with domain added
[ ] Stripe account created for the new store
[ ] Brand assets ready: logo (SVG/PNG), favicon (ICO/PNG), brand colors (hex codes)
[ ] Store info ready: name, tagline, support email, phone, physical address
[ ] Product catalog ready: product list, images, prices, categories
[ ] Docker Desktop installed and running
[ ] cloudflared CLI installed
[ ] Git repo cloned: `git clone <repo-url> && cd saleor-platform`
```

---

### Step 1: Environment Configuration (~15 min)

**File:** `infra/.env` (copy from template)

```powershell
# Copy the template
cp infra/env-template.txt infra/.env
```

**What to fill in:**

| Variable | What To Set | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Generate random password | `openssl rand -hex 24` |
| `SECRET_KEY` | Generate 50+ char random string | `openssl rand -hex 32` |
| `RSA_PRIVATE_KEY` | Generate RSA key for webhooks | `openssl genrsa 2048` |
| `ALLOWED_HOSTS` | Your API domain | `api.mybrand.com,localhost,saleor-api` |
| `PUBLIC_URL` | Public API URL | `https://api.mybrand.com` |
| `NEXT_PUBLIC_SALEOR_API_URL` | GraphQL endpoint | `https://api.mybrand.com/graphql/` |
| `NEXT_PUBLIC_STOREFRONT_URL` | Public storefront URL | `https://shop.mybrand.com` |
| `NEXT_PUBLIC_DEFAULT_CHANNEL` | Default channel slug | `default-channel` |
| `STRIPE_PUBLISHABLE_KEY` | From Stripe Dashboard | `pk_test_...` or `pk_live_...` |
| `STRIPE_SECRET_KEY` | From Stripe Dashboard | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Webhooks page | `whsec_...` |
| `EMAIL_URL` | SMTP connection string | `smtp://user:pass@smtp.sendgrid.net:587/?tls=True` |

**Generate all secrets at once (PowerShell):**
```powershell
Write-Host "SECRET_KEY=$(openssl rand -hex 32)"
Write-Host "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
Write-Host "WEBHOOK_SECRET_KEY=$(openssl rand -hex 32)"
```

---

### Step 2: Cloudflare Tunnel Setup (~20 min)

**Create a named tunnel for stable URLs:**

```powershell
# One-time login
cloudflared tunnel login

# Create tunnel (use store name)
cloudflared tunnel create mybrand-store

# Note the tunnel ID from output (e.g., a1b2c3d4-...)
```

**Create `infra/cloudflared-config.yml`:**
```yaml
tunnel: mybrand-store
credentials-file: C:\Users\<you>\.cloudflared\<tunnel-id>.json

ingress:
  - hostname: shop.mybrand.com
    service: http://localhost:3000
  - hostname: api.mybrand.com
    service: http://localhost:8000
  - hostname: dashboard.mybrand.com
    service: http://localhost:9000
  - hostname: stripe.mybrand.com
    service: http://localhost:3002
  - hostname: smtp.mybrand.com
    service: http://localhost:3001
  - hostname: invoices.mybrand.com
    service: http://localhost:3003
  - hostname: control.mybrand.com
    service: http://localhost:3004
  - hostname: newsletter.mybrand.com
    service: http://localhost:3005
  - hostname: analytics.mybrand.com
    service: http://localhost:3006
  - hostname: bulk.mybrand.com
    service: http://localhost:3007
  - hostname: studio.mybrand.com
    service: http://localhost:3008
  - service: http_status:404
```

**Create DNS records in Cloudflare Dashboard:**
- Add a CNAME record for each subdomain → `<tunnel-id>.cfargotunnel.com` (proxied)

**Update `infra/.env` with stable URLs:**
```bash
SALEOR_API_TUNNEL_URL=https://api.mybrand.com
NEXT_PUBLIC_SALEOR_API_URL=https://api.mybrand.com/graphql/
NEXT_PUBLIC_STOREFRONT_URL=https://shop.mybrand.com
DASHBOARD_URL=https://dashboard.mybrand.com
STRIPE_APP_URL=https://stripe.mybrand.com
SMTP_APP_URL=https://smtp.mybrand.com
# ... (all app URLs)
```

---

### Step 3: Start the Platform (~5 min)

```powershell
# Start all containers
docker compose -f infra/docker-compose.dev.yml up -d

# Wait for healthy status
docker compose -f infra/docker-compose.dev.yml ps

# Start the tunnel
cloudflared tunnel --config infra/cloudflared-config.yml run
```

**Verify:**
- `https://api.mybrand.com/graphql/` → GraphQL Playground
- `https://dashboard.mybrand.com` → Saleor Dashboard login
- `https://shop.mybrand.com` → Storefront (will show errors until configured)

---

### Step 4: Create Admin User (~2 min)

```powershell
docker exec -it saleor-api-dev python manage.py createsuperuser
# Enter email, password when prompted
```

Log in to `https://dashboard.mybrand.com` with these credentials.

---

### Step 5: Configure Store Infrastructure (~30 min)

**File:** `scripts/catalog-generator/config.yml`

This is your "infrastructure as code" — it defines what your store sells and how.

**What to customize:**

```yaml
shop:
  name: "My Brand Store"            # ← Your store name

channels:
  - name: "Israel"                   # ← Your primary market
    slug: ils
    currencyCode: ILS
    defaultCountry: IL
  - name: "International"            # ← Your secondary market
    slug: usd
    currencyCode: USD
    defaultCountry: US

productTypes:                        # ← What you sell
  - name: "Electronics"             # Example: electronics store
    productAttributes:
      - name: "Brand"
        type: PRODUCT_TYPE
        inputType: DROPDOWN
        values: ["Apple", "Samsung", "Sony"]
      - name: "Warranty"
        type: PRODUCT_TYPE
        inputType: DROPDOWN
        values: ["1 Year", "2 Years", "3 Years"]
    variantAttributes:
      - name: "Storage"
        type: PRODUCT_TYPE
        inputType: DROPDOWN
        values: ["64GB", "128GB", "256GB", "512GB"]
      - name: "Color"
        type: PRODUCT_TYPE
        inputType: DROPDOWN
        values: ["Black", "White", "Silver"]

warehouses:                          # ← Your fulfillment locations
  - name: "Main Warehouse"
    slug: "main-warehouse"
    address:
      streetAddress1: "123 Commerce St"
      city: "Your City"
      countryArea: "Your State"      # ← REQUIRED field
      postalCode: "12345"
      country: "US"
    shippingZones:
      - "domestic"

shippingZones:                       # ← Your shipping regions
  - name: "Domestic"
    slug: "domestic"
    countries: ["US"]
    channels: ["usd"]
    shippingMethods:
      - name: "Standard Shipping"
        type: PRICE
        channelListings:
          - channel: usd
            price: 5.99
            minimumOrderPrice: 0
      - name: "Free Shipping"
        type: PRICE
        channelListings:
          - channel: usd
            price: 0
            minimumOrderPrice: 75
```

**Deploy to Saleor:**
```powershell
cd scripts/catalog-generator
cp .env.example .env
# Edit .env: set SALEOR_URL=https://api.mybrand.com/graphql/
#            set SALEOR_TOKEN=<your-admin-token>
npm install
npm run deploy:ci
```

This creates all product types, attributes, warehouses, shipping zones, and channels in your Saleor instance.

---

### Step 6: Register Apps (~5 min)

```powershell
.\infra\scripts\install-dashboard-apps.ps1
# Enter admin email and password when prompted
```

This registers all 8 apps (Stripe, SMTP, Invoices, Storefront Control, Newsletter, Analytics, Bulk Manager, Image Studio) in the Dashboard.

**Verify:** Dashboard → Apps → should see all 8 apps listed.

---

### Step 7: Configure Storefront Branding (~45 min)

Open Dashboard → Apps → Storefront Control → Select your channel.

**7a. Store Section:**
| Field | What to Set |
|-------|-------------|
| Store Name | Your brand name |
| Tagline | Short slogan |
| Support Email | help@mybrand.com |
| Support Phone | +1-xxx-xxx-xxxx |
| Address | Your business address |

**7b. Design Section:**
| Field | What to Set |
|-------|-------------|
| Logo URL | Upload logo, paste media URL |
| Favicon URL | Upload favicon, paste media URL |
| Primary Color | Your brand color (hex) |
| Secondary Color | Complementary color |
| Accent Color | CTA/highlight color |
| Font (Headings) | Google Font name (e.g., "Inter") |
| Font (Body) | Google Font name (e.g., "Inter") |
| Border Radius | `4px` (sharp), `8px` (rounded), `16px` (very rounded) |
| Button Style | Choose fill/outline/rounded |

**7c. Features Section:**
Toggle on/off: wishlist, reviews, related products, quick view, cart drawer, compare, etc.

**7d. Content Section (IMPORTANT — do for EACH channel):**
Translate ALL UI text for each market:
- Product detail page labels (Add to Cart, Description, Reviews, etc.)
- Cart page labels
- Checkout labels
- Account page labels
- Filter labels
- Header/footer text

**7e. Homepage Sections:**
Configure each section (Hero, Trust Strip, Categories, Featured Products, etc.) with your brand's content, images, and CTAs.

**Tip:** Use Cmd+K (command palette) to quickly find any setting.

---

### Step 8: Import Product Catalog (~30 min)

**Option A: Use Catalog Generator** (for bulk generation)
```powershell
cd scripts/catalog-generator

# Edit product definitions
# → src/config/products.ts (product data)
# → src/config/categories.ts (category hierarchy)
# → src/config/collections.ts (marketing collections)

npm run translate    # Add Hebrew translations
npm run generate     # Create Excel + CSV files
```

Then upload via Dashboard → Apps → Bulk Manager:
1. **Categories** tab → Import `output/categories.csv`
2. **Collections** tab → Import `output/collections.csv`
3. **Products** tab → Import `output/products.xlsx`

**Option B: Manual via Dashboard**
- Dashboard → Catalog → Products → Add Product
- Good for small catalogs (< 50 products)

**Option C: CSV Templates from Bulk Manager**
- Dashboard → Apps → Bulk Manager → Products → Download Template
- Fill in the CSV, then import

---

### Step 9: Configure Payments (~10 min)

**Stripe Setup:**
1. Dashboard → Apps → Stripe → Configuration
2. Enter your Stripe API keys (or verify they're loaded from `.env`)
3. Create a Stripe webhook pointing to `https://stripe.mybrand.com/api/webhooks`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`
5. Copy webhook secret → update `STRIPE_WEBHOOK_SECRET` in `.env`

**Test:** Add product to cart → Checkout → Pay with test card `4242 4242 4242 4242`

---

### Step 10: Configure Email (~10 min)

**SMTP Setup:**
1. Dashboard → Apps → SMTP → Configuration
2. Enter SMTP server details (or verify loaded from `.env`)
3. Configure email templates:
   - Order confirmation
   - Shipping notification
   - Account verification
   - Password reset

**Test:** Create a test order → check email delivery.

---

### Step 11: Security Hardening (~10 min)

Update `.env` for production settings:

```bash
DEBUG=False
GRAPHQL_PLAYGROUND_ENABLED=False
ALLOWED_HOSTS=api.mybrand.com,localhost,saleor-api
ALLOWED_GRAPHQL_ORIGINS=https://shop.mybrand.com,https://dashboard.mybrand.com
```

Cloudflare Dashboard settings:
- SSL/TLS → Full (strict)
- Always Use HTTPS → On
- HSTS → Enable (1 year)
- Bot Fight Mode → On
- Browser Integrity Check → On

---

### Step 12: Set Up Backups (~10 min)

```powershell
# Test backup
docker exec saleor-postgres-dev pg_dump -U saleor saleor > backup-test.sql

# Set up daily backup via Task Scheduler
# See Phase 4 in this plan for full script
```

---

### Step 13: Final Verification Checklist

```
[ ] Storefront loads at https://shop.mybrand.com
[ ] Hebrew channel works (RTL, ILS currency)
[ ] English channel works (LTR, USD currency)
[ ] Products display with images and prices
[ ] Add to cart works
[ ] Checkout completes (Stripe test mode)
[ ] Account registration + login works
[ ] Dashboard accessible at https://dashboard.mybrand.com
[ ] All 8 apps visible in Dashboard → Apps
[ ] Email sends on order (if SMTP configured)
[ ] Mobile layout looks correct
[ ] Backup script produces valid .sql file
```

---

### Per-Store Configuration Map

Quick reference — what changes per store vs what stays the same:

| Component | Changes Per Store | Stays the Same |
|-----------|-------------------|----------------|
| **`.env`** | Secrets, domains, Stripe keys, email config | Variable names, structure |
| **`cloudflared-config.yml`** | Hostnames, tunnel ID | Port numbers, service structure |
| **`config.yml`** | Shop name, channels, product types, attributes, warehouses, shipping | YAML structure, deployment commands |
| **Products/Categories** | All product data, images, prices | Import format, CSV conventions |
| **Storefront Control** | Branding, colors, logo, all UI text, homepage content | Config schema, admin UI |
| **Stripe** | API keys, webhook secret, webhook URL | Integration code |
| **SMTP** | Server credentials, sender address | Email templates (reusable) |
| **Docker Compose** | Nothing (reads from .env) | Everything |
| **Codebase** | Nothing | Everything (shared across all stores) |
| **Cloudflare** | Domain, DNS records, tunnel | Security settings (copy between stores) |

---

### Time Estimate: New Store Setup

| Step | Time | Notes |
|------|------|-------|
| 1. Environment config | 15 min | Copy template, generate secrets |
| 2. Cloudflare tunnel | 20 min | One-time per domain |
| 3. Start platform | 5 min | Docker compose up |
| 4. Create admin user | 2 min | One command |
| 5. Store infrastructure | 30 min | Edit config.yml, deploy |
| 6. Register apps | 5 min | One script |
| 7. Storefront branding | 45 min | Logos, colors, all UI text (both languages) |
| 8. Import catalog | 30 min | Depends on catalog size |
| 9. Configure payments | 10 min | Stripe keys + webhook |
| 10. Configure email | 10 min | SMTP credentials |
| 11. Security hardening | 10 min | Env vars + Cloudflare settings |
| 12. Set up backups | 10 min | Script + Task Scheduler |
| 13. Final verification | 15 min | Test all flows |
| **Total** | **~3.5 hours** | **From zero to live store** |

---

### Duplicating for a Second Store on the Same Machine

If running multiple stores on one PC:

1. **Clone repo** to a new directory (e.g., `C:\stores\brand-b\`)
2. **Change ports** in `docker-compose.dev.yml` to avoid conflicts:
   - API: 8010 (instead of 8000)
   - Dashboard: 9010 (instead of 9000)
   - Storefront: 3010 (instead of 3000)
   - Apps: 3011-3018
3. **Change container names** (add store prefix):
   - `brand-b-api-dev`, `brand-b-storefront-dev`, etc.
4. **Separate database** — use different `POSTGRES_DB` name
5. **Separate tunnel** — create a new named tunnel
6. **Separate domain** — new subdomains under new domain
7. Follow Steps 1-13 above for the new store

**RAM requirement:** Each store instance uses ~4-6 GB. Two stores = ~8-12 GB recommended.

---

### Quick Duplication Checklist (Experienced User)

For someone who's done this before — the minimum steps:

```
1. cp env-template.txt .env && generate secrets
2. cloudflared tunnel create && create config.yml && add DNS records
3. docker compose up -d
4. python manage.py createsuperuser
5. Edit config.yml → npm run deploy:ci
6. .\install-dashboard-apps.ps1
7. Configure Storefront Control (branding + content for each channel)
8. Import products via Bulk Manager
9. Add Stripe keys + webhook
10. Set DEBUG=False, tighten ALLOWED_HOSTS
11. Verify checkout flow end-to-end
```
