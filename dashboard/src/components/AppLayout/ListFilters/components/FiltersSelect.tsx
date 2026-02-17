// @ts-strict-ignore
import { FilterContent } from "@dashboard/components/Filter/FilterContent/FilterContent";
import {
  FilterElement,
  FilterErrorMessages,
  IFilter,
  InvalidFilters,
} from "@dashboard/components/Filter/types";
import useFilter from "@dashboard/components/Filter/useFilter";
import { extractInvalidFilters } from "@dashboard/components/Filter/utils";
import { useClickOutside } from "@dashboard/hooks/useClickOutside";
import { DropdownButton } from "@saleor/macaw-ui-next";
import { useCallback, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";

import { getSelectedFilterAmount } from "../utils";

interface FilterProps<TFilterKeys extends string = string> {
  currencySymbol?: string;
  errorMessages?: FilterErrorMessages<TFilterKeys>;
  menu: IFilter<TFilterKeys>;
  onFilterAdd: (filter: Array<FilterElement<TFilterKeys>>) => void;
  onFilterAttributeFocus?: (id?: string) => void;
}

export const FiltersSelect = <TFilterKeys extends string = string>({
  currencySymbol,
  menu,
  onFilterAdd,
  onFilterAttributeFocus,
  errorMessages,
}: FilterProps<TFilterKeys>) => {
  const anchor = useRef<HTMLDivElement>(null);
  const [isFilterMenuOpened, setFilterMenuOpened] = useState(false);
  const [filterErrors, setFilterErrors] = useState<InvalidFilters<string>>({});
  const [data, dispatch, reset] = useFilter(menu);
  const isFilterActive = menu.some(filterElement => filterElement.active);
  const selectedFilterAmount = useMemo(() => getSelectedFilterAmount(menu, data), [data, menu]);

  const handleClickAway = useCallback((event: MouseEvent) => {
    if ((event.target as HTMLElement).getAttribute("role") !== "option") {
      setFilterMenuOpened(false);
    }
  }, []);

  useClickOutside([anchor], handleClickAway, "mouseup");

  const handleSubmit = () => {
    const invalidFilters = extractInvalidFilters(data, menu);

    if (Object.keys(invalidFilters).length > 0) {
      setFilterErrors(invalidFilters);

      return;
    }

    setFilterErrors({});
    onFilterAdd(data);
    setFilterMenuOpened(false);
  };
  const handleClear = () => {
    reset();
    setFilterErrors({});
  };

  return (
    <div ref={anchor} className="relative">
      <DropdownButton
        data-test-id="show-filters-button"
        onClick={() => setFilterMenuOpened(!isFilterMenuOpened)}
      >
        <FormattedMessage id="FNpv6K" defaultMessage="Filters" description="button" />
        {isFilterActive && selectedFilterAmount > 0 && <>({selectedFilterAmount})</>}
      </DropdownButton>
      {isFilterMenuOpened && (
        <div
          className="absolute left-0 top-full bg-[var(--mu-colors-background-default1)] overflow-y-scroll shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-[3]"
          style={{ width: "376px", maxHeight: "450px" }}
        >
          <FilterContent
            errorMessages={errorMessages}
            errors={filterErrors}
            dataStructure={menu}
            currencySymbol={currencySymbol}
            filters={data}
            onClear={handleClear}
            onFilterPropertyChange={dispatch}
            onFilterAttributeFocus={onFilterAttributeFocus}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </div>
  );
};

FiltersSelect.displayName = "Filter";
