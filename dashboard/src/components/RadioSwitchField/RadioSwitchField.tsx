// @ts-strict-ignore
import { cn } from "@dashboard/utils/cn";
import { FormControl, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import * as React from "react";

interface RadioSwitchFieldProps {
  classes?: Record<"radioLabel", string>;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  firstOptionLabel: React.ReactNode;
  name?: string;
  secondOptionLabel: React.ReactNode;
  value?: boolean;
  onChange: (event: React.ChangeEvent<any>) => void;
}

const RadioSwitchField = (props: RadioSwitchFieldProps) => {
  const {
    classes: overrideClasses,
    className,
    disabled,
    error,
    firstOptionLabel,
    onChange,
    name,
    secondOptionLabel,
    value,
  } = props;
  const initialValue = value ? "true" : "false";
  const change = event => {
    onChange({
      target: {
        name: event.target.name,
        value: event.target.value === "true",
      },
    } as any);
  };

  return (
    <FormControl className={cn("p-0 w-full", className)} error={error} disabled={disabled}>
      <RadioGroup
        aria-label={name}
        name={name}
        value={initialValue}
        onChange={event => change(event)}
      >
        <FormControlLabel
          value="true"
          className={cn("[&>span]:py-2", overrideClasses?.radioLabel)}
          control={<Radio color="secondary" />}
          label={firstOptionLabel}
          name={name}
        />
        <FormControlLabel
          value="false"
          className={cn("[&>span]:py-2", overrideClasses?.radioLabel)}
          control={<Radio color="secondary" />}
          label={secondOptionLabel}
          name={name}
        />
      </RadioGroup>
    </FormControl>
  );
};

RadioSwitchField.displayName = "RadioSwitchField";
export default RadioSwitchField;
