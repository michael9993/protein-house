# Aura Platform — Deployment Options Analysis

## Current Platform Requirements

**14 Docker containers** in production compose:
- PostgreSQL, Redis (data stores)
- Saleor API, Worker, Scheduler (Python backend)
- Storefront (Next.js SSR)
- Dashboard (static React SPA)
- 7 apps: Stripe, SMTP, Invoices, Storefront Control, Newsletter, Analytics, Bulk Manager

**Minimum RAM (idle):** ~3.4GB reserved across containers
**Comfortable RAM:** 8-16GB for headroom under traffic
**Storage:** 50GB+ for OS, images, database, media files

---

## Option A: Hybrid — Your 2GB Droplet + Vercel Free ($19/mo)

**Architecture:**
```
Vercel Hobby (FREE)       → Storefront (Next.js SSR)
Cloudflare Pages (FREE)   → Dashboard (static SPA)
2GB Droplet ($14/mo)      → API + Worker + Scheduler + PostgreSQL + Redis (bare-metal)
                          → 4 essential apps via PM2 (Stripe, SMTP, Control, Invoices)
DO Spaces ($5/mo)         → Backups
Cloudflare (FREE)         → DNS + CDN + SSL
```

| Pros | Cons |
|------|------|
| Cheapest option ($19/mo) | **Vercel Hobby forbids commercial use** (ToS violation) |
| Uses your existing droplet | Storefront → API latency +100-200ms per GraphQL call |
| Vercel optimized for Next.js | 1,000 image optimizations/mo limit (product images) |
| No Docker overhead saves ~500MB | 10-second serverless timeout (complex pages may fail) |
| Cloudflare CDN for free | Bare-metal = complex maintenance (no `docker compose up`) |
| | 2GB RAM = OOM risk under any real traffic |
| | 1 vCPU = everything queues under concurrent requests |
| | Can't build on server (too small) |
| | No staging environment |

**Best for:** Personal projects, demos, proof-of-concept. NOT for a commercial store.

**Traffic capacity:** < 50 visitors/day comfortably

---

## Option B: Hybrid — Your 2GB Droplet + Vercel Pro ($39/mo)

**Architecture:** Same as Option A, but Vercel Pro instead of Hobby.

```
Vercel Pro ($20/mo)       → Storefront (Next.js SSR)
Cloudflare Pages (FREE)   → Dashboard (static SPA)
2GB Droplet ($14/mo)      → API + Worker + Scheduler + PostgreSQL + Redis (bare-metal)
                          → 4 essential apps via PM2
DO Spaces ($5/mo)         → Backups
```

| Pros | Cons |
|------|------|
| Legally commercial | API still on 2GB = slow under load |
| 1TB bandwidth on Vercel | Still +100-200ms latency per GraphQL call |
| 5,000 image optimizations/mo | Bare-metal complexity remains |
| 15-second serverless timeout | 1 vCPU bottleneck |
| Preview deployments | OOM risk during imports/heavy operations |
| Team members supported | Split architecture = more debugging complexity |
| Vercel Analytics included | Newsletter, Analytics, Bulk Manager not always running |

**Best for:** Budget-conscious commercial launch with low initial traffic.

**Traffic capacity:** < 100 visitors/day (limited by API droplet)

---

## Option C: Hybrid — 4GB Droplet + Vercel Pro ($48/mo)

**Architecture:**
```
Vercel Pro ($20/mo)       → Storefront (Next.js SSR)
Cloudflare Pages (FREE)   → Dashboard (static SPA)
4GB Droplet ($28/mo)      → API + Worker + Scheduler + PostgreSQL + Redis (bare-metal)
                          → All 7 apps via PM2
Cloudflare (FREE)         → DNS + CDN + SSL
```

| Pros | Cons |
|------|------|
| API has 4GB breathing room | Still +100-200ms latency per GraphQL call |
| 2 vCPUs = handles concurrent requests | Two platforms to manage (Vercel + DO) |
| All 7 apps can run simultaneously | Bare-metal complexity (no Docker) |
| Vercel handles SSR perfectly | $48/mo = more than Option D |
| Legal for commercial use | Vercel Pro cost adds up yearly ($240/yr) |
| Can handle product imports safely | Debugging split across two platforms |
| Room for 2GB swap as safety net | |

