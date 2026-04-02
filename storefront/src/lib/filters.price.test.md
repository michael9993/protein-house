# Price Range Filter - Test Cases

This document outlines test cases for the price range filter functionality.

## Test Cases

### 1. URL Parsing Tests

#### Test: Parse priceMin from URL
```typescript
const params = new URLSearchParams("priceMin=10");
const filters = parseFiltersFromURL(params);
// Expected: { priceMin: 10, priceMax: undefined, ... }
```

#### Test: Parse priceMax from URL
```typescript
const params = new URLSearchParams("priceMax=100");
const filters = parseFiltersFromURL(params);
// Expected: { priceMin: undefined, priceMax: 100, ... }
```

#### Test: Parse both priceMin and priceMax
```typescript
const params = new URLSearchParams("priceMin=10&priceMax=100");
const filters = parseFiltersFromURL(params);
// Expected: { priceMin: 10, priceMax: 100, ... }
```

#### Test: Parse invalid price values
```typescript
const params = new URLSearchParams("priceMin=abc&priceMax=xyz");
const filters = parseFiltersFromURL(params);
// Expected: { priceMin: undefined, priceMax: undefined, ... }
```

### 2. URL Serialization Tests

#### Test: Serialize priceMin to URL
```typescript
const updates = { priceMin: 10 };
const params = serializeFiltersToURL(updates, new URLSearchParams());
// Expected: params.get("priceMin") === "10"
```

#### Test: Serialize priceMax to URL
```typescript
const updates = { priceMax: 100 };
const params = serializeFiltersToURL(updates, new URLSearchParams());
// Expected: params.get("priceMax") === "100"
```

#### Test: Remove price filter from URL
```typescript
const currentParams = new URLSearchParams("priceMin=10&priceMax=100");
const updates = { priceMin: undefined, priceMax: undefined };
const params = serializeFiltersToURL(updates, currentParams);
// Expected: params.get("priceMin") === null, params.get("priceMax") === null
```

### 3. GraphQL Filter Building Tests

#### Test: Build GraphQL filter with priceMin only
```typescript
const filters = { priceMin: 10, priceMax: undefined, ... };
const graphqlFilter = buildGraphQLFilter({ filters });
// Expected: { minimalPrice: { gte: 10, lte: undefined } }
```

#### Test: Build GraphQL filter with priceMax only
```typescript
const filters = { priceMin: undefined, priceMax: 100, ... };
const graphqlFilter = buildGraphQLFilter({ filters });
// Expected: { minimalPrice: { gte: undefined, lte: 100 } }
```

#### Test: Build GraphQL filter with both prices
```typescript
const filters = { priceMin: 10, priceMax: 100, ... };
const graphqlFilter = buildGraphQLFilter({ filters });
// Expected: { minimalPrice: { gte: 10, lte: 100 } }
```

#### Test: Build GraphQL filter without price
```typescript
const filters = { priceMin: undefined, priceMax: undefined, ... };
const graphqlFilter = buildGraphQLFilter({ filters });
// Expected: minimalPrice should not be in filter object
```

### 4. Validation Tests

#### Test: Min price must be >= 0
```typescript
// Input: priceMin = -5
// Expected: Should be clamped to 0 or ignored
```

#### Test: Max price must be >= min price
```typescript
// Input: priceMin = 100, priceMax = 50
// Expected: priceMax should be cleared or ignored
```

#### Test: Empty values allowed
```typescript
// Input: priceMin = "", priceMax = ""
// Expected: Both should be undefined (no bound)
```

### 5. hasActiveFilters Tests

#### Test: Price filter active with priceMin
```typescript
const filters = { priceMin: 10, priceMax: undefined, ... };
const active = hasActiveFilters(filters);
// Expected: true
```

#### Test: Price filter active with priceMax
```typescript
const filters = { priceMin: undefined, priceMax: 100, ... };
const active = hasActiveFilters(filters);
// Expected: true
```

#### Test: Price filter not active
```typescript
const filters = { priceMin: undefined, priceMax: undefined, ... };
const active = hasActiveFilters(filters);
// Expected: false (if no other filters)
```

### 6. countActiveFilters Tests

#### Test: Count price filter as one
```typescript
const filters = { priceMin: 10, priceMax: 100, ... };
const count = countActiveFilters(filters);
// Expected: 1 (price range counts as one filter)
```

### 7. Integration Tests

#### Test: URL -> State -> GraphQL
```typescript
// 1. Parse from URL: ?priceMin=10&priceMax=100
// 2. Build GraphQL filter
// 3. Verify GraphQL filter has correct minimalPrice
```

#### Test: Clear all filters includes price
```typescript
const filters = { priceMin: 10, priceMax: 100, ... };
const cleared = clearAllFilters();
// Expected: { priceMin: undefined, priceMax: undefined, ... }
```

## Manual Testing Steps

1. **Test URL Parameters:**
   - Navigate to `/products?priceMin=10&priceMax=100`
   - Verify products are filtered by price range
   - Check URL updates when changing price inputs

2. **Test Debouncing:**
   - Type in price input fields
   - Verify URL doesn't update immediately
   - Wait 400ms, verify URL updates

3. **Test Validation:**
   - Enter negative price in min field → should clamp to 0
   - Enter max < min → should clear max
   - Clear inputs → should remove from URL

4. **Test Active Filters:**
   - Set price range
   - Verify "Active Filters" shows price tag
   - Click remove on price tag → should clear filter

5. **Test Mobile:**
   - Open filters on mobile
   - Verify price inputs stack vertically
   - Test touch interactions

6. **Test Back/Forward Navigation:**
   - Set price filter
   - Navigate away
   - Press back button
   - Verify price filter is restored

