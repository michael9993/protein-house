# Price Range Slider Filter - Implementation Summary

## Overview

The price range filter has been upgraded from input fields to a **dual-handle slider-based UX** with proper clearing behavior in both the Price filter section and Active Filters chips.

## Files Modified

1. **`storefront/src/ui/components/Filters/PriceRangeFilter.tsx`**
   - Replaced input-based UI with `react-slider` dual-handle range slider
   - Added debounced updates (300ms after drag ends)
   - Implemented proper state synchronization with URL
   - Added accessibility features (ARIA labels, keyboard support)

2. **`storefront/src/ui/components/Filters/PriceRangeFilter.css`** (NEW)
   - Custom styles for the slider component
   - Uses CSS variables for dynamic branding colors
   - Responsive and accessible styling

3. **`storefront/src/app/[channel]/(main)/products/ActiveFiltersTags.tsx`**
   - Updated `formatPriceRange` to use consistent currency formatting
   - Clearing from chip already works correctly (calls `updateFilters`)

## Installation Required

**IMPORTANT:** You need to install the `react-slider` library:

```bash
cd storefront
pnpm add react-slider @types/react-slider
```

Or with npm:
```bash
cd storefront
npm install react-slider @types/react-slider
```

## Features

### 1. Slider UI
- ✅ Dual-handle range slider (min/max)
- ✅ Current values displayed above slider (formatted with currency)
- ✅ Dynamic step calculation based on price range
- ✅ Minimum distance between handles to prevent overlap
- ✅ Visual feedback during drag (immediate UI updates)

### 2. URL & State Management
- ✅ URL params: `priceMin` and `priceMax` (canonical, consistent)
- ✅ URL is source of truth (slider syncs from URL on load/back/forward)
- ✅ Clearing removes params from URL (not empty strings)

### 3. Debouncing
- ✅ Updates slider UI immediately during drag
- ✅ Debounces URL updates (300ms after drag ends)
- ✅ Prevents refetch loops

### 4. Clearing Behavior (CRITICAL - Both Places Work)

#### A) Clear in Price Filter Section:
- ✅ "Clear Price Filter" button resets slider to full range
- ✅ Removes `priceMin/priceMax` from URL
- ✅ Removes filter from GraphQL variables
- ✅ Updates product list

#### B) Remove from Active Filters Chip:
- ✅ Clicking "X" on price chip calls `updateFilters({ priceMin: undefined, priceMax: undefined })`
- ✅ Slider automatically syncs (via useEffect watching URL state)
- ✅ Resets to full range
- ✅ Removes from URL and GraphQL variables
- ✅ Updates product list
- ✅ No stale UI (slider reflects cleared state immediately)

#### C) Clear All Filters:
- ✅ "Clear all filters" already clears price (via `clearAllFilters()`)
- ✅ Slider syncs automatically

### 5. Accessibility
- ✅ ARIA labels: "Minimum price", "Maximum price"
- ✅ ARIA value text: "Price range: $X.XX to $Y.YY"
- ✅ Keyboard navigation (arrow keys, Home/End)
- ✅ Focus visible indicators
- ✅ Screen reader support

### 6. Price Bounds
- ✅ Default bounds: $0 - $1000 (safe defaults)
- ✅ Can be overridden via props: `minPrice` and `maxPrice`
- ✅ Future: Can calculate from product data (see TODO below)

## How It Works

### State Flow:
1. **User drags slider** → Updates local `sliderValues` state immediately
2. **User stops dragging** → After 300ms debounce, calls `debouncedUpdate()`
3. **debouncedUpdate** → Calls `updateFilters()` with priceMin/priceMax
4. **updateFilters** → Updates URL params via `useProductFilters` hook
5. **URL change** → Triggers page re-render with new filter
6. **GraphQL query** → Uses `buildGraphQLFilter()` which maps to `minimalPrice: { gte, lte }`

### Clearing Flow:
1. **User clicks Clear** → `handleClear()` called
2. **handleClear** → Resets `sliderValues` to `[minBound, maxBound]`
3. **handleClear** → Calls `updateFilters({ priceMin: undefined, priceMax: undefined })`
4. **URL updated** → Params removed
5. **useEffect in PriceRangeFilter** → Detects URL change, syncs slider (if not dragging)