**Best for:** Commercial launch where you want the best of both worlds — Vercel's edge network for the storefront, dedicated server for the backend.

**Traffic capacity:** 200-500 visitors/day

---

## Option D: All-in-One — 4GB Droplet, Full Docker ($28/mo)

**Architecture:**
```
4GB Droplet ($28/mo)      → ALL 14 containers via Docker Compose
                          → Nginx reverse proxy on host
Cloudflare (FREE)         → DNS + CDN + SSL
DO Spaces ($5/mo)         → Backups (optional)
```

**Resource plan (tight but workable with 4GB swap):**
```
OS + Nginx + Docker:     ~500MB
PostgreSQL:              256MB limit (tuned small)
Redis:                   128MB limit
Saleor API (2 workers):  512MB limit
Saleor Worker (1 proc):  384MB limit
Saleor Scheduler:        128MB limit
Storefront:              512MB limit
Dashboard:               128MB limit
Stripe App:              256MB limit
SMTP App:                192MB limit
Invoices App:            192MB limit
Storefront Control:      256MB limit
Newsletter App:          192MB limit
Analytics App:           192MB limit
Bulk Manager:            192MB limit
─────────────────────────────────
Total:                   ~4GB (with 4GB swap as overflow)
```

| Pros | Cons |
|------|------|
| **Cheapest self-hosted** ($28-33/mo) | Tight on RAM — swap will be used under load |
| Everything on one server | 2 vCPU shared across 14 containers |
| Docker = simple deploys (`docker compose up -d`) | Slow under concurrent traffic (swap thrashing) |
| No external dependencies | Storefront SSR competes with API for CPU/RAM |
| No latency between services (<1ms) | Can't build images on server (too small) — need CI |
| Full control over everything | Need 4GB swap file (uses SSD, wears it faster) |
| Simple architecture to understand | No headroom for spikes |
| One place to debug | Dashboard + apps may be slow |

**Best for:** Self-hosted commercial launch on a budget. Accepts some performance tradeoff.

**Traffic capacity:** 50-200 visitors/day (degrades beyond that)

---

## Option E: All-in-One — 8GB Droplet, Full Docker ($56/mo)

**Architecture:**
```
8GB Droplet ($56/mo)      → ALL 14 containers via Docker Compose
                          → Nginx reverse proxy on host
Cloudflare (FREE)         → DNS + CDN + SSL
DO Spaces ($5/mo)         → Backups
```

**Resource plan (comfortable):**
```
OS + Nginx + Docker:     ~500MB
PostgreSQL:              1GB limit
Redis:                   512MB limit
Saleor API (4 workers):  2GB limit
Saleor Worker (2 proc):  1GB limit
Saleor Scheduler:        256MB limit
Storefront:              1GB limit
Dashboard:               256MB limit
7 Apps:                  ~256MB each = 1.8GB
─────────────────────────────────
Total:                   ~7.3GB (700MB headroom)
```

| Pros | Cons |
|------|------|
| **Recommended for production** | $56/mo (not the cheapest) |
| Comfortable RAM for all services | Still single server (SPOF) |
| 4 vCPUs handle concurrent requests | No horizontal scaling |
| Room for traffic spikes | Need to upgrade if traffic grows significantly |
| Docker = easy maintenance | |
| Can build images on server if needed | |
| Fast SSR (storefront + API same network) | |
| Simple architecture | |
| 2GB swap as safety net (rarely used) | |

**Best for:** Production commercial store with confidence. Room to grow.

**Traffic capacity:** 500-2000 visitors/day

---

## Option F: All-in-One — 16GB Droplet, Full Docker ($96/mo)

**Architecture:** Same as Option E but with more headroom.

| Pros | Cons |
|------|------|
| No resource concerns at all | $96/mo |
| Original plan's recommended spec | Overkill for launch with < 500 visitors/day |
| Can handle heavy imports + traffic simultaneously | |
| Room for Image Studio app too | |
| Can add future apps without worry | |

