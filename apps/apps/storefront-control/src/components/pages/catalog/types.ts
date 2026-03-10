import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import { z } from "zod";
import {
  FeaturesSchema,
  FiltersSchema,
  QuickFiltersSchema,
  RelatedProductsSchema,
  ContentSchema,
  UiSchema,
} from "@/modules/config/schema";

export const CatalogFormSchema = z.object({
  features: FeaturesSchema,
  filters: FiltersSchema,
  quickFilters: QuickFiltersSchema,
  relatedProducts: RelatedProductsSchema,
  content: ContentSchema,
  ui: UiSchema,
});

export type CatalogFormData = z.infer<typeof CatalogFormSchema>;

export interface CatalogTabProps {
  register: UseFormRegister<CatalogFormData>;
  control: Control<CatalogFormData>;
  errors: FieldErrors<CatalogFormData>;
  watch: UseFormWatch<CatalogFormData>;
}
