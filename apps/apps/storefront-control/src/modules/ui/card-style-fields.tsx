import React from "react";
import { UseFormRegister, Control, UseFormWatch } from "react-hook-form";
import { FormField, SelectField } from "@/modules/ui/form-field";

interface CardStyleFieldsProps {
  basePath: string; // e.g. "sections.featuredCategories.card"
  register: UseFormRegister<any>;
  control: Control<any>;
  watch: UseFormWatch<any>;
}

export const CardStyleFields: React.FC<CardStyleFieldsProps> = ({ basePath, register, control, watch }) => {
  return (
    <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "#f3f4f6", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
       <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#374151" }}>Card Styling Overrides</h4>
       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
         <SelectField
            label="Aspect Ratio"
            name={`${basePath}.aspectRatio`}
            register={register}
            options={[
              { value: "square", label: "Square (1:1)" },
              { value: "portrait", label: "Portrait (3:4)" },
              { value: "landscape", label: "Landscape (4:3)" },
              { value: "wide", label: "Wide (16:9)" },
            ]}
         />
         <SelectField
            label="Image Fit"
            name={`${basePath}.imageFit`}
            register={register}
            options={[
              { value: "cover", label: "Cover (Crop)" },
              { value: "contain", label: "Contain (No Crop)" },
              { value: "fill", label: "Fill (Stretch)" },
            ]}
         />
       </div>

       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
         <SelectField
            label="Text Size"
            name={`${basePath}.textSize`}
            register={register}
            options={[
              { value: "sm", label: "Small" },
              { value: "base", label: "Standard" },
              { value: "lg", label: "Large" },
              { value: "xl", label: "Extra Large" },
            ]}
         />
         <SelectField
            label="Text Position"
            name={`${basePath}.textPosition`}
            register={register}
            options={[
              { value: "bottom-left", label: "Bottom Left" },
              { value: "bottom-center", label: "Bottom Center" },
              { value: "center", label: "Center (Overlay)" },
            ]}
         />
       </div>
       
       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
         <FormField
            label="Text Color"
            name={`${basePath}.textColor`}
            register={register}
            placeholder="#000000 or inherit"
         />
          <FormField
            label="Background Color"
            name={`${basePath}.backgroundColor`}
            register={register}
            placeholder="#ffffff or inherit"
         />
       </div>

       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
         <SelectField
            label="Border Radius"
            name={`${basePath}.borderRadius`}
            register={register}
            options={[
              { value: "none", label: "0px" },
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
              { value: "full", label: "Full / Pill" },
            ]}
         />
         <SelectField
            label="Shadow"
            name={`${basePath}.shadow`}
            register={register}
            options={[
               { value: "none", label: "None" },
               { value: "sm", label: "Small" },
               { value: "md", label: "Medium" },
               { value: "lg", label: "Large" },
            ]}
         />
       </div>
       
       <div style={{ marginTop: "12px" }}>
         <FormField
            label="Opacity (%)"
            name={`${basePath}.opacity`}
            register={register}
            type="number"
            placeholder="100"
            description="Card opacity (0-100)"
         />
       </div>
    </div>
  );
};
