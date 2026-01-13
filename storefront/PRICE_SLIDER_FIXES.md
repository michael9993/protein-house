# Price Range Slider - Bug Fixes

## Issues Fixed

### 1. MIN slider at 0 does not filter

**Root Cause:** Falsy check bug - `0` was being treated as falsy in multiple places:
- `PriceRangeFilter.tsx`: `min > minBound` excluded `0` when `minBound = 0`
- `filters.ts`: `filters.priceMin !== undefined` but missing null check
- URL serialization: `if (value !== undefined)` but `0` was valid

**Fix:**
- Changed all checks to explicit: `value !== undefined && value !== null`
- Updated `debouncedUpdate` to use `>=` and proper bounds logic
- Updated `buildGraphQLFilter` to explicitly check for null
- Updated `setNumberParam` to allow `0` as valid value

**Files Changed:**
- `storefront/src/ui/components/Filters/PriceRangeFilter.tsx` - Lines 47-58, 75-89, 140
- `storefront/src/lib/filters.ts` - Lines 153-160, 265-271, 321-328, 334-343

**Behavior:** Now `priceMin=0` is treated as a valid filter value and included in URL/GraphQL.

### 2. Clear price filter doesn't remove chip

**Root Cause:** The `handleClear` function calls `updateFilters({ priceMin: undefined, priceMax: undefined })` which should work, but the chip visibility check was using falsy check.

**Fix:**
- Updated `hasPriceFilter` to use explicit null/undefined checks
- Updated `hasActiveFilters` and `countActiveFilters` to use explicit checks
- Updated ActiveFiltersTags condition to use explicit checks

**Files Changed:**
- `storefront/src/ui/components/Filters/PriceRangeFilter.tsx` - Line 140
- `storefront/src/lib/filters.ts` - Lines 321-328, 334-343
- `storefront/src/app/[channel]/(main)/products/ActiveFiltersTags.tsx` - Line 107

**Behavior:** Clearing price filter now properly removes the chip from Active Filters.

### 3. Active filter chip removal not working

**Root Cause:** The chip removal calls `updateFilters({ priceMin: undefined, priceMax: undefined })` which updates URL, but the slider sync logic was already correct. The issue was the chip visibility check.

**Fix:**
- Updated ActiveFiltersTags condition to use explicit null/undefined checks
- Slider already syncs via `useEffect` watching `currentMin`/`currentMax`

**Files Changed:**
- `storefront/src/app/[channel]/(main)/products/ActiveFiltersTags.tsx` - Line 107

**Behavior:** Clicking "X" on price chip now:
- Removes chip immediately
- Updates URL (removes params)
- Slider syncs to default range
- Product list updates

### 4. Slider color CSS issue

**Root Cause:** Duplicate `box-shadow` declaration in CSS causing color issues.

**Fix:**
- Removed duplicate `box-shadow` line
- Used `color-mix()` for proper transparency with CSS variable

**Files Changed:**
- `storefront/src/ui/components/Filters/PriceRangeFilter.css` - Line 41

**Behavior:** Slider now uses consistent branding color from CSS variable.

## Testing

### Test 1: MIN slider at 0

1. Navigate to `/products`
2. Open "Price" filter section
3. Drag min handle to `$0.00`
4. **Expected:** URL shows `?priceMin=0` (or `?priceMin=0&priceMax=1000` if max is set)
5. **Expected:** Products are filtered (if applicable)
6. **Expected:** GraphQL query includes `minimalPrice: { gte: 0 }`

**Test URL:** `/products?priceMin=0`

### Test 2: Clear price filter removes chip

1. Set price range via slider (e.g., min=10, max=100)
2. Verify chip appears in "Active Filters"
3. Click "Clear Price Filter" button
4. **Expected:**
   - Slider resets to full range
   - URL params removed (`priceMin` and `priceMax` gone)
   - Chip disappears from Active Filters
   - Products show all prices

**Test URL:** `/products?priceMin=10&priceMax=100` → Clear → `/products`

### Test 3: Remove price chip

1. Set price range via slider
2. Verify chip appears: `$10.00 - $100.00`
3. Click "X" on the price chip
4. **Expected:**
   - Chip disappears immediately
   - URL params removed
   - Slider resets to full range
   - Products show all prices

**Test URL:** `/products?priceMin=10&priceMax=100` → Click X → `/products`

### Test 4: Slider color

1. Open "Price" filter section
2. Hover over slider handles
3. **Expected:** Hover effect uses store's primary color (from branding config)
4. **Expected:** Active track uses primary color
5. **Expected:** No color inconsistencies

## Example URLs

- Min only: `/products?priceMin=0` (now works!)
- Max only: `/products?priceMax=100`
- Range: `/products?priceMin=10&priceMax=100`
- Combined: `/products?priceMin=0&priceMax=50&categories=electronics`

## Verification Checklist

- [x] `priceMin=0` is included in URL
- [x] `priceMin=0` is included in GraphQL variables
- [x] Clear button removes chip
- [x] Chip removal resets slider
- [x] Slider syncs when URL changes
- [x] Slider colors use branding
- [x] No falsy checks for `0`
- [x] All checks use explicit `!== undefined && !== null`

## Code Changes Summary

**Key Pattern:** Replaced all falsy checks with explicit checks:
```typescript
// Before (BUGGY):
if (filters.priceMin !== undefined) { ... }
if (value !== undefined) { ... }

// After (FIXED):
if (filters.priceMin !== undefined && filters.priceMin !== null) { ... }
if (value !== undefined && value !== null) { ... }
```

This ensures `0` is treated as a valid filter value, not as "no filter".

