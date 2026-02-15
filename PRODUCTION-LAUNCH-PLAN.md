# Production Launch Plan — Aura E-Commerce Platform on DigitalOcean

## Context

After completing an 8-phase codebase cleanup (1,297 files removed, 613K lines deleted), this plan covers **everything** needed to go from current state to a fully production-ready, professionally deployed e-commerce platform on DigitalOcean Ubuntu with Docker. Three deep-dive audits were conducted covering infrastructure, storefront code, security, and CI/CD.

**Current state: ~80% production-ready.** The plan below brings every area to 100%.

**Target: Single DigitalOcean Droplet (16GB/4vCPU, ~$96/mo) running all services via Docker Compose, with Cloudflare CDN (free), automated backups, monitoring, and CI/CD.**

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

## Phase 2: Sentry Error Monitoring

### 2.1 Storefront Sentry Integration
- **Install:** `@sentry/nextjs` (already in pnpm catalog at 9.8.0)
- **Create files:**
  - `storefront/sentry.client.config.ts` — browser-side error capture
  - `storefront/sentry.server.config.ts` — server-side error capture
  - `storefront/sentry.edge.config.ts` — edge runtime capture
  - `storefront/src/instrumentation.ts` — Next.js instrumentation hook
- **Update:** `storefront/next.config.js` — wrap with `withSentryConfig()`
- **Env vars:** `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`
- **Update error boundaries** in `storefront/src/app/error.tsx` and `storefront/src/app/[channel]/(main)/error.tsx` to call `Sentry.captureException(error)` instead of just `console.error`

### 2.2 Saleor API Sentry (Optional but Recommended)
- **Install:** `sentry-sdk[django]` in `saleor/requirements.txt`
- **Configure:** Add `SENTRY_DSN` env var, add `sentry_sdk.init()` in `saleor/saleor/wsgi.py`
- **Cost:** Sentry free tier = 5K errors/month (sufficient for launch)

**Commit:** `feat: add Sentry error monitoring to storefront and API`

---

## Phase 3: CI/CD Pipelines

### 3.1 Saleor API CI (`.github/workflows/api-ci.yml`)
- Trigger: push/PR to `main` affecting `saleor/`
- Jobs: `ruff check .` → `mypy saleor` → `pytest --reuse-db`
- Services: PostgreSQL 15, Redis 7
- Python 3.12, pip install from requirements

### 3.2 Dashboard CI (`.github/workflows/dashboard-ci.yml`)
- Trigger: push/PR to `main` affecting `dashboard/`
- Jobs: `pnpm check-types` → `pnpm lint` → `pnpm build`
- Node 22, pnpm 10

### 3.3 Apps CI (`.github/workflows/apps-ci.yml`)
- Trigger: push/PR to `main` affecting `apps/`
- Jobs: `pnpm install` → `pnpm lint` → `pnpm build` (via Turborepo)
- Node 22, pnpm 10

### 3.4 Docker Image Build & Push (`.github/workflows/deploy.yml`)
- Trigger: push to `main` (after all CI passes)
- Build all Docker images with git SHA tags
- Push to GitHub Container Registry (ghcr.io) — free for public repos, 500MB free for private
- SSH into DigitalOcean droplet and pull + restart (simple deployment)

**Commit:** `ci: add CI/CD pipelines for all workspaces + deployment`

---

## Phase 4: Security Hardening

### 4.1 Django Production Settings
All via env vars in production `.env` — no code changes needed, just proper configuration:

| Setting | Env Var | Production Value |
|---------|---------|-----------------|
| DEBUG | `DEBUG` | `False` |
| SECRET_KEY | `SECRET_KEY` | 50+ char random string |
| ALLOWED_HOSTS | `ALLOWED_HOSTS` | `api.yourdomain.com` |
| ALLOWED_GRAPHQL_ORIGINS | `ALLOWED_GRAPHQL_ORIGINS` | `https://shop.yourdomain.com,https://dashboard.yourdomain.com` |
| PLAYGROUND_ENABLED | `PLAYGROUND_ENABLED` | `False` |
| ENABLE_SSL | `ENABLE_SSL` | `True` |

### 4.2 Nginx Hardening
- **File:** `infra/nginx.conf`
- **Add gzip compression** (missing — saves 60-80% bandwidth):
  ```nginx
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
  ```
- **Add `Permissions-Policy` header** to all server blocks:
  ```nginx
  add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
  ```
- **Tighten API CSP:** Remove `'unsafe-inline'` from `style-src` in API server block (not needed for API)
- **Replace domain placeholders:** `yourdomain.com` → actual domain (sed script in deploy)

