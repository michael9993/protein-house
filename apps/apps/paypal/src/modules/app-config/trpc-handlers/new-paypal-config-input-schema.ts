import { z } from "zod";

export const newPayPalConfigInputSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

export type NewPayPalConfigInput = z.infer<typeof newPayPalConfigInputSchema>;
