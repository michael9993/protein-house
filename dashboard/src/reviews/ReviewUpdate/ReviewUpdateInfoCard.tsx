import CardSpacer from "@dashboard/components/CardSpacer";
import { DashboardCard } from "@dashboard/components/Card";
import Label from "@dashboard/orders/components/OrderHistory/Label";
import { Text, Skeleton } from "@saleor/macaw-ui-next";
import { useIntl } from "react-intl";

import { reviewUpdatePageMessages as messages } from "./messages";

interface ReviewUpdateInfoCardProps {
  review?: any;
  loading: boolean;
}

const ReviewUpdateInfoCard = ({ review, loading }: ReviewUpdateInfoCardProps) => {
  const intl = useIntl();

  return (
      <DashboardCard>
        <DashboardCard.Header>
          <DashboardCard.Title>{intl.formatMessage(messages.information)}</DashboardCard.Title>
        </DashboardCard.Header>
        <DashboardCard.Content>
          {loading || !review ? (
            <Skeleton />
          ) : (
            <>
              <Label text={intl.formatMessage(messages.product)} />
              <Text>{review.product?.name || "-"}</Text>
              <CardSpacer />

              <Label text={intl.formatMessage(messages.user)} />
              <Text>
                {review.user?.firstName || review.user?.lastName
                  ? `${review.user.firstName || ""} ${review.user.lastName || ""}`.trim()
                  : review.user?.email || "Guest"}
              </Text>
              <CardSpacer />

              <Label text={intl.formatMessage(messages.status)} />
              <Text>{review.status || "-"}</Text>
              <CardSpacer />

              <Label text={intl.formatMessage(messages.helpfulCount)} />
              <Text>{review.helpfulCount || 0}</Text>
              <CardSpacer />

              <Label text={intl.formatMessage(messages.verifiedPurchase)} />
              <Text>{review.isVerifiedPurchase ? "Yes" : "No"}</Text>
              <CardSpacer />

              <Label text={intl.formatMessage(messages.createdAt)} />
              <Text>
                {review.createdAt ? new Date(review.createdAt).toLocaleString() : "-"}
              </Text>
              <CardSpacer />

              <Label text={intl.formatMessage(messages.updatedAt)} />
              <Text>
                {review.updatedAt ? new Date(review.updatedAt).toLocaleString() : "-"}
              </Text>
            </>
          )}
        </DashboardCard.Content>
      </DashboardCard>
    );
  };

export default ReviewUpdateInfoCard;

