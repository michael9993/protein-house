import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { isInIframe } from "@saleor/apps-shared/is-in-iframe";
import { Box, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";

const IndexPage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();

  if (!isInIframe()) {
    return (
      <Box>
        <Text as="h1" size={5} fontWeight="bold">
          Newsletter Management
        </Text>
        <Text as="p" marginTop={4}>
          This is a Saleor App that manages newsletter subscribers, templates, and campaigns.
        </Text>
        <Text as="p" marginTop={2}>
          Install the app in your Saleor Dashboard to get started.
        </Text>
      </Box>
    );
  }

  // Return null while App Bridge is initializing - this prevents race conditions
  if (!appBridgeState) {
    return null;
  }

  // Show loading while App Bridge is connecting
  if (!appBridgeState.ready) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" style={{ height: "100vh" }}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box marginBottom={8}>
        <Text as="h1" size={5} fontWeight="bold">
          Newsletter Management
        </Text>
        <Text as="p" color="default2" marginTop={2}>
          Manage your newsletter subscribers, templates, and campaigns.
        </Text>
      </Box>

      <Box
        display="grid"
        __gridTemplateColumns="repeat(auto-fill, minmax(250px, 1fr))"
        gap={4}
      >
        <Box
          backgroundColor="default1"
          borderRadius={4}
          padding={6}
          boxShadow="defaultFocused"
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/subscribers")}
        >
          <Text as="h2" size={4} fontWeight="bold" marginBottom={2}>
            Subscribers
          </Text>
          <Text as="p" color="default2" size={2}>
            View and manage newsletter subscribers
          </Text>
        </Box>

        <Box
          backgroundColor="default1"
          borderRadius={4}
          padding={6}
          boxShadow="defaultFocused"
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/templates")}
        >
          <Text as="h2" size={4} fontWeight="bold" marginBottom={2}>
            Templates
          </Text>
          <Text as="p" color="default2" size={2}>
            Create and manage email templates
          </Text>
        </Box>

        <Box
          backgroundColor="default1"
          borderRadius={4}
          padding={6}
          boxShadow="defaultFocused"
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/campaigns")}
        >
          <Text as="h2" size={4} fontWeight="bold" marginBottom={2}>
            Campaigns
          </Text>
          <Text as="p" color="default2" size={2}>
            Schedule and send promotional emails
          </Text>
        </Box>

        <Box
          backgroundColor="default1"
          borderRadius={4}
          padding={6}
          boxShadow="defaultFocused"
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/images")}
        >
          <Text as="h2" size={4} fontWeight="bold" marginBottom={2}>
            Images
          </Text>
          <Text as="p" color="default2" size={2}>
            Upload and manage images for templates
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default IndexPage;
