import { ConditionalFilterContext } from "@dashboard/components/ConditionalFilter/context/context";
import { Route } from "@dashboard/components/Router";
import { WindowTitle } from "@dashboard/components/WindowTitle";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { RouteComponentProps, Switch } from "react-router-dom";
import { useUrlValueProvider } from "@dashboard/components/ConditionalFilter/ValueProvider/useUrlValueProvider";
import { useContainerState } from "@dashboard/components/ConditionalFilter/useContainerState";
import { useFilterWindow } from "@dashboard/components/ConditionalFilter/useFilterWindow";
import { useFilterLeftOperandsProvider } from "@dashboard/components/ConditionalFilter/useFilterLeftOperands";
import { QUERY_API_TYPES } from "@dashboard/components/ConditionalFilter/queryVariables";

import { ReviewListPage } from "./ReviewsList/ReviewListPage";
import { ReviewListUrlQueryParams, ReviewUrlSortField } from "./ReviewsList/types";
import { reviewsListPath, reviewPath } from "./urls";
import ReviewUpdate from "./ReviewUpdate";
import { ReviewUpdatePageUrlQueryParams } from "./ReviewUpdate/types";

const ReviewList = () => {
  const qs = parseQs(location.search.substr(1)) as any;
  const params: ReviewListUrlQueryParams = asSortParams(
    qs,
    ReviewUrlSortField,
    ReviewUrlSortField.created,
  );

  // Create a minimal conditional filter context for reviews
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
        queryApiType: QUERY_API_TYPES.PRODUCT, // Using PRODUCT as fallback
      }}
    >
      <ReviewListPage params={params} />
    </ConditionalFilterContext.Provider>
  );
};

const ReviewUpdatePage = ({ match }: RouteComponentProps<{ id: string }>) => {
  const qs = parseQs(location.search.substr(1));
  const params: ReviewUpdatePageUrlQueryParams = qs;

  return <ReviewUpdate id={decodeURIComponent(match.params.id)} params={params} />;
};

const Component = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.reviews)} />
      <Switch>
        <Route exact path={reviewsListPath} component={ReviewList} />
        <Route path={reviewPath(":id")} component={ReviewUpdatePage} />
      </Switch>
    </>
  );
};

export default Component;

