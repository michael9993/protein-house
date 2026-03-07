import {
  type Control,
  type FieldValues,
  type Path,
  type UseFormSetValue,
  useWatch,
  Controller,
} from "react-hook-form";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormColorPicker, FormSelect, FormSlider, FormField } from "@/components/forms";
import { Label } from "@/components/ui/label";
import type { ComponentStyleOverride } from "@saleor/apps-storefront-config";

// ---------------------------------------------------------------------------
// Property metadata: maps each property to its form renderer config
// ---------------------------------------------------------------------------

interface PropertyMeta {
  label: string;
  group: "visual" | "typography" | "layout" | "hover" | "custom";
  type: "color" | "select" | "slider" | "text" | "hidden" | "presets_text";
  options?: { value: string; label: string }[];
  /** Quick-pick presets for presets_text fields */
  presetChips?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

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

const FONT_FAMILY_OPTIONS = [
  { value: "heading", label: "Heading" },
  { value: "body", label: "Body" },
  { value: "mono", label: "Monospace" },
];

const FONT_SIZE_OPTIONS = [
  { value: "xs", label: "Extra Small" },
  { value: "sm", label: "Small" },
  { value: "base", label: "Base" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "XL" },
  { value: "2xl", label: "2XL" },
  { value: "3xl", label: "3XL" },
  { value: "4xl", label: "4XL" },
];

const FONT_WEIGHT_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "medium", label: "Medium" },
  { value: "semibold", label: "Semibold" },
  { value: "bold", label: "Bold" },
  { value: "extrabold", label: "Extra Bold" },
];

const TEXT_TRANSFORM_OPTIONS = [
  { value: "none", label: "None" },
  { value: "uppercase", label: "Uppercase" },
  { value: "lowercase", label: "Lowercase" },
  { value: "capitalize", label: "Capitalize" },
];

const PADDING_PRESETS = [
  { value: "0.5rem", label: "XS" },
  { value: "1rem", label: "S" },
  { value: "1.5rem", label: "M" },
  { value: "2rem", label: "L" },
  { value: "3rem", label: "XL" },
  { value: "1rem 2rem", label: "H" },
  { value: "2rem 3rem", label: "HXL" },
];

const MARGIN_PRESETS = [
  { value: "0", label: "0" },
  { value: "0.5rem", label: "XS" },
  { value: "1rem", label: "S" },
  { value: "1.5rem", label: "M" },
  { value: "2rem", label: "L" },
  { value: "0 auto", label: "Center" },
];

const GAP_PRESETS = [
  { value: "0.25rem", label: "XS" },
  { value: "0.5rem", label: "S" },
  { value: "1rem", label: "M" },
  { value: "1.5rem", label: "L" },
  { value: "2rem", label: "XL" },
  { value: "3rem", label: "2XL" },
];

const BACKGROUND_STYLE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  { value: "radial-gradient", label: "Radial" },
];

const GRADIENT_DIRECTION_OPTIONS = [
  { value: "to-right", label: "→ Right" },
  { value: "to-left", label: "← Left" },
  { value: "to-bottom", label: "↓ Down" },
  { value: "to-top", label: "↑ Up" },
  { value: "to-bottom-right", label: "↘ Diagonal" },
  { value: "to-top-left", label: "↖ Reverse" },
  { value: "diagonal", label: "⟋ 135°" },
];

