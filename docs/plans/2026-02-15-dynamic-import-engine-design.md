# Dynamic Import Engine — Design Document

**Goal:** Make the Bulk Manager's product import universal — any CSV/Excel from any source (Shopify, WooCommerce, Magento, istores, custom) should work dynamically, auto-creating missing attributes, attribute values, brand pages, and product type assignments on the fly.

**Architecture:** Two-layer enhancement (Approach A). The Bulk Manager gets a "dynamic attribute engine" that auto-creates infrastructure before importing products. The import converter gets smarter at extracting data from istores Excels. Both work independently.

**Tech Stack:** tRPC mutations in products-router.ts, Saleor GraphQL API (attributeCreate, attributeValueCreate, productTypeUpdate, pageCreate), React UI in products.tsx.

---

## Part 1: Bulk Manager — Dynamic Attribute Engine

### Core Concept

Insert a new **pre-processing phase** into `products-router.ts` that runs AFTER CSV parsing but BEFORE the product creation loop. This phase scans all rows, discovers what's needed, and creates missing infrastructure in Saleor.

### Pre-Processing Pipeline

#### Step 1: Attribute Discovery (Scan CSV)

Iterate ALL parsed rows to build a complete picture:

```
For each row:
  For each key starting with "attr:" or "variantAttr:":
    → Extract attribute name (e.g., "attr:Color" → "Color")
    → Add value to Set<string> for that attribute
    → Track which product types use this attribute
```

Output: `Map<attrColumn, { values: Set<string>, productTypes: Set<string>, isVariant: boolean }>`

#### Step 2: Match Against Saleor

For each discovered attribute column, classify it:

| Classification | Meaning |
|---|---|
| `EXISTS_COMPLETE` | Attribute exists on product type, all values exist |
| `EXISTS_MISSING_VALUES` | Attribute exists but some values aren't in Saleor |
| `EXISTS_NOT_ON_TYPE` | Attribute exists in Saleor but not assigned to this product type |
| `NOT_IN_SALEOR` | Attribute doesn't exist at all |

Also for SINGLE_REFERENCE attributes (like Brand): check `pageNameMap` for missing pages.

#### Step 3: Auto-Create Infrastructure

Execute mutations in this order (dependencies flow downward):

1. **Create new attributes** (`attributeCreate`) — for `NOT_IN_SALEOR` columns
   - Detect `inputType` from data (see Type Detection below)
   - Set `type: PRODUCT_TYPE`, `visibleInStorefront: true`, `filterableInDashboard: true`

