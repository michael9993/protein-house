import { useCallback } from "react";
import Datagrid, { GetCellContentOpts } from "@dashboard/components/Datagrid/Datagrid";
import {
  DatagridChangeStateContext,
  useDatagridChangeState,
} from "@dashboard/components/Datagrid/hooks/useDatagridChange";
import {
  createGetCellContent,
  reviewsListStaticColumns,
  Review,
} from "./datagrid";
import { ReviewListUrlQueryParams } from "./types";
import { useReviewList } from "../providers/ReviewListProvider";
import { reviewUrl } from "../urls";
import { useIntl } from "react-intl";
import { messages } from "./messages";
import { Item } from "@glideapps/glide-data-grid";
import useNavigator from "@dashboard/hooks/useNavigator";
import { getPrevLocationState } from "@dashboard/hooks/useBackLinkWithState";
import { useLocation } from "react-router";

interface ReviewsListProps {
  params: ReviewListUrlQueryParams;
}

export const ReviewsList = ({ params }: ReviewsListProps) => {
  const intl = useIntl();
  const navigate = useNavigator();
  const location = useLocation();
  const datagridState = useDatagridChangeState();
  const { reviews: reviewsData, loading, settings } = useReviewList();

  const reviews: Review[] = reviewsData || [];
  const columns = reviewsListStaticColumns(intl);

  const getCellContent = useCallback(
    createGetCellContent({
      reviews,
      columns,
    }),
    [reviews, columns],
  );

  const handleRowClick = useCallback(
    ([_, row]: Item) => {
      const review: Review | undefined = reviews[row];

      if (review) {
        navigate(reviewUrl(review.id), {
          state: getPrevLocationState(location),
        });
      }
    },
    [reviews, navigate, location],
  );

  const handleRowAnchor = useCallback(
    ([, row]: Item) => reviewUrl(reviews[row]?.id),
    [reviews],
  );

  const getCellError = useCallback(
    (_item: Item, _opts?: GetCellContentOpts) => false,
    [],
  );

  return (
    <DatagridChangeStateContext.Provider value={datagridState}>
      <Datagrid
        readonly
        loading={loading}
        rowMarkers="none"
        columnSelect="single"
        hasRowHover={true}
        verticalBorder={false}
        rows={reviews.length}
        availableColumns={columns}
        emptyText={intl.formatMessage(messages.noReviewsFound)}
        getCellContent={getCellContent}
        getCellError={getCellError}
        selectionActions={() => null}
        menuItems={() => []}
        onRowClick={handleRowClick}
        rowAnchor={handleRowAnchor}
        navigatorOpts={{ state: getPrevLocationState(location) }}
      />
    </DatagridChangeStateContext.Provider>
  );
};

