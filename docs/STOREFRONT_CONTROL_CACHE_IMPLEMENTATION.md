# Storefront Control Cache Implementation

## Overview
This document describes the cache-first configuration loading system implemented for the Storefront Control integration. The system provides zero-latency UI rendering on first load while maintaining real-time configuration updates via webhooks.

## Architecture

### Cache Layers (Priority Order)
1. **Memory Cache** - In-memory Map (fastest, per-request)
2. **LocalStorage Cache** - Browser storage (client-side only, persists across sessions)
3. **Fallback JSON** - Bundled file (`storefront-cms-config.json`, generated at build time)
4. **Default Config** - Hardcoded defaults (always available)

### Flow Diagram
```
User Request → loadConfig() → Memory? → LocalStorage? → Fallback JSON? → Defaults
                                    ↓
                            (if stale) → refreshConfig() → API → Update Caches
```

## Implementation Details

### Phase 1: Core Infrastructure ✅

#### 1. Schema Updates
- **File**: `apps/apps/storefront-control/src/modules/config/schema.ts`
- **Change**: Added `updatedAt: z.string().optional()` to `StorefrontConfigSchema`
- **Purpose**: Track when config was last modified for cache invalidation

#### 2. Config Manager Updates
- **File**: `apps/apps/storefront-control/src/modules/config/config-manager.ts`
- **Change**: `setForChannel()` now automatically sets `updatedAt` timestamp
- **Purpose**: Ensure all saved configs have timestamps

#### 3. API Endpoint Updates
- **File**: `apps/apps/storefront-control/src/pages/api/config/[channelSlug].ts`
- **Changes**:
  - Returns wrapped response: `{ config, version, updatedAt }`
  - Adds ETag header for cache validation
  - Supports `If-None-Match` header (304 Not Modified)
  - Handles OPTIONS for CORS preflight
- **Purpose**: Enable efficient cache validation and proper response format

#### 4. Cache Module
- **File**: `storefront/src/lib/storefront-control/cache.ts`
- **Features**:
  - In-memory cache (Map)
  - Stale channel tracking (Set)
  - LocalStorage read/write (client-side)
  - Cache clearing utilities
- **Purpose**: Manage multi-layer cache system

#### 5. Fallback Module
- **File**: `storefront/src/lib/storefront-control/fallback.ts`
- **Features**:
  - Reads `storefront-cms-config.json` from project root
  - Server-side only (uses fs.readFileSync)
  - Validates structure before returning
  - Skips placeholder entries
- **Purpose**: Provide offline/cold-start fallback

### Phase 2: Loader & Refresh ✅

#### 6. Updated Fetch Config
- **File**: `storefront/src/lib/storefront-control/fetch-config.ts`
- **Changes**:
  - `loadConfig()`: Synchronous cache-first loader
  - `refreshConfig()`: Async API fetcher with ETag support
  - `fetchStorefrontConfig()`: Main entry point (cache-first + background refresh)
- **Purpose**: Implement cache-first strategy with silent background updates

#### 7. Layout Integration
- **File**: `storefront/src/app/[channel]/(main)/layout.tsx`
- **Status**: Already uses `fetchStorefrontConfig()` - no changes needed
- **Behavior**: Renders with cached config, triggers background refresh if stale

### Phase 3: Webhook System ✅

#### 8. Webhook Trigger (Storefront Control)
- **File**: `apps/apps/storefront-control/src/modules/trpc/router.ts`
- **Function**: `triggerConfigWebhook()`
- **Triggers**: Called after config save in:
  - `saveConfig` mutation
  - `updateSection` mutation
  - `updateMultipleSections` mutation
  - `resetConfig` mutation
  - `importConfig` mutation
- **Purpose**: Notify storefront when config changes

#### 9. Webhook Receiver (Storefront)
- **File**: `storefront/src/app/api/config/refresh/route.ts`
- **Endpoint**: `POST /api/config/refresh`
- **Action**: Marks channel as stale
- **Purpose**: Receive invalidation notifications from storefront-control

### Phase 4: Build-Time Generation ✅

#### 10. Build Script
- **File**: `scripts/fetch-storefront-config.ts`
- **Usage**:
  ```bash
  STOREFRONT_CONTROL_URL=http://localhost:3000 \
  SALEOR_API_URL=https://your-saleor.example.com/graphql/ \
  STOREFRONT_CHANNELS=default,ils,usd \
  node scripts/fetch-storefront-config.ts
  ```
- **Output**: `storefront-cms-config.json` in project root
- **Purpose**: Generate fallback file during Docker build

#### 11. Fallback File Template
- **File**: `storefront-cms-config.json`
- **Structure**:
  ```json
  {
    "schemaVersion": 1,
    "exportedAt": "ISO timestamp",
    "channels": {
      "channel-slug": { /* StoreConfig */ }
    }
  }
  ```
- **Purpose**: Provide offline fallback (populated by build script)

## Usage

### For Developers

#### Fetching Config
```typescript
import { fetchStorefrontConfig } from "@/lib/storefront-control";

// In server component
const config = await fetchStorefrontConfig(channel);
// Returns immediately from cache, triggers background refresh if stale
```

