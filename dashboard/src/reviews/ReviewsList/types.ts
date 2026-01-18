import {
  ActiveTab,
  Dialog,
  Filters,
  Pagination,
  Search,
  SingleAction,
  Sort,
} from "@dashboard/types";

export enum ReviewUrlSortField {
  created = "created_at",
  rating = "rating",
  helpful = "helpful_count",
}

export enum ReviewListActionParamsEnum {
  DELETE = "review-delete",
  SAVE_SEARCH = "save-search",
  DELETE_SEARCH = "delete-search",
}

type ReviewUrlSort = Sort<ReviewUrlSortField>;

export enum ReviewListUrlFiltersEnum {
  status = "status",
  rating = "rating",
}

export type ReviewListUrlQueryParams = Pagination &
  Dialog<ReviewListActionParamsEnum> &
  SingleAction &
  Filters<ReviewListUrlFiltersEnum> &
  ReviewUrlSort &
  ActiveTab &
  Search & {
    status?: string;
    rating?: number;
  };

