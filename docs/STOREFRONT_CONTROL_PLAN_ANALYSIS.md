# Storefront Control Plan Analysis

## Executive Summary
**The plan will work with minor modifications.** The architecture aligns well with the current codebase, but a few adjustments are needed for seamless integration.

## ✅ What Works Well

### 1. **API Endpoint Compatibility**
- ✅ Current endpoint: `/api/config/[channelSlug]` matches plan's `/api/config/{channel}`
- ✅ Endpoint already returns full config object
- ✅ Config schema already includes `version` field (line 1244 in schema.ts)
- ✅ CORS headers already configured
- ✅ Error handling with defaults already in place

### 2. **Current Implementation**
- ✅ Storefront already uses `fetchStorefrontConfig()` in layout.tsx
- ✅ Multi-channel support already exists
- ✅ Fallback to `defaultStoreConfig` already implemented
- ✅ Next.js ISR caching (60s) already in use

### 3. **Architecture Fit**
- ✅ The plan's cache-first approach complements existing ISR
- ✅ Per-channel configuration already supported
- ✅ StoreConfigProvider already accepts config prop

## ⚠️ Required Modifications

### 1. **API Response Format**
**Issue**: Plan expects `{ config, version, updatedAt }` but current API returns config directly.

**Current Response**:
```typescript
// apps/apps/storefront-control/src/pages/api/config/[channelSlug].ts
return res.status(200).json(config); // Returns StorefrontConfig directly
```

**Required Change**:
```typescript
// Modify the API endpoint to wrap response
return res.status(200).json({
  config,
  version: config.version, // Already in schema
  updatedAt: new Date().toISOString(), // Need to track this
});
```

**Location**: `apps/apps/storefront-control/src/pages/api/config/[channelSlug].ts`

### 2. **Version/Timestamp Tracking**
**Issue**: Config has `version` but no `updatedAt` timestamp.

**Options**:
- **Option A**: Add `updatedAt` to config schema (recommended)
- **Option B**: Use metadata modification time from Saleor
- **Option C**: Track separately in a metadata field

**Recommended**: Add `updatedAt` to `StorefrontConfigSchema`:
```typescript
export const StorefrontConfigSchema = z.object({
  version: z.number(),
  updatedAt: z.string().optional(), // ISO timestamp
  channelSlug: z.string(),
  // ... rest of schema
});
```

**Location**: `apps/apps/storefront-control/src/modules/config/schema.ts`

### 3. **Build Script Authentication**
**Issue**: Build script needs to authenticate with storefront-control app.

**Current**: API requires `saleorApiUrl` query param or header.

**Solution**: Build script should:
1. Use environment variables for Saleor API URL
2. Pass it as query param: `?saleorApiUrl=${SALEOR_API_URL}`
3. Or use internal Docker service URL if running in same network

**Modified Build Script**:
```typescript
const CONTROL_URL = process.env.STOREFRONT_CONTROL_URL ?? "http://saleor-storefront-control-app:3000";
const SALEOR_API_URL = process.env.SALEOR_API_URL; // Required

async function fetchChannel(channel: string) {
  const url = `${CONTROL_URL}/api/config/${channel}${SALEOR_API_URL ? `?saleorApiUrl=${encodeURIComponent(SALEOR_API_URL)}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${channel}`);
  const data = await res.json();
  return data.config; // Extract config from wrapped response
}
```

### 4. **Webhook Implementation**
**Issue**: Plan requires webhook from storefront-control → storefront, but this doesn't exist yet.

**Required Changes**:

**A. Add webhook trigger in storefront-control** (when config is saved):
```typescript
// In updateSection mutation (apps/apps/storefront-control/src/modules/trpc/router.ts)
await configManager.setForChannel(input.channelSlug, validated);

// Trigger webhook to storefront
const storefrontUrl = process.env.STOREFRONT_URL || "http://storefront:3000";
await fetch(`${storefrontUrl}/api/config/refresh`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    channelSlug: input.channelSlug,
    updatedAt: new Date().toISOString(),
    version: validated.version,
  }),
}).catch(err => console.error("Webhook failed:", err));
```

**B. Add webhook receiver in storefront** (as per plan):
```typescript
// storefront/src/app/api/config/refresh/route.ts
// (Already in plan - implement as specified)
```

### 5. **ETag Support (Optional Enhancement)**
**Issue**: Plan mentions ETag for efficient refresh, but current API doesn't support it.

**Recommendation**: Add ETag support for better cache efficiency:
```typescript
// In API endpoint
const etag = `"${config.version}-${config.updatedAt}"`;
res.setHeader("ETag", etag);