### Active Filters Clearing:
1. **User clicks X on chip** → `updateFilters({ priceMin: undefined, priceMax: undefined })` called
2. **URL updated** → Params removed
3. **useEffect in PriceRangeFilter** → Detects `filters.priceMin`/`filters.priceMax` are undefined
4. **Slider syncs** → `setSliderValues([currentMin, currentMax])` where currentMin/max = bounds
5. **UI updates** → Slider resets to full range

## Testing

### Manual Testing Steps:

1. **Install the library:**
   ```bash
   cd storefront && pnpm add react-slider @types/react-slider
   ```

2. **Test Slider Interaction:**
   - Navigate to `/products`
   - Open "Price" filter section
   - Drag min handle → Verify value updates immediately
   - Drag max handle → Verify value updates immediately
   - Release handle → Wait 300ms → Verify URL updates (`?priceMin=X&priceMax=Y`)
   - Verify products are filtered

3. **Test Clearing from Price Section:**
   - Set price range via slider
   - Click "Clear Price Filter" button
   - Verify slider resets to full range
   - Verify URL params removed
   - Verify products show all prices

4. **Test Clearing from Active Filters:**
   - Set price range via slider
   - Verify chip appears in "Active Filters" (e.g., "$10.00 - $100.00")
   - Click "X" on price chip
   - Verify slider resets to full range immediately
   - Verify URL params removed
   - Verify products show all prices

5. **Test Clear All:**
   - Set multiple filters (price + categories + brands)
   - Click "Clear all filters"
   - Verify price slider resets
   - Verify all filters cleared

6. **Test URL Sharing:**
   - Set price range: `?priceMin=10&priceMax=100`
   - Copy URL and open in new tab
   - Verify slider positions reflect URL params
   - Verify products filtered correctly

7. **Test Back/Forward Navigation:**
   - Set price range
   - Navigate to product detail page
   - Press browser back button
   - Verify slider positions restored
   - Verify filter still active

8. **Test Accessibility:**
   - Tab to slider handles
   - Use arrow keys to adjust values
   - Verify screen reader announces values
   - Verify focus indicators visible

### Example URLs:

- Min only: `/products?priceMin=10`
- Max only: `/products?priceMax=100`
- Range: `/products?priceMin=10&priceMax=100`
- Combined: `/products?priceMin=10&priceMax=100&categories=electronics&brands=nike`

## GraphQL Mapping

The filter maps to Saleor's GraphQL schema:

```graphql
filter: {
  minimalPrice: {
    gte: 10,  # priceMin
    lte: 100  # priceMax
  }
}
```

Uses `minimalPrice` (lowest variant price after discounts) for accurate filtering.

## Future Enhancements

1. **Calculate Price Bounds from Products:**
   - Query products to get actual min/max prices
   - Pass as props: `<PriceRangeFilter minPrice={actualMin} maxPrice={actualMax} />`
   - Or fetch in component from product list context

2. **Currency from Channel:**
   - Get currency code from channel context
   - Pass to `PriceRangeFilter` and `formatPriceRange`
   - Use actual currency symbol from products

3. **Price Aggregations:**
   - If Saleor supports price facets/aggregations, use those for bounds
   - More accurate than scanning all products

## Notes

- Default bounds are $0 - $1000 (safe defaults for most e-commerce)
- Debounce is 300ms (adjustable in `handleSliderChange`)
- Step is dynamic: `(maxBound - minBound) / 1000` for smooth interaction
- Minimum distance between handles: `(maxBound - minBound) / 100` to prevent overlap
- Slider uses CSS variables for branding colors (dynamic per store config)

## Troubleshooting

**Slider not appearing:**
- Ensure `react-slider` is installed
- Check browser console for import errors

**Slider not syncing when cleared from Active Filters:**
- Verify `useEffect` dependencies include `currentMin`, `currentMax`, `isDragging`
- Check that `updateFilters` is called with `undefined` values (not empty strings)

**URL params not updating:**
- Check `useProductFilters` hook is working
- Verify `serializeFiltersToURL` handles `undefined` correctly (removes params)

**GraphQL filter not applied:**
- Verify `buildGraphQLFilter` maps `priceMin`/`priceMax` to `minimalPrice`
- Check GraphQL query includes `filter` variable

