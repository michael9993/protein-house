import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { exportToCSV } from "../../export/csv-exporter";
import { exportToExcel } from "../../export/excel-exporter";
import { assertQuerySuccess, applyFieldMappings, tryParseDescription, parseMetadata, isValidUrl, type ImportResult, buildImportResponse } from "../utils/helpers";
import { uploadCategoryBackgroundImage } from "../utils/image-upload";

export const categoriesRouter = router({
  import: protectedClientProcedure
    .input(
      z.object({
        rows: z.array(z.record(z.string())),
        fieldMappings: z.record(z.string()),
        upsertMode: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results: ImportResult[] = [];

      // Pre-fetch existing categories for parent resolution AND upsert matching
      const categorySlugMap = new Map<string, string>();
      const categoryNameMap = new Map<string, string>();
      const categoryRefMap = new Map<string, string>();
      const categoryBgMap = new Map<string, boolean>(); // id -> has background image
      try {
        let hasNext = true;
        let after: string | undefined;
        while (hasNext) {
          const catResult = await ctx.apiClient.query(
            `query CatsList($first: Int!, $after: String) {
              categories(first: 100, after: $after) {
                edges { node { id name slug externalReference backgroundImage { url } } }
                pageInfo { hasNextPage endCursor }
              }
            }`,
            { first: 100, after }
          );
          const edges = catResult.data?.categories?.edges || [];
          for (const e of edges) {
            categorySlugMap.set(e.node.slug.toLowerCase(), e.node.id);
            categoryNameMap.set(e.node.name.toLowerCase(), e.node.id);
            if (e.node.externalReference) categoryRefMap.set(e.node.externalReference, e.node.id);
            categoryBgMap.set(e.node.id, !!e.node.backgroundImage?.url);
          }
          hasNext = catResult.data?.categories?.pageInfo?.hasNextPage || false;
          after = catResult.data?.categories?.pageInfo?.endCursor;
        }
      } catch { /* ignore */ }

      // Map all rows first
      const mappedRows = input.rows.map((row) => applyFieldMappings(row, input.fieldMappings));

      // Topological sort: process categories without parents first, then children
      const withParent: { mapped: Record<string, string>; origIdx: number }[] = [];
      const withoutParent: { mapped: Record<string, string>; origIdx: number }[] = [];
      for (let i = 0; i < mappedRows.length; i++) {
        if (mappedRows[i].parent) {
          withParent.push({ mapped: mappedRows[i], origIdx: i });
        } else {
          withoutParent.push({ mapped: mappedRows[i], origIdx: i });
        }
      }
      const ordered = [...withoutParent, ...withParent];

      for (const { mapped, origIdx } of ordered) {
        try {
          // Resolve parent category by slug or name
          let parentId: string | undefined;
          if (mapped.parent) {
            const lower = mapped.parent.toLowerCase();
            parentId = categorySlugMap.get(lower) || categoryNameMap.get(lower);
          }

          const categoryFields: Record<string, any> = {
            name: mapped.name,
            slug: mapped.slug || undefined,
            description: mapped.description
              ? JSON.stringify({ blocks: [{ type: "paragraph", data: { text: mapped.description } }] })
              : undefined,
            ...(mapped.seoTitle || mapped.seoDescription ? {
              seoTitle: mapped.seoTitle || undefined,
              seoDescription: mapped.seoDescription || undefined,
            } : {}),
            ...(mapped.metadata ? { metadata: parseMetadata(mapped.metadata) } : {}),
            ...(mapped.externalReference ? { externalReference: mapped.externalReference } : {}),
          };

          let categoryId: string | undefined;
          let hasExistingBg = false;

          // Upsert: check if category already exists
          if (input.upsertMode) {
            const existingByRef = mapped.externalReference ? categoryRefMap.get(mapped.externalReference) : undefined;
            const slug = mapped.slug || mapped.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const existingBySlug = slug ? categorySlugMap.get(slug.toLowerCase()) : undefined;
            const existingId = existingByRef || existingBySlug;

            if (existingId) {
              hasExistingBg = categoryBgMap.get(existingId) || false;
              const updateResult = await ctx.apiClient.mutation(
                `mutation CategoryUpdate($id: ID!, $input: CategoryInput!) {
                  categoryUpdate(id: $id, input: $input) {
                    category { id name slug }
                    errors { field code message }
                  }
                }`,
                { id: existingId, input: categoryFields }
              );

              if (updateResult.error) {
                const errMsg = updateResult.error.graphQLErrors?.map((e: any) => e.message).join("; ") || "GraphQL error";
                results.push({ row: origIdx + 1, success: false, error: `Category update: ${errMsg}` });
                continue;
              }
              const updateData = updateResult.data?.categoryUpdate;
              if (!updateData?.category?.id || updateData.errors?.length > 0) {
                const errMsg = updateData?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "Category update failed";
                results.push({ row: origIdx + 1, success: false, error: errMsg });
                continue;
              }
              categoryId = updateData.category.id;
            }
          }

          // Create new category if not found via upsert
          if (!categoryId) {
            const result = await ctx.apiClient.mutation(
              `mutation CategoryCreate($input: CategoryInput!, $parent: ID) {
                categoryCreate(input: $input, parent: $parent) {
                  category { id name slug }
                  errors { field code message }
                }
              }`,
              { input: categoryFields, parent: parentId || undefined }
            );

            if (result.error) {
              const errMsg = result.error.graphQLErrors?.map((e: any) => e.message).join("; ") || result.error.message || "GraphQL error";
              if (!input.upsertMode && errMsg.toLowerCase().includes("slug") && errMsg.toLowerCase().includes("already exists")) {
                results.push({ row: origIdx + 1, success: false, error: errMsg + ' — Enable "Update existing categories" to update instead of create' });
              } else {
                results.push({ row: origIdx + 1, success: false, error: errMsg });
              }
              continue;
            }

            const data = result.data?.categoryCreate;
            if (!data || data.errors?.length > 0) {
              results.push({
                row: origIdx + 1,
                success: false,
                error: data?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "No response from API",
              });
              continue;
            }

            const cat = data.category;
            if (cat) {
              categorySlugMap.set(cat.slug.toLowerCase(), cat.id);
              categoryNameMap.set(cat.name.toLowerCase(), cat.id);
            }
            categoryId = cat?.id;
          }

          // Upload background image if provided
          if (categoryId && mapped.backgroundImageUrl && isValidUrl(mapped.backgroundImageUrl)) {
            if (hasExistingBg) {
              console.log(`[Import] Skipping background image for "${mapped.name}" — already has one`);
            } else {
              const alt = mapped.backgroundImageAlt || mapped.name || "";
              console.log(`[Import] Uploading background image for category "${mapped.name}"`);
              const imgResult = await uploadCategoryBackgroundImage(
                mapped.backgroundImageUrl, categoryId, alt, ctx.saleorApiUrl, ctx.appToken
              );
              if (!imgResult.success) {
                console.error(`[Import] Background image failed for "${mapped.name}": ${imgResult.error}`);
              }
            }
          }

          results.push({ row: origIdx + 1, success: true, id: categoryId });
        } catch (error) {
          results.push({
            row: origIdx + 1,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return buildImportResponse(results, input.rows.length);
    }),

  export: protectedClientProcedure
    .input(
      z.object({
        format: z.enum(["csv", "xlsx"]),
        first: z.number().min(1).max(500).default(100),
        after: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.apiClient.query(
        `query CategoriesExport($first: Int!, $after: String) {
          categories(first: $first, after: $after) {
            edges {
              node {
                id
                name
                slug
                description
                externalReference
                seoTitle
                seoDescription
                parent { id name slug }
                ancestors(first: 10) { edges { node { name slug } } }
                level
                backgroundImage { url alt }
                products { totalCount }
                metadata { key value }
              }
            }
            pageInfo { hasNextPage endCursor }
            totalCount
          }
        }`,
        { first: input.first, after: input.after }
      );

      assertQuerySuccess(result, "CategoriesExport");

      const categories = result.data?.categories?.edges?.map((e: any) => e.node) || [];
      const pageInfo = result.data?.categories?.pageInfo;
      const totalCount = result.data?.categories?.totalCount;

      const rows = categories.map((cat: any) => {
        const ancestorPath = (cat.ancestors?.edges || [])
          .map((e: any) => e.node.name)
          .join(" > ");
        const metadataStr = (cat.metadata || [])
          .map((m: any) => `${m.key}=${m.value}`)
          .join("; ");

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description ? tryParseDescription(cat.description) : "",
          externalReference: cat.externalReference || "",
          seoTitle: cat.seoTitle || "",
          seoDescription: cat.seoDescription || "",
          parentName: cat.parent?.name || "",
          parentSlug: cat.parent?.slug || "",
          ancestorPath,
          level: cat.level,
          backgroundImageUrl: cat.backgroundImage?.url || "",
          productCount: cat.products?.totalCount || 0,
          metadata: metadataStr,
        };
      });

      if (input.format === "csv") {
        return { data: exportToCSV(rows), format: "csv" as const, pageInfo, totalCount };
      } else {
        return { data: exportToExcel(rows, "Categories"), format: "xlsx" as const, pageInfo, totalCount };
      }
    }),

  bulkDelete: protectedClientProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.apiClient.mutation(
        `mutation CategoryBulkDelete($ids: [ID!]!) {
          categoryBulkDelete(ids: $ids) {
            count
            errors { field code message }
          }
        }`,
        { ids: input.ids }
      );

      const data = result.data?.categoryBulkDelete;
      if (data?.errors?.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: data.errors.map((e: any) => e.message).join("; "),
        });
      }

      return { count: data?.count || 0 };
    }),
});
