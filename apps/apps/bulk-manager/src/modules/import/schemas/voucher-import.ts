import { z } from "zod";

export const voucherImportSchema = z.object({
  name: z.string().min(1, "Voucher name is required"),
  code: z.string().optional(),
  type: z.string().optional(),
  discountValueType: z.string().optional(),
  discountValue: z.string().optional().refine(
    (val) => !val || !isNaN(parseFloat(val)),
    { message: "Discount value must be a number" }
  ),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  usageLimit: z.string().optional().refine(
    (val) => !val || !isNaN(parseInt(val)),
    { message: "Usage limit must be a number" }
  ),
  applyOncePerOrder: z.string().optional(),
  applyOncePerCustomer: z.string().optional(),
  onlyForStaff: z.string().optional(),
  singleUse: z.string().optional(),
  minAmountSpent: z.string().optional().refine(
    (val) => !val || !isNaN(parseFloat(val)),
    { message: "Min amount spent must be a number" }
  ),
  minCheckoutItemsQuantity: z.string().optional().refine(
    (val) => !val || !isNaN(parseInt(val)),
    { message: "Min items quantity must be a number" }
  ),
  countries: z.string().optional(),
  categories: z.string().optional(),
  collections: z.string().optional(),
  products: z.string().optional(),
});

export type VoucherImportRow = z.infer<typeof voucherImportSchema>;
