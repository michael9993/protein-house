import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { exportToCSV } from "../../export/csv-exporter";
import { exportToExcel } from "../../export/excel-exporter";
import { assertQuerySuccess, applyFieldMappings, tryParseDescription, parseBool, parseMetadata, parseSemicolonList, isValidUrl, type ImportResult, buildImportResponse } from "../utils/helpers";
import { uploadProductImage } from "../utils/image-upload";

interface AttributeValueInfo {
  id: string;
  name: string;
  slug: string;
}

interface AttributeInfo {
  id: string;
  slug: string;
  name: string;
  inputType: string; // DROPDOWN, MULTISELECT, PLAIN_TEXT, RICH_TEXT, NUMERIC, BOOLEAN, DATE, DATE_TIME, FILE, REFERENCE, SWATCH
  entityType?: string; // PAGE, PRODUCT (only for REFERENCE type)
  values: AttributeValueInfo[];
}

interface ProductTypeInfo {
  id: string;
  productAttributes: AttributeInfo[];
  variantAttributes: AttributeInfo[];
}

interface GlobalAttrInfo {
  id: string; slug: string; name: string; inputType: string; entityType?: string;
  type: string; // "PRODUCT_TYPE" or "PAGE_TYPE"
  values: AttributeValueInfo[];
}

/**
 * Build the correct AttributeValueInput based on the attribute's inputType.
 * REFERENCE → resolves name to entity ID via pageNameMap.
 * DROPDOWN/MULTISELECT/SWATCH → values: [value]
 * PLAIN_TEXT → plainText: value
 * RICH_TEXT → richText: JSON string
 * NUMERIC → numeric: value
 * BOOLEAN → boolean: true/false
 * DATE/DATE_TIME → date/dateTime: value
 */
function buildAttributeInput(
  attr: AttributeInfo,
  value: string,
  pageNameMap: Map<string, string>,
): Record<string, any> | null {
  const base = { id: attr.id };

  switch (attr.inputType) {
    case "SINGLE_REFERENCE": {
      // SINGLE_REFERENCE uses `reference: ID` (singular)
      const entityId = pageNameMap.get(value.toLowerCase());
      if (entityId) {
        return { ...base, reference: entityId };
      }
      if (value.startsWith("UG") || value.startsWith("Q29")) {
        return { ...base, reference: value };
      }
      console.warn(`[Import] SINGLE_REFERENCE attribute "${attr.name}": could not resolve "${value}". Available: ${Array.from(pageNameMap.keys()).slice(0, 10).join(", ")}`);
      return null;
    }
    case "REFERENCE":
    case "MULTI_REFERENCE": {
      // MULTI_REFERENCE / legacy REFERENCE uses `references: [ID!]` (array)
      const entityId = pageNameMap.get(value.toLowerCase());
      if (entityId) {
        return { ...base, references: [entityId] };
      }
      if (value.startsWith("UG") || value.startsWith("Q29")) {
        return { ...base, references: [value] };
      }
      console.warn(`[Import] REFERENCE attribute "${attr.name}": could not resolve "${value}". Available: ${Array.from(pageNameMap.keys()).slice(0, 10).join(", ")}`);
      return null;
    }
    case "PLAIN_TEXT":
      return { ...base, plainText: value };
    case "RICH_TEXT":
      return { ...base, richText: JSON.stringify({ blocks: [{ type: "paragraph", data: { text: value } }] }) };
    case "NUMERIC":
      return { ...base, numeric: value };
    case "BOOLEAN":
      return { ...base, boolean: parseBool(value, false) };
    case "DATE":
      return { ...base, date: value };
    case "DATE_TIME":
      return { ...base, dateTime: value };
    case "FILE":
      // Can't handle file uploads via CSV import
      console.warn(`[Import] FILE attribute "${attr.name}" cannot be set via CSV import`);
      return null;
    case "DROPDOWN":
    case "MULTISELECT":
    case "SWATCH":
    default:
      return { ...base, values: [value] };
  }
}

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

