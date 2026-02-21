import { useUser } from "@dashboard/auth";
import AppChannelSelect from "@dashboard/components/AppLayout/AppChannelSelect";
import useAppChannel from "@dashboard/components/AppLayout/AppChannelContext";
import { Box, Text } from "@saleor/macaw-ui-next";
import { FormattedMessage } from "react-intl";

export const WelcomePageTitle = () => {
  const { channel, setChannel } = useAppChannel(false);
  const { user } = useUser();
  const channels = user?.accessibleChannels ?? [];

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={3}
    >
      <Text as="h1" size={9} data-test-id="home-header">
        <FormattedMessage
          defaultMessage="Dashboard"
          id="dashboard-title"
        />
      </Text>
      {channels.length > 1 && (
        <AppChannelSelect
          channels={channels}
          selectedChannelId={channel?.id ?? ""}
          onChannelSelect={setChannel}
        />
      )}
    </Box>
  );
};
