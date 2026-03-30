# Aura E-Commerce Platform

## Overview

Enterprise-grade, multi-tenant e-commerce platform built on Saleor 3.23. Supports multi-channel commerce (Israel ILS/Hebrew/RTL + International USD/English/LTR) with fully CMS-driven configuration and modular app ecosystem. First client: Mansour Shoes.

## Quick Start

**Prerequisites:** Docker Desktop, Git, PowerShell (or `pwsh` on macOS/Linux)

```powershell
git clone --recurse-submodules https://github.com/michael9993/saleor-platform.git
cd saleor-platform
.\infra\platform.ps1 setup      # Full guided setup: prereqs, branding, DB, apps
```

This handles everything — `.env` creation, secret generation, store branding, Docker startup, database migrations, admin user creation, and Saleor app installation.

See [QUICK-START.md](QUICK-START.md) for the full guide including step-by-step and self-hosted options.

**Access Points:**
- Storefront: http://localhost:3000
- Dashboard: http://localhost:9000
- GraphQL API: http://localhost:8000/graphql/

## Key Features

- **Multi-Channel Commerce** — ILS/Hebrew/RTL + USD/English/LTR with channel-based routing
- **3-Tier Configuration** — Storefront Control app > sample JSON fallback > static defaults
- **Zero Hardcoded Values** — 64 config hooks, fully CMS-driven content and UI
- **Modular Apps** — 8 integrated Saleor apps (config, payments, email, analytics, bulk ops, AI editor)
- **Infrastructure as Code** — Catalog generator with YAML-defined product types, attributes, warehouses
- **Docker-First Development** — All commands via `docker exec`, consistent environment

## Project Structure

```
saleor-platform/
├── saleor/              # Django/GraphQL backend (Python 3.12, Saleor 3.23)
├── dashboard/           # Admin dashboard (React 18 + Vite)
├── storefront/          # Customer storefront (Next.js 15, React 19)
├── apps/                # Saleor Apps monorepo (Turborepo, TypeScript)
│   ├── apps/            # 11 active apps (storefront-control, stripe, smtp, paypal, etc.)
│   └── packages/        # Shared packages (@saleor/apps-storefront-config, etc.)
├── scripts/
│   └── catalog-generator/ # Store infrastructure as code + product catalog gen
├── infra/               # Docker Compose orchestration (18 containers)
│   ├── platform.ps1     # Platform CLI (setup, up, down, db-init, install-apps, etc.)
│   └── scripts/         # Platform management, tunneling, database utilities
├── PRD.md               # Product requirements (authoritative spec)
├── CLAUDE.md            # AI assistant guidelines
└── AGENTS.md            # Development patterns and commands
```

## Development

**All commands run inside Docker containers:**

```bash
# Saleor API
docker exec -it saleor-api-dev python manage.py migrate
docker exec -it saleor-api-dev python manage.py build_schema
docker exec -it saleor-api-dev pytest --reuse-db

# Storefront
docker exec -it saleor-storefront-dev pnpm dev
docker exec -it saleor-storefront-dev pnpm type-check
docker exec -it saleor-storefront-dev pnpm generate

# Dashboard
docker exec -it saleor-dashboard-dev pnpm dev
docker exec -it saleor-dashboard-dev pnpm build

# Apps (example: Storefront Control)
docker exec -it saleor-storefront-control-app-dev pnpm dev
docker exec -it saleor-storefront-control-app-dev pnpm build

# Container restart after code changes (hot-reload is unreliable)
docker compose -f infra/docker-compose.dev.yml restart <container-name>
docker compose -f infra/docker-compose.dev.yml logs -f <container-name>
```

**Container Map:**
- `saleor-api-dev` (8000) — Saleor GraphQL API
- `saleor-dashboard-dev` (9000) — Admin dashboard
- `saleor-storefront-dev` (3000) — Customer storefront
- `saleor-storefront-control-app-dev` (3004) — CMS configuration app
- `saleor-stripe-app-dev` (3002) — Stripe payments
- `saleor-smtp-app-dev` (3001) — Email notifications
- `saleor-invoice-app-dev` (3003) — PDF invoices
- `saleor-newsletter-app-dev` (3005) — Newsletter management
- `saleor-sales-analytics-app-dev` (3006) — Sales analytics
- `saleor-bulk-manager-app-dev` (3007) — Bulk import/export
- `saleor-image-studio-app-dev` (3008) — AI-powered image editor
- `saleor-postgres-dev` (5432) — PostgreSQL database
- `saleor-redis-dev` (6379) — Redis cache/broker

## Related Docs

- **PRD.md** — Authoritative product requirements and feature specifications
- **CLAUDE.md** — Project overview, architecture patterns, code conventions
- **AGENTS.md** — Detailed agent guidelines, container restart rules, code style
- **scripts/catalog-generator/SETUP.md** — Store infrastructure as code documentation
- **infra/DEPLOY.md** — Production deployment guide
- **apps/.github/copilot-instructions.md** — App architecture patterns