export const productsRouter = router({
  import: protectedClientProcedure
    .input(
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
    )
    .mutation(async ({ ctx, input }) => {
      const results: ImportResult[] = [];

      // Map all rows
      const mappedRows = input.rows.map((row) => applyFieldMappings(row, input.fieldMappings));

      // Group rows by product name — same name = variants of one product
      // Rows with empty name inherit the previous product's name (variant continuation)
      const productGroups = new Map<string, { rows: Record<string, string>[]; indices: number[] }>();
      let lastProductName = "";
      for (let i = 0; i < mappedRows.length; i++) {
        const mapped = mappedRows[i];
        const key = mapped.name || lastProductName || `unnamed-${i}`;
        if (mapped.name) lastProductName = mapped.name;
        if (!productGroups.has(key)) {
          productGroups.set(key, { rows: [], indices: [] });
        }
        productGroups.get(key)!.rows.push(mapped);
        productGroups.get(key)!.indices.push(i);
      }

      // Resolve channel IDs from slugs
      const channelIds: { id: string; slug: string }[] = [];
      try {
        const chResult = await ctx.apiClient.query(
          `query { channels { id slug } }`, {}
        );
        for (const ch of (chResult.data?.channels || [])) {
          if (input.channelSlugs.includes(ch.slug)) {
            channelIds.push({ id: ch.id, slug: ch.slug });
          }
        }
      } catch { /* ignore */ }

      // Use selected warehouse, or fall back to first warehouse
      let defaultWarehouseId = input.warehouseId;
      if (!defaultWarehouseId) {
        try {
          const whResult = await ctx.apiClient.query(
            `query { warehouses(first: 1) { edges { node { id } } } }`, {}
          );
          defaultWarehouseId = whResult.data?.warehouses?.edges?.[0]?.node?.id;
        } catch { /* ignore */ }
      }

      // ─── Pre-fetch ALL product types with attributes ───
      const productTypeMap = new Map<string, ProductTypeInfo>();
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

      // ─── Pre-fetch ALL attributes globally (for creating/assigning unassigned attrs) ───
      const globalAttributeMap = new Map<string, GlobalAttrInfo>();
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

      // ─── Pre-fetch ALL categories → name/slug → ID ───
      const categoryMap = new Map<string, string>();
      try {
        let hasNext = true;
        let after: string | undefined;
        while (hasNext) {
          const catResult = await ctx.apiClient.query(
            `query CategoriesLookup($after: String) {
              categories(first: 100, after: $after) {
                edges { node { id name slug } }
                pageInfo { hasNextPage endCursor }
              }
            }`,
            { after }
          );
          for (const e of (catResult.data?.categories?.edges || [])) {
            categoryMap.set(e.node.name.toLowerCase(), e.node.id);
            categoryMap.set(e.node.slug.toLowerCase(), e.node.id);
          }
          hasNext = catResult.data?.categories?.pageInfo?.hasNextPage || false;
          after = catResult.data?.categories?.pageInfo?.endCursor;
        }
      } catch { /* ignore */ }

      // ─── Pre-fetch collections → name/slug → ID ───
      const collectionSlugMap = new Map<string, string>();
      const collectionNameMap = new Map<string, string>();
      try {
        let hasNext = true;
        let after: string | undefined;
        while (hasNext) {
          const colResult = await ctx.apiClient.query(
            `query CollectionsLookup($after: String) {
              collections(first: 100, after: $after) {
                edges { node { id name slug } }
                pageInfo { hasNextPage endCursor }
              }
            }`,
            { after }
          );
          for (const e of (colResult.data?.collections?.edges || [])) {
            collectionSlugMap.set(e.node.slug.toLowerCase(), e.node.id);
            collectionNameMap.set(e.node.name.toLowerCase(), e.node.id);
          }
          hasNext = colResult.data?.collections?.pageInfo?.hasNextPage || false;
          after = colResult.data?.collections?.pageInfo?.endCursor;
        }
      } catch { /* ignore */ }

      // ─── Pre-fetch tax classes → name → ID ───
      const taxClassMap = new Map<string, string>();
      try {
        const tcResult = await ctx.apiClient.query(
          `query TaxClassesList { taxClasses(first: 100) { edges { node { id name } } } }`, {}
        );
        for (const e of (tcResult.data?.taxClasses?.edges || [])) {
          taxClassMap.set(e.node.name.toLowerCase(), e.node.id);
        }
      } catch { /* ignore */ }

      // ─── Pre-fetch warehouses → name/slug → ID ───
      const warehouseNameMap = new Map<string, string>();
      try {
        const whResult = await ctx.apiClient.query(
          `query WarehousesList { warehouses(first: 100) { edges { node { id name slug } } } }`, {}
        );
        for (const e of (whResult.data?.warehouses?.edges || [])) {
          warehouseNameMap.set(e.node.name.toLowerCase(), e.node.id);
          warehouseNameMap.set(e.node.slug.toLowerCase(), e.node.id);
        }
      } catch { /* ignore */ }

      // ─── Pre-fetch pages (for REFERENCE attributes with entityType PAGE) ───
      const pageNameMap = new Map<string, string>(); // name/slug → ID
      try {
        let hasNext = true;
        let after: string | undefined;
        while (hasNext) {
          const pgResult = await ctx.apiClient.query(
            `query PagesLookup($after: String) {
              pages(first: 100, after: $after) {
                edges { node { id title slug } }
                pageInfo { hasNextPage endCursor }
              }
            }`,
            { after }
          );
          for (const e of (pgResult.data?.pages?.edges || [])) {
            pageNameMap.set(e.node.title.toLowerCase(), e.node.id);
            if (e.node.slug) pageNameMap.set(e.node.slug.toLowerCase(), e.node.id);
          }
          hasNext = pgResult.data?.pages?.pageInfo?.hasNextPage || false;
          after = pgResult.data?.pages?.pageInfo?.endCursor;
        }
      } catch { /* ignore */ }

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

      // ─── Pre-fetch existing products (for upsert matching OR skip-existing) ───
      type ExistingProductInfo = { id: string; variants: { id: string; sku: string }[]; mediaCount: number };
      const existingProductsBySlug = new Map<string, ExistingProductInfo>();
      const existingProductsByRef = new Map<string, ExistingProductInfo>();
      try {
        let hasNext = true;
        let after: string | undefined;
        while (hasNext) {
          const pResult = await ctx.apiClient.query(
            `query ExistingProducts($after: String) {
              products(first: 100, after: $after) {
                edges { node { id slug externalReference media { id } variants { id sku } } }
                pageInfo { hasNextPage endCursor }
              }
            }`,
            { after }
          );
          for (const e of (pResult.data?.products?.edges || [])) {
            const node = e.node;
            const info: ExistingProductInfo = {
              id: node.id,
              variants: (node.variants || []).map((v: any) => ({ id: v.id, sku: v.sku || "" })),
              mediaCount: (node.media || []).length,
            };
            if (node.slug) existingProductsBySlug.set(node.slug.toLowerCase(), info);
            if (node.externalReference) existingProductsByRef.set(node.externalReference, info);
          }
          hasNext = pResult.data?.products?.pageInfo?.hasNextPage || false;
          after = pResult.data?.products?.pageInfo?.endCursor;
        }
      } catch { /* ignore */ }

      // ═══════════════════════════════════════════════════════════════════
      // DYNAMIC ATTRIBUTE ENGINE — auto-create missing attributes/values/pages
      // ═══════════════════════════════════════════════════════════════════
      if (input.autoCreateAttributes) {
        // ── Step 1: Discover all attr:/variantAttr: columns and their values ──
        interface DiscoveredAttr {
          columnKey: string;
          attrName: string;
          isVariant: boolean;
          values: Set<string>;
          productTypes: Set<string>;
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
        const attrsToCreateValues: { attrId: string; missingValues: string[] }[] = [];
        const attrsToAssign: { attrId: string; productTypeId: string; isVariant: boolean }[] = [];
        const attrsToCreate: DiscoveredAttr[] = [];
        const pagesToCreate: { value: string; pageTypeName: string }[] = [];

        for (const [, disc] of discoveredAttrs) {
          const attrNameLower = disc.attrName.toLowerCase();
          const globalAttr = globalAttributeMap.get(attrNameLower);

          if (globalAttr) {
            // Attribute exists — check if values are missing (DROPDOWN/MULTISELECT/SWATCH only)
            if (["DROPDOWN", "MULTISELECT", "SWATCH"].includes(globalAttr.inputType)) {
              const existingNames = new Set(globalAttr.values.map(v => v.name.toLowerCase()));
              const existingSlugs = new Set(globalAttr.values.map(v => v.slug.toLowerCase()));
              const missing = Array.from(disc.values).filter(v =>
                !existingNames.has(v.toLowerCase()) && !existingSlugs.has(v.toLowerCase())
              );
              if (missing.length > 0) {
                attrsToCreateValues.push({ attrId: globalAttr.id, missingValues: missing });
              }
            }

            // Check if attribute is assigned to each product type
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

            if (detectedType === "DROPDOWN" || detectedType === "MULTISELECT") {
              createInput.values = Array.from(disc.values).filter(Boolean).map(v => ({ name: v }));
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

              for (const ptRef of disc.productTypes) {
                const ptInfo = productTypeMap.get(ptRef);
                if (ptInfo) {
                  attrsToAssign.push({ attrId: created.id, productTypeId: ptInfo.id, isVariant: disc.isVariant });
                }
              }
            } else {
              console.warn(`[DynamicImport] Failed to create attribute "${disc.attrName}":`, result.data?.attributeCreate?.errors);
            }
          } catch (err: any) {
            console.warn(`[DynamicImport] Error creating attribute "${disc.attrName}":`, err.message?.substring(0, 100));
          }
        }

        // ── Step 4: Create missing attribute values ──
        for (const { attrId, missingValues } of attrsToCreateValues) {
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
              if (result.data?.attributeValueCreate?.attributeValue) {
                console.log(`[DynamicImport] Created value "${val}" for attribute ${attrId}`);
              } else {
                console.warn(`[DynamicImport] Failed to create value "${val}":`, result.data?.attributeValueCreate?.errors);
              }
            } catch (err: any) {
              console.warn(`[DynamicImport] Error creating value "${val}":`, err.message?.substring(0, 100));
            }
          }
        }

        // ── Step 5: Assign attributes to product types ──
        const seenAssignments = new Set<string>();
        for (const assignment of attrsToAssign) {
          const key = `${assignment.attrId}::${assignment.productTypeId}::${assignment.isVariant}`;
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
          const uniquePageTypes = [...new Set(pagesToCreate.map(p => p.pageTypeName.toLowerCase()))];
          const resolvedPageTypes = new Map<string, string>();

          for (const ptName of uniquePageTypes) {
            let ptId = pageTypeMap.get(ptName);
            if (!ptId) {
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

      // ─── Process each product group ───
      for (const [, group] of productGroups) {
        const first = group.rows[0];
        const indices = group.indices;

        try {
          // ── Resolve product type (CSV column → name/slug lookup → fallback to dropdown) ──
          let resolvedProductTypeId = input.productTypeId || "";
          let productAttributes: AttributeInfo[] = [];
          let variantAttributes: AttributeInfo[] = [];

          if (first.productType) {
            const ptInfo = productTypeMap.get(first.productType.toLowerCase());
            if (ptInfo) {
              resolvedProductTypeId = ptInfo.id;
              productAttributes = ptInfo.productAttributes;
              variantAttributes = ptInfo.variantAttributes;
            } else {
              for (const idx of indices) results.push({ row: idx + 1, success: false, error: `Product type "${first.productType}" not found. Check name/slug spelling.` });
              continue;
            }
          } else if (resolvedProductTypeId) {
            const ptInfo = productTypeMap.get(resolvedProductTypeId);
            if (ptInfo) {
              productAttributes = ptInfo.productAttributes;
              variantAttributes = ptInfo.variantAttributes;
            }
          }

          if (!resolvedProductTypeId) {
            for (const idx of indices) results.push({ row: idx + 1, success: false, error: "No product type specified. Set it in CSV 'productType' column or select from dropdown." });
            continue;
          }

          // ── Skip existing products when NOT in upsert mode ──
          if (!input.upsertMode) {
            const slug = first.slug || first.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const existsBySlug = slug ? existingProductsBySlug.has(slug.toLowerCase()) : false;
            const existsByRef = first.externalReference ? existingProductsByRef.has(first.externalReference) : false;
            if (existsBySlug || existsByRef) {
              for (const idx of indices) results.push({ row: idx + 1, success: true, error: "Skipped (already exists)" });
              continue;
            }
          }

          // ── Resolve category (CSV column → name/slug lookup → fallback to dropdown) ──
          let categoryId: string | undefined;
          if (first.category) {
            categoryId = categoryMap.get(first.category.toLowerCase()) || undefined;
            if (!categoryId) {
              // Maybe it's already a Saleor ID — pass through for backward compat
              categoryId = first.category;
            }
          } else {
            categoryId = input.categoryId || undefined;
          }

          // ── Resolve warehouse for this row (CSV column → name/slug lookup → fallback) ──
          let rowWarehouseId = defaultWarehouseId;
          if (first.warehouse) {
            const wId = warehouseNameMap.get(first.warehouse.toLowerCase());
            if (wId) rowWarehouseId = wId;
          }

          // Resolve collections from semicolon-separated slugs/names
          const collectionIds: string[] = [];
          if (first.collections) {
            for (const ref of parseSemicolonList(first.collections)) {
              const lower = ref.toLowerCase();
              const id = collectionSlugMap.get(lower) || collectionNameMap.get(lower);
              if (id) collectionIds.push(id);
            }
          }

          // Resolve tax class by name (CSV column → fallback to dropdown)
          const taxClassId = first.taxClass
            ? taxClassMap.get(first.taxClass.toLowerCase()) || undefined
            : input.taxClassId || undefined;

          // ── Build product-level attributes (generic matching via attr:* + legacy brand) ──
          const productAttrs: Record<string, any>[] = [];
          for (const attr of productAttributes) {
            const slug = attr.slug.toLowerCase();
            const name = attr.name.toLowerCase();
            let value: string | undefined;

            // Check for attr:* dynamic columns (case-insensitive match)
            for (const [key, val] of Object.entries(first)) {
              if (!key.startsWith("attr:") || !val) continue;
              const attrRef = key.substring(5).toLowerCase();
              if (attrRef === slug || attrRef === name) {
                value = val;
                break;
              }
            }

            // Legacy brand field fallback — match any attribute containing "brand" or "manufacturer"
            if (!value && first.brand) {
              if (slug === "brand" || name === "brand" ||
                  slug.includes("brand") || slug.includes("manufacturer") ||
                  name.includes("brand") || name.includes("manufacturer")) {
                value = first.brand;
              }
            }

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
          }

          // Build shared product fields (used for both create and update)
          const productFields: Record<string, any> = {
            name: first.name,
            slug: first.slug || undefined,
            description: first.description
              ? JSON.stringify({ blocks: [{ type: "paragraph", data: { text: first.description } }] })
              : undefined,
            category: categoryId,
            weight: first.weight ? parseFloat(first.weight) : undefined,
            ...(productAttrs.length > 0 ? { attributes: productAttrs } : {}),
            ...(first.seoTitle || first.seoDescription ? {
              seo: {
                title: first.seoTitle || undefined,
                description: first.seoDescription || undefined,
              },
            } : {}),
            ...(collectionIds.length > 0 ? { collections: collectionIds } : {}),
            ...(taxClassId ? { taxClass: taxClassId } : {}),
            ...(first.externalReference ? { externalReference: first.externalReference } : {}),
            ...(first.metadata ? { metadata: parseMetadata(first.metadata) } : {}),
            ...(first.chargeTaxes !== undefined ? { chargeTaxes: parseBool(first.chargeTaxes, true) } : {}),
          };

          let productId: string | undefined;
          let existingVariants: { id: string; sku: string }[] = [];
          let existingMediaCount = 0;

          // ── Upsert: check if product already exists ──
          if (input.upsertMode) {
            const existingByRef = first.externalReference
              ? existingProductsByRef.get(first.externalReference)
              : undefined;
            const slug = first.slug || first.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const existingBySlug = slug
              ? existingProductsBySlug.get(slug.toLowerCase())
              : undefined;
            const existing = existingByRef || existingBySlug;

            if (existing) {
              existingVariants = existing.variants;
              existingMediaCount = existing.mediaCount;

              const updateResult = await ctx.apiClient.mutation(
                `mutation ProductUpdate($id: ID!, $input: ProductInput!) {
                  productUpdate(id: $id, input: $input) {
                    product { id name slug }
                    errors { field code message }
                  }
                }`,
                { id: existing.id, input: productFields }
              );

              if (updateResult.error) {
                const errMsg = updateResult.error.graphQLErrors?.map((e: any) => e.message).join("; ") || "GraphQL error";
                for (const idx of indices) results.push({ row: idx + 1, success: false, error: `Product update: ${errMsg}` });
                continue;
              }
              const updateData = updateResult.data?.productUpdate;
              if (!updateData?.product?.id || updateData.errors?.length > 0) {
                const errMsg = updateData?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "Product update failed";
                for (const idx of indices) results.push({ row: idx + 1, success: false, error: errMsg });
                continue;
              }
              productId = updateData.product.id;
            }
          }

          // ── Create new product if not found via upsert ──
          if (!productId) {
            const createResult = await ctx.apiClient.mutation(
              `mutation ProductCreate($input: ProductCreateInput!) {
                productCreate(input: $input) {
                  product { id name slug }
                  errors { field code message }
                }
              }`,
              {
                input: {
                  ...productFields,
                  productType: resolvedProductTypeId,
                },
              }
            );

            if (createResult.error) {
              const errMsg = createResult.error.graphQLErrors?.map((e: any) => e.message).join("; ") || "GraphQL error";
              for (const idx of indices) results.push({ row: idx + 1, success: false, error: `Product: ${errMsg}` });
              continue;
            }

            const createData = createResult.data?.productCreate;
            if (!createData?.product?.id || createData.errors?.length > 0) {
              let errMsg = createData?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "Product create failed";
              if (!input.upsertMode && errMsg.toLowerCase().includes("slug") && errMsg.toLowerCase().includes("already exists")) {
                errMsg += ' — Enable "Update existing products" to update instead of create';
              }
              for (const idx of indices) results.push({ row: idx + 1, success: false, error: errMsg });
              continue;
            }
            productId = createData.product.id;
          }

          // ── Publish to all selected channels ──
          if (channelIds.length > 0) {
            try {
              await ctx.apiClient.mutation(
                `mutation ProductChannelListingUpdate($id: ID!, $input: ProductChannelListingUpdateInput!) {
                  productChannelListingUpdate(id: $id, input: $input) {
                    product { id }
                    errors { field code message }
                  }
                }`,
                {
                  id: productId,
                  input: {
                    updateChannels: channelIds.map((ch) => ({
                      channelId: ch.id,
                      isPublished: parseBool(first.isPublished, true),
                      visibleInListings: parseBool(first.visibleInListings, true),
                      isAvailableForPurchase: first.availableForPurchase && first.availableForPurchase.includes("-")
                        ? true
                        : parseBool(first.availableForPurchase, true),
                      ...(first.availableForPurchase && first.availableForPurchase.includes("-")
                        ? { availableForPurchaseAt: first.availableForPurchase }
                        : {}),
                    })),
                  },
                }
              );
            } catch { /* non-critical */ }
          }

          // ── Add product images from URLs (supports up to 5 images) ──
          const imageUrls = [first.imageUrl, first.imageUrl2, first.imageUrl3, first.imageUrl4, first.imageUrl5]
            .filter(Boolean)
            .filter(isValidUrl);
          const imageAlt = first.imageAlt || first.name || "";
          const imageErrors: string[] = [];
          const shouldReplaceImages = parseBool(first.replaceImages, false);
          // Skip image upload if product already has media (upsert mode) unless replaceImages=Yes
          if (imageUrls.length > 0 && existingMediaCount > 0 && !shouldReplaceImages) {
            console.log(`[Import] Skipping ${imageUrls.length} image(s) for "${first.name}" — product already has ${existingMediaCount} media (use replaceImages=Yes to update)`);
          } else {
            // If replacing, delete existing media first
            if (shouldReplaceImages && existingMediaCount > 0 && imageUrls.length > 0) {
              try {
                const mediaQuery = await ctx.apiClient.query(
                  `query ProductMedia($id: ID!) { product(id: $id) { media { id } } }`,
                  { id: productId }
                );
                const mediaIds = (mediaQuery.data?.product?.media || []).map((m: any) => m.id);
                if (mediaIds.length > 0) {
                  for (const mId of mediaIds) {
                    await ctx.apiClient.mutation(
                      `mutation DeleteMedia($id: ID!) { productMediaDelete(id: $id) { product { id } errors { field message } } }`,
                      { id: mId }
                    );
                  }
                  console.log(`[Import] Deleted ${mediaIds.length} existing media for "${first.name}" before re-upload`);
                }
              } catch (e) {
                console.warn(`[Import] Could not delete existing media for "${first.name}" — will append instead`);
              }
            }
            for (const imgUrl of imageUrls) {
              console.log(`[Import] Downloading & uploading image for "${first.name}": ${imgUrl.substring(0, 80)}`);
              const uploadResult = await uploadProductImage(
                imgUrl, productId!, imageAlt, ctx.saleorApiUrl, ctx.appToken
              );
              if (uploadResult.success) {
                console.log(`[Import] Image uploaded: ${uploadResult.id}`);
              } else {
                console.error(`[Import] Image failed for "${first.name}": ${uploadResult.error}`);
                imageErrors.push(`Image "${imgUrl.substring(0, 60)}": ${uploadResult.error}`);
              }
            }
          }

          // ── Create/update variants + prices + stock ──
          for (let vi = 0; vi < group.rows.length; vi++) {
            const vRow = group.rows[vi];
            const origIdx = indices[vi];
            const variantName = vRow.variantName || vRow.sku || `Variant ${vi + 1}`;

            try {
              // Build variant attributes (case-insensitive matching)
              const variantAttrs: Record<string, any>[] = [];
              for (const attr of variantAttributes) {
                const slug = attr.slug.toLowerCase();
                const name = attr.name.toLowerCase();
                let value: string | undefined;

                for (const [key, val] of Object.entries(vRow)) {
                  if (!key.startsWith("variantAttr:") || !val) continue;
                  const attrRef = key.substring(12).toLowerCase();
                  if (attrRef === slug || attrRef === name) {
                    value = val;
                    break;
                  }
                }

                // Legacy size/color fallback
                if (!value && (slug.includes("size") || slug.includes("shoe") || name.includes("size"))) {
                  value = vRow.variantName;
                }
                if (!value && (slug.includes("color") || slug.includes("colour") || name.includes("color"))) {
                  value = vRow.color;
                }
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
              }

              let variantId: string | undefined;

              const existingVariant = vRow.sku
                ? existingVariants.find(ev => ev.sku && ev.sku.toLowerCase() === vRow.sku.toLowerCase())
                : undefined;

              if (existingVariant) {
                variantId = existingVariant.id;
                const updateResult = await ctx.apiClient.mutation(
                  `mutation ProductVariantUpdate($id: ID!, $input: ProductVariantInput!) {
                    productVariantUpdate(id: $id, input: $input) {
                      productVariant { id name sku }
                      errors { field code message }
                    }
                  }`,
                  {
                    id: existingVariant.id,
                    input: {
                      name: variantName,
                      sku: vRow.sku || undefined,
                      trackInventory: parseBool(vRow.trackInventory, true),
                      quantityLimitPerCustomer: vRow.quantityLimit ? parseInt(vRow.quantityLimit) : undefined,
                      weight: vRow.variantWeight ? parseFloat(vRow.variantWeight) : undefined,
                      externalReference: vRow.variantExternalReference || undefined,
                      ...(variantAttrs.length > 0 ? { attributes: variantAttrs } : {}),
                    },
                  }
                );
                if (updateResult.error || updateResult.data?.productVariantUpdate?.errors?.length > 0) {
                  const errMsg = updateResult.error?.graphQLErrors?.map((e: any) => e.message).join("; ")
                    || updateResult.data?.productVariantUpdate?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ")
                    || "Variant update failed";
                  const warnings = imageErrors.length > 0 ? ` | ${imageErrors.join("; ")}` : "";
                  results.push({ row: origIdx + 1, success: false, error: `Variant: ${errMsg}${warnings}` });
                  continue;
                }
              } else {
                const varResult = await ctx.apiClient.mutation(
                  `mutation ProductVariantCreate($input: ProductVariantCreateInput!) {
                    productVariantCreate(input: $input) {
                      productVariant { id name sku }
                      errors { field code message }
                    }
                  }`,
                  {
                    input: {
                      product: productId,
                      name: variantName,
                      sku: vRow.sku || undefined,
                      trackInventory: parseBool(vRow.trackInventory, true),
                      quantityLimitPerCustomer: vRow.quantityLimit ? parseInt(vRow.quantityLimit) : undefined,
                      weight: vRow.variantWeight ? parseFloat(vRow.variantWeight) : undefined,
                      externalReference: vRow.variantExternalReference || undefined,
                      attributes: variantAttrs,
                    },
                  }
                );

                if (varResult.error) {
                  const errMsg = varResult.error.graphQLErrors?.map((e: any) => e.message).join("; ") || "Variant error";
                  results.push({ row: origIdx + 1, success: false, error: `Variant: ${errMsg}` });
                  continue;
                }

                const varData = varResult.data?.productVariantCreate;
                if (!varData?.productVariant?.id || varData.errors?.length > 0) {
                  const errMsg = varData?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "Variant create failed";
                  results.push({ row: origIdx + 1, success: false, error: errMsg });
                  continue;
                }
                variantId = varData.productVariant.id;
              }

              // ── Set price via channel listing ──
              const price = vRow.price ? parseFloat(vRow.price) : undefined;
              const costPrice = vRow.costPrice ? parseFloat(vRow.costPrice) : undefined;

              if (channelIds.length > 0 && price !== undefined) {
                try {
                  await ctx.apiClient.mutation(
                    `mutation ProductVariantChannelListingUpdate($id: ID!, $input: [ProductVariantChannelListingAddInput!]!) {
                      productVariantChannelListingUpdate(id: $id, input: $input) {
                        variant { id }
                        errors { field code message }
                      }
                    }`,
                    {
                      id: variantId,
                      input: channelIds.map((ch) => ({ channelId: ch.id, price, costPrice })),
                    }
                  );
                } catch { /* non-critical */ }
              }

              // ── Set stock (multi-warehouse via stock:* columns or single warehouse) ──
              const stocks: { warehouse: string; quantity: number }[] = [];

              for (const [key, val] of Object.entries(vRow)) {
                if (key.startsWith("stock:") && val) {
                  const whName = key.substring(6).toLowerCase();
                  const whId = warehouseNameMap.get(whName);
                  if (whId && !isNaN(parseInt(val))) {
                    stocks.push({ warehouse: whId, quantity: parseInt(val) });
                  }
                }
              }

              if (stocks.length === 0 && vRow.stock && rowWarehouseId) {
                const qty = parseInt(vRow.stock);
                if (!isNaN(qty)) {
                  stocks.push({ warehouse: rowWarehouseId, quantity: qty });
                }
              }

              if (stocks.length > 0) {
                const stockMutation = existingVariant
                  ? `mutation ProductVariantStocksUpdate($variantId: ID!, $stocks: [StockInput!]!) {
                      productVariantStocksUpdate(variantId: $variantId, stocks: $stocks) {
                        productVariant { id }
                        errors { field code message }
                      }
                    }`
                  : `mutation ProductVariantStocksCreate($variantId: ID!, $stocks: [StockInput!]!) {
                      productVariantStocksCreate(variantId: $variantId, stocks: $stocks) {
                        productVariant { id }
                        errors { field code message }
                      }
                    }`;
                try {
                  await ctx.apiClient.mutation(stockMutation, { variantId, stocks });
                } catch { /* non-critical */ }
              }

              const warnings = imageErrors.length > 0 ? ` (image warnings: ${imageErrors.join("; ")})` : "";
              results.push({ row: origIdx + 1, success: true, id: productId, error: warnings || undefined });
            } catch (error) {
              results.push({
                row: origIdx + 1,
                success: false,
                error: `Variant: ${error instanceof Error ? error.message : "Unknown error"}`,
              });
            }
          }
        } catch (error) {
          for (const idx of indices) {
            results.push({ row: idx + 1, success: false, error: error instanceof Error ? error.message : "Unknown error" });
          }
        }
      }

      return buildImportResponse(results, input.rows.length);
    }),

  // ── Helper: format attribute values for export ──
  // (defined inline as it's only used by export)

  export: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string(),
        format: z.enum(["csv", "xlsx"]),
        first: z.number().min(1).max(500).default(100),
        after: z.string().optional(),
        search: z.string().optional(),
        categoryIds: z.array(z.string()).optional(),
        productTypeIds: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const filter: Record<string, unknown> = {};
      if (input.search) filter.search = input.search;
      if (input.categoryIds?.length) filter.categories = input.categoryIds;
      if (input.productTypeIds?.length) filter.productTypes = input.productTypeIds;
      const hasFilter = Object.keys(filter).length > 0;

      const result = await ctx.apiClient.query(
        `query ProductsExport($channel: String!, $first: Int!, $after: String, $filter: ProductFilterInput) {
          products(channel: $channel, first: $first, after: $after, filter: $filter) {
            edges {
              node {
                id
                name
                slug
                description
                externalReference
                created
                updatedAt
                rating
                seoTitle
                seoDescription
                category { id name slug }
                productType { id name }
                weight { value unit }
                thumbnail { url }
                media { url alt type }
                collections { id name slug }
                taxClass { id name }
                metadata { key value }
                attributes {
                  attribute { slug name inputType }
                  values { name slug plainText boolean date dateTime file { url } }
                }
                channelListings {
                  channel { slug currencyCode }
                  isPublished
                  publishedAt
                  visibleInListings
                  availableForPurchaseAt
                  discountedPrice { amount }
                }
                variants {
                  id
                  name
                  sku
                  externalReference
                  trackInventory
                  quantityLimitPerCustomer
                  weight { value unit }
                  metadata { key value }
                  attributes {
                    attribute { slug name inputType }
                    values { name slug plainText boolean date dateTime }
                  }
                  channelListings {
                    channel { slug }
                    price { amount currency }
                    costPrice { amount currency }
                  }
                  stocks {
                    quantity
                    quantityAllocated
                    warehouse { id name slug }
                  }
                }
              }
            }
            pageInfo { hasNextPage endCursor }
            totalCount
          }
        }`,
        {
          channel: input.channelSlug,
          first: input.first,
          after: input.after,
          filter: hasFilter ? filter : undefined,
        }
      );

      assertQuerySuccess(result, "ProductsExport");

      const products = result.data?.products?.edges?.map((e: any) => e.node) || [];
      const pageInfo = result.data?.products?.pageInfo;
      const totalCount = result.data?.products?.totalCount;

      const channelSlug = input.channelSlug;

      // Collect all unique attribute slugs for dynamic columns
      const allProductAttrSlugs = new Set<string>();
      const allVariantAttrSlugs = new Set<string>();
      for (const product of products) {
        for (const attr of (product.attributes || [])) {
          if (attr.attribute?.slug) allProductAttrSlugs.add(attr.attribute.slug);
        }
        for (const variant of (product.variants || [])) {
          for (const attr of (variant.attributes || [])) {
            if (attr.attribute?.slug) allVariantAttrSlugs.add(attr.attribute.slug);
          }
        }
      }

      // Format a selected attribute's values for CSV/Excel export
      const fmtAttr = (selectedAttr: any): string => {
        const values = selectedAttr?.values || [];
        if (values.length === 0) return "";
        const inputType = selectedAttr.attribute?.inputType;
        if (inputType === "BOOLEAN") return values[0]?.boolean ? "Yes" : "No";
        if (inputType === "PLAIN_TEXT") return values[0]?.plainText || "";
        if (inputType === "DATE" || inputType === "DATE_TIME") return values[0]?.date || values[0]?.dateTime || "";
        if (inputType === "FILE") return values[0]?.file?.url || "";
        return values.map((v: any) => v.name || v.slug || "").join("; ");
      };

      const rows = products.flatMap((product: any) => {
        const channelListing = product.channelListings?.find(
          (cl: any) => cl.channel.slug === channelSlug
        );
        const collectionsStr = (product.collections || [])
          .map((c: any) => c.name)
          .join("; ");
        const mediaUrls = (product.media || [])
          .map((m: any) => m.url)
          .join("; ");
        const metadataStr = (product.metadata || [])
          .map((m: any) => `${m.key}=${m.value}`)
          .join("; ");

        // Build product-level attribute columns
        const productAttrCols: Record<string, string> = {};
        for (const slug of allProductAttrSlugs) {
          const matched = (product.attributes || []).find((a: any) => a.attribute?.slug === slug);
          productAttrCols[`attr:${slug}`] = matched ? fmtAttr(matched) : "";
        }

        const baseFields = {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          description: product.description ? tryParseDescription(product.description) : "",
          externalReference: product.externalReference || "",
          category: product.category?.name || "",
          categorySlug: product.category?.slug || "",
          productType: product.productType?.name || "",
          collections: collectionsStr,
          seoTitle: product.seoTitle || "",
          seoDescription: product.seoDescription || "",
          rating: product.rating ?? "",
          weight: product.weight ? `${product.weight.value} ${product.weight.unit}` : "",
          taxClass: product.taxClass?.name || "",
          thumbnailUrl: product.thumbnail?.url || "",
          mediaUrls,
          isPublished: channelListing?.isPublished ? "Yes" : "No",
          publishedAt: channelListing?.publishedAt || "",
          visibleInListings: channelListing?.visibleInListings ? "Yes" : "No",
          availableForPurchaseAt: channelListing?.availableForPurchaseAt || "",
          created: product.created || "",
          updatedAt: product.updatedAt || "",
          metadata: metadataStr,
        };

        // Empty variant attr columns for products with no variants
        const emptyVariantAttrCols: Record<string, string> = {};
        for (const slug of allVariantAttrSlugs) {
          emptyVariantAttrCols[`variantAttr:${slug}`] = "";
        }

        if (!product.variants || product.variants.length === 0) {
          return [{
            ...baseFields,
            ...productAttrCols,
            variantId: "",
            variantName: "",
            sku: "",
            variantExternalReference: "",
            price: "",
            currency: channelListing?.channel?.currencyCode || "",
            costPrice: "",
            discountedPrice: channelListing?.discountedPrice?.amount ?? "",
            stockTotal: "",
            stockAllocated: "",
            stockByWarehouse: "",
            trackInventory: "",
            quantityLimit: "",
            ...emptyVariantAttrCols,
          }];
        }

        return product.variants.map((variant: any) => {
          const variantListing = variant.channelListings?.find(
            (cl: any) => cl.channel.slug === channelSlug
          );
          const stockTotal = variant.stocks?.reduce(
            (sum: number, s: any) => sum + (s.quantity || 0), 0
          ) || 0;
          const stockAllocated = variant.stocks?.reduce(
            (sum: number, s: any) => sum + (s.quantityAllocated || 0), 0
          ) || 0;
          const stockByWarehouse = (variant.stocks || [])
            .map((s: any) => `${s.warehouse.name}: ${s.quantity}`)
            .join("; ");

          // Build variant-level attribute columns
          const variantAttrCols: Record<string, string> = {};
          for (const slug of allVariantAttrSlugs) {
            const matched = (variant.attributes || []).find((a: any) => a.attribute?.slug === slug);
            variantAttrCols[`variantAttr:${slug}`] = matched ? fmtAttr(matched) : "";
          }

          return {
            ...baseFields,
            ...productAttrCols,
            variantId: variant.id,
            variantName: variant.name,
            sku: variant.sku || "",
            variantExternalReference: variant.externalReference || "",
            price: variantListing?.price?.amount ?? "",
            currency: variantListing?.price?.currency || channelListing?.channel?.currencyCode || "",
            costPrice: variantListing?.costPrice?.amount ?? "",
            discountedPrice: channelListing?.discountedPrice?.amount ?? "",
            stockTotal,
            stockAllocated,
            stockByWarehouse,
            trackInventory: variant.trackInventory ? "Yes" : "No",
            quantityLimit: variant.quantityLimitPerCustomer ?? "",
            ...variantAttrCols,
          };
        });
      });

      if (input.format === "csv") {
        return { data: exportToCSV(rows), format: "csv" as const, pageInfo, totalCount };
      } else {
        return {
          data: exportToExcel(rows, "Products"),
          format: "xlsx" as const,
          pageInfo,
          totalCount,
        };
      }
    }),

  bulkDelete: protectedClientProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.apiClient.mutation(
        `mutation ProductBulkDelete($ids: [ID!]!) {
          productBulkDelete(ids: $ids) {
            count
            errors { field code message }
          }
        }`,
        { ids: input.ids }
      );

      const data = result.data?.productBulkDelete;
      if (data?.errors?.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: data.errors.map((e: any) => e.message).join("; "),
        });
      }

      return { count: data?.count || 0 };
    }),
});
