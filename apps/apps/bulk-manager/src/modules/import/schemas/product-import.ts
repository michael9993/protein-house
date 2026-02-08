import { z } from "zod";

export const productImportSchema = z.object({
  name: z.string().optional(), // Optional on variant rows (inherits from first row in group)
  slug: z.string().optional(),
  description: z.string().optional(),
  productType: z.string().optional(),
  category: z.string().optional(),
  warehouse: z.string().optional(),
  weight: z.string().optional(),
  variantName: z.string().optional(),
  sku: z.string().optional(),
  price: z.string().optional().refine(
    (val) => !val || !isNaN(parseFloat(val)),
    { message: "Price must be a valid number" }
  ),
  costPrice: z.string().optional().refine(
    (val) => !val || !isNaN(parseFloat(val)),
    { message: "Cost price must be a valid number" }
  ),
  stock: z.string().optional().refine(
    (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
    { message: "Stock must be a non-negative integer" }
  ),
  trackInventory: z.string().optional(),
  quantityLimit: z.string().optional(),
  color: z.string().optional(),
  brand: z.string().optional(),
  imageUrl: z.string().optional(),
  imageUrl2: z.string().optional(),
  imageUrl3: z.string().optional(),
  imageUrl4: z.string().optional(),
  imageUrl5: z.string().optional(),
  imageAlt: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  taxClass: z.string().optional(),
  collections: z.string().optional(),
  externalReference: z.string().optional(),
  metadata: z.string().optional(),
  isPublished: z.string().optional(),
  visibleInListings: z.string().optional(),
  chargeTaxes: z.string().optional(),
  variantWeight: z.string().optional(),
  variantExternalReference: z.string().optional(),
}).passthrough(); // Allow dynamic attr:*, variantAttr:*, stock:* columns

export type ProductImportRow = z.infer<typeof productImportSchema>;
