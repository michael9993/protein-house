import {
  type UseFormRegister,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import { FormSelect } from "./FormSelect";
import { FormColorPicker } from "./FormColorPicker";
import { FormSlider } from "./FormSlider";

interface BackgroundEditorProps {
  basePath: string;
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues>;
  watch: (name: string) => unknown;
}

const BACKGROUND_STYLE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  { value: "radial-gradient", label: "Radial Gradient" },
  { value: "color-mix", label: "Color Mix" },
  { value: "pattern", label: "Pattern" },
  { value: "animated-gradient", label: "Animated Gradient" },
  { value: "glass", label: "Glassmorphism" },
  { value: "mesh", label: "Mesh" },
];

const GRADIENT_DIRECTION_OPTIONS = [
  { value: "to-right", label: "To Right" },
  { value: "to-left", label: "To Left" },
  { value: "to-bottom", label: "To Bottom" },
  { value: "to-top", label: "To Top" },
  { value: "to-bottom-right", label: "To Bottom Right" },
  { value: "to-top-left", label: "To Top Left" },
  { value: "diagonal", label: "Diagonal" },
];

const PATTERN_TYPE_OPTIONS = [
  { value: "grid", label: "Grid" },
  { value: "dots", label: "Dots" },
  { value: "lines", label: "Lines" },
  { value: "waves", label: "Waves" },
];

const ANIMATION_SPEED_OPTIONS = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];

const MESH_GRADE_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "deep", label: "Deep" },
  { value: "cool", label: "Cool" },
  { value: "warm", label: "Warm" },
];

function p(base: string, field: string): Path<FieldValues> {
  return `${base}.${field}` as Path<FieldValues>;
}

export function BackgroundEditor({
  basePath,
  control,
  watch,
}: BackgroundEditorProps) {
  const style = watch(`${basePath}.style`) as string | undefined;
  const showPrimaryColor = style && style !== "none";
  const showSecondaryColor =
    style === "gradient" ||
    style === "radial-gradient" ||
    style === "color-mix" ||
    style === "animated-gradient";
  const showGradientDirection = style === "gradient" || style === "animated-gradient";
  const showMixPercentage = style === "color-mix";
  const showPatternFields = style === "pattern";
  const showAnimationSpeed = style === "animated-gradient";
  const showGlassFields = style === "glass";
  const showMeshFields = style === "mesh";

  return (
    <div className="space-y-4">
      <FormSelect
        label="Background Style"
        name={p(basePath, "style")}
        control={control}
        options={BACKGROUND_STYLE_OPTIONS}
        description="Choose how the section background is rendered"
      />

      {showPrimaryColor && (
        <FormColorPicker
          label="Primary Color"
          name={p(basePath, "color")}
          control={control}
        />
      )}

      {showSecondaryColor && (
        <FormColorPicker
          label="Secondary Color"
          name={p(basePath, "secondaryColor")}
          control={control}
        />
      )}

      {showGradientDirection && (
        <FormSelect
          label="Gradient Direction"
          name={p(basePath, "gradientDirection")}
          control={control}
          options={GRADIENT_DIRECTION_OPTIONS}
        />
      )}

      {showMixPercentage && (
        <FormSlider
          label="Mix Percentage"
          name={p(basePath, "mixPercentage")}
          control={control}
          min={0}
          max={100}
          step={5}
          unit="%"
          description="How much of the secondary color to mix in"
        />
      )}

      {showPatternFields && (
        <>
          <FormSelect
            label="Pattern Type"
            name={p(basePath, "patternType")}
            control={control}
            options={PATTERN_TYPE_OPTIONS}
          />
          <FormSlider
            label="Pattern Opacity"
            name={p(basePath, "patternOpacity")}
            control={control}
            min={0}
            max={100}
            step={5}
            unit="%"
          />
        </>
      )}

      {showAnimationSpeed && (
        <FormSelect
          label="Animation Speed"
          name={p(basePath, "animationSpeed")}
          control={control}
          options={ANIMATION_SPEED_OPTIONS}
        />
      )}

      {showGlassFields && (
        <>
          <FormSlider
            label="Blur"
            name={p(basePath, "glassBlur")}
            control={control}
            min={0}
            max={20}
            step={1}
            unit="px"
          />
          <FormSlider
            label="Glass Opacity"
            name={p(basePath, "glassOpacity")}
            control={control}
            min={0}
            max={100}
            step={5}
            unit="%"
          />
        </>
      )}

      {showMeshFields && (
        <>
          <FormSlider
            label="Mesh Opacity"
            name={p(basePath, "meshOpacity")}
            control={control}
            min={0}
            max={100}
            step={5}
            unit="%"
          />
          <FormSelect
            label="Mesh Grade"
            name={p(basePath, "meshGrade")}
            control={control}
            options={MESH_GRADE_OPTIONS}
          />
        </>
      )}
    </div>
  );
}
