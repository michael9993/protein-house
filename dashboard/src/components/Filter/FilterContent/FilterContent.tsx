// @ts-strict-ignore
import CollectionWithDividers from "@dashboard/components/CollectionWithDividers";
import useStateFromProps from "@dashboard/hooks/useStateFromProps";
import { Paper } from "@mui/material";
import { Accordion, AccordionSummary } from "@saleor/macaw-ui";
import { Text } from "@saleor/macaw-ui-next";
import { useState } from "react";

import { FilterAutocompleteDisplayValues } from "../FilterAutocompleteField";
import { FilterReducerAction } from "../reducer";
import { FieldType, FilterElement, FilterErrorMessages, IFilter, InvalidFilters } from "../types";
import { FilterContentBody, FilterContentBodyProps } from "./FilterContentBody";
import { FilterContentBodyNameField } from "./FilterContentBodyNameField";
import { FilterContentHeader } from "./FilterContentHeader";
import { FilterErrorsList } from "./FilterErrorsList";

const expanderSx = {
  boxShadow: "none",
  margin: 0,
  padding: 0,
  "&:before": { content: "none" },
  "&.Mui-expanded": { margin: 0, border: "none" },
} as const;

const summarySx = {
  width: "100%",
  border: "none",
  margin: 0,
  padding: 0,
  minHeight: 0,
  paddingRight: 2,
  "&.Mui-expanded": { minHeight: 0 },
} as const;

interface FilterContentProps<K extends string = string> {
  filters: IFilter<K>;
  onFilterPropertyChange: <T extends FieldType>(value: FilterReducerAction<K, T>) => void;
  onFilterAttributeFocus?: (id?: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  currencySymbol?: string;
  dataStructure: IFilter<K>;
  errors?: InvalidFilters<K>;
  errorMessages?: FilterErrorMessages<K>;
}

export const FilterContent = ({
  currencySymbol,
  errors,
  errorMessages,
  filters,
  onClear,
  onFilterPropertyChange,
  onFilterAttributeFocus,
  onSubmit,
  dataStructure,
}: FilterContentProps) => {
  const [openedFilter, setOpenedFilter] = useState<FilterElement<string>>();
  const getAutocompleteValuesWithNewValues = (
    autocompleteDisplayValues: FilterAutocompleteDisplayValues,
    filterField: FilterElement<string>,
  ) => {
    if (filterField.type === FieldType.autocomplete) {
      return {
        ...autocompleteDisplayValues,
        [filterField.name]: filterField.options,
      };
    }

    return autocompleteDisplayValues;
  };
  const initialAutocompleteDisplayValues = filters.reduce((acc, filterField) => {
    if (filterField.multipleFields) {
      return filterField.multipleFields.reduce(getAutocompleteValuesWithNewValues, acc);
    }

    return getAutocompleteValuesWithNewValues(acc, filterField);
  }, {});
  const [autocompleteDisplayValues, setAutocompleteDisplayValues] =
    useStateFromProps<FilterAutocompleteDisplayValues>(initialAutocompleteDisplayValues);
  const commonFilterBodyProps: Omit<
    FilterContentBodyProps<string>,
    "filter" | "onFilterPropertyChange"
  > = {
    currencySymbol,
    autocompleteDisplayValues,
    setAutocompleteDisplayValues,
    initialAutocompleteDisplayValues,
  };
  const handleFilterAttributeFocus = (filter?: FilterElement<string>) => {
    setOpenedFilter(filter);

    if (onFilterAttributeFocus) {
      onFilterAttributeFocus(filter?.id);
    }
  };
  const handleFilterOpen = (filter: FilterElement<string>) => {
    if (filter.name !== openedFilter?.name) {
      handleFilterAttributeFocus(filter);
    } else {
      handleFilterAttributeFocus(undefined);
    }
  };
  const handleFilterPropertyGroupChange = function <K extends string, T extends FieldType>(
    action: FilterReducerAction<K, T>,
    filter: FilterElement<string>,
  ) {
    const switchToActive = action.payload.update.active;

    if (switchToActive && filter.name !== openedFilter?.name) {
      handleFilterAttributeFocus(filter);
    } else if (!switchToActive && filter.name === openedFilter?.name) {
      handleFilterAttributeFocus(undefined);
    }

    if (!switchToActive) {
      action.payload.update.value = [];
    }

    onFilterPropertyChange(action);
  };
  const handleMultipleFieldPropertyChange = function <K extends string, T extends FieldType>(
    action: FilterReducerAction<K, T>,
  ) {
    const { update } = action.payload;

    onFilterPropertyChange({
      ...action,
      payload: { ...action.payload, update: { ...update, active: true } },
    });
  };
  const getFilterFromCurrentData = function <T extends string>(filter: FilterElement<T>) {
    return filters.find(({ name }) => filter.name === name);
  };

  return (
    <Paper elevation={8}>
      <form
        onSubmit={event => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <FilterContentHeader onClear={onClear} />

        {dataStructure
          .sort((a, b) => (a.name > b.name ? 1 : -1))
          .map(filter => {
            const currentFilter = getFilterFromCurrentData(filter);

            return (
              <Accordion
                key={filter.name}
                sx={expanderSx}
                data-test-id={"channel-availability-item-" + filter.name}
                expanded={filter.name === openedFilter?.name}
              >
                <AccordionSummary
                  IconButtonProps={{
                    className: "mr-2",
                    disableRipple: true,
                  }}
                  sx={summarySx}
                  onClick={() => handleFilterOpen(filter)}
                >
                  {currentFilter && (
                    <FilterContentBodyNameField
                      filter={currentFilter}
                      onFilterPropertyChange={action =>
                        handleFilterPropertyGroupChange(action, filter)
                      }
                    />
                  )}
                </AccordionSummary>
                {currentFilter?.active && (
                  <FilterErrorsList
                    errors={errors?.[filter.name]}
                    errorMessages={errorMessages}
                    filter={filter}
                  />
                )}
                {filter.multipleFields ? (
                  <CollectionWithDividers
                    collection={filter.multipleFields}
                    renderItem={filterField => (
                      <FilterContentBody
                        {...commonFilterBodyProps}
                        onFilterPropertyChange={handleMultipleFieldPropertyChange}
                        filter={{
                          ...getFilterFromCurrentData(filterField),
                          active: currentFilter?.active,
                        }}
                      >
                        <Text>{filterField.label}</Text>
                      </FilterContentBody>
                    )}
                  />
                ) : (
                  <FilterContentBody
                    {...commonFilterBodyProps}
                    onFilterPropertyChange={onFilterPropertyChange}
                    filter={currentFilter}
                  />
                )}
              </Accordion>
            );
          })}
      </form>
    </Paper>
  );
};

FilterContent.displayName = "FilterContent";
