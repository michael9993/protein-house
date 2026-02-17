import ListItemLink from "@dashboard/components/ListItemLink";
import { TaxConfigurationFragment } from "@dashboard/graphql";
import { taxesMessages } from "@dashboard/taxes/messages";
import { taxConfigurationListUrl } from "@dashboard/taxes/urls";
import { isLastElement } from "@dashboard/taxes/utils/utils";
import { Card, Divider } from "@mui/material";
import { List, ListHeader, ListItem, ListItemCell } from "@saleor/macaw-ui";
import { cn } from "@dashboard/utils/cn";
import { Skeleton } from "@saleor/macaw-ui-next";
import { Fragment } from "react";
import { FormattedMessage } from "react-intl";

interface TaxChannelsMenuProps {
  configurations: TaxConfigurationFragment[] | undefined;
  selectedConfigurationId: string;
}

const TaxChannelsMenu = ({ configurations, selectedConfigurationId }: TaxChannelsMenuProps) => {

  return (
    <Card>
      <List gridTemplate={["1fr"]}>
        <ListHeader>
          <ListItem className="min-h-[48px] after:hidden">
            <ListItemCell>
              <FormattedMessage {...taxesMessages.channelList} />
            </ListItemCell>
          </ListItem>
        </ListHeader>
        <Divider />
        {configurations?.map((configuration, confIndex) => (
          <Fragment key={configuration.id}>
            <ListItemLink
              data-test-id="channels-list-rows"
              className={cn(
                "cursor-pointer min-h-[48px] after:hidden",
                configuration.id === selectedConfigurationId && "[&&&]:before:block [&&&]:before:absolute [&&&]:before:left-0 [&&&]:before:w-1 [&&&]:before:h-full [&&&]:before:bg-saleor-active-1",
              )}
              href={taxConfigurationListUrl(configuration.id)}
            >
              <ListItemCell className="text-ellipsis overflow-hidden">{configuration.channel.name}</ListItemCell>
            </ListItemLink>
            {!isLastElement(configurations, confIndex) && <Divider />}
          </Fragment>
        )) ?? <Skeleton />}
      </List>
    </Card>
  );
};

export default TaxChannelsMenu;
