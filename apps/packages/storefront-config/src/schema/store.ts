import { z } from "zod";

export const StoreTypeSchema = z.enum(["physical", "digital", "food", "services", "mixed"]);

export const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
});

export const StoreSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  tagline: z.string(),
  type: StoreTypeSchema,
  description: z.string(),
  email: z.string().email("Invalid email"),
  phone: z.string(),
  address: AddressSchema.optional(),
});
