// @ts-strict-ignore
import { DashboardModal } from "@dashboard/components/Modal";
import { CountryFragment } from "@dashboard/graphql";
import { useLocalSearch } from "@dashboard/hooks/useLocalSearch";
import useModalDialogOpen from "@dashboard/hooks/useModalDialogOpen";
import { buttonMessages } from "@dashboard/intl";
import { taxesMessages } from "@dashboard/taxes/messages";
import { Search } from "lucide-react";
import { Box, Button, Divider, Input, RadioGroup, Text } from "@saleor/macaw-ui-next";
import { Fragment, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface TaxCountryDialogProps {
  open: boolean;
  countries: CountryFragment[];
  onConfirm: (countries: CountryFragment) => void;
  onClose: () => void;
}

const TaxCountryDialog = ({ open, countries, onConfirm, onClose }: TaxCountryDialogProps) => {
  const intl = useIntl();
  const [selectedCountry, setSelectedCountry] = useState<CountryFragment>();

  useModalDialogOpen(open, {
    onClose: () => {
      setSelectedCountry(undefined);
      setQuery("");
    },
  });

  const {
    query,
    setQuery,
    searchResult: filteredCountries,
  } = useLocalSearch<CountryFragment>(countries, country => country.country);

  return (
    <DashboardModal open={open} onChange={onClose}>
      <DashboardModal.Content size="sm">
        <DashboardModal.Header>
          <FormattedMessage {...taxesMessages.chooseCountryDialogTitle} />
        </DashboardModal.Header>

        <Input
          data-test-id="search-country-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          size="small"
          placeholder={intl.formatMessage(taxesMessages.country)}
          startAdornment={
            <Search size={20} />
          }
        />

        <RadioGroup
          value={selectedCountry?.code ?? ""}
          onValueChange={value => {
            const country = filteredCountries.find(c => c.code === value);
            if (country) setSelectedCountry(country);
          }}
          display="flex"
          flexDirection="column"
          overflowY="scroll"
          __maxHeight="60vh"
        >
          {filteredCountries.map(country => (
            <Fragment key={country.code}>
              <RadioGroup.Item
                id={country.code}
                value={country.code}
                data-test-id="country-row"
                paddingY={2}
              >
                <Text size={2}>{country.country}</Text>
              </RadioGroup.Item>
              <Divider />
            </Fragment>
          ))}
        </RadioGroup>

        <DashboardModal.Actions>
          <Button
            data-test-id="add-button"
            variant="primary"
            onClick={() => {
              onConfirm(selectedCountry);
            }}
            disabled={!selectedCountry}
          >
            <FormattedMessage {...buttonMessages.add} />
          </Button>
        </DashboardModal.Actions>
      </DashboardModal.Content>
    </DashboardModal>
  );
};

export default TaxCountryDialog;
