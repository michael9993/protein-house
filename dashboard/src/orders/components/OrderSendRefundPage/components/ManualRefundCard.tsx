import { DashboardCard } from "@dashboard/components/Card";
import { commonMessages } from "@dashboard/intl";
import { Text } from "@saleor/macaw-ui-next";
import { FormattedMessage, useIntl } from "react-intl";

import {
  OrderManualTransactionForm,
  OrderManualTransactionFormProps,
} from "../../OrderManualTransactionForm";
import { manualRefundMessages, refundPageMessages } from "../messages";

export const ManualRefundCard = (props: OrderManualTransactionFormProps) => {
  const intl = useIntl();

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>
          <FormattedMessage {...manualRefundMessages.refundManual} />
        </DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content>
        <Text>
          <FormattedMessage {...manualRefundMessages.refundManualDescription} />
        </Text>
      </DashboardCard.Content>
      <OrderManualTransactionForm {...props}>
        <div className="flex flex-col p-4 items-end gap-2">
          <OrderManualTransactionForm.Form className="flex gap-2 w-full flex-col items-center sm:flex-row sm:flex-wrap sm:justify-end">
            <OrderManualTransactionForm.DescriptionField
              className="w-full sm:max-w-[30rem]"
              label={intl.formatMessage(commonMessages.descriptionOptional)}
            />
            <OrderManualTransactionForm.PspReferenceField
              className="w-full sm:max-w-[25rem]"
              label={intl.formatMessage(commonMessages.pspReferenceOptional)}
            />
            <OrderManualTransactionForm.PriceInputField
              className="sm:max-w-[24rem]"
              label={intl.formatMessage(refundPageMessages.refundAmount)}
            />
            <OrderManualTransactionForm.SubmitButton className="shrink-0">
              <FormattedMessage {...manualRefundMessages.refund} />
            </OrderManualTransactionForm.SubmitButton>
          </OrderManualTransactionForm.Form>
        </div>
      </OrderManualTransactionForm>
    </DashboardCard>
  );
};
