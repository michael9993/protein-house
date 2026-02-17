import { ConfirmButton } from "@dashboard/components/ConfirmButton";
import { DashboardModal } from "@dashboard/components/Modal";
import { buttonMessages } from "@dashboard/intl";
import { Box, RadioGroup, Text } from "@saleor/macaw-ui-next";
import { FormattedMessage, useIntl } from "react-intl";

import OrderCustomerChangeForm, { CustomerChangeActionEnum, OrderCustomerChangeData } from "./form";
import messages from "./messages";

interface OrderCustomerChangeDialogProps {
  open: boolean;
  onConfirm: (data: OrderCustomerChangeData) => void;
  onClose: () => any;
}

const OrderCustomerChangeDialog = (props: OrderCustomerChangeDialogProps) => {
  const { open, onClose, onConfirm } = props;
  const intl = useIntl();

  return (
    <DashboardModal onChange={onClose} open={open}>
      <DashboardModal.Content size="sm">
        <OrderCustomerChangeForm onSubmit={onConfirm}>
          {({ change, data }) => (
            <Box display="grid" gap={6}>
              <DashboardModal.Header>
                <FormattedMessage {...messages.title} />
              </DashboardModal.Header>
              <Text>
                <FormattedMessage {...messages.description} />
              </Text>
              <RadioGroup
                value={data.changeActionOption}
                name="changeActionOption"
                onValueChange={value =>
                  change({ target: { name: "changeActionOption", value } } as any)
                }
              >
                <RadioGroup.Item
                  value={CustomerChangeActionEnum.KEEP_ADDRESS}
                  id="keep-address"
                  className="block"
                >
                  <Text>{intl.formatMessage(messages.keepAddress)}</Text>
                </RadioGroup.Item>
                <RadioGroup.Item
                  value={CustomerChangeActionEnum.CHANGE_ADDRESS}
                  id="change-address"
                  className="block"
                >
                  <Text>{intl.formatMessage(messages.changeAddress)}</Text>
                </RadioGroup.Item>
              </RadioGroup>
              <DashboardModal.Actions>
                <ConfirmButton transitionState="default" type="submit">
                  <FormattedMessage {...buttonMessages.continue} />
                </ConfirmButton>
              </DashboardModal.Actions>
            </Box>
          )}
        </OrderCustomerChangeForm>
      </DashboardModal.Content>
    </DashboardModal>
  );
};

OrderCustomerChangeDialog.displayName = "OrderCustomerChangeDialog";
export default OrderCustomerChangeDialog;