### 4.3 Production `.env` Template
- **File:** `infra/.env.production.example` — verify it includes ALL required vars (cross-reference with Phase 4.1 + Sentry + Stripe)
- Must include: `SENTRY_DSN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ALLOWED_GRAPHQL_ORIGINS`, `ALLOWED_HOSTS`

**Commit:** `security: harden nginx, add gzip, Permissions-Policy, tighten CSP`

---

## Phase 5: DigitalOcean Deployment

### 5.1 Infrastructure Setup

**Droplet Specs (budget-optimized):**

| Resource | Spec | Cost |
|----------|------|------|
| Droplet | 16GB RAM / 4 vCPU / 320GB SSD (Premium AMD) | $96/mo |
| OS | Ubuntu 24.04 LTS | included |
| Cloudflare DNS + CDN | Free tier (proxied) | $0 |
| S3 backups (DO Spaces) | 250GB included | $5/mo |
| Domain | yourdomain.com | ~$10/yr |
| Sentry | Free tier (5K errors/mo) | $0 |
| UptimeRobot | Free tier (5 monitors) | $0 |
| **Total** | | **~$102/mo** |

**Why 16GB:** Total container memory reservations = ~6GB, limits = ~16GB. Under load, API + Worker + Storefront can spike to 8-10GB. 16GB gives safe headroom without OOM kills.

### 5.2 Server Setup Script (automated)

Create `infra/scripts/setup-production.sh`:
```bash
#!/bin/bash
# 1. System updates + Docker install
# 2. UFW firewall (SSH + HTTP + HTTPS only)
# 3. Create deploy user (non-root)
# 4. Install Docker Compose v2
# 5. Install Certbot + obtain SSL certificates
# 6. Clone repo + create .env from template
# 7. Build and start all services
# 8. Run database migrations + collectstatic
# 9. Register Saleor apps
# 10. Set up backup cron
# 11. Set up monitoring (UptimeRobot curl check)
```

### 5.3 DNS Configuration (Cloudflare)
```
A    yourdomain.com      → Droplet IP (proxied)
A    shop.yourdomain.com → Droplet IP (proxied)
A    api.yourdomain.com  → Droplet IP (proxied, but with "Full (strict)" SSL)
A    dashboard.yourdomain.com → Droplet IP (proxied)
A    apps.yourdomain.com → Droplet IP (proxied)
```

**Cloudflare settings (free tier):**
- SSL/TLS: Full (strict) — Cloudflare ↔ origin both encrypted
- Auto Minify: JS + CSS + HTML
- Brotli compression: On
- Always Use HTTPS: On
- HTTP/2 + HTTP/3: On
- Caching: Standard (respects Cache-Control headers)
- Page Rules: Cache `shop.yourdomain.com/_next/static/*` for 1 year

### 5.4 SSL Certificate Strategy
- **Use Cloudflare Origin Certificates** (free, 15-year validity) instead of Certbot
- No renewal needed, no cron, no downtime for certificate rotation
- Generate in Cloudflare Dashboard → SSL/TLS → Origin Server
- Install cert + key in `/etc/ssl/cloudflare/`
- Update `nginx.conf` to point to Cloudflare origin certs

### 5.5 Deployment Script (automated)

Update `infra/scripts/deploy-prod.sh` to:
1. Pull latest code from git
2. Pull Docker images from ghcr.io (built by CI)
3. Run pre-deploy health check (is DB accessible?)
4. Take database backup
5. Run migrations
6. Blue-green restart: start new containers → health check → stop old
7. Run `collectstatic` + copy to nginx static dir
8. Verify all containers healthy
9. Post-deploy notification (Slack/email)

### 5.6 Firewall Rules
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp    # HTTP (Cloudflare → nginx)
ufw allow 443/tcp   # HTTPS (Cloudflare → nginx)
ufw enable
```
All Docker ports bind to `127.0.0.1` only (already configured in docker-compose.prod.yml).

### 5.7 File Permissions
```bash
chmod 600 /opt/saleor/.env           # Only owner can read secrets
chown -R deploy:deploy /opt/saleor   # Non-root user owns everything
chmod 700 /opt/saleor/backups        # Backup directory
```

**Commit:** `infra: add production setup script, update deploy script, Cloudflare SSL`

---

## Phase 6: Monitoring & Alerting

### 6.1 UptimeRobot (Free — 5 Monitors)
- Monitor 1: `https://shop.yourdomain.com` (storefront)
- Monitor 2: `https://api.yourdomain.com/health/` (API)
- Monitor 3: `https://dashboard.yourdomain.com` (dashboard)
- Monitor 4: `https://apps.yourdomain.com/storefront-control/api/manifest` (apps)
- Monitor 5: SSL certificate expiry check
- Alert via email + Telegram/Slack

