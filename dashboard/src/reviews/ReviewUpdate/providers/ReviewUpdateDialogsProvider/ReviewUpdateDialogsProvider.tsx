import { DashboardModal } from "@dashboard/components/Modal";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import { useMutation } from "@apollo/client";
import { reviewsListPath, reviewUrl } from "../../../urls";
import useNavigator from "@dashboard/hooks/useNavigator";
import useNotifier from "@dashboard/hooks/useNotifier";
import { useIntl } from "react-intl";
import { buttonMessages, commonMessages } from "@dashboard/intl";
import { productReviewDelete } from "../../mutations";
import { reviews } from "../../../ReviewsList/queries";
import { useReviewDetails } from "../ReviewDetailsProvider";
import createDialogActionHandlers from "@dashboard/utils/handlers/dialogActionHandlers";
import { createContext, useContext } from "react";
import * as React from "react";
import { ReviewUpdatePageActionParamsEnum, ReviewUpdatePageUrlQueryParams } from "../../types";
import { reviewUpdatePageMessages as messages } from "../../messages";
import ReviewEditDialog from "../../ReviewEditDialog";

interface ReviewUpdateDialogsProviderProps {
  children: React.ReactNode;
  params: ReviewUpdatePageUrlQueryParams;
  id: string;
}

export interface ReviewUpdateDialogsConsumerProps {
  onClose: () => void;
  openDeleteDialog: () => void;
  openEditDialog: () => void;
}

export const ReviewUpdateDialogsContext = createContext<ReviewUpdateDialogsConsumerProps | null>(
  null,
);

export const useReviewUpdateDialogs = () => {
  const context = useContext(ReviewUpdateDialogsContext);
  if (!context) {
    throw new Error("useReviewUpdateDialogs must be used within ReviewUpdateDialogsProvider");
  }
  return context;
};

const ReviewUpdateDialogsProvider = ({
  children,
  params,
  id,
}: ReviewUpdateDialogsProviderProps) => {
  const navigate = useNavigator();
  const notify = useNotifier();
  const intl = useIntl();
  const { review } = useReviewDetails();
  const { DELETE, EDIT } = ReviewUpdatePageActionParamsEnum;
  const [openDialog, onClose] = createDialogActionHandlers<
    ReviewUpdatePageActionParamsEnum,
    ReviewUpdatePageUrlQueryParams
  >(navigate, params => reviewUrl(id, params), params);

  const [deleteReview, { loading: deleteLoading }] = useMutation(productReviewDelete, {
    refetchQueries: [{ query: reviews }],
    onCompleted: data => {
      const errors = data.productReviewDelete?.errors || [];
      const productErrors = data.productReviewDelete?.productErrors || [];
      const allErrors = [...errors, ...productErrors];

      if (allErrors.length > 0) {
        const errorMessage =
          allErrors[0]?.message || intl.formatMessage(commonMessages.somethingWentWrong);
        notify({
          status: "error",
          text: errorMessage,
        });
      } else {
        notify({
          status: "success",
          text: intl.formatMessage(messages.deleteSuccess),
        });
        navigate(reviewsListPath);
      }
    },
    onError: error => {
      const errorMessage =
        error.graphQLErrors?.[0]?.message ||
        error.message ||
        intl.formatMessage(commonMessages.somethingWentWrong);
      console.error("Delete review error:", error);
      notify({
        status: "error",
        text: errorMessage,
      });
    },
  });

  const isDialogOpen = (action: ReviewUpdatePageActionParamsEnum) => params?.action === action;

  const handleEditClose = () => {
    onClose();
  };

  const handleDelete = () => {
    if (review?.id) {
      deleteReview({
        variables: { reviewId: review.id },
      });
    }
  };

  const providerValues: ReviewUpdateDialogsConsumerProps = {
    openDeleteDialog: () => openDialog(DELETE),
    openEditDialog: () => openDialog(EDIT),
    onClose,
  };

  return (
    <ReviewUpdateDialogsContext.Provider value={providerValues}>
      {children}
      <DashboardModal open={isDialogOpen(DELETE)} onChange={onClose}>
        <DashboardModal.Content size="sm">
          <DashboardModal.Header>
            {intl.formatMessage(messages.deleteDialogTitle)}
          </DashboardModal.Header>
          <Box paddingY={2}>
            <Text>{intl.formatMessage(messages.deleteDialogMessage)}</Text>
          </Box>
          <DashboardModal.Actions>
            <Button variant="secondary" onClick={onClose}>
              {intl.formatMessage(buttonMessages.cancel)}
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              disabled={deleteLoading}
              data-test-id="confirm-delete"
            >
              {intl.formatMessage(buttonMessages.delete)}
            </Button>
          </DashboardModal.Actions>
        </DashboardModal.Content>
      </DashboardModal>
      <ReviewEditDialog
        open={isDialogOpen(EDIT)}
        onClose={handleEditClose}
        onSuccess={() => {
          // Refetch will be handled by the mutation's refetchQueries
        }}
      />
    </ReviewUpdateDialogsContext.Provider>
  );
};

export default ReviewUpdateDialogsProvider;
