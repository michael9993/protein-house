import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { z } from "zod";
import { HomepageSchema, ContentSchema } from "@/modules/config/schema";

export const HomepageFormSchema = z.object({
  homepage: HomepageSchema,
  content: ContentSchema,
});

export type HomepageFormData = z.infer<typeof HomepageFormSchema>;

export interface HomepageTabProps {
  register: UseFormRegister<HomepageFormData>;
  control: Control<HomepageFormData>;
  errors: FieldErrors<HomepageFormData>;
  watch: UseFormWatch<HomepageFormData>;
}

export interface HomepageSectionsTabProps extends HomepageTabProps {
  setValue: UseFormSetValue<HomepageFormData>;
}
