import { Controller } from "react-hook-form";

import { FormField } from "@/components/forms/FormField";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { FormSection } from "@/components/forms/FormSection";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { GlobalFormData, GlobalTabProps } from "./types";

export function LocalizationSeoTab({ register, control, errors }: GlobalTabProps) {
  return (
    <>
      {/* Localization */}
      <FormSection title="Language & Direction">
        <FormField<GlobalFormData>
          label="Default Locale"
          name="localization.defaultLocale"
          register={register}
          errors={errors}
          description="e.g., en-US, he-IL, ar"
        />
        <Controller
          name="localization.supportedLocales"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <Label>Supported Locales</Label>
              <Input
                value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  field.onChange(arr);
                }}
                placeholder="en-US, he-IL, ar"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of supported locales
              </p>
            </div>
          )}
        />
        <FormSelect<GlobalFormData>
          label="Direction"
          name="localization.direction"
          control={control}
          options={[
            { value: "auto", label: "Auto (based on locale)" },
            { value: "ltr", label: "Left to Right" },
            { value: "rtl", label: "Right to Left" },
          ]}
        />
        <Controller
          name="localization.rtlLocales"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <Label>RTL Locales</Label>
              <Input
                value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  field.onChange(arr);
                }}
                placeholder="he, ar, fa, ur"
              />
              <p className="text-xs text-muted-foreground">
                Locales that render RTL when direction is set to Auto
              </p>
            </div>
          )}
        />
      </FormSection>

      <FormSection title="Format">
        <div className="grid grid-cols-2 gap-4">
          <FormField<GlobalFormData>
            label="Date Format"
            name="localization.dateFormat"
            register={register}
            errors={errors}
            placeholder="MM/DD/YYYY"
          />
          <FormSelect<GlobalFormData>
            label="Time Format"
            name="localization.timeFormat"
            control={control}
            options={[
              { value: "12h", label: "12-hour" },
              { value: "24h", label: "24-hour" },
            ]}
          />
        </div>
      </FormSection>

      <FormSection title="UI Overrides">
        <FormSelect<GlobalFormData>
          label="Drawer Side Override"
          name="localization.drawerSideOverride"
          control={control}
          options={[
            { value: "auto", label: "Auto (RTL=Left, LTR=Right)" },
            { value: "left", label: "Always Left" },
            { value: "right", label: "Always Right" },
          ]}
        />
      </FormSection>

      {/* SEO */}
      <FormSection title="Page Titles">
        <FormField<GlobalFormData>
          label="Title Template (Coming Soon)"
          name="seo.titleTemplate"
          register={register}
          errors={errors}
          placeholder="%s | Your Store Name"
          description="Use %s as placeholder for the page title. Not yet applied by the storefront."
        />
        <FormField<GlobalFormData>
          label="Default Title"
          name="seo.defaultTitle"
          register={register}
          errors={errors}
          placeholder="Your Store Name - Online Shopping"
        />
      </FormSection>

      <FormSection title="Meta Description">
        <FormTextarea<GlobalFormData>
          label="Default Description"
          name="seo.defaultDescription"
          register={register}
          errors={errors}
          placeholder="Shop the best products..."
          description="Recommended: 150-160 characters"
        />
      </FormSection>

      <FormSection title="Social Sharing">
        <FormField<GlobalFormData>
          label="Default OG Image URL"
          name="seo.defaultImage"
          register={register}
          errors={errors}
          placeholder="/og-image.jpg"
        />
        <FormField<GlobalFormData>
          label="Twitter Handle"
          name="seo.twitterHandle"
          register={register}
          errors={errors}
          placeholder="@yourstore"
        />
      </FormSection>
    </>
  );
}
