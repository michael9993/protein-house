import { type ReactNode } from "react";
import {
  type Control,
  Controller,
  type Path,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface FormRadioCardsProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  control: Control<T>;
  options: RadioCardOption[];
  description?: string;
  columns?: 2 | 3 | 4;
  className?: string;
}

const columnClasses: Record<2 | 3 | 4, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function FormRadioCards<T extends FieldValues>({
  label,
  name,
  control,
  options,
  description,
  columns = 3,
  className,
}: FormRadioCardsProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn("space-y-3", className)}>
          <div>
            <Label>{label}</Label>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className={cn("grid gap-3", columnClasses[columns])}>
            {options.map((option) => {
              const isSelected = field.value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  {option.icon && (
                    <div className="flex h-10 w-10 items-center justify-center text-muted-foreground">
                      {option.icon}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    {option.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {fieldState.error?.message && (
            <p className="text-xs text-destructive">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}
