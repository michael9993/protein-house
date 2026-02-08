import { z } from "zod";

export const PromoPopupSchema = z.object({
  enabled: z.boolean(),
  title: z.string(),
  body: z.string(),
  badge: z.string().nullable(),
  imageUrl: z.string().nullable(),
  backgroundImageUrl: z.string().nullable(),
  ctaText: z.string(),
  ctaLink: z.string(),
  itemsOnSaleText: z.string(),
  maybeLaterText: z.string(),
  delaySeconds: z.number().min(0).max(60),
  showOncePerSession: z.boolean(),
  ttlHours: z.number().min(1).max(168),
  excludeCheckout: z.boolean(),
  excludeCart: z.boolean(),
  autoDetectSales: z.boolean(),
});
