import { z } from "zod";

export const categoryImportSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  metadata: z.string().optional(),
  externalReference: z.string().optional(),
});

export type CategoryImportRow = z.infer<typeof categoryImportSchema>;