export const PROPERTY_META: Record<keyof ComponentStyleOverride, PropertyMeta> = {
  backgroundColor: { label: "Background Color", group: "visual", type: "color" },
  backgroundStyle: { label: "Background Style", group: "visual", type: "hidden" },
  backgroundSecondaryColor: { label: "Secondary Color", group: "visual", type: "hidden" },
  gradientDirection: { label: "Direction", group: "visual", type: "hidden" },
  textColor: { label: "Text Color", group: "visual", type: "color" },
  borderColor: { label: "Border Color", group: "visual", type: "color" },
  borderWidth: { label: "Border Width", group: "visual", type: "slider", min: 0, max: 8, step: 1, unit: "px" },
  borderRadius: { label: "Border Radius", group: "visual", type: "select", options: BORDER_RADIUS_OPTIONS },
  shadow: { label: "Shadow", group: "visual", type: "select", options: SHADOW_OPTIONS },
  opacity: { label: "Opacity", group: "visual", type: "slider", min: 0, max: 100, step: 5, unit: "%" },
  fontFamily: { label: "Font Family", group: "typography", type: "select", options: FONT_FAMILY_OPTIONS },
  fontSize: { label: "Font Size", group: "typography", type: "select", options: FONT_SIZE_OPTIONS },
  fontWeight: { label: "Font Weight", group: "typography", type: "select", options: FONT_WEIGHT_OPTIONS },
  textTransform: { label: "Text Transform", group: "typography", type: "select", options: TEXT_TRANSFORM_OPTIONS },
  padding: { label: "Padding", group: "layout", type: "presets_text", presetChips: PADDING_PRESETS, placeholder: "e.g., 1rem 2rem" },
  margin: { label: "Margin", group: "layout", type: "presets_text", presetChips: MARGIN_PRESETS, placeholder: "e.g., 0 auto" },
  gap: { label: "Gap", group: "layout", type: "presets_text", presetChips: GAP_PRESETS, placeholder: "e.g., 1rem" },
  hoverBackgroundColor: { label: "Hover Background", group: "hover", type: "color" },
  hoverTextColor: { label: "Hover Text Color", group: "hover", type: "color" },
  hoverShadow: { label: "Hover Shadow", group: "hover", type: "select", options: SHADOW_OPTIONS },
  customClasses: { label: "Custom Tailwind Classes", group: "custom", type: "text", placeholder: "e.g., rounded-xl shadow-2xl" },
};

export const GROUP_LABELS: Record<string, string> = {
  visual: "Visual",
  typography: "Typography",
  layout: "Layout",
  hover: "Hover States",
  custom: "Custom CSS",
};

export const GROUP_ORDER = ["visual", "typography", "layout", "hover", "custom"] as const;

// ---------------------------------------------------------------------------
// Visual option maps (for visual select previews)
// ---------------------------------------------------------------------------

const RADIUS_CSS_MAP: Record<string, string> = {
  none: "0px", sm: "4px", md: "8px", lg: "16px", full: "9999px",
};

const SHADOW_CSS_MAP: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px -1px rgba(0,0,0,0.1)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.1)",
};

const FONT_WEIGHT_CSS_MAP: Record<string, number> = {
  normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800,
};

// ---------------------------------------------------------------------------
// Property Field Wrapper — adds clear button + modified indicator
// ---------------------------------------------------------------------------

