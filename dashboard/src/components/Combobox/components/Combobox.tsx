import { ChangeEvent } from "@dashboard/hooks/useForm";
import { commonMessages } from "@dashboard/intl";
import { FetchMoreProps } from "@dashboard/types";
import { DynamicCombobox, DynamicComboboxProps, Option } from "@saleor/macaw-ui-next";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";

import { useCombbobxCustomOption } from "../hooks/useCombbobxCustomOption";
import { useComboboxEmptyOption } from "../hooks/useComboboxEmptyOption";
import { useComboboxHandlers } from "../hooks/useComboboxHandlers";

type HandleOnChangeValue = Option | null;

type ComboboxProps = Omit<DynamicComboboxProps<Option | null>, "value" | "onChange"> & {
  children?: ReactNode;
  fetchOptions: (data: string) => void;
  allowCustomValues?: boolean;
  alwaysFetchOnFocus?: boolean;
  allowEmptyValue?: boolean;
  fetchMore?: FetchMoreProps;
  value: Option | string | null;
  onChange: (event: ChangeEvent) => void;
};

// Normalize value: form often has string (id only); Combobox needs Option | null
function toOption(value: Option | string | null, options: Option[] = []): Option | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "object" && "value" in value && "label" in value) {
    return value as Option;
  }
  const id = typeof value === "string" ? value : (value as Option).value;
  const found = options?.find(opt => opt.value === id);
  return found ?? { value: id, label: id };
}

const ComboboxRoot = ({
  value: valueProp,
  fetchOptions,
  onChange,
  options = [],
  alwaysFetchOnFocus = false,
  allowCustomValues = false,
  allowEmptyValue = false,
  fetchMore,
  loading,
  children,
  size = "small",
  ...rest
}: ComboboxProps) => {
  const intl = useIntl();
  const value = useMemo(
    () => toOption(valueProp, options),
    [valueProp, options],
  );
  const [selectedValue, setSelectedValue] = useState(value);
  const [inputValue, setInputValue] = useState("");

  // Sync internal state with prop value
  useEffect(() => {
    const valueStr = value?.value ?? null;
    const selectedStr = selectedValue?.value ?? null;

    if (
      valueStr !== selectedStr ||
      (value === null && selectedValue !== null) ||
      (value !== null && selectedValue === null)
    ) {
      setSelectedValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const { handleFetchMore, handleFocus, handleInputChange } = useComboboxHandlers({
    fetchOptions,
    alwaysFetchOnFocus,
    fetchMore,
  });
  const { customValueOption } = useCombbobxCustomOption({
    query: inputValue,
    allowCustomValues,
    selectedValue,
  });

  const { emptyOption } = useComboboxEmptyOption();

  // Ensure current value is in the options list so the combobox can display it
  // (e.g. when value is set from form/API but options are loaded async or from search)
  const optionsWithValue = useMemo(() => {
    const base = [
      ...(allowEmptyValue ? [emptyOption] : []),
      ...customValueOption,
      ...(options ?? []),
    ] as Option[];
    if (value && !base.some(opt => opt.value === value.value)) {
      return [value, ...base];
    }
    return base;
  }, [allowEmptyValue, emptyOption, customValueOption, options, value]);

  const handleOnChange = (newValue: HandleOnChangeValue) => {
    setSelectedValue(newValue);
    setInputValue("");
    onChange({
      target: { value: newValue?.value ?? null, name: rest.name ?? "" },
    });
  };

  return (
    <DynamicCombobox
      value={selectedValue}
      options={optionsWithValue}
      onChange={handleOnChange}
      onScrollEnd={handleFetchMore}
      onInputValueChange={value => {
        setInputValue(value);
        handleInputChange(value);
      }}
      onFocus={handleFocus}
      loading={loading || fetchMore?.hasMore || fetchMore?.loading}
      locale={{
        loadingText: intl.formatMessage(commonMessages.loading),
      }}
      size={size}
      {...rest}
    >
      {children}
    </DynamicCombobox>
  );
};

export const Combobox = Object.assign(ComboboxRoot, {
  NoOptions: DynamicCombobox.NoOptions,
});
