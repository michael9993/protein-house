import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { exportToCSV } from "../../export/csv-exporter";
import { exportToExcel } from "../../export/excel-exporter";
import { assertQuerySuccess, applyFieldMappings, parseBool, parseMetadata, parseSemicolonList, extractGraphQLError, type ImportResult, buildImportResponse } from "../utils/helpers";

export const giftCardsRouter = router({
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

      // Resolve channel currency for balance
      let channelCurrency = "USD";
      try {
        const chResult = await ctx.apiClient.query(`query { channels { slug currencyCode } }`, {});
        const ch = (chResult.data?.channels || []).find((c: any) => c.slug === input.channelSlug);
        if (ch?.currencyCode) channelCurrency = ch.currencyCode;
      } catch { /* ignore */ }

      // Pre-fetch existing gift cards for upsert by code
      const existingByCode = new Map<string, { id: string; isActive: boolean }>();
      if (input.upsertMode) {
        try {
          let hasNext = true;
          let after: string | undefined;
          while (hasNext) {
            const gcResult = await ctx.apiClient.query(
              `query GiftCardsLookup($after: String) {
                giftCards(first: 100, after: $after) {
                  edges { node { id code isActive currentBalance { amount currency } } }
                  pageInfo { hasNextPage endCursor }
                }
              }`,
              { after }
            );
            for (const e of (gcResult.data?.giftCards?.edges || [])) {
              if (e.node.code) {
                existingByCode.set(e.node.code.toLowerCase(), {
                  id: e.node.id,
                  isActive: e.node.isActive,
                });
              }
            }
            hasNext = gcResult.data?.giftCards?.pageInfo?.hasNextPage || false;
            after = gcResult.data?.giftCards?.pageInfo?.endCursor;
          }
        } catch { /* ignore */ }
      }

      for (let i = 0; i < input.rows.length; i++) {
        const row = input.rows[i];
        try {
          const mapped = applyFieldMappings(row, input.fieldMappings);

          const balance = parseFloat(mapped.balance || mapped.initialBalance || "0");
          const tags = mapped.tags ? parseSemicolonList(mapped.tags) : [];
          const isActive = mapped.isActive ? parseBool(mapped.isActive, true) : true;

          let giftCardId: string | undefined;

          // Upsert: check if gift card exists by code
          if (input.upsertMode && mapped.code) {
            const existing = existingByCode.get(mapped.code.toLowerCase());
            if (existing) {
              const updateInput: Record<string, any> = {};
              if (mapped.expiryDate) updateInput.expiryDate = mapped.expiryDate;
              if (tags.length > 0) updateInput.addTags = tags;
              if (mapped.isActive !== undefined) updateInput.isActive = isActive;
              if (balance > 0) {
                updateInput.balanceAmount = balance;
              }
              if (mapped.externalReference) updateInput.externalReference = mapped.externalReference;

              const updateResult = await ctx.apiClient.mutation(
                `mutation GiftCardUpdate($id: ID!, $input: GiftCardUpdateInput!) {
                  giftCardUpdate(id: $id, input: $input) {
                    giftCard { id code isActive }
                    errors { field code message }
                  }
                }`,
                { id: existing.id, input: updateInput }
              );

              if (updateResult.error) {
                results.push({ row: i + 1, success: false, error: `Gift card update: ${extractGraphQLError(updateResult.error)}` });
                continue;
              }
              const updateData = updateResult.data?.giftCardUpdate;
              if (!updateData?.giftCard?.id || updateData.errors?.length > 0) {
                const errMsg = updateData?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "Gift card update failed";
                results.push({ row: i + 1, success: false, error: errMsg });
                continue;
              }
              giftCardId = updateData.giftCard.id;
            }
          }

          // Create new gift card if not found via upsert
          if (!giftCardId) {
            const createInput: Record<string, any> = {
              balance: {
                amount: balance,
                currency: channelCurrency,
              },
              isActive,
            };

            if (mapped.code) createInput.code = mapped.code;
            if (mapped.userEmail) createInput.userEmail = mapped.userEmail;
            if (mapped.expiryDate) createInput.expiryDate = mapped.expiryDate;
            if (tags.length > 0) createInput.addTags = tags;
            if (mapped.note) createInput.note = mapped.note;
            if (mapped.externalReference) createInput.externalReference = mapped.externalReference;

            const result = await ctx.apiClient.mutation(
              `mutation GiftCardCreate($input: GiftCardCreateInput!) {
                giftCardCreate(input: $input) {
                  giftCard { id code isActive }
                  errors { field code message }
                }
              }`,
              { input: createInput }
            );

            if (result.error) {
              results.push({ row: i + 1, success: false, error: extractGraphQLError(result.error) });
              continue;
            }

            const data = result.data?.giftCardCreate;
            if (!data || data.errors?.length > 0) {
              const errMsg = data?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "No response from API";
              // Hint about code conflict
              if (!input.upsertMode && errMsg.toLowerCase().includes("unique")) {
                results.push({ row: i + 1, success: false, error: `${errMsg}. Tip: Enable "Update existing" to update gift cards with duplicate codes.` });
              } else {
                results.push({ row: i + 1, success: false, error: errMsg });
              }
              continue;
            }
            giftCardId = data.giftCard?.id;
          }

          // Set metadata
          if (giftCardId && mapped.metadata) {
            const metaItems = parseMetadata(mapped.metadata);
            if (metaItems.length > 0) {
              try {
                await ctx.apiClient.mutation(
                  `mutation UpdateMetadata($id: ID!, $input: [MetadataInput!]!) {
                    updateMetadata(id: $id, input: $input) { item { metadata { key value } } errors { field code message } }
                  }`,
                  { id: giftCardId, input: metaItems }
                );
              } catch { /* non-critical */ }
            }
          }

          results.push({ row: i + 1, success: true, id: giftCardId });
        } catch (error) {
          results.push({ row: i + 1, success: false, error: error instanceof Error ? error.message : "Unknown error" });
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
        `query GiftCardsExport($first: Int!, $after: String) {
          giftCards(first: $first, after: $after) {
            edges {
              node {
                id code isActive
                externalReference
                initialBalance { amount currency }
                currentBalance { amount currency }
                tags { name }
                expiryDate
                createdBy { email }
                usedBy { email }
                created
                lastUsedOn
                metadata { key value }
              }
            }
            pageInfo { hasNextPage endCursor }
            totalCount
          }
        }`,
        { first: input.first, after: input.after }
      );

      assertQuerySuccess(result, "GiftCardsExport");

      const giftCards = result.data?.giftCards?.edges?.map((e: any) => e.node) || [];
      const pageInfo = result.data?.giftCards?.pageInfo;
      const totalCount = result.data?.giftCards?.totalCount;

      const rows = giftCards.map((gc: any) => {
        const metadataStr = (gc.metadata || []).map((m: any) => `${m.key}=${m.value}`).join("; ");
        return {
          id: gc.id,
          code: gc.code || "",
          externalReference: gc.externalReference || "",
          isActive: gc.isActive ? "Yes" : "No",
          initialBalance: gc.initialBalance?.amount ?? "",
          currentBalance: gc.currentBalance?.amount ?? "",
          currency: gc.currentBalance?.currency || gc.initialBalance?.currency || "",
          tags: (gc.tags || []).map((t: any) => t.name).join("; "),
          expiryDate: gc.expiryDate || "",
          createdBy: gc.createdBy?.email || "",
          usedBy: gc.usedBy?.email || "",
          created: gc.created || "",
          lastUsedOn: gc.lastUsedOn || "",
          metadata: metadataStr,
        };
      });

      if (input.format === "csv") {
        return { data: exportToCSV(rows), format: "csv" as const, pageInfo, totalCount };
      } else {
        return { data: exportToExcel(rows, "GiftCards"), format: "xlsx" as const, pageInfo, totalCount };
      }
    }),

  bulkDelete: protectedClientProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.apiClient.mutation(
        `mutation GiftCardBulkDelete($ids: [ID!]!) {
          giftCardBulkDelete(ids: $ids) { count errors { field code message } }
        }`,
        { ids: input.ids }
      );
      const data = result.data?.giftCardBulkDelete;
      if (data?.errors?.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: extractGraphQLError({ graphQLErrors: data.errors }) });
      }
      return { count: data?.count || 0 };
    }),
});
