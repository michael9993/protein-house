import { ConditionalFilterContext } from "@dashboard/components/ConditionalFilter/context/context";
import { WindowTitle } from "@dashboard/components/WindowTitle";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useParams, useLocation } from "react-router";
import { useUrlValueProvider } from "@dashboard/components/ConditionalFilter/ValueProvider/useUrlValueProvider";
import { useContainerState } from "@dashboard/components/ConditionalFilter/useContainerState";
import { useFilterWindow } from "@dashboard/components/ConditionalFilter/useFilterWindow";
import { useFilterLeftOperandsProvider } from "@dashboard/components/ConditionalFilter/useFilterLeftOperands";
import { QUERY_API_TYPES } from "@dashboard/components/ConditionalFilter/queryVariables";

import { ReviewListPage } from "./ReviewsList/ReviewListPage";
import { ReviewListUrlQueryParams, ReviewUrlSortField } from "./ReviewsList/types";
import ReviewUpdate from "./ReviewUpdate";
import { ReviewUpdatePageUrlQueryParams } from "./ReviewUpdate/types";

const ReviewList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: ReviewListUrlQueryParams = asSortParams(
    qs,
    ReviewUrlSortField,
    ReviewUrlSortField.created,
  );

  const valueProvider = useUrlValueProvider(location.search, "reviews", []);
  const leftOperandsProvider = useFilterLeftOperandsProvider([]);
  const containerState = useContainerState(valueProvider);
  const filterWindow = useFilterWindow();

  return (
    <ConditionalFilterContext.Provider
      value={{
        apiProvider: {
          fetchLeftOperands: async () => [],
          fetchRightOperands: async () => [],
        },
        valueProvider,
        leftOperandsProvider,
        containerState,
        filterWindow,
        queryApiType: QUERY_API_TYPES.PRODUCT,
      }}
    >
      <ReviewListPage params={params} />
    </ConditionalFilterContext.Provider>
  );
};

const ReviewUpdatePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: ReviewUpdatePageUrlQueryParams = qs;

  return <ReviewUpdate id={decodeURIComponent(id ?? "")} params={params} />;
};

const Component = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.reviews)} />
      <Routes>
        <Route index element={<ReviewList />} />
        <Route path=":id" element={<ReviewUpdatePage />} />
      </Routes>
    </>
  );
};

export default Component;
