import { CardTitle } from "@dashboard/components/CardTitle/CardTitle";
import ControlledCheckbox from "@dashboard/components/ControlledCheckbox";
import Grid from "@dashboard/components/Grid";
import { Select } from "@dashboard/components/Select";
import { TaxConfigurationUpdateInput } from "@dashboard/graphql";
import { FormChange } from "@dashboard/hooks/useForm";
import { LegacyFlowWarning } from "@dashboard/taxes/components";
import { taxesMessages } from "@dashboard/taxes/messages";
import {
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { Option } from "@saleor/macaw-ui-next";
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
    <Card>
      <CardTitle title={intl.formatMessage(taxesMessages.defaultSettings)} />
      <CardContent>
        <Typography className="font-medium text-xs leading-[160%] tracking-[0.1em] uppercase">
          <FormattedMessage {...taxesMessages.chargeTaxesHeader} />
        </Typography>
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
      </CardContent>
      <Divider />
      <CardContent data-test-id="entered-rendered-prices-section">
        <Grid variant="uniform">
          <RadioGroup
            value={values.pricesEnteredWithTax}
            name={"pricesEnteredWithTax" as keyof TaxConfigurationUpdateInput}
            onChange={e => {
              onChange({
                target: {
                  name: e.target.name,
                  value: e.target.value === "true",
                },
              });
            }}
            className="[&&]:overflow-visible"
          >
            <Typography className="font-medium text-xs leading-[160%] tracking-[0.1em] uppercase">
              <FormattedMessage {...taxesMessages.enteredPrices} />
            </Typography>
            <FormControlLabel
              value={true}
              control={<Radio />}
              label={intl.formatMessage(taxesMessages.pricesWithTaxLabel)}
            />
            <FormControlLabel
              value={false}
              control={<Radio />}
              label={intl.formatMessage(taxesMessages.pricesWithoutTaxLabel)}
            />
          </RadioGroup>
          <div className="[&&]:overflow-visible">
            <Typography className="font-medium text-xs leading-[160%] tracking-[0.1em] uppercase">
              <FormattedMessage {...taxesMessages.renderedPrices} />
            </Typography>
            <ControlledCheckbox
              label={intl.formatMessage(taxesMessages.showGrossHeader)}
              name={"displayGrossPrices" as keyof TaxConfigurationUpdateInput}
              checked={values.displayGrossPrices}
              onChange={onChange}
            />
          </div>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TaxSettingsCard;
