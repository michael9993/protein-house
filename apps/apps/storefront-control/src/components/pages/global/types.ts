import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import { z } from "zod";
import {
  StoreSchema,
  LocalizationSchema,
  SeoSchema,
  BrandingSchema,
  UiSchema,
  DarkModeSchema,
  DesignTokensSchema,
  IntegrationsSchema,
  FeaturesSchema,
  ContentSchema,
} from "@/modules/config/schema";

export const GlobalFormSchema = z.object({
  store: StoreSchema,
  localization: LocalizationSchema,
  seo: SeoSchema,
  branding: BrandingSchema,
  ui: UiSchema,
  darkMode: DarkModeSchema,
  design: DesignTokensSchema,
  integrations: IntegrationsSchema,
  features: FeaturesSchema,
  content: ContentSchema,
});

export type GlobalFormData = z.infer<typeof GlobalFormSchema>;

export interface GlobalTabProps {
  register: UseFormRegister<GlobalFormData>;
  control: Control<GlobalFormData>;
  errors: FieldErrors<GlobalFormData>;
}

export interface GlobalTabWithWatchProps extends GlobalTabProps {
  watch: UseFormWatch<GlobalFormData>;
}
