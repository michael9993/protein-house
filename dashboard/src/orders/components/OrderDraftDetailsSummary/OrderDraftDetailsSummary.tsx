// @ts-strict-ignore
import { ButtonLink } from "@dashboard/components/ButtonLink";
import HorizontalSpacer from "@dashboard/components/HorizontalSpacer";
import Money from "@dashboard/components/Money";
import {
  DiscountValueTypeEnum,
  OrderDetailsFragment,
  OrderErrorFragment,
} from "@dashboard/graphql";
import { OrderDiscountContextConsumerProps } from "@dashboard/products/components/OrderDiscountProviders/OrderDiscountProvider";
import { OrderDiscountData } from "@dashboard/products/components/OrderDiscountProviders/types";
import { getFormErrors } from "@dashboard/utils/errors";
import getOrderErrorMessage from "@dashboard/utils/errors/order";
import { Box, Popover, sprinkles, Text } from "@saleor/macaw-ui-next";
import { useIntl } from "react-intl";

import OrderDiscountCommonModal from "../OrderDiscountCommonModal";
import { ORDER_DISCOUNT } from "../OrderDiscountCommonModal/types";
import { messages } from "./messages";

const PRICE_PLACEHOLDER = "---";

interface OrderDraftDetailsSummaryProps extends OrderDiscountContextConsumerProps {
  disabled?: boolean;
  order: OrderDetailsFragment;
  errors: OrderErrorFragment[];
  onShippingMethodEdit: () => void;
}

const OrderDraftDetailsSummary = (props: OrderDraftDetailsSummaryProps) => {
  const {
    order,
    errors,
    onShippingMethodEdit,
    orderDiscount,
    addOrderDiscount,
    removeOrderDiscount,
    openDialog,
    closeDialog,
    isDialogOpen,
    orderDiscountAddStatus,
    orderDiscountRemoveStatus,
    undiscountedPrice,
  } = props;
  const intl = useIntl();

  if (!order) {
    return null;
  }

  const {
    subtotal,
    total,
    shippingMethod,
    shippingMethodName,
    shippingMethods,
    shippingPrice,
    shippingAddress,
    isShippingRequired,
  } = order;
  const formErrors = getFormErrors(["shipping"], errors);
  const hasChosenShippingMethod = shippingMethod !== null && shippingMethodName !== null;
  const hasShippingMethods = !!shippingMethods?.length || isShippingRequired;
  const discountTitle = orderDiscount ? messages.discount : messages.addDiscount;
  const getOrderDiscountLabel = (orderDiscountData: OrderDiscountData) => {
    if (!orderDiscountData) {
      return PRICE_PLACEHOLDER;
    }

    const { value: discountValue, calculationMode, amount: discountAmount } = orderDiscountData;
    const currency = total.gross.currency;

    if (calculationMode === DiscountValueTypeEnum.PERCENTAGE) {
      return (
        <div className="flex flex-row items-baseline justify-end">
          <Text className="text-gray-500 pr-2">{`(${discountValue}%)`}</Text>
          <Money money={discountAmount} />
        </div>
      );
    }

    return <Money money={{ amount: discountValue, currency }} />;
  };
  const getShippingMethodComponent = () => {
    if (hasChosenShippingMethod) {
      return <ButtonLink onClick={onShippingMethodEdit}>{`${shippingMethodName}`}</ButtonLink>;
    }

    const shippingCarrierBase = intl.formatMessage(messages.addShippingCarrier);

    if (shippingAddress) {
      return (
        <ButtonLink onClick={onShippingMethodEdit} data-test-id="add-shipping-carrier">
          {shippingCarrierBase}
        </ButtonLink>
      );
    }

    const addShippingAddressInfo = intl.formatMessage(messages.addShippingAddressInfo);

    return (
      <div className="flex flex-row items-baseline">
        <ButtonLink underline disabled onClick={onShippingMethodEdit}>
          {shippingCarrierBase}
        </ButtonLink>
        <HorizontalSpacer />
        <Text size={2} fontWeight="light">{`(${addShippingAddressInfo})`}</Text>
      </div>
    );
  };

  return (
    <table data-test-id="order-summary" className="text-base leading-[1.9] w-full">
      <tbody>
        <tr className="relative">
          <td>
            <Popover
              onOpenChange={val => {
                if (!val) {
                  closeDialog();
                }
              }}
              open={isDialogOpen}
            >
              <Popover.Trigger>
                <Box>
                  <ButtonLink onClick={isDialogOpen ? closeDialog : openDialog}>
                    {intl.formatMessage(discountTitle)}
                  </ButtonLink>
                </Box>
              </Popover.Trigger>
              <Popover.Content align="start" className={sprinkles({ zIndex: "3" })}>
                <Box boxShadow="defaultOverlay">
                  <OrderDiscountCommonModal
                    modalType={ORDER_DISCOUNT}
                    existingDiscount={orderDiscount}
                    maxPrice={undiscountedPrice}
                    onConfirm={addOrderDiscount}
                    onClose={closeDialog}
                    onRemove={removeOrderDiscount}
                    confirmStatus={orderDiscountAddStatus}
                    removeStatus={orderDiscountRemoveStatus}
                  />
                </Box>
              </Popover.Content>
            </Popover>
          </td>
          <td className="text-right">{getOrderDiscountLabel(orderDiscount)}</td>
        </tr>
        <tr data-test-id="order-subtotal-price">
          <td>{intl.formatMessage(messages.subtotal)}</td>
          <td className="text-right">
            <Money money={subtotal.gross} />
          </td>
        </tr>
        <tr data-test-id="order-add-shipping-line">
          <td>
            {hasShippingMethods && getShippingMethodComponent()}

            {!hasShippingMethods && intl.formatMessage(messages.noShippingCarriers)}

            {formErrors.shipping && (
              <Text size={3} fontWeight="regular" className="text-error ml-3 inline">
                {getOrderErrorMessage(formErrors.shipping, intl)}
              </Text>
            )}
          </td>

          <td className="text-right">
            {hasChosenShippingMethod ? <Money money={shippingPrice.gross} /> : PRICE_PLACEHOLDER}
          </td>
        </tr>
        <tr data-test-id="order-taxes-price">
          <td>{intl.formatMessage(messages.taxes)}</td>
          <td className="text-right">
            <Money money={order.total.tax} />
          </td>
        </tr>
        <tr data-test-id="order-total-price">
          <td>{intl.formatMessage(messages.total)}</td>
          <td className="text-right">
            <Money money={total.gross} />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default OrderDraftDetailsSummary;
