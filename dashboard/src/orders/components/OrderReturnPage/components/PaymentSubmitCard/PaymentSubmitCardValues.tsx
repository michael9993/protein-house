// @ts-strict-ignore
import Money from "@dashboard/components/Money";
import { cn } from "@dashboard/utils/cn";
import { IMoney } from "@dashboard/utils/intl";
import { Skeleton } from "@saleor/macaw-ui-next";
import reduce from "lodash/reduce";
import { defineMessages, useIntl } from "react-intl";

export interface PaymentSubmitCardValuesProps {
  authorizedAmount: IMoney;
  shipmentCost?: IMoney;
  selectedProductsValue?: IMoney;
  previouslyRefunded: IMoney;
  maxRefund: IMoney;
  proposedRefundAmount?: IMoney;
  replacedProductsValue?: IMoney;
  refundTotalAmount?: IMoney;
}

const messages = defineMessages({
  authorizedAmount: {
    id: "L/O4LQ",
    defaultMessage: "Authorized Amount",
    description: "order refund amount",
  },
  maxRefund: {
    id: "I7HyJZ",
    defaultMessage: "Max Refund",
    description: "order refund amount",
  },
  previouslyRefunded: {
    id: "Q55cTG",
    defaultMessage: "Previously refunded",
    description: "order refund amount",
  },
  proposedRefundAmount: {
    id: "wDUBLR",
    defaultMessage: "Proposed refund amount",
    description: "order refund amount",
  },
  refundTotalAmount: {
    id: "C6bb6x",
    defaultMessage: "Refund total amount",
    description: "order refund amount",
  },
  replacedProductsValue: {
    id: "i56GGQ",
    defaultMessage: "Replaced Products Value",
    description: "order refund amount",
  },
  selectedProductsValue: {
    id: "kak5vT",
    defaultMessage: "Selected Products Value",
    description: "order refund amount",
  },
  shipmentCost: {
    id: "WGp+Fw",
    defaultMessage: "Shipment Cost",
    description: "order refund amount",
  },
});

export const PaymentSubmitCardValues = (props: PaymentSubmitCardValuesProps) => {
  const intl = useIntl();
  const orderedKeys: Array<keyof PaymentSubmitCardValuesProps> = [
    "authorizedAmount",
    "shipmentCost",
    "selectedProductsValue",
    "previouslyRefunded",
    "replacedProductsValue",
    "maxRefund",
    "refundTotalAmount",
  ];
  const highlightedItems: Array<keyof PaymentSubmitCardValuesProps> = [
    "maxRefund",
    "refundTotalAmount",
  ];
  const items = reduce(
    orderedKeys,
    (result, key) => {
      const value = props[key];

      if (!value) {
        return result;
      }

      return [...result, { data: value, highlighted: highlightedItems.includes(key), key }];
    },
    [],
  );

  return (
    <div className="text-base leading-[1.9] w-full">
      {items.map(({ key, data, highlighted }) => (
        <div
          className={cn("flex flex-row justify-between mb-4 text-right", highlighted && "font-semibold")}
          key={key}
        >
          {intl.formatMessage(messages[key])}
          <div>{data?.amount !== undefined ? <Money money={data} /> : <Skeleton />}</div>
        </div>
      ))}
    </div>
  );
};

PaymentSubmitCardValues.displayName = "PaymentSubmitCardValues";
