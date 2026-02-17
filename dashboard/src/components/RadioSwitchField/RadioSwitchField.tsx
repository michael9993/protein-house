// @ts-strict-ignore
import { cn } from "@dashboard/utils/cn";
import { RadioGroup, Text } from "@saleor/macaw-ui-next";
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
  const change = (newValue: string) => {
    onChange({
      target: {
        name,
        value: newValue === "true",
      },
    } as any);
  };

  return (
    <div className={cn("p-0 w-full", disabled && "opacity-50 pointer-events-none", className)}>
      <RadioGroup
        name={name}
        value={initialValue}
        error={error}
        onValueChange={change}
      >
        <RadioGroup.Item
          value="true"
          id={`${name}-true`}
          className={cn("[&>span]:py-2", overrideClasses?.radioLabel)}
        >
          <Text>{firstOptionLabel}</Text>
        </RadioGroup.Item>
        <RadioGroup.Item
          value="false"
          id={`${name}-false`}
          className={cn("[&>span]:py-2", overrideClasses?.radioLabel)}
        >
          <Text>{secondOptionLabel}</Text>
        </RadioGroup.Item>
      </RadioGroup>
    </div>
  );
};

RadioSwitchField.displayName = "RadioSwitchField";
export default RadioSwitchField;
