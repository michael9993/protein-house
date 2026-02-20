// @ts-strict-ignore
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import ResponsiveTable from "@dashboard/components/ResponsiveTable";
import TableRowLink from "@dashboard/components/TableRowLink";
import { cn } from "@dashboard/utils/cn";
import { CountryFragment } from "@dashboard/graphql";
import { TableBody, TableCell } from "@dashboard/components/Table";
import { IconButton } from "@dashboard/components/IconButton/IconButton";
import { Button, Text } from "@saleor/macaw-ui-next";
import { ChevronDownIcon, Trash2 } from "lucide-react";
import * as React from "react";
import { FormattedMessage } from "react-intl";

import { getStringOrPlaceholder } from "../../misc";
import { DashboardCard } from "../Card";
import { groupCountriesByStartingLetter } from "./utils";

interface CountryListProps {
  countries: CountryFragment[];
  disabled: boolean;
  emptyText: React.ReactNode;
  title: React.ReactNode;
  onCountryAssign: () => void;
  onCountryUnassign: (country: string) => void;
}

const CountryList = (props: CountryListProps) => {
  const { countries, disabled, emptyText, title, onCountryAssign, onCountryUnassign } = props;
  const [isCollapsed, setCollapseStatus] = React.useState(true);
  const toggleCollapse = () => setCollapseStatus(!isCollapsed);

  function sortCountries(countries: CountryFragment[]): CountryFragment[] {
    return [...countries].sort((a, b) => a.country.localeCompare(b.country));
  }

  const sortedCountries = sortCountries(countries ?? []);
  const groupedCountries = groupCountriesByStartingLetter(sortedCountries);
  const hasCountriesToRender = sortedCountries.length > 0;

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>{title}</DashboardCard.Title>
        <DashboardCard.Toolbar>
          <Button
            disabled={disabled}
            onClick={onCountryAssign}
            data-test-id="assign-country"
            variant="secondary"
          >
            <FormattedMessage id="zZCCqz" defaultMessage="Assign countries" description="button" />
          </Button>
        </DashboardCard.Toolbar>
      </DashboardCard.Header>
      <ResponsiveTable>
        <TableBody>
          <TableRowLink className="cursor-pointer" onClick={toggleCollapse}>
            <TableCell className="w-full first:pl-0">
              <FormattedMessage
                id="62Ywh2"
                defaultMessage="{number} Countries"
                description="number of countries"
                values={{
                  number: getStringOrPlaceholder(countries?.length.toString()),
                }}
              />
            </TableCell>
            <TableCell className="text-right last:pr-6 last:pl-0 w-[calc(48px+32px)]">
              <IconButton variant="secondary" size="medium">
                <ChevronDownIcon
                  data-test-id="countries-drop-down-icon"
                  className={cn(!isCollapsed && "rotate-180")}
                />
              </IconButton>
            </TableCell>
          </TableRowLink>
          {!isCollapsed && hasCountriesToRender ? (
            Object.keys(groupedCountries).map(letter => {
              const countries = groupedCountries[letter];

              return countries.map((country, countryIndex) => (
                <TableRowLink key={country ? country.code : "skeleton"}>
                  <TableCell className="relative first:pl-6">
                    {countryIndex === 0 && (
                      <Text color="default2" display="inline-block" left={2} position="absolute">
                        {country.country[0]}
                      </Text>
                    )}
                    {country.country}
                  </TableCell>
                  <TableCell className="text-right last:pr-6 last:pl-0 w-[calc(48px+32px)]">
                    <IconButton
                      data-test-id="delete-icon"
                      variant="secondary"
                      disabled={!country || disabled}
                      onClick={() => onCountryUnassign(country.code)}
                      size="medium">
                      <Trash2 size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
                    </IconButton>
                  </TableCell>
                </TableRowLink>
              ));
            })
          ) : (
            <TableRowLink>
              <TableCell className="first:pl-0" colSpan={2}>
                {emptyText}
              </TableCell>
            </TableRowLink>
          )}
        </TableBody>
      </ResponsiveTable>
    </DashboardCard>
  );
};

export default CountryList;
