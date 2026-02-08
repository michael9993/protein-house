import { z } from "zod";

export const TimeFormatSchema = z.enum(["12h", "24h"]);
export const DirectionSchema = z.enum(["ltr", "rtl", "auto"]);

export const DEFAULT_RTL_LOCALES = ["he", "ar", "fa", "ur", "yi", "ps"];

export const LocalizationSchema = z.object({
  defaultLocale: z.string(),
  supportedLocales: z.array(z.string()),
  dateFormat: z.string(),
  timeFormat: TimeFormatSchema,
  direction: DirectionSchema,
  rtlLocales: z.array(z.string()).optional(),
  drawerSideOverride: z.enum(["auto", "left", "right"]).optional(),
});
