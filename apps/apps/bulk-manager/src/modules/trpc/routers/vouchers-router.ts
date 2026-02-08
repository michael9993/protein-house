import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { exportToCSV } from "../../export/csv-exporter";
import { exportToExcel } from "../../export/excel-exporter";
import { assertQuerySuccess, applyFieldMappings, parseBool, parseMetadata, parseSemicolonList, type ImportResult, buildImportResponse } from "../utils/helpers";

export const vouchersRouter = router({
  import: protectedClientProcedure
    .input(
      z.object({
        rows: z.array(z.record(z.string())),
        channelSlug: z.string(),
        fieldMappings: z.record(z.string()),
        upsertMode: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results: ImportResult[] = [];

      // Pre-fetch entity maps for slug → ID resolution
      const categorySlugMap = new Map<string, string>();
      const collectionSlugMap = new Map<string, string>();
      const productSlugMap = new Map<string, string>();

      try {
        let hasNext = true;
        let after: string | undefined;
        while (hasNext) {
          const r = await ctx.apiClient.query(
            `query CategoriesList($first: Int!, $after: String) {
              categories(first: 100, after: $after) {
                edges { node { id slug } }
                pageInfo { hasNextPage endCursor }
              }
            }`,
            { first: 100, after }
          );
          for (const e of (r.data?.categories?.edges || [])) {
            categorySlugMap.set(e.node.slug.toLowerCase(), e.node.id);
          }
          hasNext = r.data?.categories?.pageInfo?.hasNextPage || false;
          after = r.data?.categories?.pageInfo?.endCursor;
        }
      } catch { /* ignore */ }

      try {
        let hasNext = true;
        let after: string | undefined;
        while (hasNext) {
          const r = await ctx.apiClient.query(
            `query CollectionsList($first: Int!, $after: String, $channel: String!) {
              collections(first: 100, after: $after, channel: $channel) {
                edges { node { id slug } }
                pageInfo { hasNextPage endCursor }
              }
            }`,
            { first: 100, after, channel: input.channelSlug }
          );
          for (const e of (r.data?.collections?.edges || [])) {
            collectionSlugMap.set(e.node.slug.toLowerCase(), e.node.id);
          }
          hasNext = r.data?.collections?.pageInfo?.hasNextPage || false;
          after = r.data?.collections?.pageInfo?.endCursor;
        }
      } catch { /* ignore */ }

      try {
        let hasNext = true;
        let after: string | undefined;
        while (hasNext) {
          const r = await ctx.apiClient.query(
            `query ProductsList($first: Int!, $after: String, $channel: String!) {
              products(first: 100, after: $after, channel: $channel) {
                edges { node { id slug } }
                pageInfo { hasNextPage endCursor }
              }
            }`,
            { first: 100, after, channel: input.channelSlug }
          );
          for (const e of (r.data?.products?.edges || [])) {
            productSlugMap.set(e.node.slug.toLowerCase(), e.node.id);
          }
          hasNext = r.data?.products?.pageInfo?.hasNextPage || false;
          after = r.data?.products?.pageInfo?.endCursor;
        }
      } catch { /* ignore */ }

      // Resolve channel ID
      let channelId: string | undefined;
      try {
        const chResult = await ctx.apiClient.query(`query { channels { id slug } }`, {});
        const ch = (chResult.data?.channels || []).find((c: any) => c.slug === input.channelSlug);
        channelId = ch?.id;
      } catch { /* ignore */ }

      // Pre-fetch existing vouchers for upsert by code
      const existingByCode = new Map<string, string>();
      if (input.upsertMode) {
        try {
          let hasNext = true;
          let after: string | undefined;
          while (hasNext) {
            const vResult = await ctx.apiClient.query(
              `query VouchersLookup($channel: String!, $after: String) {
                vouchers(channel: $channel, first: 100, after: $after) {
                  edges { node { id code } }
                  pageInfo { hasNextPage endCursor }
                }
              }`,
              { channel: input.channelSlug, after }
            );
            for (const e of (vResult.data?.vouchers?.edges || [])) {
              if (e.node.code) existingByCode.set(e.node.code.toLowerCase(), e.node.id);
            }
            hasNext = vResult.data?.vouchers?.pageInfo?.hasNextPage || false;
            after = vResult.data?.vouchers?.pageInfo?.endCursor;
          }
        } catch { /* ignore */ }
      }

      for (let i = 0; i < input.rows.length; i++) {
        const row = input.rows[i];
        try {
          const mapped = applyFieldMappings(row, input.fieldMappings);

          let voucherType: string | undefined;
          if (mapped.type) {
            const t = mapped.type.toUpperCase().trim();
            if (["ENTIRE_ORDER", "SHIPPING", "SPECIFIC_PRODUCT"].includes(t)) voucherType = t;
          }

          let discountValueType = "FIXED";
          if (mapped.discountValueType) {
            const dvt = mapped.discountValueType.toUpperCase().trim();
            if (dvt === "PERCENTAGE" || dvt === "%") discountValueType = "PERCENTAGE";
          }

          const voucherInput: Record<string, any> = {
            name: mapped.name,
            ...(mapped.code ? { code: mapped.code } : {}),
            ...(voucherType ? { type: voucherType } : {}),
            discountValueType,
            ...(mapped.startDate ? { startDate: mapped.startDate } : {}),
            ...(mapped.endDate ? { endDate: mapped.endDate } : {}),
            ...(mapped.usageLimit ? { usageLimit: parseInt(mapped.usageLimit) } : {}),
            applyOncePerOrder: parseBool(mapped.applyOncePerOrder, false),
            applyOncePerCustomer: parseBool(mapped.applyOncePerCustomer, false),
            onlyForStaff: parseBool(mapped.onlyForStaff, false),
            singleUse: parseBool(mapped.singleUse, false),
            ...(mapped.minCheckoutItemsQuantity ? { minCheckoutItemsQuantity: parseInt(mapped.minCheckoutItemsQuantity) } : {}),
          };

          if (mapped.countries) {
            voucherInput.countries = parseSemicolonList(mapped.countries).map(c => c.toUpperCase());
          }

          let voucherId: string | undefined;

          // Upsert: check if voucher exists by code
          if (input.upsertMode && mapped.code) {
            const existingId = existingByCode.get(mapped.code.toLowerCase());
            if (existingId) {
              const updateResult = await ctx.apiClient.mutation(
                `mutation VoucherUpdate($id: ID!, $input: VoucherInput!) {
                  voucherUpdate(id: $id, input: $input) {
                    voucher { id name code }
                    errors { field code message }
                  }
                }`,
                { id: existingId, input: voucherInput }
              );

              if (updateResult.error) {
                const errMsg = updateResult.error.graphQLErrors?.map((e: any) => e.message).join("; ") || "GraphQL error";
                results.push({ row: i + 1, success: false, error: `Voucher update: ${errMsg}` });
                continue;
              }
              const updateData = updateResult.data?.voucherUpdate;
              if (!updateData?.voucher?.id || updateData.errors?.length > 0) {
                const errMsg = updateData?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "Voucher update failed";
                results.push({ row: i + 1, success: false, error: errMsg });
                continue;
              }
              voucherId = updateData.voucher.id;
            }
          }

          // Create new voucher if not found via upsert
          if (!voucherId) {
            const result = await ctx.apiClient.mutation(
              `mutation VoucherCreate($input: VoucherInput!) {
                voucherCreate(input: $input) {
                  voucher { id name code }
                  errors { field code message }
                }
              }`,
              { input: voucherInput }
            );

            if (result.error) {
              const errMsg = result.error.graphQLErrors?.map((e: any) => e.message).join("; ") || result.error.message || "GraphQL error";
              results.push({ row: i + 1, success: false, error: errMsg });
              continue;
            }

            const data = result.data?.voucherCreate;
            if (!data || data.errors?.length > 0) {
              results.push({
                row: i + 1,
                success: false,
                error: data?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "No response from API",
              });
              continue;
            }
            voucherId = data.voucher?.id;
          }

          // Add channel listing
          if (voucherId && channelId) {
            try {
              const channelListingInput: Record<string, any> = { channelId };
              if (mapped.discountValue) channelListingInput.discountValue = parseFloat(mapped.discountValue);
              if (mapped.minAmountSpent) channelListingInput.minAmountSpent = parseFloat(mapped.minAmountSpent);

              await ctx.apiClient.mutation(
                `mutation VoucherChannelListingUpdate($id: ID!, $input: VoucherChannelListingInput!) {
                  voucherChannelListingUpdate(id: $id, input: $input) {
                    voucher { id }
                    errors { field code message }
                  }
                }`,
                { id: voucherId, input: { addChannels: [channelListingInput] } }
              );
            } catch { /* non-critical */ }
          }

          // Assign categories (additive)
          if (voucherId && mapped.categories) {
            const catIds = parseSemicolonList(mapped.categories)
              .map(s => categorySlugMap.get(s.toLowerCase()))
              .filter(Boolean) as string[];
            if (catIds.length > 0) {
              try {
                await ctx.apiClient.mutation(
                  `mutation VoucherCataloguesAdd($id: ID!, $input: CatalogueInput!) {
                    voucherCataloguesAdd(id: $id, input: $input) { voucher { id } errors { field code message } }
                  }`,
                  { id: voucherId, input: { categories: catIds } }
                );
              } catch { /* non-critical */ }
            }
          }

          // Assign collections (additive)
          if (voucherId && mapped.collections) {
            const colIds = parseSemicolonList(mapped.collections)
              .map(s => collectionSlugMap.get(s.toLowerCase()))
              .filter(Boolean) as string[];
            if (colIds.length > 0) {
              try {
                await ctx.apiClient.mutation(
                  `mutation VoucherCataloguesAdd($id: ID!, $input: CatalogueInput!) {
                    voucherCataloguesAdd(id: $id, input: $input) { voucher { id } errors { field code message } }
                  }`,
                  { id: voucherId, input: { collections: colIds } }
                );
              } catch { /* non-critical */ }
            }
          }

          // Assign products (additive)
          if (voucherId && mapped.products) {
            const prodIds = parseSemicolonList(mapped.products)
              .map(s => productSlugMap.get(s.toLowerCase()))
              .filter(Boolean) as string[];
            if (prodIds.length > 0) {
              try {
                await ctx.apiClient.mutation(
                  `mutation VoucherCataloguesAdd($id: ID!, $input: CatalogueInput!) {
                    voucherCataloguesAdd(id: $id, input: $input) { voucher { id } errors { field code message } }
                  }`,
                  { id: voucherId, input: { products: prodIds } }
                );
              } catch { /* non-critical */ }
            }
          }

          // Set metadata
          if (voucherId && mapped.metadata) {
            const metaItems = parseMetadata(mapped.metadata);
            if (metaItems.length > 0) {
              try {
                await ctx.apiClient.mutation(
                  `mutation UpdateMetadata($id: ID!, $input: [MetadataInput!]!) {
                    updateMetadata(id: $id, input: $input) { item { metadata { key value } } errors { field code message } }
                  }`,
                  { id: voucherId, input: metaItems }
                );
              } catch { /* non-critical */ }
            }
          }

          results.push({ row: i + 1, success: true, id: voucherId });
        } catch (error) {
          results.push({ row: i + 1, success: false, error: error instanceof Error ? error.message : "Unknown error" });
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
        `query VouchersExport($channel: String!, $first: Int!, $after: String) {
          vouchers(channel: $channel, first: $first, after: $after) {
            edges {
              node {
                id name code type discountValueType
                startDate endDate usageLimit used
                applyOncePerOrder applyOncePerCustomer onlyForStaff singleUse
                minCheckoutItemsQuantity
                countries { code }
                metadata { key value }
                channelListings {
                  channel { slug }
                  discountValue
                  minSpent { amount currency }
                }
              }
            }
            pageInfo { hasNextPage endCursor }
            totalCount
          }
        }`,
        { channel: input.channelSlug, first: input.first, after: input.after }
      );

      assertQuerySuccess(result, "VouchersExport");

      const vouchers = result.data?.vouchers?.edges?.map((e: any) => e.node) || [];
      const pageInfo = result.data?.vouchers?.pageInfo;
      const totalCount = result.data?.vouchers?.totalCount;

      const rows = vouchers.map((v: any) => {
        const channelListing = v.channelListings?.find((cl: any) => cl.channel.slug === input.channelSlug);
        const metadataStr = (v.metadata || []).map((m: any) => `${m.key}=${m.value}`).join("; ");
        return {
          id: v.id, name: v.name || "", code: v.code || "",
          type: v.type || "", discountValueType: v.discountValueType || "",
          discountValue: channelListing?.discountValue || "",
          startDate: v.startDate || "", endDate: v.endDate || "",
          usageLimit: v.usageLimit ?? "", used: v.used ?? 0,
          applyOncePerOrder: v.applyOncePerOrder ? "Yes" : "No",
          applyOncePerCustomer: v.applyOncePerCustomer ? "Yes" : "No",
          onlyForStaff: v.onlyForStaff ? "Yes" : "No",
          singleUse: v.singleUse ? "Yes" : "No",
          minCheckoutItemsQuantity: v.minCheckoutItemsQuantity ?? "",
          minAmountSpent: channelListing?.minSpent?.amount ?? "",
          currency: channelListing?.minSpent?.currency || "",
          countries: (v.countries || []).map((c: any) => c.code).join("; "),
          metadata: metadataStr,
        };
      });

      if (input.format === "csv") {
        return { data: exportToCSV(rows), format: "csv" as const, pageInfo, totalCount };
      } else {
        return { data: exportToExcel(rows, "Vouchers"), format: "xlsx" as const, pageInfo, totalCount };
      }
    }),

  bulkDelete: protectedClientProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.apiClient.mutation(
        `mutation VoucherBulkDelete($ids: [ID!]!) {
          voucherBulkDelete(ids: $ids) { count errors { field code message } }
        }`,
        { ids: input.ids }
      );
      const data = result.data?.voucherBulkDelete;
      if (data?.errors?.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: data.errors.map((e: any) => e.message).join("; ") });
      }
      return { count: data?.count || 0 };
    }),
});