### 6.2 Docker Health Monitoring Script
Create `infra/scripts/monitor-containers.sh`:
- Check all container health status via `docker inspect`
- Send alert if any container is unhealthy or stopped
- Run via cron every 5 minutes
- Alert via email (using `mail` command) or webhook

### 6.3 Disk & Memory Monitoring
- Cron job every hour: check disk usage > 80%, memory usage > 90%
- Alert before running out of space
- Auto-cleanup Docker build cache if disk > 85%

### 6.4 Web Vitals in Storefront
- **File:** `storefront/src/app/layout.tsx`
- Add `reportWebVitals` function to log Core Web Vitals
- Send to Sentry Performance (included in free tier)

### 6.5 Log Rotation
- Configure Docker log driver with max-size and max-file:
  ```yaml
  # Add to docker-compose.prod.yml for each service
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
  ```
- Prevents disk fill from runaway logs

**Commit:** `infra: add monitoring scripts, log rotation, Web Vitals`

---

## Phase 7: Backup & Disaster Recovery

### 7.1 Automated Daily Backups
```cron
# /etc/cron.d/saleor-backups
0 2 * * * deploy /opt/saleor/infra/scripts/backup-db.sh --mode s3 >> /var/log/saleor-backup.log 2>&1
0 3 * * 0 deploy /opt/saleor/infra/scripts/backup-media.sh >> /var/log/saleor-backup.log 2>&1
```
- DB: Daily at 2 AM → DigitalOcean Spaces (S3-compatible)
- Media: Weekly at 3 AM Sunday → DigitalOcean Spaces
- Retention: 30 days DB, 90 days media

### 7.2 Create Media Backup Script
- **New file:** `infra/scripts/backup-media.sh`
- Tar + gzip the saleor-media Docker volume
- Upload to Spaces
- 90-day retention

### 7.3 Backup Encryption
- Update `backup-db.sh` to encrypt with GPG before upload
- Store GPG key separately (not on same server)
- Or use DigitalOcean Spaces server-side encryption (simpler)

### 7.4 Recovery Procedure Document
- Update `infra/DEPLOY.md` with disaster recovery section:
  - RTO target: 1 hour
  - RPO target: 24 hours (daily backups)
  - Step-by-step restore from Spaces backup
  - How to rebuild from scratch using setup script

**Commit:** `infra: add media backup script, encryption, disaster recovery docs`

---

## Phase 8: Performance Tuning

### 8.1 PostgreSQL Tuning
Add to `docker-compose.prod.yml` PostgreSQL command:
```yaml
command: >
  postgres
  -c shared_buffers=512MB
  -c effective_cache_size=1536MB
  -c work_mem=16MB
  -c maintenance_work_mem=256MB
  -c max_connections=100
  -c checkpoint_completion_target=0.9
```
(Tuned for 2GB container with 16GB host)

### 8.2 Redis Configuration
Add `redis.conf` mount with:
```
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### 8.3 Gunicorn Workers
- **Current:** Hardcoded to 4 workers
- **Fix:** Set to `(2 * CPU_COUNT) + 1` = 9 workers for 4 vCPU
- Update in `docker-compose.prod.yml` gunicorn command

### 8.4 Next.js Storefront
- Enable `output: "standalone"` (reduces image from ~1GB to ~100MB)
- Configure `next.config.js` image device sizes for mobile optimization
- Ensure fonts use `display: "swap"` (already done)

**Commit:** `perf: tune PostgreSQL, Redis, Gunicorn, Next.js for production`

---

## Phase 9: Stripe Live Mode & App Registration

### 9.1 Stripe Configuration
- Switch from test to live keys in production `.env`
- Configure production webhook endpoint: `https://apps.yourdomain.com/stripe/api/webhooks/stripe`
- Test with real $1 charge (refund immediately)
- Enable 3D Secure for European cards

### 9.2 App Registration Automation
Create `infra/scripts/register-apps.sh`:
- Use Saleor GraphQL API to register all 8 apps programmatically
- No manual dashboard clicking needed
- Requires superuser auth token
- Apps to register (with manifest URLs):
  1. Storefront Control: `https://apps.yourdomain.com/storefront-control/api/manifest`
  2. Stripe: `https://apps.yourdomain.com/stripe/api/manifest`
  3. SMTP: `https://apps.yourdomain.com/smtp/api/manifest`
  4. Invoices: `https://apps.yourdomain.com/invoices/api/manifest`
  5. Newsletter: `https://apps.yourdomain.com/newsletter/api/manifest`
  6. Analytics: `https://apps.yourdomain.com/analytics/api/manifest`
  7. Bulk Manager: `https://apps.yourdomain.com/bulk-manager/api/manifest`
  8. Image Studio: `https://apps.yourdomain.com/image-studio/api/manifest`

