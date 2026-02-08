import { useState } from "react";
import {
  type UseFormRegister,
  type UseFormWatch,
  type FieldErrors,
  type Path,
  type FieldValues,
} from "react-hook-form";
import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FormImageUrlProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  errors?: FieldErrors<T>;
  placeholder?: string;
  description?: string;
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

export function FormImageUrl<T extends FieldValues>({
  label,
  name,
  register,
  watch,
  errors,
  placeholder = "https://example.com/image.png",
  description,
  className,
}: FormImageUrlProps<T>) {
  const [imageError, setImageError] = useState(false);
  const currentUrl = watch(name) as string;
  const errorMessage = getNestedError(errors, name);
  const hasValidUrl = currentUrl && currentUrl.trim().length > 0;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type="url"
        placeholder={placeholder}
        {...register(name, {
          onChange: () => setImageError(false),
        })}
        className={cn(errorMessage && "border-destructive")}
      />
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {hasValidUrl && !imageError ? (
          <img
            src={currentUrl}
            alt={`Preview for ${label}`}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        )}
      </div>
      {description && !errorMessage && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