**Best for:** If you want zero resource worries and plan for rapid growth.

**Traffic capacity:** 2000-5000+ visitors/day

---

## Comparison Table

| | A: 2GB+Vercel Free | B: 2GB+Vercel Pro | C: 4GB+Vercel Pro | D: 4GB Docker | E: 8GB Docker | F: 16GB Docker |
|---|---|---|---|---|---|---|
| **Monthly cost** | $19 | $39 | $48 | $28-33 | $56-61 | $96-101 |
| **Yearly cost** | $228 | $468 | $576 | $336-396 | $672-732 | $1152-1212 |
| **Commercial legal** | NO | Yes | Yes | Yes | Yes | Yes |
| **Uses Docker** | No | No | No | Yes | Yes | Yes |
| **Deploy complexity** | High | High | High | Low | Low | Low |
| **SSR performance** | Good (Vercel edge) | Good (Vercel edge) | Good (Vercel edge) | Medium (shared CPU) | Good | Excellent |
| **API performance** | Poor (2GB/1CPU) | Poor (2GB/1CPU) | Good (4GB/2CPU) | Medium (4GB/2CPU) | Good (8GB/4CPU) | Excellent |
| **GraphQL latency** | +100-200ms | +100-200ms | +100-200ms | <1ms | <1ms | <1ms |
| **Traffic capacity** | ~50/day | ~100/day | ~500/day | ~200/day | ~2000/day | ~5000/day |
| **OOM risk** | HIGH | HIGH | Low | Medium | Very Low | None |
| **Image optimization** | 1K/mo (Vercel) | 5K/mo (Vercel) | 5K/mo (Vercel) | Unlimited (self) | Unlimited (self) | Unlimited (self) |
| **Staging env** | No | No | No | No | Maybe (tight) | Yes |
| **Maintenance** | Complex (split) | Complex (split) | Complex (split) | Simple | Simple | Simple |
| **Single point of failure** | API only | API only | API only | Everything | Everything | Everything |

---

## Self-Hosting on Your Own Device (Windows PC)

### Can You Do It?

**Yes, absolutely.** You're already running the entire platform locally in Docker for development. The question is whether it makes sense for production.

### What You'd Need

1. **Your PC stays ON 24/7** — no shutdowns, no restarts, no sleep mode
2. **Static IP or Dynamic DNS** — your home ISP probably gives you a dynamic IP that changes. Use a DDNS service (No-IP, DuckDNS) or ask your ISP for a static IP ($5-10/mo extra)
3. **Port forwarding** — open ports 80 and 443 on your router, forward to your PC
4. **Your PC specs** (based on running Docker for dev already):
   - If you have 16GB+ RAM: plenty for the platform
   - If you have 8GB RAM: tight but works (same as Option E)
   - SSD storage: need ~50GB free

### How It Would Work

```
Internet → Your Router (port 80/443) → Your PC (Nginx) → Docker containers
                                                        → same as dev setup but production config
```

You'd use:
- Cloudflare DNS (proxied) → hides your home IP
- Cloudflare Tunnel (FREE) → even better, no port forwarding needed, encrypted tunnel from your PC to Cloudflare's edge
- Docker Compose (production config) → same containers as any VPS

### Pros of Self-Hosting at Home

| Pro | Details |
|-----|---------|
| **$0/month** | No server costs. You already own the hardware. |
| **More resources** | Your PC likely has 8-32GB RAM and 4-8+ CPU cores — far more than any budget VPS |
| **Fast iteration** | Edit code → restart container → live in seconds. No deploy pipeline needed. |
| **Full control** | No provider limits, no ToS restrictions, no bandwidth caps |
| **Great for MVP/testing** | Run production config locally, send the URL to beta testers |
| **Cloudflare Tunnel** | Free, secure, no port forwarding, hides your IP |

### Cons of Self-Hosting at Home

