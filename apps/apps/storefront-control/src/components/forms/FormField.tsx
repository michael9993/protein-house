import {
  type UseFormRegister,
  type FieldErrors,
  type Path,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  type?: "text" | "email" | "number" | "url";
  as?: "input" | "textarea";
  rows?: number;
  placeholder?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

function getNestedError(
  errors: FieldErrors | undefined,
  path: string,
): string | undefined {
  if (!errors) return undefined;

  const segments = path.split(".");
  let current: unknown = errors;

  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (
    current !== null &&
    current !== undefined &&
    typeof current === "object" &&
    "message" in current
  ) {
    return (current as { message?: string }).message;
  }

  return undefined;
}

export function FormField<T extends FieldValues>({
  label,
  name,
  register,
  errors,
  type = "text",
  as = "input",
  rows = 6,
  placeholder,
  description,
  required,
  className,
}: FormFieldProps<T>) {
  const errorMessage = getNestedError(errors, name);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="ms-1 text-destructive">*</span>}
      </Label>
      {as === "textarea" ? (
        <Textarea
          id={name}
          rows={rows}
          placeholder={placeholder}
          {...register(name)}
          className={cn(errorMessage && "border-destructive")}
        />
      ) : (
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          {...register(name, { valueAsNumber: type === "number" })}
          className={cn(errorMessage && "border-destructive")}
        />
      )}
      {description && !errorMessage && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
