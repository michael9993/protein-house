import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { parseCSV } from "../../import/csv-parser";
import { parseExcel } from "../../import/excel-parser";
import { validateRows } from "../../import/validator";
import { autoMapFields } from "../../import/field-mapper";
import { productImportSchema } from "../../import/schemas/product-import";
import { categoryImportSchema } from "../../import/schemas/category-import";
import { collectionImportSchema } from "../../import/schemas/collection-import";
import { customerImportSchema } from "../../import/schemas/customer-import";
import { orderImportSchema } from "../../import/schemas/order-import";
import { voucherImportSchema } from "../../import/schemas/voucher-import";
import { giftCardImportSchema } from "../../import/schemas/gift-card-import";

const entitySchemaMap = {
  products: productImportSchema,
  categories: categoryImportSchema,
  collections: collectionImportSchema,
  customers: customerImportSchema,
  orders: orderImportSchema,
  vouchers: voucherImportSchema,
  giftCards: giftCardImportSchema,
} as const;

type EntityType = keyof typeof entitySchemaMap;

export const importRouter = router({
  parseFile: protectedClientProcedure
    .input(
      z.object({
        fileContent: z.string(),
        fileName: z.string(),
        fileType: z.enum(["csv", "xlsx"]),
        sheetName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let rows: Record<string, string>[];

        if (input.fileType === "csv") {
          rows = parseCSV(input.fileContent);
        } else {
          rows = parseExcel(input.fileContent, input.sheetName);
        }

        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

        return {
          success: true,
          rows,
          headers,
          totalRows: rows.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to parse file",
        });
      }
    }),

  autoMapFields: protectedClientProcedure
    .input(
      z.object({
        headers: z.array(z.string()),
        entityType: z.enum(["products", "categories", "collections", "customers", "orders", "vouchers", "giftCards"]),
      })
    )
    .mutation(async ({ input }) => {
      const mappings = autoMapFields(input.headers, input.entityType);
      return { mappings };
    }),

  validateRows: protectedClientProcedure
    .input(
      z.object({
        rows: z.array(z.record(z.string())),
        entityType: z.enum(["products", "categories", "collections", "customers", "orders", "vouchers", "giftCards"]),
        fieldMappings: z.record(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const schema = entitySchemaMap[input.entityType as EntityType];
      const results = validateRows(input.rows, schema, input.fieldMappings);
      return results;
    }),
});
