import Checkbox from "@dashboard/components/Checkbox";

import { FilterElement } from "../types";
import { FilterDispatchFunction } from "../useFilter";

interface FilterContentBodyNameFieldProps<K extends string = string> {
  filter: FilterElement<K>;
  onFilterPropertyChange: FilterDispatchFunction<K>;
}

export const FilterContentBodyNameField = ({
  filter,
  onFilterPropertyChange,
}: FilterContentBodyNameFieldProps) => {
  return (
    <div className="py-2 px-5 [&:not(:last-of-type)]:border-b [&:not(:last-of-type)]:border-divider">
      <label
        className="inline-flex items-center gap-0 cursor-pointer"
        onClick={e => e.stopPropagation()}
      >
        <Checkbox
          data-test-id={"filter-group-active-" + filter.name}
          checked={filter.active}
          onChange={() => {
            onFilterPropertyChange({
              payload: {
                name: filter.name,
                update: {
                  active: !filter.active,
                },
              },
              type: "set-property",
            });
          }}
        />
        <span>{filter.label}</span>
      </label>
    </div>
  );
};
