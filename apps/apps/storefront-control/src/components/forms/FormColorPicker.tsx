import { useRef } from "react";
import {
  type Control,
  Controller,
  type Path,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FormColorPickerProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  control: Control<T>;
  description?: string;
  className?: string;
  presets?: string[];
}

const DEFAULT_PRESETS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

export function FormColorPicker<T extends FieldValues>({
  label,
  name,
  control,
  description,
  className,
  presets = DEFAULT_PRESETS,
}: FormColorPickerProps<T>) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const colorValue = (field.value as string) || "#000000";

        const handleSwatchClick = () => {
          colorInputRef.current?.click();
        };

        const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let val = e.target.value;
          if (val && !val.startsWith("#")) {
            val = "#" + val;
          }
          field.onChange(val);
        };

        return (
          <div className={cn("space-y-2", className)}>
            <Label htmlFor={name}>{label}</Label>
            <div className="flex items-center gap-2">
              {/* Color swatch — opens native picker */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={handleSwatchClick}
                  className="h-10 w-10 rounded-md border-2 border-input shadow-sm transition-all hover:shadow-md hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{ backgroundColor: colorValue }}
                  aria-label={`Pick color for ${label}`}
                />
                <input
                  ref={colorInputRef}
                  type="color"
                  value={colorValue}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                />
              </div>

              {/* Hex input */}
              <Input
                id={name}
                value={colorValue}
                onChange={handleHexChange}
                placeholder="#000000"
                maxLength={7}
                className={cn(
                  "font-mono uppercase w-28",
                  fieldState.error && "border-destructive",
                )}
              />
            </div>

            {/* Preset swatches */}
            {presets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {presets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => field.onChange(color)}
                    className={cn(
                      "h-5 w-5 rounded-sm border transition-all hover:scale-110",
                      colorValue.toLowerCase() === color.toLowerCase()
                        ? "border-foreground ring-1 ring-foreground ring-offset-1"
                        : "border-input"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Set color to ${color}`}
                  />
                ))}
              </div>
            )}

            {description && !fieldState.error && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {fieldState.error?.message && (
              <p className="text-xs text-destructive">
                {fieldState.error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
