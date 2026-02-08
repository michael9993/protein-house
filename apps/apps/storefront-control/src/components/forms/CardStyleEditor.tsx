import {
  type UseFormRegister,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import { FormSelect } from "./FormSelect";
import { FormColorPicker } from "./FormColorPicker";
import { FormSlider } from "./FormSlider";

interface CardStyleEditorProps {
  basePath: string;
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues>;
  watch: (name: string) => unknown;
}

const ASPECT_RATIO_OPTIONS = [
  { value: "square", label: "Square (1:1)" },
  { value: "portrait", label: "Portrait (3:4)" },
  { value: "landscape", label: "Landscape (4:3)" },
  { value: "wide", label: "Wide (16:9)" },
];

const IMAGE_FIT_OPTIONS = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
  { value: "fill", label: "Fill" },
];

const TEXT_SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "base", label: "Base" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const TEXT_POSITION_OPTIONS = [
  { value: "center", label: "Center" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
];

const BORDER_RADIUS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "full", label: "Full" },
];

const SHADOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

function p(base: string, field: string): Path<FieldValues> {
  return `${base}.${field}` as Path<FieldValues>;
}

export function CardStyleEditor({
  basePath,
  control,
}: CardStyleEditorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          label="Aspect Ratio"
          name={p(basePath, "aspectRatio")}
          control={control}
          options={ASPECT_RATIO_OPTIONS}
        />
        <FormSelect
          label="Image Fit"
          name={p(basePath, "imageFit")}
          control={control}
          options={IMAGE_FIT_OPTIONS}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          label="Text Size"
          name={p(basePath, "textSize")}
          control={control}
          options={TEXT_SIZE_OPTIONS}
        />
        <FormSelect
          label="Text Position"
          name={p(basePath, "textPosition")}
          control={control}
          options={TEXT_POSITION_OPTIONS}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormColorPicker
          label="Text Color"
          name={p(basePath, "textColor")}
          control={control}
        />
        <FormColorPicker
          label="Background Color"
          name={p(basePath, "backgroundColor")}
          control={control}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          label="Border Radius"
          name={p(basePath, "borderRadius")}
          control={control}
          options={BORDER_RADIUS_OPTIONS}
        />
        <FormSelect
          label="Shadow"
          name={p(basePath, "shadow")}
          control={control}
          options={SHADOW_OPTIONS}
        />
      </div>

      <FormSlider
        label="Opacity"
        name={p(basePath, "opacity")}
        control={control}
        min={0}
        max={100}
        step={5}
        unit="%"
        description="Overall card opacity"
      />
    </div>
  );
}
