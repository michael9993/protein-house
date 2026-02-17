// @ts-strict-ignore
import { FilterDateTimeField } from "@dashboard/components/Filter/FilterContent/FilterDateTimeField";
import { FilterNumericField } from "@dashboard/components/Filter/FilterContent/FilterNumericField";
import { FilterSingleSelectField } from "@dashboard/components/Filter/FilterContent/FilterSingleSelectField";
import { commonFilterStyles } from "@dashboard/components/Filter/FilterContent/utils";
import { Input, Option, Skeleton } from "@saleor/macaw-ui-next";
import * as React from "react";

import FilterAutocompleteField, {
  FilterAutocompleteDisplayValues,
} from "../FilterAutocompleteField";
import { FilterKeyValueField } from "../FilterKeyValueField";
import FilterOptionField from "../FilterOptionField";
import { FilterReducerAction } from "../reducer";
import {
  FieldType,
  FilterElement,
  isFilterDateType,
  isFilterNumericType,
  isFilterType,
} from "../types";

const filterTestingContext = "filter-field-";

export interface FilterContentBodyProps<K extends string> {
  children?: React.ReactNode;
  filter: FilterElement<K>;
  currencySymbol?: string;
  initialAutocompleteDisplayValues: FilterAutocompleteDisplayValues;
  onFilterPropertyChange: <T extends FieldType>(value: FilterReducerAction<K, T>) => void;
  autocompleteDisplayValues: FilterAutocompleteDisplayValues;
  setAutocompleteDisplayValues: React.Dispatch<React.SetStateAction<Record<string, Option[]>>>;
}

export const FilterContentBody = <K extends string = string>({
  filter,
  children,
  currencySymbol,
  onFilterPropertyChange,
  autocompleteDisplayValues,
  setAutocompleteDisplayValues,
  initialAutocompleteDisplayValues,
}: FilterContentBodyProps<K>) => {
  if (!filter) {
    return <Skeleton />;
  }

  return (
    <div className="py-4 px-6">
      {children}
      {isFilterType(filter, FieldType.text) && (
        <Input
          size="small"
          data-test-id={filterTestingContext + filter.name}
          name={filter.name}
          className={commonFilterStyles.input}
          value={filter.value[0]}
          onChange={event =>
            onFilterPropertyChange<FieldType.text>({
              payload: {
                name: filter.name,
                update: {
                  value: [event.target.value, filter.value[1]],
                },
              },
              type: "set-property",
            })
          }
        />
      )}
      {isFilterDateType(filter) && (
        <>
          <FilterSingleSelectField
            filter={filter}
            onFilterPropertyChange={onFilterPropertyChange}
          />
          <FilterDateTimeField filter={filter} onFilterPropertyChange={onFilterPropertyChange} />
        </>
      )}
      {isFilterNumericType(filter) && (
        <>
          <FilterSingleSelectField
            filter={filter}
            onFilterPropertyChange={onFilterPropertyChange}
          />
          <FilterNumericField
            filter={filter}
            onFilterPropertyChange={onFilterPropertyChange}
            currencySymbol={currencySymbol}
          />
        </>
      )}

      {isFilterType(filter, FieldType.options) && (
        <FilterOptionField
          data-test-id={filterTestingContext + filter.name}
          filter={filter}
          onFilterPropertyChange={onFilterPropertyChange}
        />
      )}
      {isFilterType(filter, FieldType.boolean) &&
        filter.options.map(option => (
          <div className="relative -left-[3px]" key={option.value}>
            <label className="inline-flex items-center gap-0 cursor-pointer">
              <span className="inline-flex items-center justify-center w-[42px] h-[42px]">
                <input
                  type="radio"
                  data-test-id="filter-boolean"
                  data-test-is-checked={filter.value[0] === option.value}
                  checked={filter.value[0] === option.value}
                  onChange={() =>
                    onFilterPropertyChange({
                      payload: {
                        name: filter.name,
                        update: {
                          value: [option.value],
                        },
                      },
                      type: "set-property",
                    })
                  }
                  name={filter.name}
                  className="w-[18px] h-[18px] accent-[var(--mu-colors-background-interactiveNeutralDefault)] cursor-pointer"
                />
              </span>
              <span>{option.label}</span>
            </label>
          </div>
        ))}
      {isFilterType(filter, FieldType.keyValue) && (
        <FilterKeyValueField filter={filter} onFilterPropertyChange={onFilterPropertyChange} />
      )}
      {isFilterType(filter, FieldType.autocomplete) && (
        <FilterAutocompleteField
          data-test-id={filterTestingContext + filter.name}
          displayValues={autocompleteDisplayValues}
          filter={filter}
          setDisplayValues={setAutocompleteDisplayValues}
          onFilterPropertyChange={onFilterPropertyChange}
          initialDisplayValues={initialAutocompleteDisplayValues}
        />
      )}
    </div>
  );
};
