// @ts-strict-ignore
import ControlledCheckbox from "@dashboard/components/ControlledCheckbox";
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import { Select } from "@dashboard/components/Select";
import { TaxConfigurationUpdateInput } from "@dashboard/graphql";
import { FormChange } from "@dashboard/hooks/useForm";
import { LegacyFlowWarning } from "@dashboard/taxes/components";
import { ListItem, ListItemCell } from "@saleor/macaw-ui";
import { Box, Button, Divider, Option } from "@saleor/macaw-ui-next";
import { Trash2 } from "lucide-react";

import { TaxCountryConfiguration } from "../TaxChannelsPage";

interface TaxCountryExceptionListItemProps {
  country: TaxCountryConfiguration | undefined;
  onDelete: () => void;
  onChange: FormChange;
  divider: boolean;
  strategyChoices: Option[];
  strategyChoicesLoading: boolean;
}

const TaxCountryExceptionListItem = ({
  country,
  onDelete,
  onChange,
  strategyChoices,
  divider = true,
  strategyChoicesLoading,
}: TaxCountryExceptionListItemProps) => {
  return (
    <>
      <ListItem
        hover={false}
        className="grid grid-cols-[1fr_500px_1fr_1fr] before:hidden after:hidden"
        data-test-id="exception-country"
      >
        <ListItemCell>{country.country.country}</ListItemCell>
        <ListItemCell className="grid">
          {!strategyChoicesLoading && (
            <LegacyFlowWarning taxCalculationStrategy={country.taxCalculationStrategy} />
          )}
          <Box display="flex" alignItems="center">
            <ControlledCheckbox
              className="m-0 flex place-content-center text-center"
              checked={country.chargeTaxes}
              name={"chargeTaxes" as keyof TaxConfigurationUpdateInput}
              onChange={onChange}
            />
            <Box width="100%">
              <Select
                options={strategyChoices}
                disabled={!country.chargeTaxes || strategyChoicesLoading}
                value={country.taxCalculationStrategy}
                name={"taxCalculationStrategy" as keyof TaxConfigurationUpdateInput}
                onChange={onChange}
              />
            </Box>
          </Box>
        </ListItemCell>
        <ListItemCell className="m-0 flex place-content-center text-center" data-test-id="display-gross-prices-checkbox">
          <ControlledCheckbox
            className="m-0 flex place-content-center text-center"
            checked={country.displayGrossPrices}
            name={"displayGrossPrices" as keyof TaxConfigurationUpdateInput}
            onChange={onChange}
          />
        </ListItemCell>
        <ListItemCell>
          <Button
            size="small"
            onClick={onDelete}
            variant="secondary"
            icon={<Trash2 size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />}
          />
        </ListItemCell>
      </ListItem>
      {divider && <Divider />}
    </>
  );
};

export default TaxCountryExceptionListItem;
