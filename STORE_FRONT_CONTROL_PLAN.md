# Storefront Control Integration Plan (Webhook + Cache, No Flicker)

## Executive Summary
- The plan is viable and aligns with the current Saleor Platform structure.
- A few integration adjustments are required (API response shape, updatedAt, build-time auth, webhook sender).
- The combined plan below includes those fixes while keeping the original architecture intact.

## Goal
- Zero-latency UI on first render.
- Storefront Control customization stays intact.
- Offline/bad connection safe.
- Per-channel fallback.

## Recommendation
- Build-time multi-channel snapshot JSON.
- Runtime cache-first config load.
- Webhook invalidation + silent refresh.
- Do not write the fallback file at runtime.

## Architecture Overview

### Primary config sources (priority)
1) In-memory cache (per channel)
2) Local cache (localStorage/IndexedDB)
3) `storefront-cms-config.json` (bundled fallback)
4) Default config

### Change detection
- Storefront Control -> webhook -> Storefront
- Mark channel as stale
- Silent refresh in background

### Required modifications (from analysis)
- Wrap Storefront Control API response as `{ config, version, updatedAt }`.
- Add `updatedAt` to the Storefront Config schema (or derive it from metadata).
- Ensure build-time script passes required auth/query parameters (e.g., `saleorApiUrl`).
- Add webhook sender in Storefront Control when config is saved.

## File and Data Structures

### Fallback file (multi-channel)
**`storefront-cms-config.json`**
```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-01-19T12:00:00Z",
  "channels": {
    "default": { "...config...": true },
    "channel-a": { "...config...": true },
    "channel-b": { "...config...": true }
  }
}
```
- Each channel value matches the `sample-config-import.json` `config` payload.
- Keep this file inside the storefront image for cold starts/offline.

## Build-Time Script (populate fallback file)

**When**: Docker build or CI

**What**: Fetch Storefront Control config for all channels

**Output**: `storefront-cms-config.json`

### Pseudo-script
1) GET `/api/config/{channelSlug}` for each channel
2) Pass required auth/query params (ex: `?saleorApiUrl=...`)
3) Validate response schema
4) Write to `storefront-cms-config.json` (channels map)
5) If fetch fails: keep previous file or default

## Runtime Loader (no flicker)

### `loadConfig(channelSlug)`
- If `memoryCache[channel]` exists -> return it
- Else if `localCache[channel]` exists -> return it
- Else if `fallbackJson.channels[channel]` exists -> return it
- Else return `defaultConfig`

### `refreshConfig(channelSlug)` (non-blocking)
- Fetch latest config with ETag
- If changed: update memory cache + local cache + UI state

## Webhook Invalidation Flow

### Storefront Control
- On config change, send webhook:
  - `POST /api/config/refresh`
  - Body: `{ channelSlug, updatedAt, version }`
- This must be wired in the config save/update path.

### Storefront
- Mark `stale[channelSlug] = true`
- Trigger background refresh on next request or immediately

## Silent Background Refresh (definition)
- No loading spinners.
- UI renders from cached config.
- If refresh returns new config, update state quietly.

## Scalability Notes
- Works well for 5 channels now.
- If multiple storefront containers later, move `stale` flags to Redis/KV.

## Cursor Auto-Mode Instructions (Steps)

### Step 1 - Build script
- Add a Node script: `scripts/fetch-storefront-config.ts`
- Fetch all channel configs from Storefront Control.
- Write `storefront-cms-config.json`.

### Step 2 - Add fallback file
- Create `storefront-cms-config.json` in repo root or `storefront/src/config/`.

### Step 3 - Config loader
- Implement `loadConfig` + `refreshConfig`.
- Use in StoreConfigProvider to avoid blocking SSR.

### Step 4 - Webhook endpoint
- Add endpoint in storefront:
  - `POST /api/config/refresh`
  - Marks channel stale.

### Step 5 - Background refresh
- Trigger `refreshConfig` after webhook or on next page request.

---

# Concrete Code Changes (file-by-file)

The snippets below show exactly how to implement this in Saleor Platform. These are examples you can paste into Cursor Auto Mode.

## 1) `storefront/src/lib/storefront-control/cache.ts` (new)
In-memory + local cache helpers plus stale flags.
```ts
import { type StoreConfig } from "@/config";

const memoryCache = new Map<string, StoreConfig>();
const staleChannels = new Set<string>();

const LOCAL_STORAGE_KEY = "storefront-config-cache";

type CachePayload = {
  version: number | null;
  updatedAt: string | null;
  config: StoreConfig;
};

type LocalCacheStore = Record<string, CachePayload>;

export function getMemoryConfig(channel: string): StoreConfig | null {
  return memoryCache.get(channel) ?? null;
}

export function setMemoryConfig(channel: string, config: StoreConfig): void {
  memoryCache.set(channel, config);
}

export function markChannelStale(channel: string): void {
  staleChannels.add(channel);
}

export function clearChannelStale(channel: string): void {
  staleChannels.delete(channel);
}

export function isChannelStale(channel: string): boolean {
  return staleChannels.has(channel);
}

export function readLocalCache(channel: string): CachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalCacheStore;
    return parsed[channel] ?? null;
  } catch {
    return null;
  }
}

export function writeLocalCache(channel: string, payload: CachePayload): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocalCacheStore) : {};
    parsed[channel] = payload;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage errors
  }
}
```

## 2) `storefront/src/lib/storefront-control/fallback.ts` (new)
Load fallback config from the bundled JSON.
```ts
import fallback from "@/storefront-cms-config.json";
import { type StoreConfig } from "@/config";

type FallbackPayload = {
  schemaVersion: number;
  exportedAt: string;
  channels: Record<string, StoreConfig>;
};

const fallbackPayload = fallback as FallbackPayload;

export function readFallbackConfig(channel: string): StoreConfig | null {
  return fallbackPayload.channels[channel] ?? fallbackPayload.channels.default ?? null;
}
```