### 9.3 Store Data Import
- Import config via Storefront Control app (sample-config-import.json)
- Import categories → collections → products via Bulk Manager
- Verify all channels configured (ILS + USD)
- Verify shipping zones and warehouses

**Commit:** `infra: add app registration script, Stripe live mode docs`

---

## Phase 10: Final Verification & Launch

### 10.1 Pre-Launch Checklist
```
[ ] All containers healthy (docker compose ps)
[ ] Storefront loads at https://shop.yourdomain.com
[ ] Dashboard accessible at https://dashboard.yourdomain.com
[ ] API responds at https://api.yourdomain.com/health/
[ ] All 8 apps registered and active
[ ] Hebrew channel works (RTL, ₪ currency)
[ ] English channel works (LTR, $ currency)
[ ] Product pages load with images
[ ] Add to cart works
[ ] Checkout flow completes (Stripe live test)
[ ] Account registration + login works
[ ] Email notifications send (SMTP app)
[ ] Sentry receives test error
[ ] UptimeRobot monitors all green
[ ] Backups running (check Spaces)
[ ] SSL certificate valid (check Cloudflare)
[ ] robots.txt correct
[ ] sitemap.xml accessible
[ ] Lighthouse score > 80 on mobile
```

### 10.2 Post-Launch Day 1
- Monitor Sentry for errors
- Check UptimeRobot for any downtime
- Verify backup ran at 2 AM
- Check container memory usage (`docker stats`)
- Review nginx access logs for anomalies

---

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| DigitalOcean Droplet (16GB/4vCPU) | $96 |
| DigitalOcean Spaces (250GB backups) | $5 |
| Cloudflare (DNS + CDN + SSL) | $0 |
| Sentry (error monitoring, free tier) | $0 |
| UptimeRobot (5 monitors, free tier) | $0 |
| GitHub Actions (CI/CD, free for public) | $0 |
| Domain name | ~$1/mo |
| **Total** | **~$102/mo** |

**Scaling path (when needed):**
- If traffic grows: upgrade Droplet to 32GB ($192/mo) or add 2nd Droplet
- If DB becomes bottleneck: DigitalOcean Managed PostgreSQL ($15/mo for 1GB)
- If media storage grows: Cloudflare R2 (10GB free, then $0.015/GB)

---

## Execution Order & Effort

| Phase | Description | Effort | Dependencies |
|-------|-------------|--------|--------------|
| 1 | Storefront code fixes | 3-4 hours | None |
| 2 | Sentry integration | 2-3 hours | None |
| 3 | CI/CD pipelines | 3-4 hours | None |
| 4 | Security hardening | 2 hours | None |
| 5 | DigitalOcean deployment | 4-6 hours | Phases 1-4 |
| 6 | Monitoring & alerting | 2 hours | Phase 5 |
| 7 | Backup & disaster recovery | 2 hours | Phase 5 |
| 8 | Performance tuning | 2 hours | Phase 5 |
| 9 | Stripe + app registration | 2-3 hours | Phase 5 |
| 10 | Final verification | 2 hours | All phases |

**Total estimated effort: ~25-30 hours (~4-5 days focused work)**

Phases 1-4 can be done in parallel before deployment. Phases 5-9 are sequential on the server. Phase 10 is final QA.

---

## Areas Now at 100% (No Action Needed)

| Area | Why It's Complete |
|------|-------------------|
| Config System | 64 hooks, 3-tier fallback, shared Zod schema, zero hardcoded values |
| All 8 Apps | Fully functional: Control, Stripe, SMTP, Invoices, Newsletter, Analytics, Bulk Manager, Image Studio |
| Checkout Flow | Stripe + Adyen, multi-step, promo codes, server actions |
| Auth System | JWT (5min access/30d refresh), cookie-based, OAuth, server sessions |
| Multi-Channel | ILS/Hebrew/RTL + USD/English/LTR, dynamic routing |
| RTL Support | Logical CSS properties throughout, directional icons |
| Error Boundaries | Root + channel level with config-aware styling |
| XSS Protection | `xss` library for all Editor.js content |
| Webhook Verification | HMAC-SHA256 for Stripe, RS256/JWKS for Saleor — both properly implemented |
| Pre-commit Hooks | Python: Ruff + MyPy + Semgrep + Deptry. TypeScript: Husky + lint-staged |
