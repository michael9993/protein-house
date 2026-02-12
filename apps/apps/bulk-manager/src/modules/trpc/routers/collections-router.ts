import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { exportToCSV } from "../../export/csv-exporter";
import { exportToExcel } from "../../export/excel-exporter";
import { assertQuerySuccess, applyFieldMappings, tryParseDescription, parseBool, parseMetadata, parseSemicolonList, isValidUrl, type ImportResult, buildImportResponse } from "../utils/helpers";
import { uploadCollectionBackgroundImage } from "../utils/image-upload";

export const collectionsRouter = router({
  import: protectedClientProcedure
    .input(
      z.object({
        rows: z.array(z.record(z.string())),
        channelSlugs: z.array(z.string()).min(1),
        fieldMappings: z.record(z.string()),
        upsertMode: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results: ImportResult[] = [];

      // Pre-fetch products for slug/SKU → ID resolution
      const productSlugMap = new Map<string, string>();
      const productSkuMap = new Map<string, string>();
      try {
        let hasNext = true;
        let after: string | undefined;
        while (hasNext) {
          const pResult = await ctx.apiClient.query(
            `query ProductsList($first: Int!, $after: String) {
              products(first: 100, after: $after) {
                edges { node { id slug variants { sku } } }
                pageInfo { hasNextPage endCursor }
              }
            }`,
            { first: 100, after }
          );
          const edges = pResult.data?.products?.edges || [];
          for (const e of edges) {
            productSlugMap.set(e.node.slug.toLowerCase(), e.node.id);
            for (const v of (e.node.variants || [])) {
              if (v.sku) productSkuMap.set(v.sku.toLowerCase(), e.node.id);
            }
          }
          hasNext = pResult.data?.products?.pageInfo?.hasNextPage || false;
          after = pResult.data?.products?.pageInfo?.endCursor;
        }
      } catch { /* ignore */ }

      // Resolve channel IDs from slugs
      const channelIds: { id: string; slug: string }[] = [];
      try {
        const chResult = await ctx.apiClient.query(`query { channels { id slug } }`, {});
        for (const ch of (chResult.data?.channels || [])) {
          if (input.channelSlugs.includes(ch.slug)) {
            channelIds.push({ id: ch.id, slug: ch.slug });
          }
        }
      } catch { /* ignore */ }

      // Pre-fetch existing collections for upsert
      const existingBySlug = new Map<string, { id: string; hasBg: boolean }>();
      const existingByRef = new Map<string, { id: string; hasBg: boolean }>();
      if (input.upsertMode) {
        try {
          let hasNext = true;
          let after: string | undefined;
          while (hasNext) {
            const colResult = await ctx.apiClient.query(
              `query CollectionsLookup($after: String) {
                collections(first: 100, after: $after) {
                  edges { node { id slug externalReference backgroundImage { url } } }
                  pageInfo { hasNextPage endCursor }
                }
              }`,
              { after }
            );
            for (const e of (colResult.data?.collections?.edges || [])) {
              const info = { id: e.node.id, hasBg: !!e.node.backgroundImage?.url };
              if (e.node.slug) existingBySlug.set(e.node.slug.toLowerCase(), info);
              if (e.node.externalReference) existingByRef.set(e.node.externalReference, info);
            }
            hasNext = colResult.data?.collections?.pageInfo?.hasNextPage || false;
            after = colResult.data?.collections?.pageInfo?.endCursor;
          }
        } catch { /* ignore */ }
      }

      for (let i = 0; i < input.rows.length; i++) {
        const row = input.rows[i];
        try {
          const mapped = applyFieldMappings(row, input.fieldMappings);

          // Resolve product IDs from slugs and/or SKUs
          const productIds: string[] = [];
          if (mapped.productSlugs) {
            for (const ref of parseSemicolonList(mapped.productSlugs)) {
              const id = productSlugMap.get(ref.toLowerCase());
              if (id && !productIds.includes(id)) productIds.push(id);
            }
          }
          if (mapped.productSKUs) {
            for (const ref of parseSemicolonList(mapped.productSKUs)) {
              const id = productSkuMap.get(ref.toLowerCase());
              if (id && !productIds.includes(id)) productIds.push(id);
            }
          }

          const collectionFields: Record<string, any> = {
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

          let collectionId: string | undefined;
          let hasExistingBg = false;

          // Upsert: check if collection already exists
          if (input.upsertMode) {
            const byRef = mapped.externalReference ? existingByRef.get(mapped.externalReference) : undefined;
            const slug = mapped.slug || mapped.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const bySlug = slug ? existingBySlug.get(slug.toLowerCase()) : undefined;
            const existing = byRef || bySlug;

            if (existing) {
              hasExistingBg = existing.hasBg;
              const updateResult = await ctx.apiClient.mutation(
                `mutation CollectionUpdate($id: ID!, $input: CollectionInput!) {
                  collectionUpdate(id: $id, input: $input) {
                    collection { id name slug }
                    errors { field code message }
                  }
                }`,
                { id: existing.id, input: collectionFields }
              );

              if (updateResult.error) {
                const errMsg = updateResult.error.graphQLErrors?.map((e: any) => e.message).join("; ") || "GraphQL error";
                results.push({ row: i + 1, success: false, error: `Collection update: ${errMsg}` });
                continue;
              }
              const updateData = updateResult.data?.collectionUpdate;
              if (!updateData?.collection?.id || updateData.errors?.length > 0) {
                const errMsg = updateData?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "Collection update failed";
                results.push({ row: i + 1, success: false, error: errMsg });
                continue;
              }
              collectionId = updateData.collection.id;

              // Add products (additive — doesn't remove existing products)
              if (productIds.length > 0) {
                try {
                  await ctx.apiClient.mutation(
                    `mutation CollectionAddProducts($id: ID!, $products: [ID!]!) {
                      collectionAddProducts(collectionId: $id, products: $products) {
                        collection { id }
                        errors { field code message }
                      }
                    }`,
                    { id: collectionId, products: productIds }
                  );
                } catch { /* non-critical */ }
              }
            }
          }

          // Create new collection if not found via upsert
          if (!collectionId) {
            const result = await ctx.apiClient.mutation(
              `mutation CollectionCreate($input: CollectionCreateInput!) {
                collectionCreate(input: $input) {
                  collection { id name slug }
                  errors { field code message }
                }
              }`,
              {
                input: {
                  ...collectionFields,
                  ...(productIds.length > 0 ? { products: productIds } : {}),
                },
              }
            );

            if (result.error) {
              const errMsg = result.error.graphQLErrors?.map((e: any) => e.message).join("; ") || result.error.message || "GraphQL error";
              if (!input.upsertMode && errMsg.toLowerCase().includes("slug") && errMsg.toLowerCase().includes("already exists")) {
                results.push({ row: i + 1, success: false, error: errMsg + ' — Enable \"Update existing collections\" to update instead of create' });
              } else {
                results.push({ row: i + 1, success: false, error: errMsg });
              }
              continue;
            }

            const data = result.data?.collectionCreate;
            if (!data || data.errors?.length > 0) {
              results.push({
                row: i + 1,
                success: false,
                error: data?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "No response from API",
              });
              continue;
            }
            collectionId = data.collection?.id;
          }

          // Publish to all selected channels
          if (collectionId && channelIds.length > 0) {
            try {
              await ctx.apiClient.mutation(
                `mutation CollectionChannelListingUpdate($id: ID!, $input: CollectionChannelListingUpdateInput!) {
                  collectionChannelListingUpdate(id: $id, input: $input) {
                    collection { id }
                    errors { field code message }
                  }
                }`,
                {
                  id: collectionId,
                  input: {
                    addChannels: channelIds.map((ch) => ({
                      channelId: ch.id,
                      isPublished: parseBool(mapped.isPublished, true),
                    })),
                  },
                }
              );
            } catch { /* non-critical */ }
          }

          // Upload background image if provided
          if (collectionId && mapped.backgroundImageUrl && isValidUrl(mapped.backgroundImageUrl)) {
            if (hasExistingBg) {
              console.log(`[Import] Skipping background image for collection "${mapped.name}" — already has one`);
            } else {
              const alt = mapped.backgroundImageAlt || mapped.name || "";
              console.log(`[Import] Uploading background image for collection "${mapped.name}"`);
              const imgResult = await uploadCollectionBackgroundImage(
                mapped.backgroundImageUrl, collectionId, alt, ctx.saleorApiUrl, ctx.appToken
              );
              if (!imgResult.success) {
                console.error(`[Import] Background image failed for "${mapped.name}": ${imgResult.error}`);
              }
            }
          }

          results.push({ row: i + 1, success: true, id: collectionId });
        } catch (error) {
          results.push({
            row: i + 1,
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
        channelSlug: z.string(),
        format: z.enum(["csv", "xlsx"]),
        first: z.number().min(1).max(500).default(100),
        after: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.apiClient.query(
        `query CollectionsExport($channel: String!, $first: Int!, $after: String) {
          collections(channel: $channel, first: $first, after: $after) {
            edges {
              node {
                id
                name
                slug
                description
                externalReference
                seoTitle
                seoDescription
                backgroundImage { url alt }
                products(first: 0) { totalCount }
                channelListings {
                  channel { slug }
                  isPublished
                  publishedAt
                }
                metadata { key value }
              }
            }
            pageInfo { hasNextPage endCursor }
            totalCount
          }
        }`,
        { channel: input.channelSlug, first: input.first, after: input.after }
      );

      assertQuerySuccess(result, "CollectionsExport");

      const collections = result.data?.collections?.edges?.map((e: any) => e.node) || [];
      const pageInfo = result.data?.collections?.pageInfo;
      const totalCount = result.data?.collections?.totalCount;

      const rows = collections.map((col: any) => {
        const channelListing = col.channelListings?.find(
          (cl: any) => cl.channel.slug === input.channelSlug
        );
        const metadataStr = (col.metadata || [])
          .map((m: any) => `${m.key}=${m.value}`)
          .join("; ");

        return {
          id: col.id,
          name: col.name,
          slug: col.slug,
          description: col.description ? tryParseDescription(col.description) : "",
          externalReference: col.externalReference || "",
          seoTitle: col.seoTitle || "",
          seoDescription: col.seoDescription || "",
          backgroundImageUrl: col.backgroundImage?.url || "",
          productCount: col.products?.totalCount || 0,
          isPublished: channelListing?.isPublished ? "Yes" : "No",
          publishedAt: channelListing?.publishedAt || "",
          metadata: metadataStr,
        };
      });

      if (input.format === "csv") {
        return { data: exportToCSV(rows), format: "csv" as const, pageInfo, totalCount };
      } else {
        return { data: exportToExcel(rows, "Collections"), format: "xlsx" as const, pageInfo, totalCount };
      }
    }),

  bulkDelete: protectedClientProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.apiClient.mutation(
        `mutation CollectionBulkDelete($ids: [ID!]!) {
          collectionBulkDelete(ids: $ids) {
            count
            errors { field code message }
          }
        }`,
        { ids: input.ids }
      );

      const data = result.data?.collectionBulkDelete;
      if (data?.errors?.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: data.errors.map((e: any) => e.message).join("; "),
        });
      }

      return { count: data?.count || 0 };
    }),
});
