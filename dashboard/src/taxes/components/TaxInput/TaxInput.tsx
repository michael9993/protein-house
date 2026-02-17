import { findPriceSeparator } from "@dashboard/components/PriceField/utils";
import { FormChange } from "@dashboard/hooks/useForm";
import { Input, Text } from "@saleor/macaw-ui-next";
import React from "react";

interface TaxInputProps {
  placeholder?: string;
  value: string | undefined;
  change: FormChange;
}

const TaxInput = ({ placeholder, value, change }: TaxInputProps) => {
  const handleChange: FormChange = e => {
    let value = e.target.value;
    const splitCharacter = findPriceSeparator(value);
    const [integerPart, decimalPart] = value.split(splitCharacter);

    if (decimalPart?.length > 3) {
      const shortenedDecimalPart = decimalPart.slice(0, 3);

      value = `${integerPart}${splitCharacter}${shortenedDecimalPart}`;
    }

    change({
      target: {
        name: e.target.name,
        value,
      },
    });
  };
  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = event => {
    switch (event.key.toLowerCase()) {
      case "e":
      case "-": {
        event.preventDefault();
        break;
      }
    }
  };

  return (
    <Input
      data-test-id="tax-input"
      type="number"
      size="small"
      placeholder={placeholder}
      value={value}
      startAdornment={<Text size={2} marginLeft={2}>%</Text>}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
};

export default TaxInput;
