import { Box, Text, Input, Checkbox, Select } from "@saleor/macaw-ui";
import { UseFormRegister, FieldErrors, Path, FieldValues, Control, Controller } from "react-hook-form";

interface FormFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  type?: "text" | "email" | "number" | "url" | "color" | "textarea";
  placeholder?: string;
  description?: string;
  required?: boolean;
}

export function FormField<T extends FieldValues>({
  label,
  name,
  register,
  errors,
  type = "text",
  placeholder,
  description,
  required,
}: FormFieldProps<T>) {
  const error = errors?.[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <Box marginBottom={4}>
      <Box marginBottom={1}>
        <Text as="label" variant="bodyStrong">
          {label}
          {required && <Text color="critical1"> *</Text>}
        </Text>
      </Box>
      
      {type === "textarea" ? (
        <textarea
          {...register(name)}
          placeholder={placeholder}
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "8px 12px",
            borderRadius: "4px",
            border: errorMessage ? "1px solid var(--color-critical1)" : "1px solid var(--color-default2)",
            fontFamily: "inherit",
            fontSize: "14px",
            resize: "vertical",
          }}
        />
      ) : type === "color" ? (
        <Box display="flex" alignItems="center" gap={2}>
          <input
            type="color"
            {...register(name)}
            style={{
              width: "40px",
              height: "40px",
              padding: 0,
              border: "none",
              cursor: "pointer",
            }}
          />
          <Input
            {...register(name)}
            placeholder="#000000"
            size="small"
            style={{ maxWidth: "120px" }}
          />
        </Box>
      ) : (
        <Input
          {...register(name, { valueAsNumber: type === "number" })}
          type={type}
          placeholder={placeholder}
          error={!!errorMessage}
          width="100%"
        />
      )}
      
      {description && !errorMessage && (
        <Text as="p" variant="caption" color="default2" marginTop={1}>
          {description}
        </Text>
      )}
      
      {errorMessage && (
        <Text as="p" variant="caption" color="critical1" marginTop={1}>
          {errorMessage}
        </Text>
      )}
    </Box>
  );
}

interface ToggleFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  control: Control<T>;
  description?: string;
}

/**
 * Controlled toggle field using Controller for proper Macaw UI Checkbox binding.
 * Macaw UI Checkbox requires `checked` + `onCheckedChange` props.
 */
export function ToggleField<T extends FieldValues>({
  label,
  name,
  control,
  description,
}: ToggleFieldProps<T>) {
  return (
    <Box 
      display="flex" 
      alignItems="flex-start" 
      gap={3}
      paddingY={2}
      borderBottomWidth={1}
      borderBottomStyle="solid"
      borderColor="default2"
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Checkbox
            checked={field.value === true}
            onCheckedChange={(checked) => field.onChange(checked)}
          />
        )}
      />
      <Box>
        <Text as="label" variant="bodyStrong">
          {label}
        </Text>
        {description && (
          <Text as="p" variant="caption" color="default2">
            {description}
          </Text>
        )}
      </Box>
    </Box>
  );
}

interface CheckboxFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  description?: string;
}

/**
 * Simple checkbox field using register for boolean fields
 */
export function CheckboxField<T extends FieldValues>({
  label,
  name,
  register,
  description,
}: CheckboxFieldProps<T>) {
  return (
    <Box 
      display="flex" 
      alignItems="flex-start" 
      gap={2}
      paddingY={2}
    >
      <input
        type="checkbox"
        {...register(name)}
        style={{
          width: "18px",
          height: "18px",
          marginTop: "2px",
          cursor: "pointer",
        }}
      />
      <Box>
        <Text as="label" variant="bodyStrong">
          {label}
        </Text>
        {description && (
          <Text as="p" variant="caption" color="default2">
            {description}
          </Text>
        )}
      </Box>
    </Box>
  );
}

interface SelectFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  options: { value: string; label: string }[];
  description?: string;
}

export function SelectField<T extends FieldValues>({
  label,
  name,
  register,
  options,
  description,
}: SelectFieldProps<T>) {
  return (
    <Box marginBottom={4}>
      <Box marginBottom={1}>
        <Text as="label" variant="bodyStrong">
          {label}
        </Text>
      </Box>
      <select
        {...register(name)}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: "4px",
          border: "1px solid var(--color-default2)",
          fontFamily: "inherit",
          fontSize: "14px",
          backgroundColor: "white",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {description && (
        <Text as="p" variant="caption" color="default2" marginTop={1}>
          {description}
        </Text>
      )}
    </Box>
  );
}
