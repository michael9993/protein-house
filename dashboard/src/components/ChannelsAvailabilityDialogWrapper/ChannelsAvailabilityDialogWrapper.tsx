import { ControlledCheckbox } from "@dashboard/components/ControlledCheckbox";
import Hr from "@dashboard/components/Hr";
import Label from "@dashboard/orders/components/OrderHistory/Label";
import { TextField } from "@mui/material";
import { Text } from "@saleor/macaw-ui-next";
import * as React from "react";
import { defineMessages, FormattedMessage, useIntl } from "react-intl";

const messages = defineMessages({
  selectTitle: {
    id: "7scATx",
    defaultMessage: "Select channels you want for {contentType} to be available on",
    description: "select title",
  },
  selectAllChannelsLabel: {
    id: "zR9Ozi",
    defaultMessage: "Select All Channels",
    description: "select all channels label",
  },
  channelsAlphabeticallyTitle: {
    id: "/lBLBI",
    defaultMessage: "Channels from A to Z",
    description: "channels alphabetically title",
  },
  notFoundTitle: {
    id: "PctLol",
    defaultMessage: "No Channels Found",
    description: "no channels found title",
  },
});

interface ChannelsAvailabilityContentProps {
  contentType?: string;
  toggleAll?: () => void;
  children: React.ReactNode;
  toggleAllLabel?: React.ReactNode;
  query: string;
  onQueryChange: (query: string) => void;
  hasAnyChannelsToDisplay: boolean;
  hasAllSelected: boolean;
}

const ChannelsAvailabilityContentWrapper = ({
  contentType = "",
  toggleAll,
  toggleAllLabel,
  children,
  hasAnyChannelsToDisplay,
  query,
  onQueryChange,
  hasAllSelected,
}: ChannelsAvailabilityContentProps) => {
  const intl = useIntl();
  const searchText = intl.formatMessage({
    id: "ybaLoZ",
    defaultMessage: "Search through channels",
  });

  return (
    <div className="[&_hr]:relative [&_hr]:-left-6 [&_hr]:w-[calc(100%+48px)]">
      {!!contentType && (
        <Text className="mb-[5px]" size={2} fontWeight="light">
          <FormattedMessage {...messages.selectTitle} />
        </Text>
      )}
      <TextField
        name="query"
        value={query}
        className="[&_label]:overflow-x-visible"
        onChange={e => onQueryChange(e.target.value)}
        label={searchText}
        placeholder={searchText}
        fullWidth
      />
      <div className="-mb-[30px] mt-4">
        {!!toggleAll && (
          <>
            <ControlledCheckbox
              checked={hasAllSelected}
              name="allChannels"
              label={
                toggleAllLabel || (
                  <Label text={intl.formatMessage(messages.selectAllChannelsLabel)} />
                )
              }
              onChange={toggleAll}
            />
            <Hr />
          </>
        )}
        <Text className="my-2">
          <FormattedMessage {...messages.channelsAlphabeticallyTitle} />
        </Text>
        <div
          className="scrollArea overflow-y-scroll overflow-x-hidden -ml-[15px] pl-[15px] mb-6"
          data-test-id="manage-products-channels-availiability-list"
        >
          {hasAnyChannelsToDisplay ? (
            children
          ) : (
            <div className="pb-4">
              <FormattedMessage {...messages.notFoundTitle} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelsAvailabilityContentWrapper;
