import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { isInIframe } from "@saleor/apps-shared/is-in-iframe";
import { Box, Text, Select } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { gql, useQuery } from "urql";

const ChannelsQuery = gql`
  query Channels {
    channels {
      id
      slug
      name
      currencyCode
      isActive
    }
  }
`;

interface Channel {
  id: string;
  slug: string;
  name: string;
  currencyCode: string;
  isActive: boolean;
}

const IndexPage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState<string>("");

  const [{ data: channelsData, fetching }] = useQuery<{ channels: Channel[] }>({
    query: ChannelsQuery,
    pause: !appBridgeState?.ready,
  });

  const channels = channelsData?.channels || [];

  useEffect(() => {
    // Auto-select first channel if only one exists
    if (channels.length === 1 && !selectedChannel) {
      setSelectedChannel(channels[0].slug);
    }
  }, [channels, selectedChannel]);

  const handleChannelSelect = (value: string) => {
    setSelectedChannel(value);
    if (value) {
      router.push(`/${value}`);
    }
  };

  if (!isInIframe()) {
    return (
      <Box>
        <Text as="h1">Storefront Control</Text>
        <Text as="p" marginTop={4}>
          This is a Saleor App that manages storefront UI configuration.
        </Text>
        <Text as="p" marginTop={2}>
          Install the app in your Saleor Dashboard to get started.
        </Text>
      </Box>
    );
  }

  if (!appBridgeState?.ready) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box marginBottom={8}>
        <Text as="h1">Storefront Control</Text>
        <Text as="p" color="default2" marginTop={2}>
          Manage your storefront appearance, features, and behavior per channel.
        </Text>
      </Box>

      <Box backgroundColor="default1" borderRadius={4} padding={6} boxShadow="defaultFocused">
        <Text as="h2" size={5} fontWeight="bold" marginBottom={4}>
          Select a Channel
        </Text>

        {fetching ? (
          <Text>Loading channels...</Text>
        ) : channels.length === 0 ? (
          <Text color="critical1">No channels found. Please create a channel first.</Text>
        ) : (
          <Box __maxWidth="400px">
            <Select
              label="Channel"
              value={selectedChannel}
              onChange={(value) => handleChannelSelect(value as string)}
              options={channels.map((channel) => ({
                value: channel.slug,
                label: `${channel.name} (${channel.currencyCode})${!channel.isActive ? " - Inactive" : ""}`,
              }))}
            />

            {selectedChannel && (
              <Box marginTop={4}>
                <Text as="p" color="default2">
                  Click to configure the <strong>{selectedChannel}</strong> channel storefront.
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Box marginTop={8}>
        <Text as="h3" size={5} fontWeight="bold" marginBottom={4}>
          What you can configure:
        </Text>
        <Box display="grid" __gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
          {[
            { title: "Store Info", desc: "Name, contact, address" },
            { title: "Branding", desc: "Logo, colors, typography" },
            { title: "Features", desc: "Enable/disable features" },
            { title: "Homepage", desc: "Section order & visibility" },
            { title: "Filters", desc: "Product filter settings" },
            { title: "Pages", desc: "Enable/disable pages" },
            { title: "Integrations", desc: "Analytics, social links" },
            { title: "SEO", desc: "Meta tags, OG images" },
          ].map((item) => (
            <Box key={item.title} backgroundColor="default1" padding={4} borderRadius={4}>
              <Text as="h4" size={4} fontWeight="bold">
                {item.title}
              </Text>
              <Text as="p" color="default2">
                {item.desc}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default IndexPage;
