// @ts-strict-ignore
import { cn } from "@dashboard/utils/cn";
import { toggle } from "@dashboard/utils/lists";

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
          <label className="inline-flex items-center gap-0 cursor-pointer">
            {filter.multiple ? (
              <Checkbox
                data-test-id={"filter-option-" + option.value}
                checked={filter.value.includes(option.value)}
                onChange={() => handleSelect(option.value)}
              />
            ) : (
              <span className="inline-flex items-center justify-center w-[42px] h-[42px]">
                <input
                  type="radio"
                  data-test-id={"filter-option-" + option.value}
                  checked={filter.value[0] === option.value}
                  onChange={() => handleSelect(option.value)}
                  name={filter.name}
                  className="w-[18px] h-[18px] accent-[var(--mu-colors-background-interactiveNeutralDefault)] cursor-pointer"
                />
              </span>
            )}
            <span>{option.label}</span>
          </label>
        </div>
      ))}
    </div>
  );
};

FilterOptionField.displayName = "FilterOptionField";
export default FilterOptionField;
