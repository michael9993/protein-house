# Dynamic Import Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Bulk Manager's product import universal — auto-creates missing attributes, values, brand pages, and product type assignments so any CSV from any platform works.

**Architecture:** New pre-processing pipeline in `products-router.ts` that scans CSV data, discovers missing infrastructure, and creates it in Saleor before the existing product creation loop runs. UI gets toggles and attribute defaults. Manifest gets new permissions.

**Tech Stack:** tRPC (zod + mutations), Saleor GraphQL API, React (macaw-ui), TypeScript.

---

### Task 1: Add Permissions to Manifest

**Files:**
- Modify: `apps/apps/bulk-manager/src/pages/api/manifest.ts:26-33`

**Step 1: Add the 3 new permissions**

In `manifest.ts`, update the `permissions` array from:

```typescript
permissions: [
  "MANAGE_PRODUCTS",
  "MANAGE_ORDERS",
  "MANAGE_USERS",
  "MANAGE_APPS",
  "MANAGE_DISCOUNTS",
  "MANAGE_GIFT_CARD",
] as unknown as AppManifest["permissions"],
```

to:

```typescript
permissions: [
  "MANAGE_PRODUCTS",
  "MANAGE_ORDERS",
  "MANAGE_USERS",
  "MANAGE_APPS",
  "MANAGE_DISCOUNTS",
  "MANAGE_GIFT_CARD",
  "MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES",
  "MANAGE_PAGES",
  "MANAGE_PAGE_TYPES_AND_ATTRIBUTES",
] as unknown as AppManifest["permissions"],
```

**Step 2: Verify build**

Run: `docker exec saleor-bulk-manager-app-dev pnpm build`
Expected: Build succeeds (no type errors).

**Step 3: Reinstall app in Saleor Dashboard**

After deploying, the app must be reinstalled in the Saleor Dashboard for the new permissions to take effect. This is a manual step — go to Dashboard > Apps > Bulk Manager > ... > Reinstall.

**Step 4: Commit**

```bash
git add apps/apps/bulk-manager/src/pages/api/manifest.ts
git commit -m "feat(bulk-manager): add attribute, page, and page-type permissions for dynamic import"
```

---

### Task 2: Expand Pre-fetch Queries (Attribute Values + Global Attributes)

This task modifies the existing pre-fetch section in `products-router.ts` to also fetch attribute values (choices) and all global attributes.

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts:11-23` (interfaces)
- Modify: `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts:151-191` (ProductTypes query)

**Step 1: Extend interfaces to include attribute values**

Replace the existing `AttributeInfo` and `ProductTypeInfo` interfaces (lines 11-23):

```typescript
interface AttributeValueInfo {
  id: string;
  name: string;
  slug: string;
}

interface AttributeInfo {
  id: string;
  slug: string;
  name: string;
  inputType: string;
  entityType?: string;
  values: AttributeValueInfo[]; // ← NEW: existing attribute values
}

