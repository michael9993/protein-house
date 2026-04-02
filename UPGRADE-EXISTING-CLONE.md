# Upgrading an Existing Clone with Docker Namespacing

This guide covers how to apply the Docker `COMPOSE_PREFIX` namespacing changes to a project that was cloned **before** these changes were introduced.

> **CRITICAL:** Add `COMPOSE_PREFIX` to your `.env` **before** restarting any containers. Without it, containers will rename from `saleor-*` to `aura-*` and you'll lose access to your existing database volumes and data.

---

## Scenario A: Your Clone Tracks This Repo (Can Git Pull)

If your cloned project has this repo set as a remote and you can pull changes:

### Step 1: Pull the Latest Changes

```bash
git pull origin main
```

### Step 2: Add COMPOSE_PREFIX to Your .env

**This is the most important step.** Without it, your containers will default to `aura-*-dev` instead of `saleor-*-dev`.

```bash
# Replace "mystore" with whatever prefix you want for your containers
echo -e "\nCOMPOSE_PREFIX=mystore\nCOMPOSE_PROJECT_NAME=mystore" >> infra/.env
```

If you want to keep your existing `saleor-*` container names (e.g., you have data in those volumes):

```bash
echo -e "\nCOMPOSE_PREFIX=saleor\nCOMPOSE_PROJECT_NAME=saleor-platform" >> infra/.env
```

### Step 3: Recreate Containers with New Names

```bash
docker compose -f infra/docker-compose.dev.yml down
docker compose -f infra/docker-compose.dev.yml up -d
```

### Step 4: Update platform.yml Container Names

The `platform.yml` service registry still has old container names. Fix it by either:

**Option A — Re-run the wizard** (recommended, updates everything):
```powershell
.\infra\platform.ps1 new-store
```

**Option B — Manual find-and-replace** in `infra/platform.yml`:
Replace every `container: "saleor-` with `container: "mystore-` (or whatever your prefix is).

### Step 5: Verify

```bash
# Should show your prefix in all container names
docker compose -f infra/docker-compose.dev.yml config | grep container_name

# Should show all containers running
docker compose -f infra/docker-compose.dev.yml ps
```

---

## Scenario B: Your Clone is Fully Independent (Can't Git Pull)

If your clone has diverged or has no upstream, apply these changes manually.

### Must-Do (containers will break without this)

#### 1. Add Docker Namespacing to `.env`

Add these lines to `infra/.env`:

```env
# Docker container prefix — prevents conflicts with other stores on same machine
COMPOSE_PREFIX=mystore
# Docker Compose project name — namespaces volumes and networks
COMPOSE_PROJECT_NAME=mystore
```

#### 2. Parameterize Container Names in Docker Compose

In `infra/docker-compose.dev.yml`, replace every `container_name:` directive:

```yaml
# BEFORE
container_name: aura-api-dev

# AFTER
container_name: ${COMPOSE_PREFIX:-aura}-api-dev
```

All **20 containers** in `docker-compose.dev.yml` follow the same pattern — replace `saleor-` with `${COMPOSE_PREFIX:-aura}-` in every `container_name:` line.

Apply the same change to `docker-compose.prod.yml` (**14 containers**).

**Full list of containers to update in `docker-compose.dev.yml`:**

| Original | Parameterized |
|----------|---------------|
| `aura-postgres-dev` | `${COMPOSE_PREFIX:-aura}-postgres-dev` |
| `aura-redis-dev` | `${COMPOSE_PREFIX:-aura}-redis-dev` |
| `aura-api-dev` | `${COMPOSE_PREFIX:-aura}-api-dev` |
| `aura-worker-dev` | `${COMPOSE_PREFIX:-aura}-worker-dev` |
| `aura-scheduler-dev` | `${COMPOSE_PREFIX:-aura}-scheduler-dev` |
| `aura-dashboard-dev` | `${COMPOSE_PREFIX:-aura}-dashboard-dev` |
| `aura-storefront-dev` | `${COMPOSE_PREFIX:-aura}-storefront-dev` |
| `aura-smtp-app-dev` | `${COMPOSE_PREFIX:-aura}-smtp-app-dev` |
| `aura-invoice-app-dev` | `${COMPOSE_PREFIX:-aura}-invoice-app-dev` |
| `aura-stripe-app-dev` | `${COMPOSE_PREFIX:-aura}-stripe-app-dev` |
| `aura-storefront-control-app-dev` | `${COMPOSE_PREFIX:-aura}-storefront-control-app-dev` |
| `aura-newsletter-app-dev` | `${COMPOSE_PREFIX:-aura}-newsletter-app-dev` |
| `aura-sales-analytics-app-dev` | `${COMPOSE_PREFIX:-aura}-sales-analytics-app-dev` |
| `aura-bulk-manager-app-dev` | `${COMPOSE_PREFIX:-aura}-bulk-manager-app-dev` |
| `aura-image-studio-app-dev` | `${COMPOSE_PREFIX:-aura}-image-studio-app-dev` |
| `aura-rembg-dev` | `${COMPOSE_PREFIX:-aura}-rembg-dev` |
| `aura-esrgan-dev` | `${COMPOSE_PREFIX:-aura}-esrgan-dev` |
| `aura-dropship-app-dev` | `${COMPOSE_PREFIX:-aura}-dropship-app-dev` |
| `aura-tax-manager-app-dev` | `${COMPOSE_PREFIX:-aura}-tax-manager-app-dev` |
| `aura-paypal-app-dev` | `${COMPOSE_PREFIX:-aura}-paypal-app-dev` |

