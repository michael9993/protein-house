import { Checkbox, FormControlLabel } from "@mui/material";

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
      <FormControlLabel
        control={
          <Checkbox data-test-id={"filter-group-active-" + filter.name} checked={filter.active} />
        }
        label={filter.label}
        onClick={event => event.stopPropagation()}
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
    </div>
  );
};
