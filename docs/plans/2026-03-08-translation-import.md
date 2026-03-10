# Translation Import for Bulk Manager

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Translations" page to the Bulk Manager app that lets users upload CSV/Excel files to apply translations (name, description, SEO) to existing products, categories, and collections — matched by slug, SKU, or name.

**Architecture:** A new `/translations` page with a language selector and entity type picker. Users upload a CSV with a `slug` (or `sku`/`name`) column plus translated fields (`name`, `description`, `seoTitle`, `seoDescription`). The backend looks up the entity ID via slug/SKU/name, then calls Saleor's `productTranslate`, `categoryTranslate`, or `collectionTranslate` mutations. For products, variant names are also translated via `productVariantTranslate`. Uses the existing ImportWizard UI component — same upload→map→validate→execute flow as other entities.

**Tech Stack:** Next.js (Pages Router), tRPC, urql (GraphQL), Saleor `*Translate` mutations, existing ImportWizard components

---

### Task 1: Add MANAGE_TRANSLATIONS Permission to Manifest

**Files:**
- Modify: `apps/apps/bulk-manager/src/pages/api/manifest.ts`

**Step 1:** Add `"MANAGE_TRANSLATIONS"` to the `permissions` array in the manifest (line 26-36).

After:
```typescript
"MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES",
"MANAGE_PAGES",
"MANAGE_PAGE_TYPES_AND_ATTRIBUTES",
```

Add:
```typescript
"MANAGE_TRANSLATIONS",
```

**Note:** After deploying, the app must be re-installed (or permissions updated) in the Saleor Dashboard for the new permission to take effect.

---

### Task 2: Add Translation Field Mappings

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/import/field-mapper.ts`

**Step 1:** Add a `translations` entry to `fieldMappingRules` (after `giftCards`):

```typescript
translations: {
  slug: ["slug", "url_key", "handle", "identifier"],
  sku: ["sku", "variant_sku", "item_number"],
  name: ["name", "translated_name", "translation_name", "title"],
  description: ["description", "translated_description", "desc", "body"],
  seoTitle: ["seo_title", "meta_title", "page_title", "seotitle"],
  seoDescription: ["seo_description", "meta_description", "seodescription"],
  variantName: ["variant_name", "variant", "size", "option", "translated_variant"],
},
```

**Step 2:** Add a `translations` entry to `targetFieldMeta`:

```typescript
translations: {
  slug: { required: true, description: "Product/category/collection slug (or SKU for products) to match the existing entity" },
  sku: { required: false, description: "Product variant SKU (alternative to slug for product matching)" },
  name: { required: false, description: "Translated entity name" },
  description: { required: false, description: "Translated description (plain text — wrapped in EditorJS format automatically)" },
  seoTitle: { required: false, description: "Translated SEO page title" },
  seoDescription: { required: false, description: "Translated SEO meta description" },
  variantName: { required: false, description: "Translated variant name (products only — matched by SKU or variant position)" },
},
```

**Step 3:** Add a `translations` entry to `sampleRows`:

```typescript
translations: {
  slug: "interactive-rope-toy",
  sku: "",
  name: "צעצוע חבל אינטראקטיבי",
  description: "צעצוע חבל קלוע עמיד לכלבים, מעולה למשיכה ואחזור",
  seoTitle: "צעצוע חבל אינטראקטיבי לכלבים",
  seoDescription: "קנו את צעצוע החבל האינטראקטיבי — עמיד וכיפי לכל גדלי הכלבים",
  variantName: "",
},
```

---

### Task 3: Create the Translations Router

**Files:**
- Create: `apps/apps/bulk-manager/src/modules/trpc/routers/translations-router.ts`

**Context:** This router handles all 3 entity types (products, categories, collections) in a single import procedure. The user selects the entity type and target language code on the frontend, then uploads the CSV. The router:
1. Receives rows + entity type + language code
2. Looks up each entity by slug (or SKU/name) to get its Saleor ID
3. Calls the appropriate `*Translate` mutation for each row
4. For products with variant names, also calls `productVariantTranslate`

**Step 1:** Create the router file with the full implementation:

```typescript
import { z } from "zod";
import { router, protectedClientProcedure } from "../trpc-server";
import { TRPCError } from "@trpc/server";
import { assertQuerySuccess, extractGraphQLError, type ImportResult, buildImportResponse } from "../utils/helpers";

