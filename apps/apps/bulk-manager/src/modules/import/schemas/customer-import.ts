import { z } from "zod";

const booleanString = z
  .string()
  .optional()
  .refine(
    (val) =>
      !val || ["true", "false", "1", "0", "yes", "no"].includes(val.toLowerCase()),
    { message: "Must be true/false, 1/0, or yes/no" }
  );

export const customerImportSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  note: z.string().optional(),
  isActive: booleanString,
  languageCode: z.string().optional(),
  externalReference: z.string().optional(),
  metadata: z.string().optional(),
  // Shipping address
  shippingFirstName: z.string().optional(),
  shippingLastName: z.string().optional(),
  shippingCompany: z.string().optional(),
  shippingStreet1: z.string().optional(),
  shippingStreet2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),
  shippingCountryArea: z.string().optional(),
  shippingPhone: z.string().optional(),
  // Billing address
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingCompany: z.string().optional(),
  billingStreet1: z.string().optional(),
  billingStreet2: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  billingCountryArea: z.string().optional(),
  billingPhone: z.string().optional(),
});

export type CustomerImportRow = z.infer<typeof customerImportSchema>;
