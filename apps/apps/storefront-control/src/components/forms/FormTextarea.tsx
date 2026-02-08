import {
  type UseFormRegister,
  type FieldErrors,
  type Path,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FormTextareaProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  placeholder?: string;
  description?: string;
  rows?: number;
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

export function FormTextarea<T extends FieldValues>({
  label,
  name,
  register,
  errors,
  placeholder,
  description,
  rows = 4,
  className,
}: FormTextareaProps<T>) {
  const errorMessage = getNestedError(errors, name);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        placeholder={placeholder}
        rows={rows}
        {...register(name)}
        className={cn(errorMessage && "border-destructive")}
      />
      {description && !errorMessage && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
