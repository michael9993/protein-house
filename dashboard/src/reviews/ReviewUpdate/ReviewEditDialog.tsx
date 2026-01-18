import { DashboardModal } from "@dashboard/components/Modal";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import { TextField } from "@material-ui/core";
import { useMutation } from "@apollo/client";
import { useIntl } from "react-intl";
import { buttonMessages } from "@dashboard/intl";
import { productReviewUpdate } from "./mutations";
import { reviews } from "../ReviewsList/queries";
import { reviewUpdatePageMessages as messages } from "./messages";
import { useReviewDetails } from "./providers/ReviewDetailsProvider";
import useNotifier from "@dashboard/hooks/useNotifier";
import { commonMessages } from "@dashboard/intl";
import { useState, useEffect } from "react";

interface ReviewEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ReviewEditDialog = ({ open, onClose, onSuccess }: ReviewEditDialogProps) => {
  const intl = useIntl();
  const notify = useNotifier();
  const { review, refetch } = useReviewDetails();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number>(5);

  useEffect(() => {
    if (review) {
      setTitle(review.title || "");
      setBody(review.body || "");
      setRating(review.rating || 5);
    }
  }, [review]);

  const [updateReview, { loading: updateLoading }] = useMutation(productReviewUpdate, {
    refetchQueries: [{ query: reviews }],
    onCompleted: data => {
      const errors = data.productReviewUpdate?.errors || [];
      const productErrors = data.productReviewUpdate?.productErrors || [];
      const allErrors = [...errors, ...productErrors];

      if (allErrors.length > 0) {
        const errorMessage = allErrors[0]?.message || intl.formatMessage(commonMessages.somethingWentWrong);
        notify({
          status: "error",
          text: errorMessage,
        });
      } else {
        notify({
          status: "success",
          text: intl.formatMessage(messages.updateSuccess),
        });
        refetch();
        onSuccess?.();
        onClose();
      }
    },
    onError: error => {
      // Log full error details for debugging
      console.error("Update review error:", {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        extraInfo: error.extraInfo,
      });
      
      // Log network error details if available
      if (error.networkError) {
        console.error("Network error details:", {
          statusCode: (error.networkError as any)?.statusCode,
          result: (error.networkError as any)?.result,
          response: (error.networkError as any)?.response,
        });
      }
      
      // Extract the most specific error message
      let errorMessage = intl.formatMessage(commonMessages.somethingWentWrong);
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        // Use the first GraphQL error message
        errorMessage = error.graphQLErrors[0].message || errorMessage;
      } else if (error.networkError) {
        // Try to extract error from network error result
        const networkError = error.networkError as any;
        if (networkError?.result?.errors && networkError.result.errors.length > 0) {
          errorMessage = networkError.result.errors[0].message || errorMessage;
        } else {
          errorMessage = networkError.message || error.message || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      notify({
        status: "error",
        text: errorMessage,
      });
    },
  });

  const handleSave = () => {
    if (!review?.id) return;

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    // Build input object - GraphQL uses camelCase (reviewId, not review_id)
    // Only include fields that are being updated (rating is always sent as it's required for validation)
    const input: {
      reviewId: string;
      rating: number;
      title?: string;
      body?: string;
    } = {
      reviewId: review.id,
      rating: rating,
    };

    // Only include optional fields if they have values (avoid sending empty strings)
    if (trimmedTitle) {
      input.title = trimmedTitle;
    }
    if (trimmedBody) {
      input.body = trimmedBody;
    }

    // Log mutation variables in dev mode for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("Sending mutation with input:", JSON.stringify(input, null, 2));
    }

    updateReview({
      variables: {
        input,
      },
    });
  };

  if (!review) {
    return null;
  }

  return (
    <DashboardModal open={open} onChange={onClose}>
      <DashboardModal.Content size="md">
        <DashboardModal.Header>
          {intl.formatMessage(messages.editDialogTitle)}
        </DashboardModal.Header>
        <Box display="flex" flexDirection="column" gap={4}>
          <Box>
            <TextField
              fullWidth
              label={intl.formatMessage(messages.title)}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </Box>
          <Box>
            <Text size={2} fontWeight="light" color="default2" marginBottom={1}>
              {intl.formatMessage(messages.rating)}
            </Text>
            <Box display="flex" gap={1}>
              {[1, 2, 3, 4, 5].map(num => (
                <Button
                  key={num}
                  variant={rating >= num ? "primary" : "secondary"}
                  size="small"
                  onClick={() => setRating(num)}
                  style={{ minWidth: "40px" }}
                >
                  {num}
                </Button>
              ))}
            </Box>
          </Box>
          <Box>
            <TextField
              fullWidth
              label={intl.formatMessage(messages.body)}
              value={body}
              onChange={e => setBody(e.target.value)}
              multiline
              rows={6}
            />
          </Box>
        </Box>
        <DashboardModal.Actions>
          <Button variant="secondary" onClick={onClose}>
            {intl.formatMessage(buttonMessages.cancel)}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={updateLoading || !title.trim() || !body.trim()}
          >
            {intl.formatMessage(buttonMessages.save)}
          </Button>
        </DashboardModal.Actions>
      </DashboardModal.Content>
    </DashboardModal>
  );
};

export default ReviewEditDialog;

