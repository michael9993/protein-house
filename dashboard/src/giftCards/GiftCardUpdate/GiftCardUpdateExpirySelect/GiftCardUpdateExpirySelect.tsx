import VerticalSpacer from "@dashboard/components/VerticalSpacer";
import { getGiftCardErrorMessage } from "@dashboard/giftCards/GiftCardUpdate/messages";
import useGiftCardUpdateForm from "@dashboard/giftCards/GiftCardUpdate/providers/GiftCardUpdateFormProvider/hooks/useGiftCardUpdateForm";
import useStateFromProps from "@dashboard/hooks/useStateFromProps";
import { Checkbox, Input, Text } from "@saleor/macaw-ui-next";
import { useEffect } from "react";
import { useIntl } from "react-intl";

import { giftCardExpirySelectMessages as messages } from "./messages";

const GiftCardUpdateExpirySelect = () => {
  const intl = useIntl();
  const {
    change,
    data: { expiryDate },
    formErrors,
  } = useGiftCardUpdateForm();
  const [cardExpiresSelected, setCardExpiresSelected] = useStateFromProps(!!expiryDate);

  useEffect(() => {
    if (!cardExpiresSelected) {
      change({
        target: {
          name: "expiryDate",
          value: null,
        },
      });
    }
  }, [cardExpiresSelected]);

  return (
    <>
      <Text>{intl.formatMessage(messages.expiryDateLabel)}</Text>
      <VerticalSpacer />
      <Checkbox
        data-test-id="gift-card-expire-section"
        name="cardExpires"
        checked={cardExpiresSelected}
        onCheckedChange={value => setCardExpiresSelected(value as boolean)}
        display="inline-flex"
      >
        <Text size={3}>{intl.formatMessage(messages.expiryDateCheckboxLabel)}</Text>
      </Checkbox>

      {cardExpiresSelected && (
        <Input
          size="small"
          error={!!formErrors?.expiryDate}
          helperText={getGiftCardErrorMessage(formErrors?.expiryDate, intl)}
          onChange={change}
          name={"expiryDate"}
          className="block w-[400px] mt-4"
          label={intl.formatMessage(messages.expiryDateLabel)}
          value={expiryDate}
          type="date"
        />
      )}
    </>
  );
};

export default GiftCardUpdateExpirySelect;
