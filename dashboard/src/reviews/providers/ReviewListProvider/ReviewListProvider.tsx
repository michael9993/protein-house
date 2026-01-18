import { ApolloError } from "@apollo/client";
import { useConditionalFilterContext } from "@dashboard/components/ConditionalFilter";
import { IFilter } from "@dashboard/components/Filter/types";
import { reviewListUrl } from "@dashboard/reviews/urls";
import { UseFilterPresets, useFilterPresets } from "@dashboard/hooks/useFilterPresets";
import useListSettings, { UseListSettings } from "@dashboard/hooks/useListSettings";
import useNavigator from "@dashboard/hooks/useNavigator";
import useNotifier from "@dashboard/hooks/useNotifier";
import { usePaginationReset } from "@dashboard/hooks/usePaginationReset";
import { createPaginationState, PageInfo, PaginationState } from "@dashboard/hooks/usePaginator";
import { UseRowSelection, useRowSelection } from "@dashboard/hooks/useRowSelection";
import { ListViews, SortPage } from "@dashboard/types";
import createFilterHandlers from "@dashboard/utils/handlers/filterHandlers";
import createSortHandler from "@dashboard/utils/handlers/sortHandler";
import { mapEdgesToItems } from "@dashboard/utils/maps";
import { getSortParams } from "@dashboard/utils/sort";
import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";
import * as React from "react";

import { getFilterQueryParam, storageUtils } from "../../ReviewsList/filters";
import {
  ReviewListUrlQueryParams,
  ReviewUrlSortField,
} from "../../ReviewsList/types";
import { getSortQueryVariables } from "./sort";
import { useReviewsQuery } from "../../ReviewsList/queries";

interface ReviewListProviderProps {
  children: React.ReactNode;
  params: ReviewListUrlQueryParams;
}

export interface ReviewListConsumerProps
  extends UseFilterPresets,
    UseRowSelection,
    UseListSettings,
    SortPage<ReviewUrlSortField> {
  reviews: any[];
  pageInfo?: PageInfo;
  loading: boolean;
  params: ReviewListUrlQueryParams;
  paginationState: PaginationState;
  totalCount: number;
  changeFilters: (filter: IFilter<any>) => void;
  resetFilters: () => void;
  handleSearchChange: (query: string) => void;
  isFilterPresetOpen: boolean;
  setFilterPresetOpen: Dispatch<SetStateAction<boolean>>;
}

const ReviewListContext = createContext<ReviewListConsumerProps | null>(null);

export const useReviewList = () => {
  const context = useContext(ReviewListContext);

  if (!context) {
    throw new Error("You are trying to use ReviewListContext outside of its provider");
  }

  return context;
};

export const ReviewListProvider = ({ children, params }: ReviewListProviderProps) => {
  const navigate = useNavigator();
  const notify = useNotifier();
  const [isFilterPresetOpen, setFilterPresetOpen] = useState(false);
  const { clearRowSelection, ...rowSelectionUtils } = useRowSelection(params);
  const { valueProvider } = useConditionalFilterContext();

  const filterUtils = useFilterPresets({
    reset: clearRowSelection,
    params,
    getUrl: reviewListUrl,
    storageUtils,
  });
  const [changeFilters, resetFilters, handleSearchChange] = createFilterHandlers({
    createUrl: reviewListUrl,
    getFilterQueryParam,
    navigate,
    params,
    cleanupFn: clearRowSelection,
    keepActiveTab: true,
  });
  const { updateListSettings, settings } = useListSettings(
    ListViews.REVIEW_LIST,
  );

  usePaginationReset(reviewListUrl, params, settings.rowNumber);

  const paginationState = createPaginationState(settings.rowNumber, params);
  const handleSort = createSortHandler(navigate, reviewListUrl, params);

  const { data, loading } = useReviewsQuery({
    variables: {
      first: settings?.rowNumber || 20,
      after: params?.after,
      filter: {
        status: params?.status,
        rating: params?.rating,
        search: params?.query,
      },
    },
  });

  const reviews = mapEdgesToItems(data?.reviews) ?? [];
  const providerValues: ReviewListConsumerProps = {
    onSort: handleSort,
    sort: getSortParams(params),
    reviews,
    totalCount: data?.reviews?.totalCount || 0,
    loading,
    clearRowSelection,
    ...rowSelectionUtils,
    ...filterUtils,
    pageInfo: data?.reviews?.pageInfo,
    paginationState,
    params,
    settings,
    updateListSettings,
    changeFilters,
    resetFilters,
    handleSearchChange,
    isFilterPresetOpen,
    setFilterPresetOpen,
  };

  return (
    <ReviewListContext.Provider value={providerValues}>
      {children}
    </ReviewListContext.Provider>
  );
};