2. **Create missing attribute values** (`attributeValueCreate`) — for `EXISTS_MISSING_VALUES`
   - Add each missing value to the existing attribute
   - For DROPDOWN/MULTISELECT/SWATCH types only (other types don't have predefined values)

3. **Assign attributes to product types** (`productTypeUpdate`) — for `EXISTS_NOT_ON_TYPE`
   - Use `addProductAttributes` or `addVariantAttributes` based on `attr:` vs `variantAttr:` prefix

4. **Create missing pages** (`pageCreate`) — for SINGLE_REFERENCE attributes where the page doesn't exist
   - Detect PageType from attribute's configured `referenceTypes`, or search for a PageType named "Brand"
   - Create page with title = value, slug = slugified value, isPublished = true

5. **Refresh maps** — re-fetch `productTypeMap` and `pageNameMap` so the existing `buildAttributeInput()` works correctly

#### Step 4: Type Detection for New Attributes

When creating a brand new attribute (not in Saleor), detect `inputType` from the collected values:

```
values = all unique non-empty values across all rows for this column

if every value matches /^(true|false|yes|no|1|0)$/i → BOOLEAN
if every value matches /^-?\d+(\.\d+)?$/ → NUMERIC
if any value contains ";" → MULTISELECT
else → DROPDOWN
```

For DROPDOWN/MULTISELECT: the unique values become the initial attribute values.

#### Step 5: Configurable Defaults

New tRPC input fields:

```typescript
autoCreateAttributes: z.boolean().default(true),
autoCreatePages: z.boolean().default(true),
attributeDefaults: z.record(z.string(), z.string()).optional(),
```

When processing a product row:
- If `attr:Color` cell is empty AND `attributeDefaults["attr:Color"]` = "N/A" → use "N/A"
- If `attr:Color` cell is empty AND no default → skip the attribute (don't assign)

### Mutations Needed

| Mutation | Permission | Purpose |
|---|---|---|
| `attributeCreate` | `MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES` | Create new attributes |
| `attributeValueCreate` | `MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES` | Add values to existing attributes |
| `productTypeUpdate` | `MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES` | Assign attributes to product types |
| `pageCreate` | `MANAGE_PAGES` | Create brand/reference pages |
| `pageTypeCreate` | `MANAGE_PAGE_TYPES_AND_ATTRIBUTES` | Create page type if none exists |

### Permission Changes

Update `apps/apps/bulk-manager/src/pages/api/manifest.ts` to add:
- `MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES`
- `MANAGE_PAGES`
- `MANAGE_PAGE_TYPES_AND_ATTRIBUTES`

### Pre-fetch Enhancement

Current pre-fetch queries need expansion:

```graphql
# Existing: product types with attributes (already fetched)
# NEW: Also fetch attribute values for each attribute
query ProductTypesWithAttrs($after: String) {
  productTypes(first: 100, after: $after) {
    edges {
      node {
        id name slug
        productAttributes {
          id slug name inputType entityType
          choices(first: 100) {   # ← NEW: fetch existing values
            edges { node { id name slug } }
          }
        }
        variantAttributes {
          id slug name inputType entityType
          choices(first: 100) {   # ← NEW
            edges { node { id name slug } }
          }
        }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

Also fetch all attributes globally (not just those on product types):

```graphql
query AllAttributes($after: String) {
  attributes(first: 100, after: $after) {
    edges {
      node {
        id slug name inputType entityType type
        choices(first: 100) {
          edges { node { id name slug } }
        }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

---

## Part 2: Import Converter Enhancement

### Filters Column Parser

The istores `Filters` column (col 39) contains rich attribute data:

```
סוג המוצר>נעליים,מסנן מותג>Nike,מסנן מין>גברים,מסנן צבע>שחור
```

Parse into dynamic `attr:*` columns:

```typescript
function parseFilters(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!raw) return attrs;

  for (const pair of raw.split(",")) {
    const [key, value] = pair.split(">").map(s => s.trim());
    if (!key || !value) continue;

    // Map Hebrew filter names to English attribute names
    const attrName = FILTER_NAME_MAP[key] || key;
    attrs[attrName] = value;
  }
  return attrs;
}

const FILTER_NAME_MAP: Record<string, string> = {
  "סוג המוצר": "Product Type",   // Already handled by detectProductType
  "מסנן מותג": "Brand",
  "מסנן מין": "Gender",
  "מסנן צבע": "Color",
  "מסנן סוג הבגד": "Apparel Type",
  "מסנן סגנון": "Style",
  // ... more as discovered
};
```

### Additional Column Extraction

| Source Column | Output Column | Notes |
|---|---|---|
| Model (col 9) | `attr:Model` | PLAIN_TEXT attribute |
| Weight (col 22) | `weight` field | Already a standard product field |
| Filter: Color | `variantAttr:Color` | Only if not already from variant data |
| Filter: Style | `attr:Style` | Enrich existing Style attribute |

### Priority Note

This is secondary to Part 1. The Bulk Manager engine alone makes any CSV work. The converter enhancement is specific to the istores format and can be done as a follow-up.

---

## Part 3: UI Changes (`products.tsx`)

### New Import Options Section

After the existing field mapping step, add:

```
┌─ Dynamic Import Options ────────────────────────┐
│                                                   │
│ [x] Auto-create missing attributes & values       │
│ [x] Auto-create brand/reference pages             │
│                                                   │
│ ── Attribute Defaults (optional) ──               │
│ attr:Color     [________]  (used when cell empty) │
│ attr:Material  [________]                         │
│ attr:Gender    [________]                         │
│                                                   │
└───────────────────────────────────────────────────┘
```

The "Attribute Defaults" section is populated dynamically from the discovered `attr:*` columns in the uploaded CSV. Only shown if there are `attr:*` columns.

---

## Files Changed

| File | Change | Lines (est.) |
|---|---|---|
| `products-router.ts` | Add pre-processing pipeline (Steps 1-5), modify input schema | +250 |
| `products.tsx` | Add Dynamic Import Options UI section | +80 |
| `manifest.ts` | Add new permissions | +3 |
| `import-converter.ts` | Add filters parser, model extraction (Part 2, secondary) | +60 |
| `field-mapper.ts` | Add `weight` to product field aliases | +2 |

---

## Edge Cases

1. **Attribute with 100+ values**: `choices(first: 100)` pagination — need to handle `hasNextPage` for attribute values
2. **Duplicate attribute slugs**: When creating a new attribute, Saleor auto-generates slug from name. Check for conflicts.
3. **PageType doesn't exist**: If creating brand pages but no "Brand" PageType exists, create one first.
4. **Mixed product types**: CSV has products across multiple types (Shoes, Tops). Each type may need different attributes assigned.
5. **SINGLE_REFERENCE page type detection**: Use attribute's `entityType` (PAGE) + look for PageType matching attribute name (e.g., "Brand" attribute → "Brand" PageType).
6. **Value normalization**: "Red" and "red" should be the same value. Normalize to title case when creating.
