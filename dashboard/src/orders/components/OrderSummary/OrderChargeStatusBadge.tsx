import { Pill } from "@dashboard/components/Pill";
import { OrderChargeStatusEnum } from "@dashboard/graphql";
import { BanknoteIcon, RotateCcwIcon } from "lucide-react";
import { useIntl } from "react-intl";

interface OrderChargeStatusBadgeProps {
  status: OrderChargeStatusEnum;
}

export const OrderChargeStatusBadge = ({ status }: OrderChargeStatusBadgeProps) => {
  const intl = useIntl();

  switch (status) {
    case OrderChargeStatusEnum.FULL:
      return (
        <Pill
          color="success"
          icon={<BanknoteIcon size={16} />}
          label={intl.formatMessage({
            defaultMessage: "Fully paid",
            id: "Ynjq+C",
          })}
        />
      );

    case OrderChargeStatusEnum.OVERCHARGED:
      return (
        <Pill
          color="attention"
          label={intl.formatMessage({
            defaultMessage: "Overcharged",
            id: "8Cjxdt",
          })}
        />
      );

    case OrderChargeStatusEnum.REFUNDED:
      return (
        <Pill
          color="neutral"
          icon={<RotateCcwIcon size={16} />}
          label={intl.formatMessage({
            defaultMessage: "Refunded",
            id: "refunded-status",
          })}
        />
      );

    case OrderChargeStatusEnum.PARTIALLY_REFUNDED:
      return (
        <Pill
          color="attention"
          icon={<RotateCcwIcon size={16} />}
          label={intl.formatMessage({
            defaultMessage: "Partially refunded",
            id: "partially-refunded-status",
          })}
        />
      );

    case OrderChargeStatusEnum.PARTIAL:
      return (
        <Pill
          color="attention"
          label={intl.formatMessage({
            defaultMessage: "Partially paid",
            id: "partially-paid-status",
          })}
        />
      );

    case OrderChargeStatusEnum.NONE:
      return (
        <Pill
          color="neutral"
          label={intl.formatMessage({
            defaultMessage: "Unpaid",
            id: "X9tptP",
          })}
        />
      );

    default:
      return null;
  }
};
