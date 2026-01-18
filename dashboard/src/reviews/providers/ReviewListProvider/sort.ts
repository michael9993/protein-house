import { ReviewListUrlQueryParams, ReviewUrlSortField } from "../../ReviewsList/types";

export const getSortQueryVariables = (
  params: ReviewListUrlQueryParams,
): { direction: "ASC" | "DESC"; field: ReviewUrlSortField } | null => {
  if (!params.sort) {
    return null;
  }

  return {
    direction: params.asc ? "ASC" : "DESC",
    field: params.sort,
  };
};

