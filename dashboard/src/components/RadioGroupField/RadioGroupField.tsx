// @ts-strict-ignore
import { cn } from "@dashboard/utils/cn";
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Radio,
  RadioGroup,
} from "@mui/material";
import * as React from "react";
import { FormattedMessage } from "react-intl";

import { SimpleRadioGroupField } from "../SimpleRadioGroupField";

export interface RadioGroupFieldChoice<T extends string | number = string | number> {
  disabled?: boolean;
  value: T;
  label: React.ReactNode;
}

interface RadioGroupFieldProps {
  alignTop?: boolean;
  choices: RadioGroupFieldChoice[];
  className?: string;
  innerContainerClassName?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  label?: React.ReactNode;
  name?: string;
  value: string | number;
  variant?: "block" | "inline" | "inlineJustify";
  onChange: (event: React.ChangeEvent<any>) => void;
}

export const NewRadioGroupField = SimpleRadioGroupField;

const RadioGroupField = (props: RadioGroupFieldProps) => {
  const {
    alignTop,
    className,
    disabled,
    error,
    label,
    choices,
    value,
    onChange,
    name,
    hint,
    variant = "block",
    innerContainerClassName,
  } = props;

  return (
    <FormControl
      className={cn(
        "p-0 w-full [&_.radio-label]:last-of-type:mb-0",
        !label && "-mt-3",
        className,
      )}
      error={error}
      disabled={disabled}
    >
      {!!label && <label className="text-base mb-2">{label}</label>}
      <RadioGroup
        aria-label={name}
        name={name}
        value={value}
        onChange={onChange}
        className={cn(
          variant === "inline" && "flex-row",
          innerContainerClassName,
        )}
      >
        {choices.length > 0 ? (
          choices.map(choice => (
            <FormControlLabel
              disabled={choice.disabled}
              value={choice.value}
              className={cn(
                variant !== "inline" && "-mb-1 flex items-center",
                variant === "inline" && "items-start mr-8",
              )}
              classes={{
                label: "mt-[1.6px] flex flex-col",
              }}
              control={
                <Radio
                  data-test-id={choice.value}
                  className={cn(alignTop && "self-baseline relative -top-[6px]")}
                  color="secondary"
                />
              }
              label={choice.label}
              key={choice.value}
            />
          ))
        ) : (
          <MenuItem disabled={true}>
            <FormattedMessage id="hX5PAb" defaultMessage="No results found" />
          </MenuItem>
        )}
      </RadioGroup>
      {hint && <FormHelperText>{hint}</FormHelperText>}
    </FormControl>
  );
};

RadioGroupField.displayName = "RadioGroupField";
export default RadioGroupField;
