# macaw-ui Static Generation Build Failure — Full Analysis

## Problem Summary

Saleor apps using macaw-ui crash during `next build` when Next.js tries to statically pre-render pages. This affects all apps that use macaw-ui's `ThemeProvider`, `Box`, `Text`, or other styled components in their `_app.tsx` wrapper.

**Affected apps:** SMTP, Storefront Control, Bulk Manager, Sales Analytics, Newsletter, Image Studio, Dropship Orchestrator — any app that wraps pages with macaw-ui's `ThemeProvider`.

**Not affected:** The storefront (uses Tailwind, not macaw-ui) and the Saleor API (Python/Django).

---

## Root Cause Chain

### 1. Next.js Static Page Generation (SSG)

During `next build`, Next.js generates static HTML for:
- `/404` — Custom 404 page (always generated)
- `/500` — Custom 500 page (always generated)
- `/_error` — Default error page (always generated)
- Any page WITHOUT `getServerSideProps` or `getStaticProps`

This means Next.js **renders React components to HTML on the server** without a browser, DOM, or router.

### 2. macaw-ui's vanilla-extract Dependency

macaw-ui uses `vanilla-extract` for CSS-in-JS. The `ThemeProvider` and `ThemeSynchronizer` components (in `_app.tsx`) call `setTheme()` which initializes Sprinkles CSS classes. This initialization:

- Requires the DOM (`document.documentElement`)
- Reads/writes CSS custom properties
- Depends on a specific initialization order

When Next.js renders pages server-side for static export, none of this infrastructure exists.

### 3. The Crash Sequence

```
next build
  → Pre-render /404 page
    → Render _app.tsx (wraps all pages)
      → ThemeProvider initializes
        → vanilla-extract Sprinkles tries to access DOM
          → CRASH: "Cannot read properties of undefined (reading 'defaultClass')"

  → Or: _app.tsx uses useRouter()
    → Router not mounted during static generation
      → CRASH: "NextRouter was not mounted"

  → Or: macaw-ui internally imports <Html> from next/document
    → Next.js detects Html usage outside _document.tsx
      → CRASH: "<Html> should not be imported outside of pages/_document"
```

### 4. Why It Worked Before (Pawzen)

The Pawzen project has **cached `.next` build artifacts** in Docker volumes from a previous successful build. This build likely succeeded because:

- It was built with an older version of Next.js (pre-15.x) that handled SSG differently
- Or it was built before a macaw-ui update introduced the regression
- Or it was built with `NODE_ENV=development` which skips some SSG optimizations
- Or the `_app.tsx` at the time didn't use `useRouter()` / had different ThemeProvider setup

Once a successful `.next/BUILD_ID` exists, subsequent `next build` runs can reuse cached pages and skip the problematic static generation step.

---

## Error Messages Reference

| Error | Cause | Where |
|-------|-------|-------|
| `<Html> should not be imported outside of pages/_document` | macaw-ui or a component tree imports `Html` from `next/document` | Pre-rendering /404, /500 |
| `NextRouter was not mounted` | `_app.tsx` calls `useRouter()` during static generation | Pre-rendering any [dynamic] page |
| `Cannot read properties of undefined (reading 'defaultClass')` | vanilla-extract Sprinkles not initialized (no DOM) | Any page with macaw-ui components |
| `Export encountered an error on /[page], exiting the build` | Next.js aborts build after any pre-render error | Build phase |

---

## Workarounds (Current State)

### What We Did (Temporary)

1. Copied pre-built `.next` directories from the working Pawzen project
2. Modified docker-compose commands to skip build if `.next/BUILD_ID` exists:
   ```sh
   if [ ! -f .next/BUILD_ID ]; then pnpm build; fi && pnpm start
   ```
3. Placed `.next` on the host filesystem so Docker volume mounts pick it up

**Fragility:** This breaks if you clear Docker volumes, delete `.next`, or change app code that requires a rebuild.

### Custom 404/500 Pages (Partial Fix)

Created plain HTML `404.tsx` and `500.tsx` pages without macaw-ui:
```tsx
export default function Custom404() {
  return <div style={{padding:"2rem",textAlign:"center"}}><h1>404</h1></div>;
}
```

**Result:** Fixes the 404/500 pre-render crash, but `_error.tsx` and dynamic pages still crash if `_app.tsx` uses macaw-ui during SSG.

### getServerSideProps (Partial Fix)

Added `getServerSideProps` to all page files to prevent static generation:
```tsx
export const getServerSideProps = async () => ({ props: {} });
```

**Result:** Prevents SSG for those pages, but Next.js still pre-renders `_error`, `404`, and `500` regardless.

---

## Permanent Fix Options

### Option A: Fix `_app.tsx` to Be SSG-Safe (RECOMMENDED)

**Effort:** Medium (2-4 hours per app)
**Risk:** Low

The `_app.tsx` must handle the case where it's rendered during static generation (no DOM, no router). The pattern:

```tsx
// _app.tsx
import dynamic from "next/dynamic";

// Lazy-load ThemeProvider only on client side
const ThemeProviderWrapper = dynamic(
  () => import("../components/ThemeProviderWrapper"),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProviderWrapper>
      <Component {...pageProps} />
    </ThemeProviderWrapper>
  );
}
```

