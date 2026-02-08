import {
  type Control,
  Controller,
  type Path,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface FormSliderProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  control: Control<T>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
  className?: string;
}

export function FormSlider<T extends FieldValues>({
  label,
  name,
  control,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  description,
  className,
}: FormSliderProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const numericValue =
          typeof field.value === "number" ? field.value : min;

        return (
          <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
              <Label htmlFor={name}>{label}</Label>
              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                {numericValue}
                {unit}
              </span>
            </div>
            <Slider
              id={name}
              min={min}
              max={max}
              step={step}
              value={[numericValue]}
              onValueChange={([value]) => field.onChange(value)}
            />
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
