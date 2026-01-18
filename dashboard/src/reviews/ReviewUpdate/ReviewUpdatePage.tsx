import { DetailPageLayout } from "@dashboard/components/Layouts";
import { Savebar } from "@dashboard/components/Savebar";
import useNavigator from "@dashboard/hooks/useNavigator";
import { useIntl } from "react-intl";
import { WindowTitle } from "@dashboard/components/WindowTitle";
import { sectionNames, buttonMessages } from "@dashboard/intl";

import { reviewsListPath } from "../urls";
import ReviewUpdatePageHeader from "./ReviewUpdatePageHeader";
import ReviewUpdateDetailsCard from "./ReviewUpdateDetailsCard";
import ReviewUpdateInfoCard from "./ReviewUpdateInfoCard";
import { ReviewUpdatePageUrlQueryParams } from "./types";
import { ReviewDetailsProvider, useReviewDetails } from "./providers/ReviewDetailsProvider";
import ReviewUpdateDialogsProvider, { useReviewUpdateDialogs } from "./providers/ReviewUpdateDialogsProvider/ReviewUpdateDialogsProvider";

interface ReviewUpdatePageProps {
  id: string;
  params: ReviewUpdatePageUrlQueryParams;
}

const ReviewUpdatePageContent = ({ id }: { id: string }) => {
  const intl = useIntl();
  const navigate = useNavigator();
  const { review, loading } = useReviewDetails(id);
  const { openDeleteDialog, openEditDialog } = useReviewUpdateDialogs();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.reviews)} />
      <ReviewUpdatePageHeader review={review} loading={loading} />
      <DetailPageLayout.Content>
        <ReviewUpdateDetailsCard review={review} loading={loading} />
      </DetailPageLayout.Content>
      <DetailPageLayout.RightSidebar>
        <ReviewUpdateInfoCard review={review} loading={loading} />
      </DetailPageLayout.RightSidebar>

      <Savebar>
        <Savebar.DeleteButton onClick={openDeleteDialog} />
        <Savebar.Spacer />
        <Savebar.CancelButton onClick={() => navigate(reviewsListPath)} />
        <Savebar.ConfirmButton onClick={openEditDialog} disabled={loading || !review}>
          {intl.formatMessage(buttonMessages.edit)}
        </Savebar.ConfirmButton>
      </Savebar>
    </>
  );
};

const ReviewUpdatePage = ({ id, params }: ReviewUpdatePageProps) => {
  return (
    <ReviewDetailsProvider id={id}>
      <ReviewUpdateDialogsProvider id={id} params={params}>
        <DetailPageLayout>
          <ReviewUpdatePageContent id={id} />
        </DetailPageLayout>
      </ReviewUpdateDialogsProvider>
    </ReviewDetailsProvider>
  );
};

export default ReviewUpdatePage;