Or use `NoSSRWrapper` (which Saleor's `@saleor/apps-shared` provides):

```tsx
import { NoSSRWrapper } from "@saleor/apps-shared/no-ssr-wrapper";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NoSSRWrapper>
      <ThemeProvider>
        <ThemeSynchronizer />
        <Component {...pageProps} />
      </ThemeProvider>
    </NoSSRWrapper>
  );
}
```

**Key insight:** `NoSSRWrapper` prevents the entire tree from rendering during SSG. The static HTML will be empty, but that's fine — these apps only run inside the Saleor Dashboard iframe where JavaScript is always available.

**Research steps:**
1. Check if Pawzen's `_app.tsx` uses `NoSSRWrapper` differently
2. Check Saleor's official app template: https://github.com/saleor/app-template
3. Check if `@saleor/apps-shared/no-ssr-wrapper` correctly wraps ThemeProvider
4. Test: wrap entire `_app.tsx` content in `NoSSRWrapper`, run `next build`

### Option B: Disable Static Page Generation Entirely

**Effort:** Low (15 min)
**Risk:** Medium (may affect error page behavior)

Add to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  // ... existing config
  experimental: {
    // Skip static generation for error pages
    disableStaticImages: true,
  },
  // Generate all pages on-demand
  async exportPathMap() {
    return {}; // No pages to export statically
  },
};
```

Or override `_error.tsx` with a plain component that doesn't use macaw-ui:

```tsx
// pages/_error.tsx
function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>{statusCode || "Error"}</h1>
      <p>An error occurred.</p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
```

**Research steps:**
1. Test adding plain `_error.tsx` + custom `404.tsx` + `500.tsx` (all without macaw-ui)
2. Verify `next build` succeeds with just these error page overrides
3. If `_app.tsx` still crashes during SSG: combine with Option A's `NoSSRWrapper`

### Option C: Pre-build Docker Images (Production Approach)

**Effort:** Medium (1-2 hours)
**Risk:** Low

Instead of building inside running containers, build the apps into Docker images:

```dockerfile
# apps/Dockerfile.bulk-manager
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --filter saleor-app-bulk-manager...
RUN cd apps/bulk-manager && NODE_ENV=production pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app .
CMD ["sh", "-c", "cd apps/bulk-manager && pnpm start"]
```

The build happens during `docker build` (one-time), not on every container start. If the build fails, `docker build` fails and you fix it before deploying.

**Research steps:**
1. Check `apps/Dockerfile.prod` — may already exist with multi-stage builds
2. Adapt for each app or create a shared Dockerfile
3. Update `docker-compose.dev.yml` to use `build:` instead of `image: node:22-alpine`

### Option D: Use Next.js `output: "export"` Exclusion (Next.js 14+)

**Effort:** Low
**Risk:** Low

In newer Next.js versions, you can mark specific pages to skip during build:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};
```

Or use route groups to separate SSG-safe from SSG-unsafe pages.

**Research steps:**
1. Check Next.js 15.2.6 docs for `experimental` options related to SSG
2. Check if `appDir` migration would solve this (App Router handles SSR differently)
3. Test `missingSuspenseWithCSRBailout: false`

---

## Research Checklist

### Immediate Investigation

- [ ] Compare working Pawzen `_app.tsx` with current ones byte-by-byte (line endings may differ)
- [ ] Check if `NoSSRWrapper` is imported but not wrapping ThemeProvider correctly
- [ ] Check Saleor's official app-template repo for their recommended `_app.tsx` pattern
- [ ] Test: create minimal `_app.tsx` with `NoSSRWrapper` around everything, run `next build`

### Upstream Research

- [ ] Search Saleor GitHub issues for "Html should not be imported" and "static generation"
- [ ] Search macaw-ui GitHub issues for SSG/SSR compatibility
- [ ] Check if vanilla-extract has a known fix for SSG in Next.js 15
- [ ] Check Next.js GitHub for Pages Router SSG + CSS-in-JS issues

### Testing Matrix

| Test | Command | Expected |
|------|---------|----------|
| Build with NoSSRWrapper in _app.tsx | `cd apps/bulk-manager && pnpm build` | Success |
| Build with plain _error.tsx + 404.tsx + 500.tsx | `cd apps/bulk-manager && pnpm build` | Success |
| Build with both fixes | `cd apps/bulk-manager && pnpm build` | Success |
| Build after clearing .next | `rm -rf .next && pnpm build` | Success |

### Key Files to Examine

```
apps/apps/<app>/src/pages/_app.tsx          # ThemeProvider wrapper — the root cause
apps/apps/<app>/src/pages/_document.tsx     # Html import location
apps/apps/<app>/src/pages/_error.tsx        # Error page (if exists)
apps/apps/<app>/src/pages/404.tsx           # Custom 404 (if exists)
apps/apps/<app>/next.config.ts             # Build configuration
packages/shared/src/no-ssr-wrapper.tsx      # NoSSRWrapper implementation
```

### Key URLs

- Saleor app-template: https://github.com/saleor/app-template
- Saleor macaw-ui: https://github.com/saleor/macaw-ui
- Next.js SSG docs: https://nextjs.org/docs/pages/building-your-application/rendering/static-site-generation
- vanilla-extract SSR: https://vanilla-extract.style/documentation/setup/#server-side-rendering

---

## Decision Matrix

| Fix | Effort | Durability | Recommended For |
|-----|--------|------------|-----------------|
| A: NoSSRWrapper in _app.tsx | Medium | Permanent | All environments |
| B: Plain error pages | Low | Partial (may not cover all cases) | Quick patch |
| C: Dockerfile pre-build | Medium | Permanent | Production |
| D: Next.js experimental flags | Low | Fragile (may change between versions) | Testing only |
| Current: Cached .next | None | Fragile (breaks on volume clear) | Demo only |

**Recommended approach:** Start with Option A (NoSSRWrapper), fall back to Option C if A doesn't fully resolve it.
