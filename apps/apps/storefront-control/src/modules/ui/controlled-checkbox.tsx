import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Checkbox, Box, Text } from "@saleor/macaw-ui";

interface ControlledCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  description?: string;
}

/**
 * Controlled Checkbox component that bridges react-hook-form with Macaw UI Checkbox.
 * 
 * Macaw UI Checkbox expects `checked` + `onCheckedChange` props,
 * but react-hook-form's `register()` provides `onChange` (incompatible).
 * This component uses Controller to properly bind the checkbox state.
 */
export function ControlledCheckbox<T extends FieldValues>({
  name,
  control,
  label,
  description,
}: ControlledCheckboxProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box display="flex" alignItems="flex-start" gap={3}>
          <Checkbox
            checked={field.value === true}
            onCheckedChange={(checked) => field.onChange(checked)}
          />
          {(label || description) && (
            <Box>
              {label && <Text as="span">{label}</Text>}
              {description && (
                <Text as="p" color="default2">{description}</Text>
              )}
            </Box>
          )}
        </Box>
      )}
    />
  );
}

/**
 * Inline controlled checkbox without label/description box wrapper.
 * Use this when you want just the checkbox element for custom layouts.
 */
export function ControlledCheckboxInline<T extends FieldValues>({
  name,
  control,
}: Pick<ControlledCheckboxProps<T>, "name" | "control">) {
  return (
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
  );
}
