import { FormField } from "@/components/forms/FormField";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { FormSection } from "@/components/forms/FormSection";
import type { GlobalFormData, GlobalTabProps } from "./types";

export function StoreIdentityTab({ register, control, errors }: GlobalTabProps) {
  return (
    <>
      <FormSection title="Basic Information">
        <FormField<GlobalFormData>
          label="Store Name"
          name="store.name"
          register={register}
          errors={errors}
          placeholder="My Awesome Store"
          required
        />
        <FormField<GlobalFormData>
          label="Tagline"
          name="store.tagline"
          register={register}
          errors={errors}
          placeholder="Quality products, great prices"
        />
        <FormSelect<GlobalFormData>
          label="Store Type"
          name="store.type"
          control={control}
          options={[
            { value: "physical", label: "Physical Products" },
            { value: "digital", label: "Digital Products" },
            { value: "food", label: "Food & Grocery" },
            { value: "services", label: "Services" },
            { value: "mixed", label: "Mixed" },
          ]}
        />
        <FormTextarea<GlobalFormData>
          label="Description"
          name="store.description"
          register={register}
          errors={errors}
          placeholder="Welcome to our store..."
        />
      </FormSection>

      <FormSection title="Contact Information">
        <div className="grid grid-cols-2 gap-4">
          <FormField<GlobalFormData>
            label="Email"
            name="store.email"
            register={register}
            errors={errors}
            type="email"
            placeholder="support@store.com"
          />
          <FormField<GlobalFormData>
            label="Phone"
            name="store.phone"
            register={register}
            errors={errors}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </FormSection>

      <FormSection title="Address">
        <div className="grid grid-cols-2 gap-4">
          <FormField<GlobalFormData>
            label="Street Address"
            name="store.address.street"
            register={register}
            errors={errors}
            className="col-span-2"
          />
          <FormField<GlobalFormData>
            label="City"
            name="store.address.city"
            register={register}
            errors={errors}
          />
          <FormField<GlobalFormData>
            label="State/Province"
            name="store.address.state"
            register={register}
            errors={errors}
          />
          <FormField<GlobalFormData>
            label="ZIP/Postal Code"
            name="store.address.zip"
            register={register}
            errors={errors}
          />
          <FormField<GlobalFormData>
            label="Country"
            name="store.address.country"
            register={register}
            errors={errors}
          />
        </div>
      </FormSection>
    </>
  );
}
