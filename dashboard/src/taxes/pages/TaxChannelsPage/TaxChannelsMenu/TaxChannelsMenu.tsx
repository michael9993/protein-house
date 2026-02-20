import ListItemLink from "@dashboard/components/ListItemLink";
import { TaxConfigurationFragment } from "@dashboard/graphql";
import { taxesMessages } from "@dashboard/taxes/messages";
import { taxConfigurationListUrl } from "@dashboard/taxes/urls";
import { isLastElement } from "@dashboard/taxes/utils/utils";
import { DashboardCard } from "@dashboard/components/Card";
import { cn } from "@dashboard/utils/cn";
import { Divider, Skeleton } from "@saleor/macaw-ui-next";
import { Fragment } from "react";
import { FormattedMessage } from "react-intl";

interface TaxChannelsMenuProps {
  configurations: TaxConfigurationFragment[] | undefined;
  selectedConfigurationId: string;
}

const TaxChannelsMenu = ({ configurations, selectedConfigurationId }: TaxChannelsMenuProps) => {

  return (
    <DashboardCard>
      <div>
        <div className="grid grid-cols-[1fr] min-h-[48px] items-center px-6">
          <div>
            <FormattedMessage {...taxesMessages.channelList} />
          </div>
        </div>
        <Divider />
        {configurations?.map((configuration, confIndex) => (
          <Fragment key={configuration.id}>
            <ListItemLink
              data-test-id="channels-list-rows"
              className={cn(
                "grid grid-cols-[1fr] cursor-pointer min-h-[48px] items-center px-6",
                configuration.id === selectedConfigurationId && "before:block before:absolute before:left-0 before:w-1 before:h-full before:bg-saleor-active-1",
              )}
              href={taxConfigurationListUrl(configuration.id)}
            >
              <div className="text-ellipsis overflow-hidden">{configuration.channel.name}</div>
            </ListItemLink>
            {!isLastElement(configurations, confIndex) && <Divider />}
          </Fragment>
        )) ?? <Skeleton />}
      </div>
    </DashboardCard>
  );
};

export default TaxChannelsMenu;
