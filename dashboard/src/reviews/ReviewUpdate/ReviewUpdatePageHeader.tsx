import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { useBackLinkWithState } from "@dashboard/hooks/useBackLinkWithState";
import { reviewsListPath } from "../urls";
import { useIntl } from "react-intl";

import { reviewUpdatePageMessages as messages } from "./messages";

interface ReviewUpdatePageHeaderProps {
  review?: any;
  loading: boolean;
}

const ReviewUpdatePageHeader = ({ review, loading }: ReviewUpdatePageHeaderProps) => {
  const intl = useIntl();
  const backLink = useBackLinkWithState({
    path: reviewsListPath,
  });

  if (loading) {
    return <TopNav href={backLink} title={intl.formatMessage(messages.loading)} />;
  }

  // Extract review ID from global ID format (e.g., "UHJvZHVjdFJldmlldzox" -> "1")
  const getReviewId = (globalId: string) => {
    try {
      // Global ID is base64 encoded, format is usually "ProductReview:1"
      const decoded = atob(globalId);
      return decoded.split(":")[1] || globalId;
    } catch {
      return globalId;
    }
  };

  return (
    <TopNav
      href={backLink}
      title={intl.formatMessage(messages.reviewDetails, {
        id: review?.id ? getReviewId(review.id) : "?",
      })}
    />
  );
};

export default ReviewUpdatePageHeader;