#### 3. Update `.env.example` Template

Add to `infra/.env.example` so future clones inherit the namespacing:

```env
# ============================================================================
# DOCKER NAMESPACING
# ============================================================================
# Prefix for Docker container names. Prevents conflicts when running multiple
# stores on the same machine. The new-store wizard sets this from your store slug.
# Examples: aura-api-dev, coolshoes-api-dev, pawzen-api-dev
COMPOSE_PREFIX=aura
# Docker Compose project name — namespaces volumes and networks.
# Should match COMPOSE_PREFIX to keep everything aligned.
COMPOSE_PROJECT_NAME=aura
```

#### 4. Restart Containers

```bash
docker compose -f infra/docker-compose.dev.yml down
docker compose -f infra/docker-compose.dev.yml up -d
```

### Nice-to-Have (improves automation)

These are optional but recommended for full feature parity:

#### 5. Copy Template Files

Copy these template files from the upstream repo to show cloners the expected config structure:

- `infra/platform.yml.example` — Service registry with generic store values and `aura-` container names
- `infra/cloudflared-config.yml.example` — Tunnel config with placeholder domain
- `scripts/catalog-generator/config.yml.example` — Infrastructure config with generic product types

#### 6. Copy `CLONE-GUIDE.md`

Copy `CLONE-GUIDE.md` to the repo root — comprehensive step-by-step guide for future cloning and rebranding.

#### 7. Fix SMTP Hardcoded Fallback Email

In `apps/apps/smtp/src/modules/branding/branding-service.ts`, update the fallback:

```typescript
// BEFORE
companyName: process.env.STORE_NAME || "Pawzen",
companyEmail: process.env.STORE_EMAIL || "support@pawzenpets.shop",

// AFTER
companyName: process.env.STORE_NAME || process.env.VITE_STORE_NAME || "My Store",
companyEmail: process.env.STORE_EMAIL || process.env.CONTACT_EMAIL || process.env.DEFAULT_FROM_EMAIL || "support@example.com",
```

#### 8. Fix Hardcoded Container References in Scripts

These scripts have hardcoded `saleor-*-dev` fallbacks that should use the prefix:

**`infra/lib/Backup.ps1`** (2 locations) — Replace:
```powershell
# BEFORE
if (-not $pgContainer) { $pgContainer = "aura-postgres-dev" }

# AFTER
if (-not $pgContainer) {
    $prefix = if ($env:COMPOSE_PREFIX) { $env:COMPOSE_PREFIX } else { "aura" }
    $pgContainer = "$prefix-postgres-dev"
}
```

**`infra/lib/Config.ps1`** (2 locations) — Same pattern for `aura-api-dev` and the `docker ps` filter.

**`infra/platform.ps1`** (3 locations) — Same pattern for `aura-api-dev` and `aura-postgres-dev` fallbacks.

---

## Quick Patch (Scenario B One-Liner)

If you just want to quickly parameterize an existing clone's docker-compose without doing each file manually:

```bash
cd infra

# Parameterize both compose files
sed -i 's/container_name: saleor-/container_name: ${COMPOSE_PREFIX:-aura}-/g' docker-compose.dev.yml
sed -i 's/container_name: saleor-/container_name: ${COMPOSE_PREFIX:-aura}-/g' docker-compose.prod.yml

# Add prefix to .env (use YOUR store's prefix, not "mystore")
echo -e "\nCOMPOSE_PREFIX=mystore\nCOMPOSE_PROJECT_NAME=mystore" >> .env

# Recreate containers
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d
```

---

## Verify Everything Works

After applying changes (either scenario):