| Con | Details |
|-----|---------|
| **Uptime depends on YOUR PC** | Windows Update reboots, power outages, blue screens, sleep mode = store goes down |
| **ISP reliability** | Home internet has no SLA. Outages can last hours. Business ISP is expensive ($100+/mo). |
| **Upload speed** | Home connections have asymmetric bandwidth (fast download, slow upload). If you have 10Mbps upload, that limits concurrent users. |
| **Security risk** | Exposing your home network to the internet. A vulnerability = attackers on your LAN. |
| **No redundancy** | PC dies → store is completely down until you fix it. No backup server. |
| **ISP Terms of Service** | Many residential ISPs **prohibit running servers**. They can terminate your service. |
| **Power costs** | Running a PC 24/7 adds ~$10-30/mo to your electricity bill (depending on hardware). |
| **No backup location** | Database is on your PC's drive. Drive fails → data lost (unless you have off-site backups). |
| **SSL certificates** | Cloudflare Tunnel handles this, so actually not an issue. |
| **Dynamic IP** | Cloudflare Tunnel solves this too. |
| **Windows overhead** | Windows uses 2-4GB RAM itself. Docker Desktop on Windows uses WSL2 which adds overhead. Less efficient than Linux. |

### The Cloudflare Tunnel Approach (Best for Home Hosting)

If you do self-host, **Cloudflare Tunnel** eliminates many issues:

```
Internet → Cloudflare Edge (CDN + SSL + DDoS protection)
              ↓ (encrypted tunnel)
         Your PC (cloudflared daemon → Docker containers)
```

- **No port forwarding** needed on your router
- **No static IP** needed — tunnel connects outward from your PC
- **SSL handled** by Cloudflare
- **IP hidden** — nobody sees your home IP
- **DDoS protection** — Cloudflare absorbs attacks
- **Free** on Cloudflare's free tier

You're already using `cloudflared` for dev tunnels (via `platform.ps1 up`), so this is familiar.

### Realistic Self-Hosting Assessment

| Factor | Score | Notes |
|--------|-------|-------|
| Cost | 10/10 | Essentially free (just electricity) |
| Performance | 8/10 | Your PC likely outperforms any budget VPS |
| Reliability | 3/10 | Windows + home ISP = unreliable for production |
| Security | 4/10 | Home network exposure risk (mitigated by Cloudflare Tunnel) |
| Scalability | 2/10 | Can't add a second PC easily |
| Professionalism | 2/10 | Not suitable for a real commercial store |
| Maintenance | 5/10 | Easy (same as dev) but you're the on-call ops person 24/7 |

### Verdict: When Self-Hosting Makes Sense

| Use Case | Self-Host? |
|----------|-----------|
| Development and testing | **YES** — you're already doing this |
| Demo for client/investors | **YES** — use Cloudflare Tunnel, share the URL |
| Beta testing with < 10 users | **YES** — fine for early feedback |
| Soft launch with < 50 customers/day | **MAYBE** — risky but possible with Cloudflare Tunnel |
| Real commercial store | **NO** — reliability too low, ISP ToS risk, no SLA |
| Store that processes payments | **NO** — PCI compliance concerns with home hosting |

### Hybrid: Self-Host Now, Migrate Later

The smartest approach might be:

1. **Now:** Self-host on your PC via Cloudflare Tunnel for beta/soft launch ($0/mo)
2. **When ready for real customers:** Migrate to a 4GB DigitalOcean droplet ($28/mo)
3. **When traffic grows:** Upgrade to 8GB ($56/mo)

The Docker Compose setup is identical — just `docker compose up` on a different machine. Migration takes 1-2 hours: copy `.env`, restore database backup, start containers.

---

## Recommendation Summary

| Stage | Option | Cost | Why |
|-------|--------|------|-----|
| **Beta / Testing** | Self-host on PC + Cloudflare Tunnel | $0/mo | Free, fast, your PC has plenty of resources |
| **Soft Launch** | Option D: 4GB Droplet, Docker | $28/mo | Cheapest reliable self-hosted. Simple Docker deploys. |
| **Growing Store** | Option E: 8GB Droplet, Docker | $56/mo | Comfortable for real commercial traffic |
| **Established Store** | Option F: 16GB Droplet, Docker | $96/mo | Room for everything including Image Studio |
