// @ts-strict-ignore
import PriceField from "@dashboard/components/PriceField";
import { OrderErrorFragment } from "@dashboard/graphql";
import { getFormErrors } from "@dashboard/utils/errors";
import getOrderErrorMessage from "@dashboard/utils/errors/order";
import { IMoney } from "@dashboard/utils/intl";
import * as React from "react";
import { defineMessages, useIntl } from "react-intl";

import { OrderRefundFormData } from "../../../OrderRefundPage/form";

interface RefundAmountInputProps {
  data: OrderRefundFormData;
  maxRefund: IMoney;
  currencySymbol: string;
  amountTooSmall: boolean;
  amountTooBig: boolean;
  disabled: boolean;
  errors: OrderErrorFragment[];
  onChange: (event: React.ChangeEvent<any>) => void;
}

const messages = defineMessages({
  amountTooBig: {
    id: "fbH51z",
    defaultMessage: "Amount cannot be bigger than max refund",
    description: "Amount error message",
  },
  amountTooSmall: {
    id: "IKvOK+",
    defaultMessage: "Amount must be bigger than 0",
    description: "Amount error message",
  },
  label: {
    id: "lrq8O6",
    defaultMessage: "Amount",
    description: "order refund amount, input label",
  },
});
const RefundAmountInput = (props: RefundAmountInputProps) => {
  const {
    data,
    maxRefund,
    amountTooSmall,
    amountTooBig,
    currencySymbol,
    disabled,
    errors,
    onChange,
  } = props;
  const intl = useIntl();
  const formErrors = getFormErrors(["amount"], errors);
  const isError = !!formErrors.amount || amountTooSmall || amountTooBig;

  return (
    <PriceField
      disabled={disabled}
      onChange={onChange}
      currencySymbol={currencySymbol}
      name={"amount" as keyof FormData}
      value={data.amount}
      label={intl.formatMessage(messages.label)}
      className="mt-4"
      max={maxRefund?.amount}
      data-test-id="amountInput"
      error={isError}
      hint={
        getOrderErrorMessage(formErrors.amount, intl) ||
        (amountTooSmall && intl.formatMessage(messages.amountTooSmall)) ||
        (amountTooBig && intl.formatMessage(messages.amountTooBig))
      }
    />
  );
};

export default RefundAmountInput;