## 3) `storefront/src/lib/storefront-control/fetch-config.ts` (new)
Cache-first loader + silent refresh. Uses fallback on failures.
```ts
import { storeConfig as defaultConfig, type StoreConfig } from "@/config";
import {
  getMemoryConfig,
  setMemoryConfig,
  readLocalCache,
  writeLocalCache,
  isChannelStale,
  clearChannelStale,
} from "./cache";
import { readFallbackConfig } from "./fallback";

const CONFIG_ENDPOINT =
  process.env.NEXT_PUBLIC_STOREFRONT_CONTROL_URL ?? "http://storefront-control:3000";
const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL;

type StorefrontControlResponse = {
  config: StoreConfig;
  version?: number;
  updatedAt?: string;
};

function withSaleorApiUrl(url: string): string {
  if (!SALEOR_API_URL) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}saleorApiUrl=${encodeURIComponent(SALEOR_API_URL)}`;
}

export async function loadConfig(channel: string): Promise<StoreConfig> {
  const memory = getMemoryConfig(channel);
  if (memory) return memory;

  const local = readLocalCache(channel);
  if (local?.config) {
    setMemoryConfig(channel, local.config);
    return local.config;
  }

  const fallback = readFallbackConfig(channel);
  if (fallback) {
    setMemoryConfig(channel, fallback);
    return fallback;
  }

  return defaultConfig;
}

export async function refreshConfig(channel: string): Promise<StoreConfig | null> {
  try {
    const response = await fetch(withSaleorApiUrl(`${CONFIG_ENDPOINT}/api/config/${channel}`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as StorefrontControlResponse;
    if (!payload?.config) return null;

    setMemoryConfig(channel, payload.config);
    writeLocalCache(channel, {
      version: payload.version ?? null,
      updatedAt: payload.updatedAt ?? null,
      config: payload.config,
    });

    clearChannelStale(channel);
    return payload.config;
  } catch {
    return null;
  }
}

export async function fetchStorefrontConfig(channel: string): Promise<StoreConfig> {
  const baseConfig = await loadConfig(channel);

  if (isChannelStale(channel)) {
    void refreshConfig(channel);
  }

  return baseConfig;
}
```

## 4) `storefront/src/lib/storefront-control/index.ts` (new)
Re-export the loader to match current imports.
```ts
export { fetchStorefrontConfig, loadConfig, refreshConfig } from "./fetch-config";
```

## 5) `storefront/src/app/api/config/refresh/route.ts` (new)
Webhook receiver. Marks channel stale.
```ts
import { NextResponse } from "next/server";
import { markChannelStale } from "@/lib/storefront-control/cache";

export async function POST(request: Request) {
  const body = (await request.json()) as { channelSlug?: string };

  if (!body.channelSlug) {
    return NextResponse.json({ ok: false, error: "Missing channelSlug" }, { status: 400 });
  }

  markChannelStale(body.channelSlug);
  return NextResponse.json({ ok: true });
}
```

## 6) `storefront/src/app/[channel]/(main)/layout.tsx`
Replace existing import to use cache-first fetch.
```ts
import { fetchStorefrontConfig } from "@/lib/storefront-control";
```
No other changes needed. The provider already accepts `config`.

## 7) `storefront/src/app/checkout/page.tsx` and nav components
Ensure all imports use the same cache-first loader.
```ts
import { fetchStorefrontConfig } from "@/lib/storefront-control";
```

## 8) `storefront-cms-config.json` (new, repo root)
Bundled per-channel fallback config. Populate during build.

## 9) Build-time script `scripts/fetch-storefront-config.ts` (new, repo root)
Fetch all channels and write `storefront-cms-config.json`.
```ts
import fs from "node:fs";
import path from "node:path";

const CONTROL_URL = process.env.STOREFRONT_CONTROL_URL ?? "http://storefront-control:3000";
const SALEOR_API_URL = process.env.SALEOR_API_URL;
const CHANNELS = (process.env.STOREFRONT_CHANNELS ?? "default")
  .split(",")
  .map((s) => s.trim());

function withSaleorApiUrl(url: string): string {
  if (!SALEOR_API_URL) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}saleorApiUrl=${encodeURIComponent(SALEOR_API_URL)}`;
}

async function fetchChannel(channel: string) {
  const res = await fetch(withSaleorApiUrl(`${CONTROL_URL}/api/config/${channel}`));
  if (!res.ok) throw new Error(`Failed ${channel}`);
  const data = await res.json();
  return data.config;
}

async function run() {
  const channels: Record<string, unknown> = {};
  for (const channel of CHANNELS) {
    channels[channel] = await fetchChannel(channel);
  }

  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    channels,
  };

  const filePath = path.join(process.cwd(), "storefront-cms-config.json");
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

void run();
```

## 10) Docker build hook (example)
Run the script during build (or CI) to generate the fallback file.
```
RUN node scripts/fetch-storefront-config.ts
```

---

## Notes
- This design avoids runtime file writes and scales to multiple containers later.
- Uses local cache for instant renders and webhooks for fresh config.
- UI stays stable because refresh happens in the background.

## Required Storefront Control API changes
- Modify `/api/config/[channelSlug]` to return `{ config, version, updatedAt }` instead of raw config.
- Add `updatedAt` to the Storefront Config schema (or derive it at save time).
- Optionally add ETag support based on `version + updatedAt`.

## Webhook sender (Storefront Control)
- On config save/update, call the storefront webhook:
  - `POST /api/config/refresh`
  - Body: `{ channelSlug, updatedAt, version }`
- This should be added in the config mutation or config manager save step.
