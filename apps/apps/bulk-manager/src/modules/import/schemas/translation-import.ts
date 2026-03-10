import { z } from "zod";

export const translationImportSchema = z.object({
  slug: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  variantName: z.string().optional(),
}).refine(
  (row) => row.slug || row.sku || row.name,
  { message: "At least one of slug, sku, or name is required to identify the entity" }
);

export type TranslationImportRow = z.infer<typeof translationImportSchema>;
