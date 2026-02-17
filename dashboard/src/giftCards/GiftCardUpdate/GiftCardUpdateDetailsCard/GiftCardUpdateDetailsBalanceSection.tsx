// @ts-strict-ignore
import CardSpacer from "@dashboard/components/CardSpacer";
import HorizontalSpacer from "@dashboard/components/HorizontalSpacer";
import Money from "@dashboard/components/Money";
import { Text } from "@saleor/macaw-ui-next";
import { useIntl } from "react-intl";

import useGiftCardDetails from "../providers/GiftCardDetailsProvider/hooks/useGiftCardDetails";
import { giftCardUpdateDetailsCardMessages as messages } from "./messages";

const GiftCardUpdateDetailsBalanceSection = () => {
  const intl = useIntl();
  const {
    giftCard: { currentBalance, initialBalance },
  } = useGiftCardDetails();

  return (
    <>
      <div className="flex items-baseline justify-between">
        <Text>{intl.formatMessage(messages.cardBalanceLabel)}</Text>
        <Text className="flex items-baseline">
          <Money money={currentBalance} />
          <HorizontalSpacer />
          /
          <HorizontalSpacer />
          <Text as="span" color="default2">
            <Money money={initialBalance} />
          </Text>
        </Text>
      </div>
      <CardSpacer />
    </>
  );
};

export default GiftCardUpdateDetailsBalanceSection;
