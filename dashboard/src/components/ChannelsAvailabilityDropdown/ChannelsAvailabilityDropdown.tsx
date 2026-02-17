// @ts-strict-ignore
import { useMemo, useState } from "react";
import { useIntl } from "react-intl";

import { DashboardCard } from "../Card";
import { ChannelsAvailabilityMenuContent } from "../ChannelsAvailabilityMenuContent/ChannelsAvailabilityMenuContent";
import { Pill } from "../Pill";
import { messages } from "./messages";
import { CollectionChannels, getDropdownColor, mapChannelsToPills } from "./utils";

interface ChannelsAvailabilityDropdownProps {
  channels: CollectionChannels[] | null;
}

export const ChannelsAvailabilityDropdown = ({ channels }: ChannelsAvailabilityDropdownProps) => {
  const intl = useIntl();
  const [isPopupOpen, setPopupOpen] = useState(false);
  const dropdownColor = useMemo(() => getDropdownColor(channels), [channels]);

  if (!channels?.length) {
    return <Pill label={intl.formatMessage(messages.noChannels)} color="error" />;
  }

  return (
    <div
      className="relative"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseOver={() => setPopupOpen(true)}
      onMouseLeave={() => setPopupOpen(false)}
    >
      <div aria-controls="availability-menu" aria-haspopup="true" role="button">
        <Pill
          label={intl.formatMessage(messages.dropdownLabel, {
            channelCount: channels.length,
          })}
          color={dropdownColor}
          outlined
        />
      </div>
      {isPopupOpen && (
        <div className="absolute right-full top-0 z-10">
          <DashboardCard boxShadow="defaultModal">
            <ChannelsAvailabilityMenuContent pills={mapChannelsToPills(channels)} />
          </DashboardCard>
        </div>
      )}
    </div>
  );
};
ChannelsAvailabilityDropdown.displayName = "ChannelsAvailabilityDropdown";
