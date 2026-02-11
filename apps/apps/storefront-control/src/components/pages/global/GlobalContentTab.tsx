import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import type { GlobalFormData, GlobalTabProps } from "./types";

export function GlobalContentTab({ register, errors }: GlobalTabProps) {
  return (
    <>
      <FormSection
        title="General Text"
        description="Common text used throughout the store (buttons, labels, newsletter)"
      >
        <FieldGroup columns={2}>
          <FormField<GlobalFormData>
            label="Search Placeholder"
            name="content.general.searchPlaceholder"
            register={register}
            errors={errors}
            placeholder="Search products..."
          />
          <FormField<GlobalFormData>
            label="Newsletter Title"
            name="content.general.newsletterTitle"
            register={register}
            errors={errors}
            placeholder="Subscribe to our newsletter"
          />
          <FormField<GlobalFormData>
            label="Newsletter Description"
            name="content.general.newsletterDescription"
            register={register}
            errors={errors}
            placeholder="Get the latest updates and deals"
          />
          <FormField<GlobalFormData>
            label="Newsletter Button"
            name="content.general.newsletterButton"
            register={register}
            errors={errors}
            placeholder="Subscribe"
          />
          <FormField<GlobalFormData>
            label="Newsletter Success"
            name="content.general.newsletterSuccess"
            register={register}
            errors={errors}
            placeholder="Thanks for subscribing!"
          />
          <FormField<GlobalFormData>
            label="Load More Button"
            name="content.general.loadMoreButton"
            register={register}
            errors={errors}
            placeholder="Load More"
          />
          <FormField<GlobalFormData>
            label="View All Button"
            name="content.general.viewAllButton"
            register={register}
            errors={errors}
            placeholder="View All"
          />
          <FormField<GlobalFormData>
            label="Back Button"
            name="content.general.backButton"
            register={register}
            errors={errors}
            placeholder="Back"
          />
          <FormField<GlobalFormData>
            label="Close Button"
            name="content.general.closeButton"
            register={register}
            errors={errors}
            placeholder="Close"
          />
          <FormField<GlobalFormData>
            label="Save Button"
            name="content.general.saveButton"
            register={register}
            errors={errors}
            placeholder="Save"
          />
          <FormField<GlobalFormData>
            label="Cancel Button"
            name="content.general.cancelButton"
            register={register}
            errors={errors}
            placeholder="Cancel"
          />
          <FormField<GlobalFormData>
            label="Confirm Button"
            name="content.general.confirmButton"
            register={register}
            errors={errors}
            placeholder="Confirm"
          />
          <FormField<GlobalFormData>
            label="Delete Button"
            name="content.general.deleteButton"
            register={register}
            errors={errors}
            placeholder="Delete"
          />
          <FormField<GlobalFormData>
            label="Edit Button"
            name="content.general.editButton"
            register={register}
            errors={errors}
            placeholder="Edit"
          />
          <FormField<GlobalFormData>
            label="Home Label"
            name="content.general.homeLabel"
            register={register}
            errors={errors}
            placeholder="Home"
          />
        </FieldGroup>
      </FormSection>
    </>
  );
}
