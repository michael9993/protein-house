import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { exportToCSV } from "../../export/csv-exporter";
import { exportToExcel } from "../../export/excel-exporter";
import { assertQuerySuccess, applyFieldMappings, parseBool, parseMetadata, extractGraphQLError, type ImportResult, buildImportResponse } from "../utils/helpers";

export const customersRouter = router({
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

      // Pre-fetch existing customers for upsert by email
      type ExistingCustomerInfo = { id: string; defaultShippingAddressId?: string; defaultBillingAddressId?: string };
      const existingByEmail = new Map<string, ExistingCustomerInfo>();
      if (input.upsertMode) {
        try {
          let hasNext = true;
          let after: string | undefined;
          while (hasNext) {
            const cResult = await ctx.apiClient.query(
              `query CustomersList($first: Int!, $after: String) {
                customers(first: 100, after: $after) {
                  edges { node {
                    id email
                    defaultShippingAddress { id }
                    defaultBillingAddress { id }
                  } }
                  pageInfo { hasNextPage endCursor }
                }
              }`,
              { first: 100, after }
            );
            for (const e of (cResult.data?.customers?.edges || [])) {
              const node = e.node;
              existingByEmail.set(node.email.toLowerCase(), {
                id: node.id,
                defaultShippingAddressId: node.defaultShippingAddress?.id,
                defaultBillingAddressId: node.defaultBillingAddress?.id,
              });
            }
            hasNext = cResult.data?.customers?.pageInfo?.hasNextPage || false;
            after = cResult.data?.customers?.pageInfo?.endCursor;
          }
        } catch { /* ignore */ }
      }

      for (let i = 0; i < input.rows.length; i++) {
        const row = input.rows[i];
        try {
          const mapped = applyFieldMappings(row, input.fieldMappings);

          const customerInput: Record<string, any> = {
            firstName: mapped.firstName || undefined,
            lastName: mapped.lastName || undefined,
            note: mapped.note || undefined,
            isActive: parseBool(mapped.isActive, true),
          };

          if (mapped.languageCode) customerInput.languageCode = mapped.languageCode.toUpperCase();
          if (mapped.externalReference) customerInput.externalReference = mapped.externalReference;
          if (mapped.metadata) customerInput.metadata = parseMetadata(mapped.metadata);

          let userId: string | undefined;
          let existingShippingAddrId: string | undefined;
          let existingBillingAddrId: string | undefined;

          // Upsert: check if customer exists by email
          if (input.upsertMode && mapped.email) {
            const existing = existingByEmail.get(mapped.email.toLowerCase());
            if (existing) {
              existingShippingAddrId = existing.defaultShippingAddressId;
              existingBillingAddrId = existing.defaultBillingAddressId;

              const updateResult = await ctx.apiClient.mutation(
                `mutation CustomerUpdate($id: ID!, $input: CustomerInput!) {
                  customerUpdate(id: $id, input: $input) {
                    user { id email }
                    errors { field code message }
                  }
                }`,
                { id: existing.id, input: customerInput }
              );

              if (updateResult.error) {
                const errMsg = extractGraphQLError(updateResult.error);
                results.push({ row: i + 1, success: false, error: `Customer update: ${errMsg}` });
                continue;
              }
              const updateData = updateResult.data?.customerUpdate;
              if (!updateData?.user?.id || updateData.errors?.length > 0) {
                const errMsg = updateData?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "Customer update failed";
                results.push({ row: i + 1, success: false, error: errMsg });
                continue;
              }
              userId = updateData.user.id;
            }
          }

          // Create new customer if not found via upsert
          if (!userId) {
            const createInput = { ...customerInput, email: mapped.email, channel: input.channelSlug };
            const result = await ctx.apiClient.mutation(
              `mutation CustomerCreate($input: UserCreateInput!) {
                customerCreate(input: $input) {
                  user { id email firstName lastName }
                  errors { field code message }
                }
              }`,
              { input: createInput }
            );

            if (result.error) {
              const errMsg = extractGraphQLError(result.error);
              if (!input.upsertMode && errMsg.toLowerCase().includes("email") && errMsg.toLowerCase().includes("already exists")) {
                results.push({ row: i + 1, success: false, error: errMsg + ' \u2014 Enable "Update existing customers" to update instead of create' });
              } else {
                results.push({ row: i + 1, success: false, error: errMsg });
              }
              continue;
            }

            const data = result.data?.customerCreate;
            if (!data || data.errors?.length > 0) {
              results.push({
                row: i + 1,
                success: false,
                error: data?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ") || "No response from API",
              });
              continue;
            }
            userId = data.user?.id;
          }

          // Handle shipping address (smart update or create)
          const hasShipping = mapped.shippingStreet1 || mapped.shippingCity || mapped.shippingCountry;
          if (userId && hasShipping) {
            try {
              const addrInput = {
                firstName: mapped.shippingFirstName || mapped.firstName || "",
                lastName: mapped.shippingLastName || mapped.lastName || "",
                companyName: mapped.shippingCompany || undefined,
                streetAddress1: mapped.shippingStreet1 || "",
                streetAddress2: mapped.shippingStreet2 || undefined,
                city: mapped.shippingCity || "",
                postalCode: mapped.shippingPostalCode || "",
                country: (mapped.shippingCountry || "US").toUpperCase(),
                countryArea: mapped.shippingCountryArea || undefined,
                phone: mapped.shippingPhone || undefined,
              };

              if (existingShippingAddrId) {
                // Update existing default shipping address (prevents duplication)
                await ctx.apiClient.mutation(
                  `mutation AddressUpdate($id: ID!, $input: AddressInput!) {
                    addressUpdate(id: $id, input: $input) {
                      address { id }
                      errors { field code message }
                    }
                  }`,
                  { id: existingShippingAddrId, input: addrInput }
                );
              } else {
                // Create new address + set as default
                const addrResult = await ctx.apiClient.mutation(
                  `mutation AddressCreate($userId: ID!, $input: AddressInput!) {
                    addressCreate(userId: $userId, input: $input) {
                      address { id }
                      errors { field code message }
                    }
                  }`,
                  { userId, input: addrInput }
                );
                const shippingAddrId = addrResult.data?.addressCreate?.address?.id;
                if (shippingAddrId) {
                  await ctx.apiClient.mutation(
                    `mutation SetDefaultAddress($userId: ID!, $addressId: ID!, $type: AddressTypeEnum!) {
                      addressSetDefault(userId: $userId, addressId: $addressId, type: $type) {
                        user { id }
                        errors { field code message }
                      }
                    }`,
                    { userId, addressId: shippingAddrId, type: "SHIPPING" }
                  );
                }
              }
            } catch { /* non-critical */ }
          }

          // Handle billing address (smart update or create)
          const hasBilling = mapped.billingStreet1 || mapped.billingCity || mapped.billingCountry;
          if (userId && hasBilling) {
            try {
              const addrInput = {
                firstName: mapped.billingFirstName || mapped.firstName || "",
                lastName: mapped.billingLastName || mapped.lastName || "",
                companyName: mapped.billingCompany || undefined,
                streetAddress1: mapped.billingStreet1 || "",
                streetAddress2: mapped.billingStreet2 || undefined,
                city: mapped.billingCity || "",
                postalCode: mapped.billingPostalCode || "",
                country: (mapped.billingCountry || "US").toUpperCase(),
                countryArea: mapped.billingCountryArea || undefined,
                phone: mapped.billingPhone || undefined,
              };

              if (existingBillingAddrId) {
                await ctx.apiClient.mutation(
                  `mutation AddressUpdate($id: ID!, $input: AddressInput!) {
                    addressUpdate(id: $id, input: $input) {
                      address { id }
                      errors { field code message }
                    }
                  }`,
                  { id: existingBillingAddrId, input: addrInput }
                );
              } else {
                const addrResult = await ctx.apiClient.mutation(
                  `mutation AddressCreate($userId: ID!, $input: AddressInput!) {
                    addressCreate(userId: $userId, input: $input) {
                      address { id }
                      errors { field code message }
                    }
                  }`,
                  { userId, input: addrInput }
                );
                const billingAddrId = addrResult.data?.addressCreate?.address?.id;
                if (billingAddrId) {
                  await ctx.apiClient.mutation(
                    `mutation SetDefaultAddress($userId: ID!, $addressId: ID!, $type: AddressTypeEnum!) {
                      addressSetDefault(userId: $userId, addressId: $addressId, type: $type) {
                        user { id }
                        errors { field code message }
                      }
                    }`,
                    { userId, addressId: billingAddrId, type: "BILLING" }
                  );
                }
              }
            } catch { /* non-critical */ }
          }

          results.push({ row: i + 1, success: true, id: userId });
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
        format: z.enum(["csv", "xlsx"]),
        first: z.number().min(1).max(500).default(100),
        after: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.apiClient.query(
        `query CustomersExport($first: Int!, $after: String) {
          customers(first: $first, after: $after) {
            edges {
              node {
                id
                email
                externalReference
                firstName
                lastName
                isActive
                isConfirmed
                dateJoined
                lastLogin
                languageCode
                note
                orders { totalCount }
                giftCards { totalCount }
                metadata { key value }
                defaultShippingAddress {
                  firstName lastName companyName
                  streetAddress1 streetAddress2
                  city cityArea postalCode
                  country { code country }
                  countryArea phone
                }
                defaultBillingAddress {
                  firstName lastName companyName
                  streetAddress1 streetAddress2
                  city cityArea postalCode
                  country { code country }
                  countryArea phone
                }
              }
            }
            pageInfo { hasNextPage endCursor }
            totalCount
          }
        }`,
        { first: input.first, after: input.after }
      );

      assertQuerySuccess(result, "CustomersExport");

      const customers = result.data?.customers?.edges?.map((e: any) => e.node) || [];
      const pageInfo = result.data?.customers?.pageInfo;
      const totalCount = result.data?.customers?.totalCount;

      const rows = customers.map((c: any) => {
        const ship = c.defaultShippingAddress;
        const bill = c.defaultBillingAddress;
        const metadataStr = (c.metadata || []).map((m: any) => `${m.key}=${m.value}`).join("; ");

        return {
          id: c.id,
          email: c.email,
          externalReference: c.externalReference || "",
          firstName: c.firstName || "",
          lastName: c.lastName || "",
          isActive: c.isActive ? "Yes" : "No",
          isConfirmed: c.isConfirmed ? "Yes" : "No",
          dateJoined: c.dateJoined || "",
          lastLogin: c.lastLogin || "",
          languageCode: c.languageCode || "",
          note: c.note || "",
          orderCount: c.orders?.totalCount || 0,
          giftCardCount: c.giftCards?.totalCount || 0,
          shippingFirstName: ship?.firstName || "",
          shippingLastName: ship?.lastName || "",
          shippingCompany: ship?.companyName || "",
          shippingStreet: ship?.streetAddress1 || "",
          shippingStreet2: ship?.streetAddress2 || "",
          shippingCity: ship?.city || "",
          shippingPostalCode: ship?.postalCode || "",
          shippingCountry: ship?.country?.code || "",
          shippingCountryArea: ship?.countryArea || "",
          shippingPhone: ship?.phone || "",
          billingFirstName: bill?.firstName || "",
          billingLastName: bill?.lastName || "",
          billingCompany: bill?.companyName || "",
          billingStreet: bill?.streetAddress1 || "",
          billingStreet2: bill?.streetAddress2 || "",
          billingCity: bill?.city || "",
          billingPostalCode: bill?.postalCode || "",
          billingCountry: bill?.country?.code || "",
          billingCountryArea: bill?.countryArea || "",
          billingPhone: bill?.phone || "",
          metadata: metadataStr,
        };
      });

      if (input.format === "csv") {
        return { data: exportToCSV(rows), format: "csv" as const, pageInfo, totalCount };
      } else {
        return { data: exportToExcel(rows, "Customers"), format: "xlsx" as const, pageInfo, totalCount };
      }
    }),

  bulkDelete: protectedClientProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.apiClient.mutation(
        `mutation CustomerBulkDelete($ids: [ID!]!) {
          customerBulkDelete(ids: $ids) {
            count
            errors { field code message }
          }
        }`,
        { ids: input.ids }
      );

      const data = result.data?.customerBulkDelete;
      if (data?.errors?.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: extractGraphQLError({ graphQLErrors: data.errors }),
        });
      }

      return { count: data?.count || 0 };
    }),
});
