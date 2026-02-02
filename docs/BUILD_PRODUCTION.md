# Production Builds – All Apps & Storefront

This doc describes how to run **production builds** for all Saleor apps (smtp, newsletter, invoices, stripe, storefront-control, sales-analytics, etc.) and the **storefront**, and how to toggle between **development** and **production**—both **on the host** and **inside Docker containers**.

---

## Quick reference

| Goal                               | Command                                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Build everything (production)**  | From repo root: `node scripts/build-all-production.mjs` or `pnpm build:production`                                                                |
| **Build only Saleor apps**         | `cd apps && pnpm build` or `pnpm build:production`                                                                                                |
| **Build only storefront**          | `cd storefront && pnpm build`                                                                                                                     |
| **Dev – all apps**                 | `cd apps && pnpm dev`                                                                                                                             |
| **Dev – storefront**               | `cd storefront && pnpm dev`                                                                                                                       |
| **Start production (after build)** | In each app: `pnpm start`                                                                                                                         |
| **Docker – production mode**       | In `infra/.env`: set `APPS_MODE=production` and/or `STOREFRONT_MODE=production`, then `docker compose -f infra/docker-compose.dev.yml up --build` |

---

## Toggle: Development vs production

- **Development**
  - **Apps:** `cd apps && pnpm dev` (runs all apps in dev mode via Turbo).
  - **Storefront:** `cd storefront && pnpm dev`.
  - **Docker:** Leave `APPS_MODE` and `STOREFRONT_MODE` unset or set to `dev` in `infra/.env`; containers run dev servers with hot reload.
  - No production build; uses dev server and hot reload.

- **Production**
  1. **On host:** Run a production build (see below), then start each service with `pnpm start` in that app's directory (or use PM2).
  2. **In Docker:** Set `APPS_MODE=production` and/or `STOREFRONT_MODE=production` in `infra/.env`; on `up`, each container runs `pnpm build && pnpm start` inside the container.

---

## Build all (apps + storefront) from repo root

From the **repository root** (e.g. `saleor-platform/`):

```bash
node scripts/build-all-production.mjs
```

Or, if you have a root `package.json` with the script:

```bash
pnpm build:production
```

This script:

1. Runs `pnpm build` in `apps/` (Turbo builds all Saleor apps).
2. Runs `pnpm build` in `storefront/`.
3. Writes a log to `build-production.log` at repo root.
4. Exits with code `1` if any build fails; `0` if all succeed.

---

## Build only Saleor apps (smtp, newsletter, invoices, stripe, storefront-control, sales-analytics, etc.)

```bash
cd apps
pnpm build
# or
pnpm build:production
```

This uses **Turborepo** to build every app in `apps/apps/` that has a `build` task (Next.js `next build`).  
To build a **single app** (e.g. storefront-control):

```bash
cd apps
pnpm build:filter saleor-app-storefront-control
# Or by path:
pnpm turbo run build --filter=./apps/storefront-control
```

---

## Build only storefront

```bash
cd storefront
pnpm build
# or
pnpm build:production
```

This runs type-check and `next build` (production).

---

## Root `package.json` scripts (repo root)

If present at repo root, these are available:

| Script                  | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `pnpm build:production` | Runs `scripts/build-all-production.mjs` (apps + storefront). |
| `pnpm build:apps`       | `cd apps && pnpm build`.                                     |
| `pnpm build:storefront` | `cd storefront && pnpm build`.                               |
| `pnpm dev:apps`         | `cd apps && pnpm dev`.                                       |
| `pnpm dev:storefront`   | `cd storefront && pnpm dev`.                                 |

---

## Logs and errors

- **Full log path:** repo root → `build-production.log` (written by `scripts/build-all-production.mjs`).
- **Summary:** The script prints OK/FAIL per target and exits with a non-zero code if any build fails.
- **Fixing failures:**
  - Run the failing part alone (e.g. `cd apps && pnpm build` or `cd storefront && pnpm build`).
  - Fix TypeScript, ESLint, or Next.js errors reported in the output or in `build-production.log`.
  - Re-run `node scripts/build-all-production.mjs` until all builds succeed.

---

## Apps included in `apps/` build

Turbo runs `build` for every package that defines it, including (among others):

- **smtp** (Saleor SMTP app)
- **newsletter**
- **invoices**
- **stripe**
- **storefront-control**
- **sales-analytics**
- **cms**, **avatax**, **klaviyo**, **segment**, **search**, **products-feed**, **np-atobarai**

No need to toggle each app individually: one `pnpm build` in `apps/` builds all of them.

---

## Docker: production mode inside containers

The platform runs in **Docker** via `infra/docker-compose.dev.yml`. Builds and execution happen **inside the containers**; you do not need to run `pnpm build` on the host first.

### Environment variables (in `infra/.env`)

| Variable          | Default | Description                                                                                                                                                                                     |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APPS_MODE`       | `dev`   | For **Saleor apps** (smtp, invoices, stripe, storefront-control, newsletter, sales-analytics). Set to `production` so each app container runs `pnpm build && pnpm start` instead of `pnpm dev`. |
| `STOREFRONT_MODE` | `dev`   | For the **storefront** container. Set to `production` so the storefront runs `pnpm build && pnpm start` instead of `pnpm dev`.                                                                  |

See `infra/env-template.txt` for these and other variables.

### How to run in production mode with Docker

1. From the repo root, ensure `infra/.env` exists (copy from `infra/env-template.txt` if needed).
2. Set in `infra/.env`:
   - `APPS_MODE=production` — to run all Saleor apps in production inside their containers.
   - `STOREFRONT_MODE=production` — to run the storefront in production inside its container.
3. Start (or rebuild) from the `infra` directory:
   ```bash
   cd infra
   docker compose -f docker-compose.dev.yml up --build
   ```
   Each app/storefront container will install deps, then either run the dev server (if mode is `dev`) or run `pnpm build && pnpm start` (if mode is `production`).

### Notes

- **Source is mounted:** The compose file mounts `../apps` and `../storefront` into the containers, so code changes are visible inside the container. For production mode, the container still runs a full build on startup; subsequent restarts will rebuild again.
- **No host build required:** When using Docker, you do **not** need to run `pnpm build:production` on the host. The containers perform the build when `APPS_MODE=production` or `STOREFRONT_MODE=production`.
- **Switching back to dev:** Set `APPS_MODE=dev` and `STOREFRONT_MODE=dev` (or remove them) in `infra/.env`, then `docker compose -f infra/docker-compose.dev.yml up` again.
