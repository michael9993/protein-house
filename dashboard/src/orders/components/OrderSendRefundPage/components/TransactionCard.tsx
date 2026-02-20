// @ts-strict-ignore
import { ConfirmButton } from "@dashboard/components/ConfirmButton";
import PriceField from "@dashboard/components/PriceField";
import {
  OrderDetailsFragment,
  TransactionActionEnum,
  TransactionItemFragment,
} from "@dashboard/graphql";
import { useId } from "@reach/auto-id";
import { Button, Text } from "@saleor/macaw-ui-next";
import * as React from "react";
import { FormattedMessage, useIntl } from "react-intl";

import OrderTransaction from "../../OrderTransaction";
import { refundPageMessages } from "../messages";
import { useOrderSendRefund } from "./useOrderSendRefund";

interface TransactionCardProps {
  transaction: TransactionItemFragment;
  orderId: OrderDetailsFragment["id"];
  totalRemainingGrant: OrderDetailsFragment["totalRemainingGrant"];
}

export const TransactionCard = ({
  transaction,
  orderId,
  totalRemainingGrant,
}: TransactionCardProps) => {
  const intl = useIntl();
  const id = useId();

  const [value, setValue] = React.useState<number | undefined>();

  const { data, error, loading, status, sendRefund } = useOrderSendRefund({
    transactionId: transaction.id,
    orderId,
    amount: value,
  });

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault();

    if (typeof value === "number" && transaction?.id) {
      await sendRefund();
    }
  };
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const value = parseFloat(e.target.value);

    if (!Number.isNaN(value)) {
      setValue(value);
    } else {
      setValue(undefined);
    }
  };
  const setMaxRefundValue = () => {
    setValue(Math.min(totalRemainingGrant.amount, transaction.chargedAmount.amount));
  };
  const inputId = `refund-amount-${id}`;
  const errorId = `refund-error-${id}`;
  const submitError = error || data?.transactionRequestAction?.errors?.[0];
  const canBeRefunded = transaction.actions.includes(TransactionActionEnum.REFUND);

  return (
    <OrderTransaction
      transaction={transaction}
      onTransactionAction={() => undefined}
      showActions={false}
      disabled={!canBeRefunded}
      cardFooter={
        canBeRefunded && (
          <div className="flex flex-col p-4 items-end gap-2">
            <form className="flex gap-2 justify-end" onSubmit={handleSubmit}>
              <Button variant="tertiary" onClick={setMaxRefundValue}>
                <FormattedMessage {...refundPageMessages.setMax} />
              </Button>
              <PriceField
                id={inputId}
                aria-invalid={submitError ? "true" : "false"}
                aria-describedby={errorId}
                disabled={loading}
                className="max-w-[24rem]"
                label={intl.formatMessage(refundPageMessages.refundAmount)}
                name="amount"
                onChange={handleChange}
                value={value?.toString() ?? ""}
                currencySymbol={transaction?.authorizedAmount?.currency}
              />
              <ConfirmButton
                type="submit"
                variant="primary"
                transitionState={status}
                disabled={value <= 0 || typeof value !== "number"}
              >
                <FormattedMessage {...refundPageMessages.requestRefund} />
              </ConfirmButton>
            </form>
            {submitError && (
              <Text id={errorId} color="critical1" fontSize={3}>
                {submitError.message}
              </Text>
            )}
          </div>
        )
      }
    />
  );
};
