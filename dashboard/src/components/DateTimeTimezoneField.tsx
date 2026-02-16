// @ts-strict-ignore
import { commonMessages } from "@dashboard/intl";
import { Box, Input, Text } from "@saleor/macaw-ui-next";
import { useEffect, useState } from "react";
import * as React from "react";
import { useIntl } from "react-intl";

interface DateTimeFieldProps {
  onChange: (value: string) => void;
  error?: string | React.ReactNode | undefined;
  setError?: () => void;
  futureDatesOnly?: boolean;
  value: string;
  disabled?: boolean;
  fullWidth?: boolean;
  name: string;
  label?: string;
  helperText?: string;
}

const convertToDateTimeLocal = (date: string) => {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "";
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const min = "1970-01-01T00:00";
const max = "2100-01-01T23:59";

const isInputValid = (value: string) => {
  const d = new Date(value);

  if (isNaN(d.getTime())) {
    return false;
  }

  return d > new Date(min) && d < new Date(max);
};

export const DateTimeTimezoneField = ({
  disabled,
  name,
  onChange,
  error,
  fullWidth,
  label,
  helperText,
  value: initialValue,
}: DateTimeFieldProps) => {
  const intl = useIntl();
  const [value, setValue] = useState<string>(
    initialValue ? convertToDateTimeLocal(initialValue) : "",
  );

  useEffect(() => {
    onChange(value === "" ? null : value);
  }, [value]);

  return (
    <>
      <Box display="flex" gap={4} width="100%">
        <Input
          width={fullWidth ? "100%" : undefined}
          size="small"
          marginRight={3}
          disabled={disabled}
          error={!!error}
          label={label ?? intl.formatMessage(commonMessages.date)}
          name={name}
          onChange={event => {
            const date = event.target.value;

            setValue(date);
          }}
          type="datetime-local"
          data-test-id="date-time-field"
          value={value}
          helperText={helperText}
          min={min}
          max={max}
          onBlur={() => {
            if (!isInputValid(value)) {
              setValue("");
            }
          }}
        />
      </Box>
      {error && (
        <Text marginTop={3} width="100%" color="critical1">
          {error}
        </Text>
      )}
    </>
  );
};
