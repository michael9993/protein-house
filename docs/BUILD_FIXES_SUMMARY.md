# Build Fixes Applied

**Date**: January 2025  
**Status**: ✅ **Fixes Applied - Build in Progress**

---

## Errors Fixed

### 1. Missing Hook: `useModalSearchWithFilters`

**Error**: `Could not load /app/src/hooks/useModalSearchWithFilters`

**Fix**: ✅ Copied from 3.22.24
- `src/hooks/useModalSearchWithFilters.ts`
- `src/hooks/useModalSearchWithFilters.test.ts`
- Fixed import path: `./useDebounce`

---

### 2. Missing Export: `GLOBAL` from Constraint.ts

**Error**: `"GLOBAL" is not exported by "src/components/ConditionalFilter/FilterElement/Constraint.ts"`

**Fix**: ✅ Updated `Constraint.ts` to match 3.22.24
- Added `export const GLOBAL = "GLOBAL" as const;`
- Updated constructor to accept `string[] | typeof GLOBAL`
- Added `isGlobal` property
- Updated `existIn()` method to handle global constraints

---

## Files Updated

1. ✅ `src/hooks/useModalSearchWithFilters.ts` - NEW (copied from 3.22.24)
2. ✅ `src/hooks/useModalSearchWithFilters.test.ts` - NEW (copied from 3.22.24)
3. ✅ `src/components/ConditionalFilter/FilterElement/Constraint.ts` - UPDATED (added GLOBAL export)

---

## Current Status

- ✅ Missing hook added
- ✅ Constraint.ts updated with GLOBAL export
- ⏳ Container rebuilding
- ⏳ Build in progress ("transforming...")

---

## Monitor Build

```powershell
cd C:\Users\micha\saleor-platform\infra
docker compose -f docker-compose.dev.yml logs -f saleor-dashboard
```

**Wait for**:
- ✅ "built in Xs" message
- ✅ "vite preview" or "Local:" message
- ✅ Container status: "healthy"

---

**All fixes applied!** The build should complete successfully now.

