import { CardTitle } from "@dashboard/components/CardTitle/CardTitle";
import ControlledCheckbox from "@dashboard/components/ControlledCheckbox";
import Grid from "@dashboard/components/Grid";
import { Select } from "@dashboard/components/Select";
import { TaxConfigurationUpdateInput } from "@dashboard/graphql";
import { FormChange } from "@dashboard/hooks/useForm";
import { LegacyFlowWarning } from "@dashboard/taxes/components";
import { taxesMessages } from "@dashboard/taxes/messages";
import { DashboardCard } from "@dashboard/components/Card";
import { Divider, Option, RadioGroup, Text } from "@saleor/macaw-ui-next";
import { FormattedMessage, useIntl } from "react-intl";

import { TaxConfigurationFormData } from "../TaxChannelsPage";

interface TaxSettingsCardProps {
  values: TaxConfigurationFormData;
  strategyChoices: Option[];
  onChange: FormChange;
  strategyChoicesLoading: boolean;
}

const TaxSettingsCard = ({
  values,
  strategyChoices,
  onChange,
  strategyChoicesLoading,
}: TaxSettingsCardProps) => {
  const intl = useIntl();

  return (
    <DashboardCard>
      <CardTitle title={intl.formatMessage(taxesMessages.defaultSettings)} />
      <DashboardCard.Content>
        <Text className="font-medium text-xs leading-[160%] tracking-[0.1em] uppercase">
          <FormattedMessage {...taxesMessages.chargeTaxesHeader} />
        </Text>
        <div className="flex items-center gap-4 [&>:first-child]:pt-8">
          <ControlledCheckbox
            data-test-id="charge-taxes-for-this-channel-checkbox"
            checked={values.chargeTaxes}
            name={"chargeTaxes" as keyof TaxConfigurationUpdateInput}
            onChange={onChange}
            label={intl.formatMessage(taxesMessages.chargeTaxes)}
          />
          <div className="flex flex-col flex-1" data-test-id="app-flat-select">
            <span className="ml-0 text-saleor-main-3">
              <FormattedMessage {...taxesMessages.taxStrategyHint} />
              {!strategyChoicesLoading && (
                <LegacyFlowWarning taxCalculationStrategy={values.taxCalculationStrategy} />
              )}
            </span>
            <Select
              size="large"
              data-test-id="tax-calculation-strategy-select"
              options={strategyChoices}
              disabled={strategyChoicesLoading || !values.chargeTaxes}
              value={values.taxCalculationStrategy}
              name={"taxCalculationStrategy" as keyof TaxConfigurationUpdateInput}
              onChange={onChange}
            />
          </div>
        </div>
      </DashboardCard.Content>
      <Divider />
      <DashboardCard.Content data-test-id="entered-rendered-prices-section">
        <Grid variant="uniform">
          <RadioGroup
            value={String(values.pricesEnteredWithTax)}
            onValueChange={value => {
              onChange({
                target: {
                  name: "pricesEnteredWithTax" as keyof TaxConfigurationUpdateInput,
                  value: value === "true",
                },
              });
            }}
          >
            <Text className="font-medium text-xs leading-[160%] tracking-[0.1em] uppercase">
              <FormattedMessage {...taxesMessages.enteredPrices} />
            </Text>
            <RadioGroup.Item
              id="pricesEnteredWithTax-true"
              value="true"
            >
              <Text size={2}>{intl.formatMessage(taxesMessages.pricesWithTaxLabel)}</Text>
            </RadioGroup.Item>
            <RadioGroup.Item
              id="pricesEnteredWithTax-false"
              value="false"
            >
              <Text size={2}>{intl.formatMessage(taxesMessages.pricesWithoutTaxLabel)}</Text>
            </RadioGroup.Item>
          </RadioGroup>
          <div className="overflow-visible">
            <Text className="font-medium text-xs leading-[160%] tracking-[0.1em] uppercase">
              <FormattedMessage {...taxesMessages.renderedPrices} />
            </Text>
            <ControlledCheckbox
              label={intl.formatMessage(taxesMessages.showGrossHeader)}
              name={"displayGrossPrices" as keyof TaxConfigurationUpdateInput}
              checked={values.displayGrossPrices}
              onChange={onChange}
            />
          </div>
        </Grid>
      </DashboardCard.Content>
    </DashboardCard>
  );
};

export default TaxSettingsCard;
