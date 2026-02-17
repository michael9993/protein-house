// @ts-strict-ignore
import { ChannelShippingData } from "@dashboard/channels/utils";
import { DashboardCard } from "@dashboard/components/Card";
import PriceField from "@dashboard/components/PriceField";
import ResponsiveTable from "@dashboard/components/ResponsiveTable";
import TableHead from "@dashboard/components/TableHead";
import TableRowLink from "@dashboard/components/TableRowLink";
import { ShippingChannelsErrorFragment } from "@dashboard/graphql";
import { getFormChannelError, getFormChannelErrors } from "@dashboard/utils/errors";
import getShippingErrorMessage from "@dashboard/utils/errors/shipping";
import { TableBody, TableCell } from "@dashboard/components/Table";
import { Text } from "@saleor/macaw-ui-next";
import { FormattedMessage, useIntl } from "react-intl";

interface Value {
  maxValue: string;
  minValue: string;
  price: string;
}

interface PricingCardProps {
  channels: ChannelShippingData[];
  errors: ShippingChannelsErrorFragment[];
  disabled: boolean;
  onChange: (channelId: string, value: Value) => void;
}

const numberOfColumns = 2;

const PricingCard = ({ channels, disabled, errors, onChange }: PricingCardProps) => {
  const intl = useIntl();
  const formErrors = getFormChannelErrors(["price"], errors);

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage({
            id: "TnTi/a",
            defaultMessage: "Pricing",
            description: "pricing card title",
          })}
        </DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content className="px-0 last:pb-0">
        <ResponsiveTable className="table-fixed">
          <TableHead colSpan={numberOfColumns} disabled={disabled} items={[]}>
            <TableCell className="pl-0 w-auto text-sm">
              <span>
                <FormattedMessage
                  id="Hj3T7P"
                  defaultMessage="Channel name"
                  description="column title"
                />
              </span>
            </TableCell>
            <TableCell className="text-sm text-right w-[250px]">
              <span>
                <FormattedMessage id="1shOIS" defaultMessage="Price" description="column title" />
              </span>
            </TableCell>
          </TableHead>
          <TableBody>
            {channels?.map(channel => {
              const error = getFormChannelError(formErrors.price, channel.id);

              return (
                <TableRowLink key={channel.id} data-test-id={channel.name}>
                  <TableCell>
                    <Text>{channel.name}</Text>
                  </TableCell>
                  <TableCell>
                    <PriceField
                      data-test-id="price-input"
                      disabled={disabled}
                      error={!!error}
                      label={intl.formatMessage({
                        id: "1shOIS",
                        defaultMessage: "Price",
                        description: "column title",
                      })}
                      name="price"
                      value={channel.price}
                      onChange={e =>
                        onChange(channel.id, {
                          ...channel,
                          price: e.target.value,
                        })
                      }
                      currencySymbol={channel.currency}
                      required
                      hint={error && getShippingErrorMessage(error, intl)}
                    />
                  </TableCell>
                </TableRowLink>
              );
            })}
          </TableBody>
        </ResponsiveTable>
      </DashboardCard.Content>
    </DashboardCard>
  );
};

export default PricingCard;
