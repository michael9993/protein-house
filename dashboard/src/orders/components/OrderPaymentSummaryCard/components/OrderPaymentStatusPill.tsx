import { Pill } from "@dashboard/components/Pill";
import { OrderChargeStatusEnum, OrderDetailsFragment } from "@dashboard/graphql";
import { transformPaymentStatus } from "@dashboard/misc";
import { useIntl } from "react-intl";

type Order = Pick<OrderDetailsFragment, "paymentStatus" | "chargeStatus">;

export interface OrderPaymentStatusPillProps {
  order: Order | undefined;
  className?: string;
}

export const OrderPaymentStatusPill = ({ order, className }: OrderPaymentStatusPillProps) => {
  const intl = useIntl();

  if (!order) {
    return null;
  }

  const payment = transformPaymentStatus(order.paymentStatus, intl);

  if (order.chargeStatus === OrderChargeStatusEnum.OVERCHARGED) {
    return (
      <Pill
        key="overcharged"
        label={intl.formatMessage({
          defaultMessage: "Overcharged",
          id: "BXKn/d",
          description: "charge status",
        })}
        color="attention"
        style={{ alignSelf: "flex-end" }}
        className={className}
      />
    );
  }

  if (order.chargeStatus === OrderChargeStatusEnum.REFUNDED) {
    return (
      <Pill
        key="refunded"
        label={intl.formatMessage({
          defaultMessage: "Refunded",
          id: "refunded-pill",
          description: "charge status",
        })}
        color="neutral"
        style={{ alignSelf: "flex-end" }}
        className={className}
      />
    );
  }

  if (order.chargeStatus === OrderChargeStatusEnum.PARTIALLY_REFUNDED) {
    return (
      <Pill
        key="partially-refunded"
        label={intl.formatMessage({
          defaultMessage: "Partially refunded",
          id: "partially-refunded-pill",
          description: "charge status",
        })}
        color="attention"
        style={{ alignSelf: "flex-end" }}
        className={className}
      />
    );
  }

  return (
    <Pill
      key={payment.status}
      label={payment.localized}
      color={payment.status}
      style={{ alignSelf: "flex-end" }}
      data-test-id="payment-status"
      className={className}
    />
  );
};