#### Manual Cache Management
```typescript
import { 
  markChannelStale, 
  clearChannelCache,
  clearAllCache 
} from "@/lib/storefront-control";

// Mark channel for refresh
markChannelStale("ils");

// Clear specific channel
clearChannelCache("ils");

// Clear all (e.g., on logout)
clearAllCache();
```

### For DevOps

#### Build-Time Config Generation
Add to Dockerfile or CI/CD:
```dockerfile
# In storefront Dockerfile
RUN node scripts/fetch-storefront-config.ts
```

Or in CI/CD pipeline:
```yaml
- name: Generate fallback config
  run: |
    node scripts/fetch-storefront-config.ts
  env:
    STOREFRONT_CONTROL_URL: ${{ env.CONTROL_APP_URL }}
    SALEOR_API_URL: ${{ env.SALEOR_API_URL }}
    STOREFRONT_CHANNELS: default,ils,usd
```

#### Environment Variables
- `STOREFRONT_CONTROL_URL`: URL of storefront-control app (for build script)
- `STOREFRONT_CONTROL_APP_INTERNAL_URL`: Internal Docker service URL (default: `http://saleor-storefront-control-app:3000`)
- `SALEOR_API_URL`: Saleor GraphQL API URL (required for build script)
- `STOREFRONT_CHANNELS`: Comma-separated list of channels (default: `default`)
- `STOREFRONT_URL`: Storefront URL for webhooks (default: `http://storefront:3000`)

## Performance Characteristics

### Cache Hit Times
- **Memory**: ~0ms (instant)
- **LocalStorage**: ~1-5ms
- **Fallback JSON**: ~10-50ms (file read)
- **API Fetch**: ~100-500ms (network)

### Cache Miss Behavior
1. Returns cached config immediately (zero flicker)
2. Triggers background refresh if stale
3. Updates cache silently for next request
4. Falls back gracefully on errors

## Webhook Flow

```
1. User saves config in Storefront Control
   ↓
2. Config saved to Saleor metadata
   ↓
3. triggerConfigWebhook() called
   ↓
4. POST /api/config/refresh (storefront)
   ↓
5. markChannelStale(channel)
   ↓
6. Next request: loadConfig() returns cached
   ↓
7. Background: refreshConfig() fetches new config
   ↓
8. Cache updated silently
```

## Error Handling

### API Failures
- Falls back to cached config
- Logs error but doesn't throw
- Continues serving from cache

### Invalid Config
- Validates before saving
- Falls back to defaults if invalid
- Logs validation errors

### Missing Fallback File
- Gracefully handles missing file
- Falls back to `defaultStoreConfig`
- No errors thrown

## Testing

### Test Cache Layers
```typescript
import { loadConfig, refreshConfig } from "@/lib/storefront-control";

// Test memory cache
const config1 = loadConfig("default");
const config2 = loadConfig("default"); // Should be instant

// Test refresh
const newConfig = await refreshConfig("default");
```

### Test Webhook
```bash
curl -X POST http://localhost:3000/api/config/refresh \
  -H "Content-Type: application/json" \
  -d '{"channelSlug": "default"}'
```

## Migration Notes

### Backward Compatibility
- ✅ Existing code continues to work
- ✅ `fetchStorefrontConfig()` signature unchanged
- ✅ Falls back to old behavior if cache fails
- ✅ No breaking changes

### Gradual Rollout
1. Deploy cache system (works alongside existing ISR)
2. Monitor cache hit rates
3. Enable webhooks after verification
4. Remove ISR caching if desired (optional)

## Troubleshooting

### Config Not Updating
1. Check webhook is being called (logs in storefront-control)
2. Verify `/api/config/refresh` endpoint is accessible
3. Check channel is marked stale
4. Verify background refresh is completing

### Fallback File Not Loading
1. Check file exists at project root
2. Verify file structure matches schema
3. Check file permissions
4. Review console logs for errors

### Performance Issues
1. Monitor cache hit rates
2. Check localStorage quota
3. Verify fallback file size
4. Review network requests

## Future Enhancements

### Potential Improvements
- Redis for stale flags (multi-container deployments)
- Config versioning and rollback
- A/B testing support
- Config diff visualization
- Real-time updates via WebSocket (optional)

## Files Modified/Created

### Storefront Control App
- `src/modules/config/schema.ts` - Added `updatedAt`
- `src/modules/config/config-manager.ts` - Auto-set `updatedAt`
- `src/pages/api/config/[channelSlug].ts` - Wrapped response + ETag
- `src/modules/trpc/router.ts` - Webhook triggers

### Storefront
- `src/lib/storefront-control/cache.ts` - **NEW** Cache management
- `src/lib/storefront-control/fallback.ts` - **NEW** Fallback loader
- `src/lib/storefront-control/fetch-config.ts` - Cache-first logic
- `src/lib/storefront-control/index.ts` - Updated exports
- `src/app/api/config/refresh/route.ts` - **NEW** Webhook receiver

### Build Scripts
- `scripts/fetch-storefront-config.ts` - **NEW** Build-time generator
- `storefront-cms-config.json` - **NEW** Fallback file (generated)

## Status

✅ **All phases complete and tested**
- Phase 1: Core Infrastructure ✅
- Phase 2: Loader & Refresh ✅
- Phase 3: Webhook System ✅
- Phase 4: Build-Time Generation ✅

The implementation is production-ready and backward compatible.
