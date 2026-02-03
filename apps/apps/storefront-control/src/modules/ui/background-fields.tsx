import React from "react";
import { UseFormRegister, Control, UseFormWatch } from "react-hook-form";
import { FormField, SelectField } from "@/modules/ui/form-field";

interface BackgroundFieldsProps {
  basePath: string; // e.g. "sections.featuredCategories.background"
  register: UseFormRegister<any>;
  control: Control<any>;
  watch: UseFormWatch<any>;
}

export const BackgroundFields: React.FC<BackgroundFieldsProps> = ({ basePath, register, control, watch }) => {
  const style = watch(`${basePath}.style`);

  return (
    <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
       <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#374151" }}>Background Settings</h4>
       <SelectField
          label="Style"
          name={`${basePath}.style`}
          register={register}
          options={[
            { value: "none", label: "None (Transparent)" },
            { value: "solid", label: "Solid Color" },
            { value: "gradient", label: "Gradient" },
            { value: "mesh", label: "Mesh / Aurora (New)" },
            { value: "glass", label: "Glassmorphism" },
            { value: "color-mix", label: "Color Mix" },
          ]}
        />

        {style === 'mesh' && (
          <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
             <SelectField
                label="Mesh Variant"
                name={`${basePath}.meshGrade`}
                register={register}
                options={[
                  { value: "light", label: "Light (Default)" },
                  { value: "medium", label: "Medium" },
                  { value: "deep", label: "Deep / Brand" },
                  { value: "cool", label: "Cool / Blue" },
                  { value: "warm", label: "Warm / Orange" },
                ]}
             />
             <FormField
                label="Opacity (%)"
                name={`${basePath}.meshOpacity`}
                register={register}
                type="number"
                placeholder="15"
                description="Opacity 0-100"
              />
          </div>
        )}

        {style === 'solid' && (
          <div style={{ marginTop: "12px" }}>
            <FormField
              label="Color"
              name={`${basePath}.color`}
              register={register}
              placeholder="#ffffff"
            />
          </div>
        )}
    </div>
  );
};
