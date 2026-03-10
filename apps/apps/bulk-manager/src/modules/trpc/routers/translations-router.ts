import { z } from "zod";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { assertQuerySuccess, applyFieldMappings, extractGraphQLError, type ImportResult, buildImportResponse } from "../utils/helpers";

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
        rows: z.array(z.record(z.string())),
        entityType: z.enum(["products", "categories", "collections"]),
        languageCode: z.string().min(2).max(10),
        fieldMappings: z.record(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { rows, entityType, languageCode, fieldMappings } = input;
      const client = ctx.apiClient;

      // Apply field mappings
      const mappedRows = rows.map((row) => applyFieldMappings(row, fieldMappings));

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
  client: ReturnType<typeof import("@saleor/apps-shared/create-graphql-client").createGraphQLClient>,
  row: Record<string, string>,
  languageCode: string,
  rowIndex: number,
  results: ImportResult[]
) {
  let productId: string | null = null;
  let variantId: string | null = null;

  if (row.slug) {
    const lookupResult = await client.query(
      `query LookupProductBySlug($slug: String!) {
        products(first: 1, filter: { slugs: [$slug] }) {
          edges { node { id name variants { id name sku } } }
        }
      }`,
      { slug: row.slug }
    ).toPromise();
    assertQuerySuccess(lookupResult, "LookupProductBySlug");
    const product = lookupResult.data?.products?.edges?.[0]?.node;
    if (product) {
      productId = product.id;
      if (row.sku) {
        const variant = product.variants?.find((v: { sku: string }) => v.sku === row.sku);
        if (variant) variantId = variant.id;
      }
    }
  } else if (row.sku) {
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
      results.push({ row: rowIndex + 1, success: true, error: `Product OK, variant translate failed: ${extractGraphQLError(varTranslateResult.error)}`, id: productId });
      return;
    }
  }

  results.push({ row: rowIndex + 1, success: true, id: productId });
}

// ── Category Translation ─────────────────────────────────────────────────────

async function translateCategory(
  client: ReturnType<typeof import("@saleor/apps-shared/create-graphql-client").createGraphQLClient>,
  row: Record<string, string>,
  languageCode: string,
  rowIndex: number,
  results: ImportResult[]
) {
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
  client: ReturnType<typeof import("@saleor/apps-shared/create-graphql-client").createGraphQLClient>,
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
