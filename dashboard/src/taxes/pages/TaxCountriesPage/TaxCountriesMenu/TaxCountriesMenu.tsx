import { CardTitle } from "@dashboard/components/CardTitle/CardTitle";
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import ListItemLink from "@dashboard/components/ListItemLink";
import { TaxCountryConfigurationFragment } from "@dashboard/graphql";
import { taxesMessages } from "@dashboard/taxes/messages";
import { taxCountriesListUrl } from "@dashboard/taxes/urls";
import { isLastElement } from "@dashboard/taxes/utils/utils";
import { DashboardCard } from "@dashboard/components/Card";
import { cn } from "@dashboard/utils/cn";
import { Button, Divider, Skeleton } from "@saleor/macaw-ui-next";
import { Trash2 } from "lucide-react";
import { Fragment } from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface TaxCountriesMenuProps {
  configurations: TaxCountryConfigurationFragment[] | undefined;
  selectedCountryId: string;
  onCountryDelete: (countryId: string) => void;
  onCountryAdd: () => void;
}

const TaxCountriesMenu = ({
  configurations,
  selectedCountryId,
  onCountryDelete,
  onCountryAdd,
}: TaxCountriesMenuProps) => {
  const intl = useIntl();

  return (
    <DashboardCard className="h-fit">
      <CardTitle
        title={intl.formatMessage(taxesMessages.countryList)}
        toolbar={
          <Button onClick={onCountryAdd} variant="secondary" data-test-id="add-country-button">
            <FormattedMessage {...taxesMessages.addCountryLabel} />
          </Button>
        }
      />
      {configurations?.length === 0 ? (
        <DashboardCard.Content className="text-text-disabled">
          <FormattedMessage {...taxesMessages.noCountriesAssigned} />
        </DashboardCard.Content>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr] min-h-[48px] items-center px-6">
            <div>
              <FormattedMessage {...taxesMessages.countryNameHeader} />
            </div>
          </div>
          <Divider />
          {configurations?.map((config, configIndex) => (
            <Fragment key={config.country.code}>
              <ListItemLink
                data-test-id="countries-list-rows"
                className={cn(
                  "grid grid-cols-[1fr] cursor-pointer min-h-[48px] items-center px-6",
                  config.country.code === selectedCountryId && "before:absolute before:left-0 before:w-1 before:h-full before:bg-saleor-active-1",
                )}
                href={taxCountriesListUrl(config.country.code)}
              >
                <div>
                  <div className="flex justify-between items-center">
                    {config.country.country}
                    <Button
                      icon={
                        <Trash2 size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
                      }
                      variant="tertiary"
                      onClick={event => {
                        event.stopPropagation();
                        event.preventDefault();
                        onCountryDelete(config.country.code);
                      }}
                    />
                  </div>
                </div>
              </ListItemLink>
              {!isLastElement(configurations, configIndex) && <Divider />}
            </Fragment>
          )) ?? <Skeleton />}
        </div>
      )}
    </DashboardCard>
  );
};

export default TaxCountriesMenu;
