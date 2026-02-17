// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import GiftCardSettingsExpirySelect, {
  GiftCardSettingsExpirySelectProps,
} from "@dashboard/giftCards/components/GiftCardSettingsExpirySelect";
import * as React from "react";
import { useIntl } from "react-intl";

import { GiftCardSettingsFormData } from "../types";
import { giftCardExpirySettingsCard as messages } from "./messages";

interface GiftCardExpirySettingsCardProps
  extends Pick<GiftCardSettingsExpirySelectProps, "errors"> {
  data: GiftCardSettingsFormData;
  disabled: boolean;
  onChange: (event: React.ChangeEvent<any>) => void;
}

const GiftCardExpirySettingsCard = ({
  data,
  disabled,
  errors,
  onChange,
}: GiftCardExpirySettingsCardProps) => {
  const intl = useIntl();

  return (
    <DashboardCard data-test-id="gift-card-settings">
      <DashboardCard.Header>
        <DashboardCard.Title className="pt-0">
          {intl.formatMessage(messages.expiryDateTitle)}
        </DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content>
        <GiftCardSettingsExpirySelect
          expiryPeriodActive={data.expiryPeriodActive}
          expiryPeriodType={data.expiryPeriodType}
          expiryPeriodAmount={data.expiryPeriodAmount}
          change={onChange}
          disabled={disabled}
          errors={errors}
        />
      </DashboardCard.Content>
    </DashboardCard>
  );
};

GiftCardExpirySettingsCard.displayName = "GiftCardExpirySettingsCard";
export default GiftCardExpirySettingsCard;
