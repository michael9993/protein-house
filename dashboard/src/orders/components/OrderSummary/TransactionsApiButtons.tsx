import { Button } from "@saleor/macaw-ui-next";
import { CheckIcon } from "lucide-react";
import { useIntl } from "react-intl";

type Props = {
  hasNoPayment: boolean;
  canMarkAsPaid: boolean;
  onMarkAsPaid: () => any;
  isRefetching?: boolean;
};

export const TransactionsApiButtons = ({
  hasNoPayment,
  canMarkAsPaid,
  onMarkAsPaid,
  isRefetching = false,
}: Props) => {
  const intl = useIntl();

  return (
    hasNoPayment &&
    canMarkAsPaid && (
      <Button variant="secondary" onClick={onMarkAsPaid} disabled={isRefetching}>
        <CheckIcon size={16} />
        {intl.formatMessage({
          defaultMessage: "Mark as Paid",
          id: "RsLoDB",
        })}
      </Button>
    )
  );
};
