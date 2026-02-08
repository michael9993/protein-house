import {
  type Control,
  Controller,
  type Path,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface FormSwitchProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  control: Control<T>;
  description?: string;
  className?: string;
}

export function FormSwitch<T extends FieldValues>({
  label,
  name,
  control,
  description,
  className,
}: FormSwitchProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-lg border p-4",
            className,
          )}
        >
          <div className="space-y-0.5">
            <Label
              htmlFor={name}
              className="text-sm font-medium cursor-pointer"
            >
              {label}
            </Label>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <Switch
            id={name}
            checked={field.value ?? false}
            onCheckedChange={field.onChange}
          />
        </div>
      )}
    />
  );
}
