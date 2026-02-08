import type { UseFormRegister, FieldErrors, Control, UseFieldArrayReturn } from "react-hook-form";
import type { StorefrontConfig } from "@/modules/config/schema";

export type ContentFormData = StorefrontConfig["content"];

export interface ContentTabProps {
  register: UseFormRegister<ContentFormData>;
  errors: FieldErrors<ContentFormData>;
  control: Control<ContentFormData>;
}

export interface ContentTabPagesProps extends ContentTabProps {
  faqFields: UseFieldArrayReturn<ContentFormData, "contact.faqs">["fields"];
  addFaq: UseFieldArrayReturn<ContentFormData, "contact.faqs">["append"];
  removeFaq: UseFieldArrayReturn<ContentFormData, "contact.faqs">["remove"];
}
