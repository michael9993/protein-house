import { DashboardCard } from "@dashboard/components/Card";
import { OrderDetailsFragment } from "@dashboard/graphql";
import { getDiscountTypeLabel } from "@dashboard/orders/utils/data";
import { OrderDetailsViewModel } from "@dashboard/orders/utils/OrderDetailsViewModel";
import { FormattedMessage, useIntl } from "react-intl";

import { OrderUsedGiftCards } from "../OrderUsedGiftCards";
import { orderSummaryMessages } from "./messages";
import SummaryLine from "./SummaryLine";
import { SummaryList } from "./SummaryList";
import { extractOrderGiftCardUsedAmount, getDeliveryMethodName, getTaxTypeText } from "./utils";

interface OrderPaymentProps {
  order: OrderDetailsFragment;
}
// TODO: remove this in the next PR
const OrderSummaryCard = ({ order }: OrderPaymentProps) => {
  const intl = useIntl();
  const giftCardAmount = extractOrderGiftCardUsedAmount(order);
  const usedGiftcards = OrderDetailsViewModel.getUsedGiftCards(order.giftCards);

  return (
    <DashboardCard data-test-id="OrderSummaryCard">
      <DashboardCard.Header>
        <DashboardCard.Title>
          <FormattedMessage {...orderSummaryMessages.orderSummary} />
        </DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content>
        <SummaryList className="[&_li:nth-last-child(2)]:pb-2 [&_li:last-of-type]:border-t [&_li:last-of-type]:border-saleor-main-5 [&_li:last-of-type]:pt-2 [&_li:last-of-type]:mt-auto">
          <SummaryLine
            text={<FormattedMessage {...orderSummaryMessages.subtotal} />}
            money={order?.subtotal?.gross}
          />
          <SummaryLine
            text={<FormattedMessage {...orderSummaryMessages.shipping} />}
            subText={getDeliveryMethodName(order, intl)}
            money={order?.shippingPrice?.gross}
          />
          <SummaryLine
            text={<FormattedMessage {...orderSummaryMessages.taxes} />}
            subText={getTaxTypeText(order, intl)}
            money={order?.total?.tax}
          />
          {order?.discounts?.map(discount => (
            <SummaryLine
              key={discount.id}
              text={<FormattedMessage {...orderSummaryMessages.discount} />}
              subText={getDiscountTypeLabel(discount, intl)}
              money={discount.amount}
            />
          ))}
          {/* TODO: Remove when gift cards are not treated as discounts */}
          {giftCardAmount && giftCardAmount > 0 && usedGiftcards && (
            <SummaryLine
              text={<OrderUsedGiftCards giftCards={usedGiftcards} />}
              negative
              money={{
                amount: giftCardAmount,
                currency: order?.total?.gross?.currency,
              }}
            />
          )}
          <SummaryLine
            bold
            text={<FormattedMessage {...orderSummaryMessages.total} />}
            money={order?.total?.gross}
          />
        </SummaryList>
      </DashboardCard.Content>
    </DashboardCard>
  );
};

OrderSummaryCard.displayName = "OrderPayment";
export default OrderSummaryCard;
