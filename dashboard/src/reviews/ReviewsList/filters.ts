// @ts-strict-ignore
import { FilterElement } from "@dashboard/components/Filter/types";
import {
  createFilterTabUtils,
  getSingleValueQueryParam,
} from "@dashboard/utils/filters";

import {
  ReviewListUrlFilters,
  ReviewListUrlFiltersEnum,
} from "./types";

const REVIEW_FILTERS_KEY = "reviewFilters";

export function getFilterQueryParam(
  filter: FilterElement<string>,
): ReviewListUrlFilters {
  const { name } = filter;

  switch (name) {
    case "status":
    case "rating":
      return getSingleValueQueryParam(filter, name as ReviewListUrlFiltersEnum);
    default:
      return {};
  }
}

export const storageUtils = createFilterTabUtils<string>(REVIEW_FILTERS_KEY);

