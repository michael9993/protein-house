import { z } from "zod";

export const orderImportSchema = z.object({
  channel: z.string().min(1, "Channel slug is required"),
  userEmail: z.string().email("Valid customer email is required"),
  variantSku: z.string().min(1, "Variant SKU is required"),
  quantity: z.string().refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    { message: "Quantity must be a positive integer" }
  ),
  shippingFirstName: z.string().optional(),
  shippingLastName: z.string().optional(),
  shippingStreet: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),
});

export type OrderImportRow = z.infer<typeof orderImportSchema>;
