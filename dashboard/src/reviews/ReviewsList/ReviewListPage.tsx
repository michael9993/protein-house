import { WindowTitle } from "@dashboard/components/WindowTitle";
import { sectionNames } from "@dashboard/intl";
import { useIntl } from "react-intl";
import { ReviewsList } from "./ReviewsList";
import { ReviewListUrlQueryParams } from "./types";
import ReviewsListHeader from "./ReviewsListHeader";
import ReviewsListSearchAndFilters from "./ReviewsListSearchAndFilters";
import { ReviewListProvider } from "../providers/ReviewListProvider";
import { ReviewListDialogsProvider } from "../providers/ReviewListDialogsProvider";

interface ReviewListPageProps {
  params: ReviewListUrlQueryParams;
}

export const ReviewListPage = ({ params }: ReviewListPageProps) => {
  const intl = useIntl();

  return (
    <ReviewListProvider params={params}>
      <ReviewListDialogsProvider params={params}>
        <WindowTitle title={intl.formatMessage(sectionNames.reviews)} />
        <ReviewsListHeader />
        <ReviewsListSearchAndFilters />
        <ReviewsList params={params} />
      </ReviewListDialogsProvider>
    </ReviewListProvider>
  );
};

