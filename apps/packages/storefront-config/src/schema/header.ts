import { z } from "zod";
import { ThemeColor } from "./primitives";

export const HeaderBannerItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  displayText: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

export const ManualBannerItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  link: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

export const HeaderBannerSchema = z.object({
  enabled: z.boolean(),
  text: z.string(),
  backgroundColor: ThemeColor,
  textColor: ThemeColor,
  useSaleorPromotions: z.boolean().optional().default(false),
  useSaleorVouchers: z.boolean().optional().default(false),
  items: z.array(HeaderBannerItemSchema).optional().default([]),
  manualItems: z.array(ManualBannerItemSchema).optional().default([]),
  autoScrollIntervalSeconds: z.number().min(4).max(30).optional().default(6),
  useGradient: z.boolean().optional().default(false),
  gradientFrom: z.string().nullable().optional(),
  gradientTo: z.string().nullable().optional(),
  dismissible: z.boolean().optional().default(false),
});

export const LogoPositionSchema = z.enum(["left", "center"]);

export const HeaderSchema = z.object({
  banner: HeaderBannerSchema,
  showStoreName: z.boolean(),
  logoPosition: LogoPositionSchema,
});
