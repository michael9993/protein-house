// @ts-strict-ignore
import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { CardTitle } from "@dashboard/components/CardTitle/CardTitle";
import { ConfirmButtonTransitionState } from "@dashboard/components/ConfirmButton";
import Grid from "@dashboard/components/Grid";
import { DetailPageLayout } from "@dashboard/components/Layouts";
import { Savebar } from "@dashboard/components/Savebar";
import VerticalSpacer from "@dashboard/components/VerticalSpacer";
import { configurationMenuUrl } from "@dashboard/configuration";
import {
  CountryCode,
  TaxClassRateInput,
  TaxCountryConfigurationFragment,
} from "@dashboard/graphql";
import { SubmitPromise } from "@dashboard/hooks/useForm";
import useNavigator from "@dashboard/hooks/useNavigator";
import { parseQuery } from "@dashboard/orders/components/OrderCustomerAddressesEditDialog/utils";
import TaxPageTitle from "@dashboard/taxes/components/TaxPageTitle";
import { taxesMessages } from "@dashboard/taxes/messages";
import { isLastElement } from "@dashboard/taxes/utils/utils";
import { DashboardCard } from "@dashboard/components/Card";
import { DashboardTab, DashboardTabs } from "@dashboard/components/Tabs/DashboardTabs";
import { Box, Divider, Input, Skeleton } from "@saleor/macaw-ui-next";
import { Search } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

import TaxInput from "../../components/TaxInput";
import TaxCountriesForm from "./form";
import TaxCountriesMenu from "./TaxCountriesMenu";

interface TaxCountriesPageProps {
  countryTaxesData: TaxCountryConfigurationFragment[] | undefined;
  selectedCountryId: string;
  handleTabChange: (tab: string) => void;
  openDialog: (action?: string) => void;
  onSubmit: (input: TaxClassRateInput[]) => SubmitPromise;
  onDeleteConfiguration: (countryCode: CountryCode) => SubmitPromise;
  savebarState: ConfirmButtonTransitionState;
  disabled: boolean;
}

const TaxCountriesPage = (props: TaxCountriesPageProps) => {
  const {
    countryTaxesData,
    selectedCountryId,
    handleTabChange,
    openDialog,
    onSubmit,
    onDeleteConfiguration,
    savebarState,
    disabled,
  } = props;
  const intl = useIntl();
  const navigate = useNavigator();
  const [query, setQuery] = useState("");
  const currentCountry = useMemo(
    () => countryTaxesData?.find(country => country.country.code === selectedCountryId),
    [selectedCountryId, countryTaxesData],
  );

  return (
    <TaxCountriesForm country={currentCountry} onSubmit={onSubmit} disabled={disabled}>
      {({ data, handlers, submit }) => {
        const filteredRates = data?.filter(
          rate => rate.label.search(new RegExp(parseQuery(query), "i")) >= 0,
        );

        return (
          <DetailPageLayout gridTemplateColumns={1}>
            <TopNav title={<TaxPageTitle />} href={configurationMenuUrl} />
            <DetailPageLayout.Content>
              <Box padding={6}>
                <DashboardTabs
                  value="countries"
                  onChange={value => handleTabChange(value)}
                >
                  <DashboardTab
                    label={intl.formatMessage(taxesMessages.channelsSection)}
                    value="channels"
                    data-test-id="channels-tab"
                  />
                  <DashboardTab
                    label={intl.formatMessage(taxesMessages.countriesSection)}
                    value="countries"
                    data-test-id="countries-tab"
                  />
                  <DashboardTab
                    label={intl.formatMessage(taxesMessages.taxClassesSection)}
                    value="tax-classes"
                    data-test-id="tax-classes-tab"
                  />
                </DashboardTabs>
                <VerticalSpacer spacing={2} />
                <Grid variant="inverted">
                  <TaxCountriesMenu
                    configurations={countryTaxesData}
                    selectedCountryId={selectedCountryId}
                    onCountryDelete={onDeleteConfiguration}
                    onCountryAdd={() => openDialog("add-country")}
                  />
                  <DashboardCard>
                    <CardTitle
                      title={
                        currentCountry ? (
                          intl.formatMessage(taxesMessages.taxClassRatesHeader, {
                            country: currentCountry?.country?.country,
                          })
                        ) : (
                          <Skeleton />
                        )
                      }
                    />
                    {countryTaxesData?.length === 0 ? (
                      <DashboardCard.Content className="text-text-disabled">
                        <FormattedMessage {...taxesMessages.addCountryToAccessClass} />
                      </DashboardCard.Content>
                    ) : (
                      <>
                        <DashboardCard.Content>
                          <Input
                            data-test-id="search-tax-class-input"
                            value={query}
                            size="small"
                            onChange={e => setQuery(e.target.value)}
                            placeholder={intl.formatMessage(taxesMessages.searchTaxClasses)}
                            startAdornment={<Search size={20} />}
                          />
                        </DashboardCard.Content>
                        <div>
                          <div className="grid grid-cols-[5fr_2fr] items-center px-6 py-3">
                            <div>
                              <FormattedMessage {...taxesMessages.taxNameHeader} />
                            </div>
                            <div className="m-0 flex place-content-end text-right">
                              <FormattedMessage {...taxesMessages.taxRateHeader} />
                            </div>
                          </div>
                          <Divider />
                          {filteredRates?.map((rate, rateIndex) => (
                            <Fragment key={rate.id}>
                              <div
                                className="grid grid-cols-[5fr_2fr] items-center px-6 py-3"
                                data-test-id={rate.label}
                              >
                                <div>{rate.label}</div>
                                <div>
                                  <TaxInput
                                    placeholder={data[0]?.rate}
                                    value={rate?.value}
                                    change={e => handlers.handleRateChange(rate.id, e.target.value)}
                                  />
                                </div>
                              </div>
                              {!isLastElement(filteredRates, rateIndex) && <Divider />}
                            </Fragment>
                          )) ?? <Skeleton />}
                        </div>
                      </>
                    )}
                  </DashboardCard>
                </Grid>
              </Box>
              <Savebar>
                <Savebar.Spacer />
                <Savebar.CancelButton onClick={() => navigate(configurationMenuUrl)} />
                <Savebar.ConfirmButton
                  transitionState={savebarState}
                  onClick={submit}
                  disabled={disabled}
                />
              </Savebar>
            </DetailPageLayout.Content>
          </DetailPageLayout>
        );
      }}
    </TaxCountriesForm>
  );
};

export default TaxCountriesPage;
