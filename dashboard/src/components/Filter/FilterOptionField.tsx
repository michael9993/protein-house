// @ts-strict-ignore
import { cn } from "@dashboard/utils/cn";
import { toggle } from "@dashboard/utils/lists";
import { FormControlLabel, Radio } from "@mui/material";

import Checkbox from "../Checkbox";
import { FieldType, FilterFieldBaseProps } from "./types";

const FilterOptionField = ({
  filter,
  onFilterPropertyChange,
  ...rest
}: FilterFieldBaseProps<string, FieldType.options>) => {
  const handleSelect = (value: string) =>
    onFilterPropertyChange({
      payload: {
        name: filter.name,
        update: {
          active: true,
          value: filter.multiple ? toggle(value, filter.value, (a, b) => a === b) : [value],
        },
      },
      type: "set-property",
    });

  return (
    <div {...rest}>
      {filter.options.map(option => (
        <div
          className={cn("relative -left-1", !filter.multiple && "-left-[2px]")}
          key={option.value}
        >
          <FormControlLabel
            control={
              filter.multiple ? (
                <Checkbox
                  data-test-id={"filter-option-" + option.value}
                  checked={filter.value.includes(option.value)}
                />
              ) : (
                <Radio
                  data-test-id={"filter-option-" + option.value}
                  checked={filter.value[0] === option.value}
                  color="primary"
                />
              )
            }
            label={option.label}
            name={filter.name}
            onChange={() => handleSelect(option.value)}
          />
        </div>
      ))}
    </div>
  );
};

FilterOptionField.displayName = "FilterOptionField";
export default FilterOptionField;
