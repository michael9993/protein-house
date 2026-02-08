import { z } from "zod";

export const collectionImportSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  productSlugs: z.string().optional(),
  productSKUs: z.string().optional(),
  isPublished: z.string().optional(),
  metadata: z.string().optional(),
});

export type CollectionImportRow = z.infer<typeof collectionImportSchema>;