/**
 * Wrap plain text in EditorJS JSON format for Saleor's description field.
 */
function toEditorJs(text: string): string {
  return JSON.stringify({
    blocks: [{ type: "paragraph", data: { text } }],
  });
}

export const translationsRouter = router({
  import: protectedClientProcedure
    .input(
      z.object({
        rows: z.array(z.record(z.string(), z.string())),
        entityType: z.enum(["products", "categories", "collections"]),
        languageCode: z.string().min(2).max(10),
        fieldMappings: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { rows, entityType, languageCode, fieldMappings } = input;
      const client = ctx.apiClient;

      // Apply field mappings
      const mappedRows = rows.map((row) => {
        const mapped: Record<string, string> = {};
        for (const [uploadedField, saleorField] of Object.entries(fieldMappings)) {
          if (saleorField && row[uploadedField] !== undefined) {
            mapped[saleorField] = row[uploadedField];
          }
        }
        return mapped;
      });

      const results: ImportResult[] = [];

      for (let i = 0; i < mappedRows.length; i++) {
        const row = mappedRows[i];
        const identifier = row.slug || row.sku || row.name;
        if (!identifier) {
          results.push({ row: i + 1, success: false, error: "No slug, SKU, or name provided to identify the entity" });
          continue;
        }

        try {
          if (entityType === "products") {
            await translateProduct(client, row, languageCode, i, results);
          } else if (entityType === "categories") {
            await translateCategory(client, row, languageCode, i, results);
          } else if (entityType === "collections") {
            await translateCollection(client, row, languageCode, i, results);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          results.push({ row: i + 1, success: false, error: msg });
        }
      }

      return buildImportResponse(results, mappedRows.length);
    }),
});

// ── Product Translation ──────────────────────────────────────────────────────

async function translateProduct(
  client: any,
  row: Record<string, string>,
  languageCode: string,
  rowIndex: number,
  results: ImportResult[]
) {
  // Look up product by slug or by SKU (via variant)
  let productId: string | null = null;
  let variantId: string | null = null;

  if (row.slug) {
    const lookupResult = await client.query(
      `query LookupProductBySlug($slug: String!) {
        products(first: 1, filter: { slug: $slug }) {
          edges { node { id name variants { id name sku } } }
        }
      }`,
      { slug: row.slug }
    ).toPromise();
    assertQuerySuccess(lookupResult, "LookupProductBySlug");
    const product = lookupResult.data?.products?.edges?.[0]?.node;
    if (product) {
      productId = product.id;
      // If SKU also provided, find the specific variant for variant name translation
      if (row.sku) {
        const variant = product.variants?.find((v: any) => v.sku === row.sku);
        if (variant) variantId = variant.id;
      }
    }
  } else if (row.sku) {
    // Look up by variant SKU
    const lookupResult = await client.query(
      `query LookupProductBySKU($sku: String!) {
        productVariants(first: 1, filter: { sku: [$sku] }) {
          edges { node { id name sku product { id name } } }
        }
      }`,
      { sku: row.sku }
    ).toPromise();
    assertQuerySuccess(lookupResult, "LookupProductBySKU");
    const variant = lookupResult.data?.productVariants?.edges?.[0]?.node;
    if (variant) {
      productId = variant.product.id;
      variantId = variant.id;
    }
  } else if (row.name) {
    // Fallback: search by name
    const lookupResult = await client.query(
      `query LookupProductByName($search: String!) {
        products(first: 1, filter: { search: $search }) {
          edges { node { id name slug variants { id name sku } } }
        }
      }`,
      { search: row.name }
    ).toPromise();
    assertQuerySuccess(lookupResult, "LookupProductByName");
    const product = lookupResult.data?.products?.edges?.[0]?.node;
    if (product) productId = product.id;
  }

  if (!productId) {
    results.push({ row: rowIndex + 1, success: false, error: `Product not found: ${row.slug || row.sku || row.name}` });
    return;
  }

  // Build translation input (only include fields that have values)
  const translationInput: Record<string, string> = {};
  if (row.name) translationInput.name = row.name;
  if (row.description) translationInput.description = toEditorJs(row.description);
  if (row.seoTitle) translationInput.seoTitle = row.seoTitle;
  if (row.seoDescription) translationInput.seoDescription = row.seoDescription;

  if (Object.keys(translationInput).length === 0 && !row.variantName) {
    results.push({ row: rowIndex + 1, success: false, error: "No translatable fields provided" });
    return;
  }

  // Translate product fields
  if (Object.keys(translationInput).length > 0) {
    const translateResult = await client.mutation(
      `mutation TranslateProduct($id: ID!, $languageCode: LanguageCodeEnum!, $input: TranslationInput!) {
        productTranslate(id: $id, languageCode: $languageCode, input: $input) {
          product { id name }
          errors { field message }
        }
      }`,
      { id: productId, languageCode, input: translationInput }
    ).toPromise();

    if (translateResult.error) {
      results.push({ row: rowIndex + 1, success: false, error: `Product translate: ${extractGraphQLError(translateResult.error)}` });
      return;
    }

    const data = translateResult.data?.productTranslate;
    if (data?.errors?.length > 0) {
      results.push({ row: rowIndex + 1, success: false, error: data.errors.map((e: { message: string }) => e.message).join("; ") });
      return;
    }
  }

  // Translate variant name if provided
  if (row.variantName && variantId) {
    const varTranslateResult = await client.mutation(
      `mutation TranslateVariant($id: ID!, $languageCode: LanguageCodeEnum!, $input: NameTranslationInput!) {
        productVariantTranslate(id: $id, languageCode: $languageCode, input: $input) {
          productVariant { id name }
          errors { field message }
        }
      }`,
      { id: variantId, languageCode, input: { name: row.variantName } }
    ).toPromise();

    if (varTranslateResult.error) {
      // Product translated OK, variant failed — partial success
      results.push({ row: rowIndex + 1, success: true, error: `Product OK, variant translate failed: ${extractGraphQLError(varTranslateResult.error)}`, id: productId });
      return;
    }
  }

  results.push({ row: rowIndex + 1, success: true, id: productId });
}

// ── Category Translation ─────────────────────────────────────────────────────

async function translateCategory(
  client: any,
  row: Record<string, string>,
  languageCode: string,
  rowIndex: number,
  results: ImportResult[]
) {
  // Look up category by slug or name
  let categoryId: string | null = null;

  if (row.slug) {
    const lookupResult = await client.query(
      `query LookupCategoryBySlug($slug: String!) {
        categories(first: 1, filter: { slugs: [$slug] }) {
          edges { node { id name } }
        }
      }`,
      { slug: row.slug }
    ).toPromise();
    assertQuerySuccess(lookupResult, "LookupCategoryBySlug");
    categoryId = lookupResult.data?.categories?.edges?.[0]?.node?.id || null;
  } else if (row.name) {
    const lookupResult = await client.query(
      `query LookupCategoryByName($search: String!) {
        categories(first: 1, filter: { search: $search }) {
          edges { node { id name slug } }
        }
      }`,
      { search: row.name }
    ).toPromise();
    assertQuerySuccess(lookupResult, "LookupCategoryByName");
    categoryId = lookupResult.data?.categories?.edges?.[0]?.node?.id || null;
  }

  if (!categoryId) {
    results.push({ row: rowIndex + 1, success: false, error: `Category not found: ${row.slug || row.name}` });
    return;
  }

  const translationInput: Record<string, string> = {};
  if (row.name) translationInput.name = row.name;
  if (row.description) translationInput.description = toEditorJs(row.description);
  if (row.seoTitle) translationInput.seoTitle = row.seoTitle;
  if (row.seoDescription) translationInput.seoDescription = row.seoDescription;

  if (Object.keys(translationInput).length === 0) {
    results.push({ row: rowIndex + 1, success: false, error: "No translatable fields provided" });
    return;
  }

  const translateResult = await client.mutation(
    `mutation TranslateCategory($id: ID!, $languageCode: LanguageCodeEnum!, $input: TranslationInput!) {
      categoryTranslate(id: $id, languageCode: $languageCode, input: $input) {
        category { id name }
        errors { field message }
      }
    }`,
    { id: categoryId, languageCode, input: translationInput }
  ).toPromise();

  if (translateResult.error) {
    results.push({ row: rowIndex + 1, success: false, error: `Category translate: ${extractGraphQLError(translateResult.error)}` });
    return;
  }

  const data = translateResult.data?.categoryTranslate;
  if (data?.errors?.length > 0) {
    results.push({ row: rowIndex + 1, success: false, error: data.errors.map((e: { message: string }) => e.message).join("; ") });
    return;
  }

  results.push({ row: rowIndex + 1, success: true, id: categoryId });
}

// ── Collection Translation ───────────────────────────────────────────────────

async function translateCollection(
  client: any,
  row: Record<string, string>,
  languageCode: string,
  rowIndex: number,
  results: ImportResult[]
) {
  let collectionId: string | null = null;

  if (row.slug) {
    const lookupResult = await client.query(
      `query LookupCollectionBySlug($slug: String!) {
        collections(first: 1, filter: { slugs: [$slug] }) {
          edges { node { id name } }
        }
      }`,
      { slug: row.slug }
    ).toPromise();
    assertQuerySuccess(lookupResult, "LookupCollectionBySlug");
    collectionId = lookupResult.data?.collections?.edges?.[0]?.node?.id || null;
  } else if (row.name) {
    const lookupResult = await client.query(
      `query LookupCollectionByName($search: String!) {
        collections(first: 1, filter: { search: $search }) {
          edges { node { id name slug } }
        }
      }`,
      { search: row.name }
    ).toPromise();
    assertQuerySuccess(lookupResult, "LookupCollectionByName");
    collectionId = lookupResult.data?.collections?.edges?.[0]?.node?.id || null;
  }

  if (!collectionId) {
    results.push({ row: rowIndex + 1, success: false, error: `Collection not found: ${row.slug || row.name}` });
    return;
  }

  const translationInput: Record<string, string> = {};
  if (row.name) translationInput.name = row.name;
  if (row.description) translationInput.description = toEditorJs(row.description);
  if (row.seoTitle) translationInput.seoTitle = row.seoTitle;
  if (row.seoDescription) translationInput.seoDescription = row.seoDescription;

  if (Object.keys(translationInput).length === 0) {
    results.push({ row: rowIndex + 1, success: false, error: "No translatable fields provided" });
    return;
  }

  const translateResult = await client.mutation(
    `mutation TranslateCollection($id: ID!, $languageCode: LanguageCodeEnum!, $input: TranslationInput!) {
      collectionTranslate(id: $id, languageCode: $languageCode, input: $input) {
        collection { id name }
        errors { field message }
      }
    }`,
    { id: collectionId, languageCode, input: translationInput }
  ).toPromise();

  if (translateResult.error) {
    results.push({ row: rowIndex + 1, success: false, error: `Collection translate: ${extractGraphQLError(translateResult.error)}` });
    return;
  }

  const data = translateResult.data?.collectionTranslate;
  if (data?.errors?.length > 0) {
    results.push({ row: rowIndex + 1, success: false, error: data.errors.map((e: { message: string }) => e.message).join("; ") });
    return;
  }

  results.push({ row: rowIndex + 1, success: true, id: collectionId });
}
```

---

### Task 4: Register the Translations Router

**Files:**
- Modify: `apps/apps/bulk-manager/src/modules/trpc/router.ts`

**Step 1:** Add import:
```typescript
import { translationsRouter } from "./routers/translations-router";
```

**Step 2:** Add to `appRouter`:
```typescript
translations: translationsRouter,
```

---

### Task 5: Create the Translations Page

**Files:**
- Create: `apps/apps/bulk-manager/src/pages/translations.tsx`

**Context:** Follow the same pattern as `categories.tsx` — uses ImportWizard, has a language code selector and entity type dropdown at the top. No export/delete tabs since translations are always an "apply" operation.

**Step 1:** Create the page:

```tsx
import { Box, Text, Button } from "@saleor/macaw-ui";
import { useState, useCallback, useMemo } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { ImportWizard, type ProgressInfo } from "@/modules/ui/import-wizard";
import { readFileContent } from "@/modules/ui/utils/read-file";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { trpcVanillaClient } from "@/modules/trpc/trpc-vanilla-client";
import { getTargetFields } from "@/modules/import/field-mapper";
import { generateTemplateCSV, generateTemplateExcel } from "@/modules/ui/utils/generate-template";

const ALL_TARGET_FIELDS = getTargetFields("translations");

const ENTITY_TYPES = [
  { value: "products", label: "Products" },
  { value: "categories", label: "Categories" },
  { value: "collections", label: "Collections" },
] as const;

const COMMON_LANGUAGES = [
  { value: "HE", label: "Hebrew (HE)" },
  { value: "AR", label: "Arabic (AR)" },
  { value: "EN", label: "English (EN)" },
  { value: "FR", label: "French (FR)" },
  { value: "DE", label: "German (DE)" },
  { value: "ES", label: "Spanish (ES)" },
  { value: "RU", label: "Russian (RU)" },
  { value: "ZH_CN", label: "Chinese Simplified (ZH_CN)" },
  { value: "JA", label: "Japanese (JA)" },
  { value: "PT", label: "Portuguese (PT)" },
] as const;

type Tab = "import" | "template";

export default function TranslationsPage() {
  const [tab, setTab] = useState<Tab>("import");
  const [entityType, setEntityType] = useState<"products" | "categories" | "collections">("products");
  const [languageCode, setLanguageCode] = useState("HE");
  const [customLanguageCode, setCustomLanguageCode] = useState("");

  const effectiveLanguageCode = customLanguageCode.trim().toUpperCase() || languageCode;

  const parseFile = trpcClient.import.parseFile.useMutation();
  const autoMapFields = trpcClient.import.autoMapFields.useMutation();
  const validateRows = trpcClient.import.validateRows.useMutation();
  const importTranslations = trpcClient.translations.import.useMutation();

  const handleFileSelected = useCallback(
    async (file: File) => {
      const content = await readFileContent(file);
      const fileType = file.name.endsWith(".csv") ? "csv" : "xlsx";
      const result = await parseFile.mutateAsync({
        fileContent: content,
        fileName: file.name,
        fileType: fileType as "csv" | "xlsx",
      });
      return { rows: result.rows, headers: result.headers };
    },
    [parseFile]
  );

  const handleAutoMap = useCallback(
    async (headers: string[]) => {
      const result = await autoMapFields.mutateAsync({ headers, entityType: "translations" });
      return result.mappings;
    },
    [autoMapFields]
  );

  const handleValidate = useCallback(
    async (rows: Record<string, string>[], mappings: Record<string, string>) => {
      return validateRows.mutateAsync({ rows, entityType: "translations", fieldMappings: mappings });
    },
    [validateRows]
  );

  const handleExecute = useCallback(
    async (
      rows: Record<string, string>[],
      mappings: Record<string, string>,
      onProgress: (info: ProgressInfo) => void,
    ) => {
      onProgress({ current: 0, total: rows.length, status: `Translating ${entityType} to ${effectiveLanguageCode}...` });

      const BATCH_SIZE = 50;
      let allResults: any[] = [];

      for (let start = 0; start < rows.length; start += BATCH_SIZE) {
        const batch = rows.slice(start, start + BATCH_SIZE);
        const result = await trpcVanillaClient.translations.import.mutate({
          rows: batch,
          entityType,
          languageCode: effectiveLanguageCode,
          fieldMappings: mappings,
        });
        allResults = allResults.concat(result.results);
        onProgress({
          current: Math.min(start + BATCH_SIZE, rows.length),
          total: rows.length,
          status: `Translated ${Math.min(start + BATCH_SIZE, rows.length)} of ${rows.length} rows...`,
        });
      }

      return {
        total: rows.length,
        successful: allResults.filter((r: any) => r.success).length,
        failed: allResults.filter((r: any) => !r.success).length,
        results: allResults,
      };
    },
    [entityType, effectiveLanguageCode]
  );

  return (
    <AppLayout>
      <Box>
        <Text variant="heading" size={6} __fontWeight="700" __display="block">
          Translations
        </Text>
        <Text size={3} __color="#64748b" __display="block" marginBottom={6}>
          Import translations for products, categories, and collections
        </Text>

        {/* Entity Type & Language Selector */}
        <Box display="flex" gap={4} marginBottom={6} __flexWrap="wrap" alignItems="flex-end">
          <Box __minWidth="200px">
            <Text size={2} __fontWeight="600" __display="block" marginBottom={1}>Entity Type</Text>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as typeof entityType)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                width: "100%",
                backgroundColor: "#fff",
              }}
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Box>

          <Box __minWidth="200px">
            <Text size={2} __fontWeight="600" __display="block" marginBottom={1}>Target Language</Text>
            <select
              value={languageCode}
              onChange={(e) => {
                setLanguageCode(e.target.value);
                setCustomLanguageCode("");
              }}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                width: "100%",
                backgroundColor: "#fff",
              }}
            >
              {COMMON_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
              <option value="CUSTOM">Other (enter code)...</option>
            </select>
          </Box>

          {languageCode === "CUSTOM" && (
            <Box __minWidth="160px">
              <Text size={2} __fontWeight="600" __display="block" marginBottom={1}>Language Code</Text>
              <input
                type="text"
                value={customLanguageCode}
                onChange={(e) => setCustomLanguageCode(e.target.value)}
                placeholder="e.g. IT, KO, TR"
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  fontSize: "14px",
                  width: "100%",
                }}
              />
            </Box>
          )}
        </Box>

        {/* Info box */}
        <Box
          padding={4}
          marginBottom={6}
          borderRadius={4}
          __backgroundColor="#f0f9ff"
          __border="1px solid #bae6fd"
        >
          <Text size={2} __color="#0369a1">
            Upload a CSV/Excel file with a <strong>slug</strong> (or <strong>sku</strong>) column to match existing{" "}
            {entityType}, plus translated columns: <strong>name</strong>, <strong>description</strong>,{" "}
            <strong>seoTitle</strong>, <strong>seoDescription</strong>.
            {entityType === "products" && (
              <> You can also include <strong>variantName</strong> with a <strong>sku</strong> to translate variant names.</>
            )}
          </Text>
        </Box>

        {/* Tabs */}
        <Box display="flex" gap={2} marginBottom={6}>
          {(["import", "template"] as Tab[]).map((t) => (
            <Button
              key={t}
              variant={tab === t ? "primary" : "secondary"}
              onClick={() => setTab(t)}
              size="small"
            >
              {t === "import" ? "Import Translations" : "Download Template"}
            </Button>
          ))}
        </Box>

        {tab === "import" && (
          <ImportWizard
            entityType="translations"
            targetFields={ALL_TARGET_FIELDS}
            onFileSelected={handleFileSelected}
            onAutoMap={handleAutoMap}
            onValidate={handleValidate}
            onExecute={handleExecute}
          />
        )}

        {tab === "template" && (
          <Box padding={6} borderRadius={4} __border="1px solid #e2e8f0">
            <Text size={3} __fontWeight="600" __display="block" marginBottom={4}>
              Download Template
            </Text>
            <Text size={2} __color="#64748b" __display="block" marginBottom={4}>
              Download a sample CSV or Excel template for translation imports.
              Fill in the slug column with existing entity slugs and add your translations.
            </Text>
            <Box display="flex" gap={3}>
              <Button
                variant="secondary"
                onClick={() => generateTemplateCSV("translations")}
                size="small"
              >
                Download CSV Template
              </Button>
              <Button
                variant="secondary"
                onClick={() => generateTemplateExcel("translations")}
                size="small"
              >
                Download Excel Template
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </AppLayout>
  );
}
```

---

### Task 6: Add Translations Card to Index Page

**Files:**
- Modify: `apps/apps/bulk-manager/src/pages/index.tsx`

**Step 1:** Add a translations entry to the `entities` array (after Gift Cards):

```typescript
{
  label: "Translations",
  description: "Import translations for products, categories, and collections in any language",
  href: "/translations",
  features: ["CSV/Excel Import", "Multi-Language", "Products", "Categories", "Collections", "Template"],
  icon: "T",
},
```

---

### Task 7: Build Verification

**Step 1:** Build the app inside Docker:
```bash
docker exec saleor-bulk-manager-app-dev sh -c "cd /app/apps/bulk-manager && pnpm next build"
```

**Step 2:** Restart the container:
```bash
docker compose -f infra/docker-compose.dev.yml restart saleor-bulk-manager-app
```

**Step 3:** Check logs:
```bash
docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-bulk-manager-app
```

**Note:** After deploying, the app needs to be re-installed in Saleor Dashboard for the `MANAGE_TRANSLATIONS` permission to be granted. Until then, translation mutations will return permission errors.

---

## Summary

| # | Type | Description | Files |
|---|------|-------------|-------|
| 1 | Config | Add MANAGE_TRANSLATIONS permission | manifest.ts |
| 2 | Feature | Translation field mappings + sample data | field-mapper.ts |
| 3 | Feature | Translations router (products, categories, collections) | translations-router.ts (new) |
| 4 | Wiring | Register router in appRouter | router.ts |
| 5 | Feature | Translations page with language/entity selector | translations.tsx (new) |
| 6 | UI | Add Translations card to index | index.tsx |
| 7 | Verify | Build + restart + logs | — |

## CSV Template Example

```csv
slug,name,description,seoTitle,seoDescription,sku,variantName
interactive-rope-toy,צעצוע חבל אינטראקטיבי,צעצוע חבל קלוע עמיד לכלבים,צעצוע חבל לכלבים,קנו צעצועי חבל איכותיים,,
interactive-rope-toy,,,,,,ROPE-BLU-M,חבל כחול - M
interactive-rope-toy,,,,,,ROPE-RED-L,חבל אדום - L
orthopedic-dog-bed,מיטה אורתופדית לכלבים,מיטה אורתופדית מפנקת לכלבים,,,,
```

**Usage flow:**
1. Upload English products via Products import (creates products in default language)
2. Go to Translations page
3. Select "Products" + "Hebrew (HE)"
4. Upload Hebrew CSV with slugs matching existing products
5. Translations are applied — products now display in Hebrew when queried with `languageCode: HE`
