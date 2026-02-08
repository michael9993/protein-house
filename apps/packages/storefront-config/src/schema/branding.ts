import { z } from "zod";
import { BorderRadiusSchema, ButtonStyleSchema, CardShadowSchema, FontSizeSchema } from "./primitives";

export const ColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  textMuted: z.string(),
  success: z.string(),
  warning: z.string(),
  error: z.string(),
});

export const TypographySchema = z.object({
  fontHeading: z.string(),
  fontBody: z.string(),
  fontMono: z.string(),
  fontSize: z.object({
    h1: FontSizeSchema.optional(),
    h2: FontSizeSchema.optional(),
    h3: FontSizeSchema.optional(),
    h4: FontSizeSchema.optional(),
    body: FontSizeSchema.optional(),
    small: FontSizeSchema.optional(),
    button: FontSizeSchema.optional(),
    caption: FontSizeSchema.optional(),
  }).optional(),
});

export const StyleSchema = z.object({
  borderRadius: BorderRadiusSchema,
  buttonStyle: ButtonStyleSchema,
  cardShadow: CardShadowSchema,
});

export const BrandingSchema = z.object({
  logo: z.string(),
  logoAlt: z.string(),
  favicon: z.string(),
  colors: ColorsSchema,
  typography: TypographySchema,
  style: StyleSchema,
});
