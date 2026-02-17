// @ts-strict-ignore
import { cn } from "@dashboard/utils/cn";
import { RadioGroup, Text } from "@saleor/macaw-ui-next";
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
    <div
      className={cn(
        "p-0 w-full",
        !label && "-mt-3",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      {!!label && <label className="text-base mb-2 block">{label}</label>}
      <RadioGroup
        value={String(value)}
        name={name}
        error={error}
        onValueChange={newValue => onChange({ target: { name, value: newValue } } as any)}
        className={cn(
          variant === "inline" && "flex-row",
          innerContainerClassName,
        )}
      >
        {choices.length > 0 ? (
          choices.map(choice => (
            <RadioGroup.Item
              key={choice.value}
              value={String(choice.value)}
              id={String(choice.value)}
              disabled={choice.disabled}
              data-test-id={choice.value}
              className={cn(
                "radio-label",
                variant !== "inline" && "-mb-1",
                variant === "inline" && "items-start mr-8",
                alignTop && "items-start",
              )}
              marginBottom={1}
            >
              <Text
                color={choice.disabled ? "defaultDisabled" : "default1"}
                className="flex flex-col"
              >
                {choice.label}
              </Text>
            </RadioGroup.Item>
          ))
        ) : (
          <Text color="default2" paddingX={4} paddingY={2}>
            <FormattedMessage id="hX5PAb" defaultMessage="No results found" />
          </Text>
        )}
      </RadioGroup>
      {hint && (
        <p
          className={cn(
            "text-xs mt-1 mx-3.5",
            error
              ? "text-[var(--mu-colors-text-critical1)]"
              : "text-[var(--mu-colors-text-default2)]",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

RadioGroupField.displayName = "RadioGroupField";
export default RadioGroupField;