// In refreshConfig
const response = await fetch(url, {
  headers: {
    "If-None-Match": currentETag, // If available
  },
});
if (response.status === 304) return null; // Not modified
```

## 📋 Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Add `updatedAt` to `StorefrontConfigSchema`
- [ ] Modify API endpoint to return `{ config, version, updatedAt }`
- [ ] Update `configManager.setForChannel()` to set `updatedAt` timestamp
- [ ] Create cache module (`storefront/src/lib/storefront-control/cache.ts`)
- [ ] Create fallback module (`storefront/src/lib/storefront-control/fallback.ts`)

### Phase 2: Loader & Refresh
- [ ] Update `fetch-config.ts` with cache-first logic
- [ ] Implement `loadConfig()` function
- [ ] Implement `refreshConfig()` function
- [ ] Update layout.tsx to use new loader

### Phase 3: Webhook System
- [ ] Add webhook trigger in storefront-control (on config save)
- [ ] Create webhook receiver endpoint (`/api/config/refresh`)
- [ ] Implement stale flag management
- [ ] Add background refresh trigger

### Phase 4: Build-Time Generation
- [ ] Create build script (`scripts/fetch-storefront-config.ts`)
- [ ] Add Docker build step to run script
- [ ] Generate initial `storefront-cms-config.json`
- [ ] Test fallback file loading

### Phase 5: Testing & Optimization
- [ ] Test cache layers (memory → localStorage → fallback → defaults)
- [ ] Test webhook invalidation flow
- [ ] Test offline/error scenarios
- [ ] Verify zero-flicker behavior
- [ ] Performance testing with multiple channels

## 🔧 Code Compatibility Notes

### Current Fetch Implementation
```typescript
// storefront/src/lib/storefront-control/fetch-config.ts
// Currently uses Next.js ISR with 60s revalidate
// Plan's cache-first approach will replace this
```

### Current Provider Usage
```typescript
// storefront/src/app/[channel]/(main)/layout.tsx
const storeConfig = await fetchStorefrontConfig(channel);
// This will continue to work, but will use new cache-first loader
```

### Type Compatibility
- ✅ `StoreConfig` type matches plan's expectations
- ✅ `StorefrontControlConfig` type exists and maps correctly
- ⚠️ Need to add `updatedAt` to types

## 🚀 Migration Path

1. **Backward Compatible**: New cache system can be added alongside existing ISR
2. **Gradual Rollout**: Can enable cache-first for specific channels first
3. **Fallback Safety**: If cache fails, falls back to current ISR behavior
4. **No Breaking Changes**: Existing code continues to work

## 📊 Performance Considerations

### Current State
- ISR: 60s cache, server-side only
- No client-side caching
- No offline support

### With Plan Implementation
- Memory cache: Instant (0ms)
- localStorage: ~1-5ms
- Fallback JSON: ~10-50ms (bundled)
- API fetch: ~100-500ms (only when stale)

### Scalability
- ✅ Works for 5 channels (current)
- ✅ Can scale to 20+ channels with current approach
- ⚠️ For 50+ channels, consider Redis for stale flags (as noted in plan)

## ✅ Final Verdict

**The plan is viable and well-designed.** It will:
- ✅ Eliminate flicker on first render
- ✅ Improve performance with multi-layer caching
- ✅ Enable offline/error resilience
- ✅ Support webhook-based invalidation
- ✅ Scale to multiple channels

**Required modifications are minimal and straightforward.** The plan aligns with Next.js best practices and the existing codebase architecture.

## 🎯 Recommended Next Steps

1. Start with Phase 1 (Core Infrastructure) - 2-3 hours
2. Implement Phase 2 (Loader & Refresh) - 3-4 hours
3. Add Phase 3 (Webhook System) - 2-3 hours
4. Complete Phase 4 (Build Script) - 1-2 hours
5. Test and optimize (Phase 5) - 2-3 hours

**Total Estimated Time**: 10-15 hours of development work.
