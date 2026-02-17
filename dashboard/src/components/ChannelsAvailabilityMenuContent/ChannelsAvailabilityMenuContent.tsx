// @ts-strict-ignore
import HorizontalSpacer from "@dashboard/components/HorizontalSpacer";
import { CollectionFragment } from "@dashboard/graphql";
import { PillColor } from "@saleor/macaw-ui";
import { Text } from "@saleor/macaw-ui-next";
import { MessageDescriptor, useIntl } from "react-intl";

import { messages } from "../ChannelsAvailabilityDropdown/messages";
import { Pill } from "../Pill";
import { ScrollableContent } from "./PluginAvailabilityStatusPopup/ScrollableContent";

interface ChannelsAvailabilityMenuContentProps {
  pills: Pill[];
}
export interface Pill {
  channel: CollectionFragment["channelListings"][0]["channel"];
  color: PillColor;
  label: MessageDescriptor;
}

export const ChannelsAvailabilityMenuContent = ({
  pills,
}: ChannelsAvailabilityMenuContentProps) => {
  const intl = useIntl();

  return (
    <div className="p-4">
      <div className="flex justify-between [&:not(:last-child)]:mb-4">
        <Text size={2} fontWeight="light" className="uppercase text-saleor-main-3 font-medium tracking-widest">
          {intl.formatMessage(messages.channel)}
        </Text>
        <Text size={2} fontWeight="light" className="uppercase text-saleor-main-3 font-medium tracking-widest">
          {intl.formatMessage(messages.status)}
        </Text>
      </div>
      <ScrollableContent>
        {pills.map(pill => (
          <div key={pill.channel.id} className="flex justify-between [&:not(:last-child)]:mb-4">
            <Text>{pill.channel.name}</Text>
            <HorizontalSpacer spacing={4} />
            <Pill label={intl.formatMessage(pill.label)} color={pill.color} />
          </div>
        ))}
      </ScrollableContent>
    </div>
  );
};

ChannelsAvailabilityMenuContent.displayName = "ChannelsAvailabilityMenuContent";
