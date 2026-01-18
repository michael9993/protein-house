import CardSpacer from "@dashboard/components/CardSpacer";
import { DashboardCard } from "@dashboard/components/Card";
import { Box, Skeleton, Text } from "@saleor/macaw-ui-next";
import { useIntl } from "react-intl";

import ReviewImageGallery from "./ReviewImageGallery";
import { reviewUpdatePageMessages as messages } from "./messages";

interface ReviewUpdateDetailsCardProps {
  review?: any;
  loading: boolean;
}

const ReviewUpdateDetailsCard = ({ review, loading }: ReviewUpdateDetailsCardProps) => {
  const intl = useIntl();

  if (loading) {
    return (
      <DashboardCard>
        <DashboardCard.Header>
          <DashboardCard.Title>{intl.formatMessage(messages.details)}</DashboardCard.Title>
        </DashboardCard.Header>
        <DashboardCard.Content>
          <Skeleton />
        </DashboardCard.Content>
      </DashboardCard>
    );
  }

  if (!review) {
    return (
      <DashboardCard>
        <DashboardCard.Header>
          <DashboardCard.Title>{intl.formatMessage(messages.details)}</DashboardCard.Title>
        </DashboardCard.Header>
        <DashboardCard.Content>
          <Text>{intl.formatMessage(messages.notFound)}</Text>
        </DashboardCard.Content>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>{intl.formatMessage(messages.details)}</DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content>
        <Box display="flex" flexDirection="column" gap={4}>
          <Box>
            <Text size={2} fontWeight="light" color="default2" marginBottom={2}>
              {intl.formatMessage(messages.title)}
            </Text>
            <Text marginLeft={2}>{review.title || "-"}</Text>
          </Box>

          <CardSpacer />

          <Box>
            <Text size={2} fontWeight="light" color="default2" marginBottom={2}>
              {intl.formatMessage(messages.rating)}
            </Text>
            <Text marginLeft={2}>{review.rating ? `${review.rating}/5` : "-"}</Text>
          </Box>

          <CardSpacer />

          <Box>
            <Text size={2} fontWeight="light" color="default2" marginBottom={2}>
              {intl.formatMessage(messages.body)}
            </Text>
            <Text style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} marginLeft={2}>
              {review.body || "-"}
            </Text>
          </Box>

          {review.images && review.images.length > 0 && (
            <>
              <CardSpacer />
              <Box>
                <Text size={2} fontWeight="light" color="default2" marginBottom={2}>
                  {intl.formatMessage(messages.images, { count: review.images.length })}
                </Text>
                <ReviewImageGallery images={review.images} />
              </Box>
            </>
          )}
        </Box>
      </DashboardCard.Content>
    </DashboardCard>
  );
};

export default ReviewUpdateDetailsCard;