```bash
# 1. Check container names match your prefix
docker compose -f infra/docker-compose.dev.yml config | grep container_name

# 2. Check all services are running
docker compose -f infra/docker-compose.dev.yml ps

# 3. Test API is reachable
curl -s http://localhost:8000/graphql/ | head -1

# 4. Test storefront loads
curl -s http://localhost:3000 | head -1
```

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Containers renamed to `aura-*` unexpectedly | Missing `COMPOSE_PREFIX` in `.env` | Add `COMPOSE_PREFIX=saleor` (or your prefix) to `.env`, then `docker compose down && up` |
| Database is empty after restart | Volume namespace changed (`COMPOSE_PROJECT_NAME` differs) | Set `COMPOSE_PROJECT_NAME` to match your original project directory name |
| `docker exec` fails with "no such container" | Container name changed | Use `docker ps` to see current names, update your commands |
| Scripts fail finding containers | Hardcoded `saleor-*-dev` in lib scripts | Apply fix #8 above, or set `COMPOSE_PREFIX=saleor` |
| Port conflicts with another store | Two stores using same ports | Change port numbers in `.env` (e.g., `SALEOR_API_PORT=8100`) |

---

## Fix: macaw-ui Build Failure on Fresh Clone

**Problem:** `next build` fails when running apps in production mode (`APPS_MODE=production`) on a fresh clone. Next.js 15 statically pre-renders error pages (`/404`, `/_error`), and the default `_error` page shares a webpack chunk with `_document.tsx`, causing `Html` from `next/document` to leak into a non-document context. Additionally, macaw-ui's vanilla-extract Sprinkles initialization crashes without a DOM.

**Error messages you'll see:**
- `<Html> should not be imported outside of pages/_document`
- `Cannot read properties of undefined (reading 'defaultClass')`
- `NextRouter was not mounted`

**Why it worked before:** The Pawzen deployment has cached `.next` build artifacts in Docker volumes. A fresh clone has no cache, so `next build` runs from scratch and hits the SSG crash.

### Fix: Add `_error.tsx` and `404.tsx` to All Apps

Create these two files in every app's `src/pages/` directory. They use plain HTML (no macaw-ui) so they pre-render safely during `next build`.

**Apps that need BOTH `_error.tsx` and `404.tsx`:**
- `apps/apps/smtp/src/pages/`
- `apps/apps/bulk-manager/src/pages/`
- `apps/apps/newsletter/src/pages/`
- `apps/apps/image-studio/src/pages/`
- `apps/apps/stripe/src/pages/`
- `apps/apps/paypal/src/pages/`
- `apps/apps/tax-manager/src/pages/`
- `apps/apps/dropship-orchestrator/src/pages/`
- `apps/apps/invoices/src/pages/`

**Apps that only need `404.tsx`** (already have `_error.tsx`):
- `apps/apps/storefront-control/src/pages/`
- `apps/apps/sales-analytics/src/pages/`

#### `_error.tsx`

```tsx
import Head from "next/head";
import { NextPageContext } from "next";

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  const message =
    statusCode === 404
      ? "This page could not be found."
      : statusCode
        ? `An error ${statusCode} occurred on the server.`
        : "An error occurred on the client.";

  return (
    <>
      <Head>
        <title>{statusCode ? `${statusCode} - Error` : "Error"}</title>
      </Head>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ margin: 0, fontSize: statusCode ? "4rem" : "1.5rem" }}>
          {statusCode ?? "Error"}
        </h1>
        <p style={{ marginTop: 8 }}>{message}</p>
      </div>
    </>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext): ErrorProps => {
  const statusCode = res ? res.statusCode : (err?.statusCode ?? 404);
  return { statusCode };
};

export default Error;
```

#### `404.tsx`

```tsx
export default function Custom404() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "4rem" }}>404</h1>
      <p style={{ marginTop: 8 }}>This page could not be found.</p>
    </div>
  );
}
```

#### Quick Apply Script (Bash)

Run from the repo root:

```bash
# _error.tsx — only apps that don't already have it
for app in smtp bulk-manager newsletter image-studio stripe paypal tax-manager dropship-orchestrator invoices; do
  cp apps/apps/sales-analytics/src/pages/_error.tsx "apps/apps/$app/src/pages/_error.tsx"
done

# 404.tsx — all 11 apps
for app in smtp bulk-manager storefront-control newsletter sales-analytics image-studio stripe paypal tax-manager dropship-orchestrator invoices; do
  cp apps/apps/smtp/src/pages/404.tsx "apps/apps/$app/src/pages/404.tsx"
done
```

#### Verify

Test a production build on any app with macaw-ui:

```bash
docker exec aura-bulk-manager-app-dev sh -c "cd apps/bulk-manager && pnpm build"
```

Expected: build succeeds, `/404` appears as a static page in the output.
