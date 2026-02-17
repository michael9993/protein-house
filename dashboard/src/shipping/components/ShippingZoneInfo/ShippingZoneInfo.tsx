import { DashboardCard } from "@dashboard/components/Card";
import CardSpacer from "@dashboard/components/CardSpacer";
import { ShippingErrorFragment } from "@dashboard/graphql";
import { commonMessages } from "@dashboard/intl";
import { getFormErrors } from "@dashboard/utils/errors";
import getShippingErrorMessage from "@dashboard/utils/errors/shipping";
import { Input, Textarea } from "@saleor/macaw-ui-next";
import * as React from "react";
import { defineMessages, FormattedMessage, useIntl } from "react-intl";

const messages = defineMessages({
  descriptionCharacterLimit: {
    id: "ChAjJu",
    defaultMessage: "{numberOfCharacters} of {maxCharacters} characters",
    description: "character limit",
  },
  descriptionPlaceholder: {
    id: "FkRNk+",
    defaultMessage: "Description of a shipping zone.",
    description: "field placeholder",
  },
  name: {
    id: "YpukUN",
    defaultMessage: "Shipping zone name",
    description: "label",
  },
});

interface ShippingZoneInfoProps {
  data: Record<"name" | "description", string>;
  disabled: boolean;
  errors: ShippingErrorFragment[];
  onChange: (event: React.ChangeEvent<any>) => void;
}

const MAX_DESCRIPTION_LENGTH = 300;
const ShippingZoneInfo = ({ data, disabled, errors, onChange }: ShippingZoneInfoProps) => {
  const intl = useIntl();
  const formErrors = getFormErrors(["name"], errors);

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage(commonMessages.generalInformations)}
        </DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content>
        <Input
          size="small"
          disabled={disabled}
          error={!!formErrors.name}
          helperText={getShippingErrorMessage(formErrors.name, intl)}
          label={intl.formatMessage(messages.name)}
          data-test-id="shipping-zone-name"
          name="name"
          value={data.name}
          onChange={onChange}
        />
        <CardSpacer />
        <Textarea
          size="small"
          error={data.description.length > MAX_DESCRIPTION_LENGTH}
          name={"description"}
          data-test-id="shipping-zone-description"
          label={
            <div className="flex [&_span]:pr-[30px]">
              <div className="flex-1">
                <FormattedMessage {...commonMessages.descriptionOptional} />
              </div>
              {data.description?.length > 0 && (
                <span>
                  <FormattedMessage
                    {...messages.descriptionCharacterLimit}
                    values={{
                      maxCharacters: MAX_DESCRIPTION_LENGTH,
                      numberOfCharacters: data.description.length,
                    }}
                  />
                </span>
              )}
            </div>
          }
          maxLength={MAX_DESCRIPTION_LENGTH}
          value={data.description}
          onChange={onChange}
          disabled={disabled}
          placeholder={intl.formatMessage(messages.descriptionPlaceholder)}
          rows={10}
        />
      </DashboardCard.Content>
    </DashboardCard>
  );
};

ShippingZoneInfo.displayName = "ShippingZoneInfo";
export default ShippingZoneInfo;
