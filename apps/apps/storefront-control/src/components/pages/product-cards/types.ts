import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import { z } from "zod";
import { CardOverridesSchema } from "@/modules/config/schema";

export const ProductCardsFormSchema = z.object({
  cardOverrides: CardOverridesSchema,
});

export type ProductCardsFormData = z.infer<typeof ProductCardsFormSchema>;

export interface ProductCardsTabProps {
  register: UseFormRegister<ProductCardsFormData>;
  control: Control<ProductCardsFormData>;
  errors: FieldErrors<ProductCardsFormData>;
  watch: UseFormWatch<ProductCardsFormData>;
}
