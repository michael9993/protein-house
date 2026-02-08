import { z } from "zod";

export const DarkModeColorsSchema = z.object({
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  textMuted: z.string(),
  border: z.string().optional(),
  primary: z.string().optional(),
  secondary: z.string().optional(),
  accent: z.string().optional(),
  success: z.string().optional(),
  warning: z.string().optional(),
  error: z.string().optional(),
});

export const DarkModeSchema = z.object({
  enabled: z.boolean(),
  auto: z.boolean(),
  colors: DarkModeColorsSchema.optional(),
});
