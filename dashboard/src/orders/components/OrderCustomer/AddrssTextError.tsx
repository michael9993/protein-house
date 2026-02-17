import FormSpacer from "@dashboard/components/FormSpacer";
import { OrderErrorFragment } from "@dashboard/graphql";
import getOrderErrorMessage from "@dashboard/utils/errors/order";
import { Text } from "@saleor/macaw-ui-next";
import { useIntl } from "react-intl";

interface AddressTextErrorProps {
  orderError: OrderErrorFragment;
}

export const AddressTextError = ({ orderError }: AddressTextErrorProps) => {
  const intl = useIntl();

  return (
    <>
      <Text size={3} fontWeight="regular" className="text-error">
        {getOrderErrorMessage(orderError, intl)}
      </Text>
      <FormSpacer />
    </>
  );
};
