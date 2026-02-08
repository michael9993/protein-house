import { z } from "zod";

export const giftCardImportSchema = z.object({
  balanceAmount: z.string().min(1, "Balance amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Balance must be a positive number" }
  ),
  balanceCurrency: z.string().optional(),
  userEmail: z.string().optional(),
  tags: z.string().optional(),
  expiryDate: z.string().optional(),
  isActive: z.string().optional(),
  note: z.string().optional(),
});

export type GiftCardImportRow = z.infer<typeof giftCardImportSchema>;