function PropertyFieldWrapper<T extends FieldValues>({
  fieldPath,
  control,
  children,
  onClear,
}: {
  fieldPath: string;
  control: Control<T>;
  children: React.ReactNode;
  onClear: () => void;
}) {
  const value = useWatch({ control, name: fieldPath as Path<T> });
  const hasValue = value != null && value !== "";

  return (
    <div className="group relative">
      {hasValue && (
        <span className="absolute -start-3 top-3 h-1.5 w-1.5 rounded-full bg-blue-500" />
      )}
      {children}
      {hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="absolute end-0 top-0 rounded p-0.5 text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100"
          title="Clear this property"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

interface PropertyFieldRendererProps<T extends FieldValues> {
  property: keyof ComponentStyleOverride;
  /** Form field name path, e.g., "componentOverrides.homepage.hero.backgroundColor" */
  basePath: string;
  control: Control<T>;
  register: any;
  errors: any;
  setValue?: UseFormSetValue<T>;
  /** Brand color presets to prepend to color picker presets */
  brandPresets?: string[];
}

export function PropertyFieldRenderer<T extends FieldValues>({
  property,
  basePath,
  control,
  register,
  errors,
  setValue,
  brandPresets,
}: PropertyFieldRendererProps<T>) {
  const meta = PROPERTY_META[property];
  if (!meta || meta.type === "hidden") return null;

  const fieldPath = `${basePath}.${String(property)}` as Path<T>;

  const handleClear = () => {
    if (setValue) {
      (setValue as (path: string, value: unknown, options?: any) => void)(
        fieldPath,
        undefined,
        { shouldDirty: true }
      );
    }
  };

  // Special compound field for backgroundColor — includes gradient controls
  if (property === "backgroundColor") {
    return (
      <BackgroundCompoundField
        basePath={basePath}
        control={control}
        setValue={setValue}
        brandPresets={brandPresets}
      />
    );
  }

  // Visual select for borderRadius
  if (property === "borderRadius") {
    return (
      <PropertyFieldWrapper fieldPath={fieldPath} control={control} onClear={handleClear}>
        <VisualRadiusSelect fieldPath={fieldPath} control={control} />
      </PropertyFieldWrapper>
    );
  }

  // Visual select for shadow
  if (property === "shadow" || property === "hoverShadow") {
    return (
      <PropertyFieldWrapper fieldPath={fieldPath} control={control} onClear={handleClear}>
        <VisualShadowSelect fieldPath={fieldPath} control={control} label={meta.label} />
      </PropertyFieldWrapper>
    );
  }

  // Visual select for fontWeight
  if (property === "fontWeight") {
    return (
      <PropertyFieldWrapper fieldPath={fieldPath} control={control} onClear={handleClear}>
        <VisualFontWeightSelect fieldPath={fieldPath} control={control} />
      </PropertyFieldWrapper>
    );
  }

  return (
    <PropertyFieldWrapper fieldPath={fieldPath} control={control} onClear={handleClear}>
      {meta.type === "color" ? (
        <FormColorPicker
          label={meta.label}
          name={fieldPath}
          control={control}
          presets={brandPresets}
        />
      ) : meta.type === "select" ? (
        <FormSelect
          label={meta.label}
          name={fieldPath}
          control={control}
          options={meta.options ?? []}
          placeholder="Inherit"
        />
      ) : meta.type === "slider" ? (
        <FormSlider
          label={meta.label}
          name={fieldPath}
          control={control}
          min={meta.min}
          max={meta.max}
          step={meta.step}
          unit={meta.unit}
        />
      ) : meta.type === "presets_text" ? (
        <PresetsTextField
          fieldPath={fieldPath}
          control={control}
          register={register}
          errors={errors}
          label={meta.label}
          placeholder={meta.placeholder}
          presets={meta.presetChips ?? []}
        />
      ) : meta.type === "text" ? (
        <FormField
          label={meta.label}
          name={fieldPath}
          register={register}
          errors={errors}
          placeholder={meta.placeholder}
        />
      ) : null}
    </PropertyFieldWrapper>
  );
}

// ---------------------------------------------------------------------------
// Background Compound Field (solid color + gradient controls)
// ---------------------------------------------------------------------------

function BackgroundCompoundField<T extends FieldValues>({
  basePath,
  control,
  setValue,
  brandPresets,
}: {
  basePath: string;
  control: Control<T>;
  setValue?: UseFormSetValue<T>;
  brandPresets?: string[];
}) {
  const bgColorPath = `${basePath}.backgroundColor` as Path<T>;
  const stylePath = `${basePath}.backgroundStyle` as Path<T>;
  const secondaryPath = `${basePath}.backgroundSecondaryColor` as Path<T>;
  const directionPath = `${basePath}.gradientDirection` as Path<T>;

  const bgStyle = useWatch({ control, name: stylePath }) as string | undefined;
  const bgColor = useWatch({ control, name: bgColorPath }) as string | undefined;
  const bgSecondary = useWatch({ control, name: secondaryPath }) as string | undefined;
  const direction = useWatch({ control, name: directionPath }) as string | undefined;

  const isGradient = bgStyle === "gradient" || bgStyle === "radial-gradient";

  const handleClearAll = () => {
    if (!setValue) return;
    const set = setValue as (path: string, value: unknown, options?: any) => void;
    set(bgColorPath, undefined, { shouldDirty: true });
    set(stylePath, undefined, { shouldDirty: true });
    set(secondaryPath, undefined, { shouldDirty: true });
    set(directionPath, undefined, { shouldDirty: true });
  };

  // Build gradient preview string
  let previewBg = bgColor || "#e5e7eb";
  if (isGradient && bgColor && bgSecondary) {
    if (bgStyle === "gradient") {
      const dirMap: Record<string, string> = {
        "to-right": "to right", "to-left": "to left", "to-bottom": "to bottom",
        "to-top": "to top", "to-bottom-right": "to bottom right",
        "to-top-left": "to top left", "diagonal": "135deg",
      };
      previewBg = `linear-gradient(${dirMap[direction ?? "to-right"]}, ${bgColor}, ${bgSecondary})`;
    } else {
      previewBg = `radial-gradient(circle, ${bgColor}, ${bgSecondary})`;
    }
  }

  return (
    <div className="group relative space-y-3">
      {bgColor && (
        <span className="absolute -start-3 top-3 h-1.5 w-1.5 rounded-full bg-blue-500" />
      )}
      {bgColor && (
        <button
          type="button"
          onClick={handleClearAll}
          className="absolute end-0 top-0 rounded p-0.5 text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100"
          title="Clear background"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Style selector */}
      <div className="space-y-1.5">
        <Label>Background</Label>
        <div className="flex gap-1">
          {BACKGROUND_STYLE_OPTIONS.map((opt) => (
            <Controller
              key={opt.value}
              name={stylePath}
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs transition-colors",
                    (field.value || "solid") === opt.value
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-neutral-500 hover:bg-neutral-100"
                  )}
                >
                  {opt.label}
                </button>
              )}
            />
          ))}
        </div>
      </div>

      {/* Primary color */}
      <FormColorPicker
        label={isGradient ? "From Color" : "Color"}
        name={bgColorPath}
        control={control}
        presets={brandPresets}
      />

      {/* Secondary color (gradient only) */}
      {isGradient && (
        <FormColorPicker
          label="To Color"
          name={secondaryPath}
          control={control}
          presets={brandPresets}
        />
      )}

      {/* Direction (linear gradient only) */}
      {bgStyle === "gradient" && (
        <div className="space-y-1.5">
          <Label>Direction</Label>
          <div className="flex flex-wrap gap-1">
            {GRADIENT_DIRECTION_OPTIONS.map((opt) => (
              <Controller
                key={opt.value}
                name={directionPath}
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs transition-colors",
                      (field.value || "to-right") === opt.value
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-neutral-500 hover:bg-neutral-100"
                    )}
                  >
                    {opt.label}
                  </button>
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gradient preview strip */}
      {bgColor && (
        <div
          className="h-6 w-full rounded-md border border-neutral-200"
          style={{ background: previewBg }}
          title="Background preview"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visual Select: Border Radius
// ---------------------------------------------------------------------------

function VisualRadiusSelect<T extends FieldValues>({
  fieldPath,
  control,
}: {
  fieldPath: Path<T>;
  control: Control<T>;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Border Radius</Label>
      <Controller
        name={fieldPath}
        control={control}
        render={({ field }) => (
          <div className="flex gap-1.5">
            {BORDER_RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => field.onChange(field.value === opt.value ? undefined : opt.value)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center border-2 transition-all",
                  field.value === opt.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                )}
                style={{ borderRadius: RADIUS_CSS_MAP[opt.value] }}
                title={opt.label}
              >
                <span className="text-[9px] text-neutral-500">{opt.label.charAt(0)}</span>
              </button>
            ))}
          </div>
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visual Select: Shadow
// ---------------------------------------------------------------------------

function VisualShadowSelect<T extends FieldValues>({
  fieldPath,
  control,
  label,
}: {
  fieldPath: Path<T>;
  control: Control<T>;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Controller
        name={fieldPath}
        control={control}
        render={({ field }) => (
          <div className="flex gap-2">
            {SHADOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => field.onChange(field.value === opt.value ? undefined : opt.value)}
                className={cn(
                  "h-9 w-12 rounded-md border-2 bg-white transition-all",
                  field.value === opt.value
                    ? "border-blue-500"
                    : "border-neutral-200 hover:border-neutral-300"
                )}
                style={{ boxShadow: SHADOW_CSS_MAP[opt.value] }}
                title={opt.label}
              >
                <span className="text-[9px] text-neutral-500">{opt.label.charAt(0)}</span>
              </button>
            ))}
          </div>
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visual Select: Font Weight
// ---------------------------------------------------------------------------

function VisualFontWeightSelect<T extends FieldValues>({
  fieldPath,
  control,
}: {
  fieldPath: Path<T>;
  control: Control<T>;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Font Weight</Label>
      <Controller
        name={fieldPath}
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap gap-1">
            {FONT_WEIGHT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => field.onChange(field.value === opt.value ? undefined : opt.value)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-all",
                  field.value === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
                style={{ fontWeight: FONT_WEIGHT_CSS_MAP[opt.value] }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presets + Text Input (for padding, margin, gap)
// ---------------------------------------------------------------------------

function PresetsTextField<T extends FieldValues>({
  fieldPath,
  control,
  register,
  errors,
  label,
  placeholder,
  presets,
}: {
  fieldPath: Path<T>;
  control: Control<T>;
  register: any;
  errors: any;
  label: string;
  placeholder?: string;
  presets: { value: string; label: string }[];
}) {
  return (
    <Controller
      name={fieldPath}
      control={control}
      render={({ field }) => (
        <div className="space-y-1.5">
          <Label>{label}</Label>
          {/* Preset chips */}
          <div className="flex flex-wrap gap-1">
            {presets.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => field.onChange(field.value === p.value ? undefined : p.value)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] transition-all",
                  field.value === p.value
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                )}
                title={p.value}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Free text input */}
          <input
            value={(field.value as string) || ""}
            onChange={(e) => field.onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 placeholder:text-neutral-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
        </div>
      )}
    />
  );
}
