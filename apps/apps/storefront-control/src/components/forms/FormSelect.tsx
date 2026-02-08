import {
  type Control,
  Controller,
  type Path,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface FormSelectProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  control: Control<T>;
  options: { value: string; label: string }[];
  description?: string;
  placeholder?: string;
  className?: string;
}

export function FormSelect<T extends FieldValues>({
  label,
  name,
  control,
  options,
  description,
  placeholder,
  className,
}: FormSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn("space-y-2", className)}>
          <Label htmlFor={name}>{label}</Label>
          <Select
            value={(field.value as string) ?? ""}
            onValueChange={field.onChange}
          >
            <SelectTrigger
              id={name}
              className={cn(fieldState.error && "border-destructive")}
            >
              <SelectValue placeholder={placeholder ?? "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && !fieldState.error && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
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