interface ProductTypeInfo {
  id: string;
  productAttributes: AttributeInfo[];
  variantAttributes: AttributeInfo[];
}
```

**Step 2: Update the ProductTypes pre-fetch query to include `choices`**

Replace the query at lines ~157-170 to fetch attribute values:

```typescript
const ptResult = await ctx.apiClient.query(
  `query ProductTypesWithAttrs($after: String) {
    productTypes(first: 100, after: $after) {
      edges {
        node {
          id name slug
          productAttributes {
            id slug name inputType entityType
            choices(first: 100) { edges { node { id name slug } } }
          }
          variantAttributes {
            id slug name inputType entityType
            choices(first: 100) { edges { node { id name slug } } }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }`,
  { after }
);
```

**Step 3: Update the `mapAttr` function to include values**

Replace the `mapAttr` helper (lines ~174-178):

```typescript
const mapAttr = (a: any): AttributeInfo => ({
  id: a.id, slug: a.slug, name: a.name,
  inputType: a.inputType || "DROPDOWN",
  entityType: a.entityType || undefined,
  values: (a.choices?.edges || []).map((e: any) => ({
    id: e.node.id, name: e.node.name, slug: e.node.slug,
  })),
});
```

**Step 4: Add global attributes map (for attributes not yet on any product type)**

Add this block AFTER the productTypeMap pre-fetch (after line ~191):

```typescript
// ─── Pre-fetch ALL attributes globally (for creating/assigning unassigned attrs) ───
interface GlobalAttrInfo {
  id: string; slug: string; name: string; inputType: string; entityType?: string;
  type: string; // "PRODUCT_TYPE" or "PAGE_TYPE"
  values: AttributeValueInfo[];
}
const globalAttributeMap = new Map<string, GlobalAttrInfo>(); // slug/name → info
try {
  let hasNext = true;
  let after: string | undefined;
  while (hasNext) {
    const attrResult = await ctx.apiClient.query(
      `query AllAttributes($after: String) {
        attributes(first: 100, after: $after, filter: { type: PRODUCT_TYPE }) {
          edges {
            node {
              id slug name inputType entityType type
              choices(first: 100) { edges { node { id name slug } } }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { after }
    );
    for (const e of (attrResult.data?.attributes?.edges || [])) {
      const node = e.node;
      const info: GlobalAttrInfo = {
        id: node.id, slug: node.slug, name: node.name,
        inputType: node.inputType || "DROPDOWN",
        entityType: node.entityType || undefined,
        type: node.type || "PRODUCT_TYPE",
        values: (node.choices?.edges || []).map((v: any) => ({
          id: v.node.id, name: v.node.name, slug: v.node.slug,
        })),
      };
      globalAttributeMap.set(node.slug.toLowerCase(), info);
      globalAttributeMap.set(node.name.toLowerCase(), info);
    }
    hasNext = attrResult.data?.attributes?.pageInfo?.hasNextPage || false;
    after = attrResult.data?.attributes?.pageInfo?.endCursor;
  }
} catch { /* ignore */ }
```

**Step 5: Also pre-fetch page types (for auto-creating brand pages)**

Add this block AFTER the pages pre-fetch (after line ~287):

```typescript
// ─── Pre-fetch page types (for auto-creating reference pages) ───
const pageTypeMap = new Map<string, string>(); // name/slug → ID
try {
  const ptResult = await ctx.apiClient.query(
    `query PageTypesLookup { pageTypes(first: 100) { edges { node { id name slug } } } }`, {}
  );
  for (const e of (ptResult.data?.pageTypes?.edges || [])) {
    pageTypeMap.set(e.node.name.toLowerCase(), e.node.id);
    if (e.node.slug) pageTypeMap.set(e.node.slug.toLowerCase(), e.node.id);
  }
} catch { /* ignore */ }
```

**Step 6: Verify build**

Run: `docker compose -f infra/docker-compose.dev.yml restart saleor-bulk-manager-app`
Run: `docker exec saleor-bulk-manager-app-dev pnpm build`
Expected: Build succeeds. Existing import still works (new fields just add `values: []` to existing flow).

**Step 7: Commit**

```bash
git add apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts
git commit -m "feat(bulk-manager): expand pre-fetch to include attribute values, global attributes, and page types"
```

---

### Task 3: Add New Input Fields to tRPC Schema

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts:94-104` (input schema)

**Step 1: Add the 3 new input fields**

Expand the `.input()` z.object from:

```typescript
z.object({
  rows: z.array(z.record(z.string())),
  channelSlugs: z.array(z.string()).min(1),
  fieldMappings: z.record(z.string()),
  productTypeId: z.string().optional().default(""),
  categoryId: z.string().optional(),
  warehouseId: z.string().optional(),
  taxClassId: z.string().optional(),
  upsertMode: z.boolean().optional().default(false),
})
```

to:

```typescript
z.object({
  rows: z.array(z.record(z.string())),
  channelSlugs: z.array(z.string()).min(1),
  fieldMappings: z.record(z.string()),
  productTypeId: z.string().optional().default(""),
  categoryId: z.string().optional(),
  warehouseId: z.string().optional(),
  taxClassId: z.string().optional(),
  upsertMode: z.boolean().optional().default(false),
  autoCreateAttributes: z.boolean().optional().default(true),
  autoCreatePages: z.boolean().optional().default(true),
  attributeDefaults: z.record(z.string(), z.string()).optional(),
})
```

**Step 2: Verify build**

Run: `docker exec saleor-bulk-manager-app-dev pnpm build`
Expected: Build succeeds. The new fields have defaults so existing callers are unaffected.

**Step 3: Commit**

```bash
git add apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts
git commit -m "feat(bulk-manager): add autoCreateAttributes, autoCreatePages, attributeDefaults to import input"
```

---

### Task 4: Implement the Dynamic Attribute Engine (Core)

This is the main task. Add the pre-processing pipeline that scans CSV rows and auto-creates missing infrastructure.

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts` — insert new block between the pre-fetch section and the `// ─── Process each product group ───` line (~line 321)

**Step 1: Add type detection helper function**

Add this BEFORE `export const productsRouter` (before line 92):

```typescript
/**
 * Detect the best Saleor attribute inputType from a set of values.
 */
function detectInputType(values: Set<string>): string {
  const arr = Array.from(values).filter(Boolean);
  if (arr.length === 0) return "DROPDOWN";

  const boolPattern = /^(true|false|yes|no|1|0)$/i;
  if (arr.every(v => boolPattern.test(v))) return "BOOLEAN";

  const numPattern = /^-?\d+(\.\d+)?$/;
  if (arr.every(v => numPattern.test(v))) return "NUMERIC";

  if (arr.some(v => v.includes(";"))) return "MULTISELECT";

  return "DROPDOWN";
}

/**
 * Slugify a string for Saleor (attribute slugs, page slugs, etc.)
 */
function slugifyForSaleor(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

**Step 2: Add the attribute discovery and auto-create pipeline**

Insert this block right BEFORE `// ─── Process each product group ───` (before the `for (const [, group] of productGroups)` loop):

```typescript
// ═══════════════════════════════════════════════════════════════════
// DYNAMIC ATTRIBUTE ENGINE — auto-create missing attributes/values/pages
// ═══════════════════════════════════════════════════════════════════
if (input.autoCreateAttributes) {
  // ── Step 1: Discover all attr:/variantAttr: columns and their values ──
  interface DiscoveredAttr {
    columnKey: string;      // e.g., "attr:Color" or "variantAttr:Shoe size"
    attrName: string;       // e.g., "Color" or "Shoe size"
    isVariant: boolean;
    values: Set<string>;
    productTypes: Set<string>; // product type names/IDs used with this attr
  }

  const discoveredAttrs = new Map<string, DiscoveredAttr>();

  for (const row of mappedRows) {
    const ptName = row.productType || input.productTypeId || "";
    for (const [key, val] of Object.entries(row)) {
      const isProductAttr = key.startsWith("attr:");
      const isVariantAttr = key.startsWith("variantAttr:");
      if (!isProductAttr && !isVariantAttr) continue;

      const attrName = isProductAttr ? key.substring(5) : key.substring(12);
      if (!discoveredAttrs.has(key)) {
        discoveredAttrs.set(key, {
          columnKey: key,
          attrName,
          isVariant: isVariantAttr,
          values: new Set(),
          productTypes: new Set(),
        });
      }
      const disc = discoveredAttrs.get(key)!;
      if (val) disc.values.add(val.trim());
      if (ptName) disc.productTypes.add(ptName.toLowerCase());
    }
  }

  // Apply attribute defaults to values set (so defaults get created too)
  if (input.attributeDefaults) {
    for (const [key, defaultVal] of Object.entries(input.attributeDefaults)) {
      if (defaultVal && discoveredAttrs.has(key)) {
        discoveredAttrs.get(key)!.values.add(defaultVal.trim());
      }
    }
  }

  // ── Step 2: Classify each discovered attribute ──
  const attrsToCreateValues: { attrId: string; missingValues: string[]; inputType: string }[] = [];
  const attrsToAssign: { attrId: string; productTypeId: string; isVariant: boolean }[] = [];
  const attrsToCreate: DiscoveredAttr[] = [];
  const pagesToCreate: { value: string; pageTypeName: string }[] = [];

  for (const [, disc] of discoveredAttrs) {
    const attrNameLower = disc.attrName.toLowerCase();

    // Check if attribute exists globally
    const globalAttr = globalAttributeMap.get(attrNameLower);

    if (globalAttr) {
      // Attribute exists in Saleor — check if values are missing (for DROPDOWN/MULTISELECT/SWATCH)
      if (["DROPDOWN", "MULTISELECT", "SWATCH"].includes(globalAttr.inputType)) {
        const existingValueNames = new Set(globalAttr.values.map(v => v.name.toLowerCase()));
        const existingValueSlugs = new Set(globalAttr.values.map(v => v.slug.toLowerCase()));
        const missing = Array.from(disc.values).filter(v =>
          !existingValueNames.has(v.toLowerCase()) && !existingValueSlugs.has(v.toLowerCase())
        );
        if (missing.length > 0) {
          attrsToCreateValues.push({ attrId: globalAttr.id, missingValues: missing, inputType: globalAttr.inputType });
        }
      }

      // Check if attribute is assigned to each product type that needs it
      for (const ptRef of disc.productTypes) {
        const ptInfo = productTypeMap.get(ptRef);
        if (!ptInfo) continue;
        const attrList = disc.isVariant ? ptInfo.variantAttributes : ptInfo.productAttributes;
        const isAssigned = attrList.some(a =>
          a.slug.toLowerCase() === globalAttr.slug.toLowerCase() ||
          a.name.toLowerCase() === globalAttr.name.toLowerCase()
        );
        if (!isAssigned) {
          attrsToAssign.push({ attrId: globalAttr.id, productTypeId: ptInfo.id, isVariant: disc.isVariant });
        }
      }

      // For SINGLE_REFERENCE to PAGE — check for missing pages
      if ((globalAttr.inputType === "SINGLE_REFERENCE" || globalAttr.inputType === "REFERENCE") &&
          globalAttr.entityType === "PAGE" && input.autoCreatePages) {
        for (const val of disc.values) {
          if (!pageNameMap.has(val.toLowerCase())) {
            pagesToCreate.push({ value: val, pageTypeName: disc.attrName });
          }
        }
      }
    } else {
      // Attribute doesn't exist at all — needs full creation
      attrsToCreate.push(disc);
    }
  }

  // ── Step 3: Create new attributes ──
  for (const disc of attrsToCreate) {
    const detectedType = detectInputType(disc.values);
    const slug = slugifyForSaleor(disc.attrName);

    try {
      const createInput: Record<string, any> = {
        name: disc.attrName,
        slug,
        inputType: detectedType,
        type: "PRODUCT_TYPE",
        visibleInStorefront: true,
        filterableInDashboard: true,
        filterableInStorefront: true,
      };

      // For DROPDOWN/MULTISELECT — include initial values
      if (detectedType === "DROPDOWN" || detectedType === "MULTISELECT") {
        createInput.values = Array.from(disc.values)
          .filter(Boolean)
          .map(v => ({ name: v }));
      }

      const result = await ctx.apiClient.mutation(
        `mutation AttributeCreate($input: AttributeCreateInput!) {
          attributeCreate(input: $input) {
            attribute { id slug name inputType entityType }
            errors { field code message }
          }
        }`,
        { input: createInput }
      );

      const created = result.data?.attributeCreate?.attribute;
      if (created) {
        console.log(`[DynamicImport] Created attribute "${disc.attrName}" (${detectedType}, slug: ${created.slug})`);
        // Add to global map for subsequent lookups
        const newInfo: GlobalAttrInfo = {
          id: created.id, slug: created.slug, name: created.name || disc.attrName,
          inputType: created.inputType || detectedType,
          entityType: created.entityType || undefined,
          type: "PRODUCT_TYPE",
          values: Array.from(disc.values).filter(Boolean).map((v, i) => ({
            id: `temp-${i}`, name: v, slug: slugifyForSaleor(v),
          })),
        };
        globalAttributeMap.set(created.slug.toLowerCase(), newInfo);
        globalAttributeMap.set(disc.attrName.toLowerCase(), newInfo);

        // Queue assignment to product types
        for (const ptRef of disc.productTypes) {
          const ptInfo = productTypeMap.get(ptRef);
          if (ptInfo) {
            attrsToAssign.push({ attrId: created.id, productTypeId: ptInfo.id, isVariant: disc.isVariant });
          }
        }
      } else {
        const errs = result.data?.attributeCreate?.errors;
        console.warn(`[DynamicImport] Failed to create attribute "${disc.attrName}":`, errs);
      }
    } catch (err: any) {
      console.warn(`[DynamicImport] Error creating attribute "${disc.attrName}":`, err.message?.substring(0, 100));
    }
  }

  // ── Step 4: Create missing attribute values ──
  for (const { attrId, missingValues, inputType } of attrsToCreateValues) {
    for (const val of missingValues) {
      try {
        const result = await ctx.apiClient.mutation(
          `mutation AttributeValueCreate($id: ID!, $input: AttributeValueCreateInput!) {
            attributeValueCreate(id: $id, input: $input) {
              attributeValue { id name slug }
              errors { field code message }
            }
          }`,
          { id: attrId, input: { name: val } }
        );
        const created = result.data?.attributeValueCreate?.attributeValue;
        if (created) {
          console.log(`[DynamicImport] Created value "${val}" for attribute ${attrId}`);
        } else {
          console.warn(`[DynamicImport] Failed to create value "${val}" for attribute ${attrId}:`,
            result.data?.attributeValueCreate?.errors);
        }
      } catch (err: any) {
        console.warn(`[DynamicImport] Error creating value "${val}":`, err.message?.substring(0, 100));
      }
    }
  }

  // ── Step 5: Assign attributes to product types ──
  // Deduplicate: same attr+type combo only once
  const assignmentKey = (a: typeof attrsToAssign[0]) => `${a.attrId}::${a.productTypeId}::${a.isVariant}`;
  const seenAssignments = new Set<string>();
  for (const assignment of attrsToAssign) {
    const key = assignmentKey(assignment);
    if (seenAssignments.has(key)) continue;
    seenAssignments.add(key);

    try {
      const field = assignment.isVariant ? "addVariantAttributes" : "addProductAttributes";
      const result = await ctx.apiClient.mutation(
        `mutation ProductTypeUpdate($id: ID!, $input: ProductTypeInput!) {
          productTypeUpdate(id: $id, input: $input) {
            productType { id }
            errors { field code message }
          }
        }`,
        { id: assignment.productTypeId, input: { [field]: [assignment.attrId] } }
      );
      if (result.data?.productTypeUpdate?.productType) {
        console.log(`[DynamicImport] Assigned attribute ${assignment.attrId} to product type ${assignment.productTypeId} (${field})`);
      } else {
        console.warn(`[DynamicImport] Failed to assign attribute:`, result.data?.productTypeUpdate?.errors);
      }
    } catch (err: any) {
      console.warn(`[DynamicImport] Error assigning attribute:`, err.message?.substring(0, 100));
    }
  }

  // ── Step 6: Auto-create missing pages (for SINGLE_REFERENCE attrs like Brand) ──
  if (input.autoCreatePages && pagesToCreate.length > 0) {
    // Find or create the page type
    const uniquePageTypes = [...new Set(pagesToCreate.map(p => p.pageTypeName.toLowerCase()))];
    const resolvedPageTypes = new Map<string, string>(); // name → pageTypeId

    for (const ptName of uniquePageTypes) {
      let ptId = pageTypeMap.get(ptName);
      if (!ptId) {
        // Create page type
        try {
          const result = await ctx.apiClient.mutation(
            `mutation PageTypeCreate($input: PageTypeCreateInput!) {
              pageTypeCreate(input: $input) {
                pageType { id name slug }
                errors { field code message }
              }
            }`,
            { input: { name: ptName.charAt(0).toUpperCase() + ptName.slice(1), slug: slugifyForSaleor(ptName) } }
          );
          ptId = result.data?.pageTypeCreate?.pageType?.id;
          if (ptId) {
            console.log(`[DynamicImport] Created page type "${ptName}" (${ptId})`);
            pageTypeMap.set(ptName, ptId);
          }
        } catch (err: any) {
          console.warn(`[DynamicImport] Error creating page type "${ptName}":`, err.message?.substring(0, 100));
        }
      }
      if (ptId) resolvedPageTypes.set(ptName, ptId);
    }

    // Create missing pages
    const seenPages = new Set<string>();
    for (const { value, pageTypeName } of pagesToCreate) {
      const key = value.toLowerCase();
      if (seenPages.has(key)) continue;
      seenPages.add(key);

      const pageTypeId = resolvedPageTypes.get(pageTypeName.toLowerCase());
      if (!pageTypeId) continue;

      try {
        const result = await ctx.apiClient.mutation(
          `mutation PageCreate($input: PageCreateInput!) {
            pageCreate(input: $input) {
              page { id title slug }
              errors { field code message }
            }
          }`,
          {
            input: {
              pageType: pageTypeId,
              title: value,
              slug: slugifyForSaleor(value),
              isPublished: true,
              content: JSON.stringify({ blocks: [{ type: "paragraph", data: { text: value } }] }),
            },
          }
        );
        const created = result.data?.pageCreate?.page;
        if (created) {
          console.log(`[DynamicImport] Created page "${value}" (${created.id})`);
          pageNameMap.set(value.toLowerCase(), created.id);
          if (created.slug) pageNameMap.set(created.slug.toLowerCase(), created.id);
        } else {
          console.warn(`[DynamicImport] Failed to create page "${value}":`, result.data?.pageCreate?.errors);
        }
      } catch (err: any) {
        console.warn(`[DynamicImport] Error creating page "${value}":`, err.message?.substring(0, 100));
      }
    }
  }

  // ── Step 7: Refresh product type map (attributes may have changed) ──
  productTypeMap.clear();
  try {
    let hasNext = true;
    let after: string | undefined;
    while (hasNext) {
      const ptResult = await ctx.apiClient.query(
        `query ProductTypesWithAttrs($after: String) {
          productTypes(first: 100, after: $after) {
            edges {
              node {
                id name slug
                productAttributes {
                  id slug name inputType entityType
                  choices(first: 100) { edges { node { id name slug } } }
                }
                variantAttributes {
                  id slug name inputType entityType
                  choices(first: 100) { edges { node { id name slug } } }
                }
              }
            }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        { after }
      );
      for (const e of (ptResult.data?.productTypes?.edges || [])) {
        const node = e.node;
        const mapAttr = (a: any): AttributeInfo => ({
          id: a.id, slug: a.slug, name: a.name,
          inputType: a.inputType || "DROPDOWN",
          entityType: a.entityType || undefined,
          values: (a.choices?.edges || []).map((ce: any) => ({
            id: ce.node.id, name: ce.node.name, slug: ce.node.slug,
          })),
        });
        const info: ProductTypeInfo = {
          id: node.id,
          productAttributes: (node.productAttributes || []).map(mapAttr),
          variantAttributes: (node.variantAttributes || []).map(mapAttr),
        };
        productTypeMap.set(node.name.toLowerCase(), info);
        productTypeMap.set(node.slug.toLowerCase(), info);
        productTypeMap.set(node.id, info);
      }
      hasNext = ptResult.data?.productTypes?.pageInfo?.hasNextPage || false;
      after = ptResult.data?.productTypes?.pageInfo?.endCursor;
    }
  } catch { /* ignore */ }

  console.log(`[DynamicImport] Pre-processing complete. Created: ${attrsToCreate.length} attrs, ${attrsToCreateValues.reduce((sum, a) => sum + a.missingValues.length, 0)} values, ${pagesToCreate.length} pages. Assigned: ${seenAssignments.size} attr→type mappings.`);
}
```

**Step 3: Add attribute defaults application to the existing product attribute building**

In the existing product attribute building loop (around line ~400-431), modify the value lookup to also check `attributeDefaults`. Replace:

```typescript
if (value) {
  const attrInput = buildAttributeInput(attr, value, pageNameMap);
  if (attrInput) productAttrs.push(attrInput);
}
```

with:

```typescript
// Apply attribute default if no value found
if (!value && input.attributeDefaults) {
  const defaultKey = `attr:${attr.name}`;
  const defaultKeySlug = `attr:${attr.slug}`;
  value = input.attributeDefaults[defaultKey] || input.attributeDefaults[defaultKeySlug] || undefined;
}

if (value) {
  const attrInput = buildAttributeInput(attr, value, pageNameMap);
  if (attrInput) productAttrs.push(attrInput);
}
```

Do the same for variant attributes (around line ~618-645). After the existing value lookup:

```typescript
// Apply variant attribute default if no value found
if (!value && input.attributeDefaults) {
  const defaultKey = `variantAttr:${attr.name}`;
  const defaultKeySlug = `variantAttr:${attr.slug}`;
  value = input.attributeDefaults[defaultKey] || input.attributeDefaults[defaultKeySlug] || undefined;
}

if (value) {
  const attrInput = buildAttributeInput(attr, value, pageNameMap);
  if (attrInput) variantAttrs.push(attrInput);
}
```

**Step 4: Verify build**

Run: `docker compose -f infra/docker-compose.dev.yml restart saleor-bulk-manager-app`
Run: `docker exec saleor-bulk-manager-app-dev pnpm build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts
git commit -m "feat(bulk-manager): implement dynamic attribute engine — auto-create attrs, values, pages, type assignments"
```

---

### Task 5: Update the Import UI (products.tsx)

Add the new toggles and attribute defaults section to the products import page.

**Files:**
- Modify: `apps/apps/bulk-manager/src/pages/products.tsx`

**Step 1: Add new state variables**

After the existing state variables (around line 36), add:

```typescript
const [autoCreateAttributes, setAutoCreateAttributes] = useState(true);
const [autoCreatePages, setAutoCreatePages] = useState(true);
const [attributeDefaults, setAttributeDefaults] = useState<Record<string, string>>({});
const [discoveredAttrColumns, setDiscoveredAttrColumns] = useState<string[]>([]);
```

**Step 2: Update handleFileSelected to discover attr: columns**

Modify `handleFileSelected` to also track discovered attribute columns. After the `return` in `handleFileSelected`, update it to:

```typescript
const handleFileSelected = useCallback(
  async (file: File) => {
    const content = await readFileContent(file);
    const fileType = file.name.endsWith(".csv") ? "csv" : "xlsx";
    const result = await parseFile.mutateAsync({
      fileContent: content,
      fileName: file.name,
      fileType: fileType as "csv" | "xlsx",
    });

    // Discover attr: and variantAttr: columns for the defaults UI
    const attrCols = result.headers.filter(
      (h: string) => h.startsWith("attr:") || h.startsWith("variantAttr:")
    );
    setDiscoveredAttrColumns(attrCols);

    return { rows: result.rows, headers: result.headers };
  },
  [parseFile]
);
```

**Step 3: Pass new fields to handleExecute**

In `handleExecute`, update the `importProducts.mutateAsync` call to include the new fields:

```typescript
const result = await importProducts.mutateAsync({
  rows: batch.rows,
  channelSlugs,
  fieldMappings: mappings,
  productTypeId: productTypeId || undefined,
  categoryId: categoryId || undefined,
  warehouseId: warehouseId || undefined,
  taxClassId: taxClassId || undefined,
  upsertMode,
  autoCreateAttributes,
  autoCreatePages,
  attributeDefaults: Object.keys(attributeDefaults).length > 0 ? attributeDefaults : undefined,
});
```

Also update the `useCallback` dependencies array to include the new state:

```typescript
[importProducts, channelSlugs, productTypeId, categoryId, warehouseId, taxClassId, upsertMode, autoCreateAttributes, autoCreatePages, attributeDefaults]
```

**Step 4: Add Dynamic Import Options UI section**

After the existing `UpsertToggle` and `ExcludeFieldsDropdown` section (after line ~241), add a new section:

```tsx
{tab === "import" && (
  <Box marginBottom={4} padding={4} borderRadius={4} __backgroundColor="#f0f9ff" __border="1px solid #bae6fd">
    <Text size={3} __fontWeight="600" __display="block" marginBottom={3} __color="#0369a1">
      Dynamic Import Options
    </Text>
    <Box display="flex" gap={4} alignItems="center" __flexWrap="wrap" marginBottom={3}>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={autoCreateAttributes}
          onChange={(e) => setAutoCreateAttributes(e.target.checked)}
        />
        <Text size={2}>Auto-create missing attributes &amp; values</Text>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={autoCreatePages}
          onChange={(e) => setAutoCreatePages(e.target.checked)}
        />
        <Text size={2}>Auto-create brand/reference pages</Text>
      </label>
    </Box>
    {discoveredAttrColumns.length > 0 && (
      <Box>
        <Text size={2} __fontWeight="500" __display="block" marginBottom={2} __color="#64748b">
          Attribute Defaults (used when CSV cell is empty)
        </Text>
        <Box display="flex" gap={3} __flexWrap="wrap">
          {discoveredAttrColumns.map((col) => (
            <Box key={col} __minWidth="180px">
              <Text size={1} __fontWeight="500" __display="block" marginBottom={1} __color="#475569">
                {col}
              </Text>
              <input
                type="text"
                value={attributeDefaults[col] || ""}
                onChange={(e) =>
                  setAttributeDefaults((prev) => ({
                    ...prev,
                    [col]: e.target.value,
                  }))
                }
                placeholder="Leave empty to skip"
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    )}
  </Box>
)}
```

**Step 5: Verify build**

Run: `docker compose -f infra/docker-compose.dev.yml restart saleor-bulk-manager-app`
Run: `docker exec saleor-bulk-manager-app-dev pnpm build`
Expected: Build succeeds. Import page shows new toggles.

**Step 6: Commit**

```bash
git add apps/apps/bulk-manager/src/pages/products.tsx
git commit -m "feat(bulk-manager): add dynamic import options UI — toggles and attribute defaults"
```

---

### Task 6: Enhance Import Converter — Extract Filters & Model

**Files:**
- Modify: `scripts/catalog-generator/src/import-converter.ts`

**Step 1: Add the filter name map and parser**

After the `normalizeSize` function (around line 170), add:

```typescript
// ============================================================================
// Filter Parser — extracts dynamic attributes from istores filter column
// ============================================================================

const FILTER_NAME_MAP: Record<string, string> = {
  "מסנן מותג": "Brand",
  "מסנן מין": "Gender",
  "מסנן צבע": "Color",
  "מסנן סוג הבגד": "Apparel Type",
  "מסנן סגנון": "Style",
  "מסנן חומר": "Material",
  "מסנן עונה": "Season",
  "מסנן קולקציה": "Collection Filter",
};

// Filters we already handle elsewhere (don't duplicate as attr: columns)
const SKIP_FILTERS = new Set(["סוג המוצר"]);

function parseFilters(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!raw) return attrs;

  for (const pair of raw.split(",")) {
    const gtIdx = pair.indexOf(">");
    if (gtIdx === -1) continue;
    const key = pair.substring(0, gtIdx).trim();
    const value = pair.substring(gtIdx + 1).trim();
    if (!key || !value || SKIP_FILTERS.has(key)) continue;

    const attrName = FILTER_NAME_MAP[key] || key;
    attrs[attrName] = value;
  }
  return attrs;
}
```

**Step 2: Update the Excel headers to include dynamically-discovered filter columns**

This is tricky because filter columns vary per product. Strategy: scan ALL products first, collect all unique filter keys, then use them as headers.

In the `main()` function, AFTER `rawProducts` is populated (after line ~718), add:

```typescript
// ── Discover all unique filter attribute names across all products ──
const allFilterAttrNames = new Set<string>();
for (const product of rawProducts) {
  const filterAttrs = parseFilters(product.filters);
  for (const attrName of Object.keys(filterAttrs)) {
    // Skip attrs we already have dedicated columns for
    if (attrName === "Brand" || attrName === "Gender") continue;
    allFilterAttrNames.add(attrName);
  }
}
const dynamicFilterAttrs = Array.from(allFilterAttrNames).sort();
console.log(`  Dynamic filter attrs: ${dynamicFilterAttrs.length > 0 ? dynamicFilterAttrs.join(", ") : "(none)"}`);
```

**Step 3: Update the Excel header array and row writing**

In `writeProductsExcel`, update the headers array to include dynamic filter columns and the model field. Pass `dynamicFilterAttrs` as a parameter.

Update the function signature:

```typescript
async function writeProductsExcel(
  products: RawProduct[],
  categories: CategoryNode[],
  collections: CollectionRow[],
  rawPathToSlug: Map<string, string>,
  outputDir: string,
  dynamicFilterAttrs: string[] = [],
)
```

Update the headers array to include model and dynamic filter attrs:

```typescript
const headers = [
  "name", "slug", "description", "productType", "category",
  "sku", "variantName", "price", "costPrice",
  "stock", "trackInventory",
  "imageUrl", "imageUrl2", "imageUrl3", "imageUrl4", "imageUrl5", "imageAlt",
  "collections", "seoTitle", "seoDescription",
  "attr:Brand", "attr:Gender",
  ...dynamicFilterAttrs.map(a => `attr:${a}`),
  "attr:Model",
  "variantAttr:Shoe size", "variantAttr:Apparel Size",
  "isPublished", "visibleInListings", "chargeTaxes",
  "weight",
  "externalReference", "metadata",
];
```

For each product row, extract filter attrs and model. Add to both the single-variant and multi-variant row construction.

For single-variant products (around line 560), add after the gender field:

```typescript
// Dynamic filter attrs
const filterAttrs = parseFilters(product.filters);
const dynamicVals = dynamicFilterAttrs.map(a => filterAttrs[a] || "");

ws.addRow([
  product.name,
  productSlug,
  plainDesc,
  productType,
  categorySlug,
  sku,
  "",
  product.price.toFixed(2),
  product.cost ? product.cost.toFixed(2) : "",
  product.stock,
  "Yes",
  images[0] || "", images[1] || "", images[2] || "", images[3] || "", images[4] || "",
  product.name,
  productCollections.join(";"),
  truncSeo(product.seoTitle || product.name),
  product.seoDescription || plainDesc.slice(0, 160),
  brand,
  gender,
  ...dynamicVals,
  product.model || "",
  "", "",
  isPublished, "Yes", "Yes",
  product.weight || "",
  product.productId,
  metaParts.join(";"),
]);
```

Do the same for multi-variant products — only populate the dynamic attrs on the first variant row (`isFirst ? filterAttrs[a] || "" : ""`).

**Step 4: Update the `main()` function call to pass dynamicFilterAttrs**

```typescript
await writeProductsExcel(rawProducts, categories, collections, rawPathToSlug, outputDir, dynamicFilterAttrs);
```

**Step 5: Test locally**

Run: `cd scripts/catalog-generator && npm run import -- --columns`
Expected: Shows all columns including filters.

Run: `cd scripts/catalog-generator && npm run import`
Expected: Output Excel now has `attr:Color`, `attr:Style`, `attr:Model`, etc. columns populated from filters.

**Step 6: Commit**

```bash
git add scripts/catalog-generator/src/import-converter.ts
git commit -m "feat(catalog-generator): extract dynamic attributes from istores filter column + model field"
```

---

### Task 7: End-to-End Verification

**Step 1: Restart affected containers**

```bash
docker compose -f infra/docker-compose.dev.yml restart saleor-bulk-manager-app
```

**Step 2: Verify Bulk Manager build**

Run: `docker exec saleor-bulk-manager-app-dev pnpm build`
Expected: Build succeeds.

**Step 3: Test with a small CSV**

Create a test CSV with a new attribute that doesn't exist in Saleor (e.g., `attr:Season`):

```csv
name,productType,category,sku,price,attr:Season,attr:Brand
Test Dynamic Product,Shoes,test-cat,TST-001,99.99,Summer,Nike
```

Upload via Bulk Manager > Products > Import:
1. Verify "Auto-create missing attributes & values" is checked
2. Verify "Auto-create brand/reference pages" is checked
3. Execute import
4. Check Saleor Dashboard > Product Types > Shoes — should now have "Season" attribute
5. Check the product — should have Season = "Summer" assigned

**Step 4: Test attribute defaults**

Create another CSV with empty `attr:Season`:

```csv
name,productType,sku,price,attr:Season
Test Default Product,Shoes,TST-002,49.99,
```

Set default for `attr:Season` = "All Year" in the UI, then import.
Verify the product has Season = "All Year".

**Step 5: Test brand page auto-creation**

Import a product with a brand that doesn't exist as a page:

```csv
name,productType,sku,price,attr:Brand
New Brand Product,Shoes,TST-003,129.99,TestBrand
```

Verify:
1. A "TestBrand" page was auto-created in Saleor
2. The product's Brand attribute references the new page

**Step 6: Final commit**

If all tests pass, no additional code changes needed. The dynamic import engine is complete.

---

## Summary of All Files Changed

| # | File | What Changed |
|---|------|-------------|
| 1 | `apps/apps/bulk-manager/src/pages/api/manifest.ts` | +3 permissions |
| 2 | `apps/apps/bulk-manager/src/modules/trpc/routers/products-router.ts` | Extended interfaces, expanded queries, new input fields, dynamic attribute engine (~250 lines), attribute defaults |
| 3 | `apps/apps/bulk-manager/src/pages/products.tsx` | New state, toggle UI, attribute defaults UI (~80 lines) |
| 4 | `scripts/catalog-generator/src/import-converter.ts` | Filter parser, model extraction, dynamic headers (~60 lines) |
