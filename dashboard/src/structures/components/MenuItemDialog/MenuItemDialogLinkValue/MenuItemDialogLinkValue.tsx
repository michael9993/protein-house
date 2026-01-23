import { Combobox } from "@dashboard/components/Combobox";
import { Control, Controller } from "react-hook-form";
import { useMemo } from "react";
import { useIntl } from "react-intl";

import { MenuItemDialogFormData, MenuItemTypeWithOptions } from "../types";
import { useLinkValue } from "./useLinkValue";

interface MenuItemDialogLinkValueProps {
  linkType: MenuItemTypeWithOptions;
  control: Control<MenuItemDialogFormData, any>;
  disabled: boolean;
  showInitialValue?: boolean;
  initialDisplayValue?: string;
}

export const MenuItemDialogLinkValue = ({
  linkType,
  disabled,
  control,
  showInitialValue,
  initialDisplayValue,
}: MenuItemDialogLinkValueProps) => {
  const intl = useIntl();
  const { fetchMoreProps, loading, options, onQueryChange } = useLinkValue(linkType);

  return (
    <Controller
      name="linkValue"
      control={control}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => {
        // Use useMemo to prevent unnecessary recalculations that could cause jitter
        const subOptionsListValue = useMemo(() => {
          return options?.find(o => o.value === value);
        }, [options, value]);

        const comboboxValue = useMemo(() => {
          // Show initial value with label in case initial options list from API does not contain it
          if (showInitialValue) {
            return {
              value,
              label: initialDisplayValue!,
            };
          }
          return subOptionsListValue || null;
        }, [showInitialValue, value, initialDisplayValue, subOptionsListValue]);

        return (
          <Combobox
            disabled={disabled}
            label={intl.formatMessage({
              id: "WDrC7e",
              defaultMessage: "Link value",
              description: "label",
            })}
            options={options ?? []}
            onChange={e => {
              // Combobox sends ChangeEvent with target.value
              // Extract the value from the ChangeEvent and pass to react-hook-form
              const newValue = e?.target?.value ?? null;
              onChange(newValue);
            }}
            onBlur={onBlur}
            value={comboboxValue}
            name="linkValue"
            error={!!error}
            helperText={error?.message}
            fetchOptions={onQueryChange}
            fetchMore={fetchMoreProps}
            loading={loading}
            data-test-id="menu-item-link-value-input"
          />
        );
      }}
    />
  );
};
