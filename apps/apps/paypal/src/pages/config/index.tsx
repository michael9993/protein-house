import { Layout } from "@saleor/apps-ui";
import { Box, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";

import { AppHeader } from "@/modules/ui/app-header";
import { ChannelConfigMappingSection } from "@/modules/ui/channel-configs/channel-config-mapping-section";
import { ChannelConfigSection } from "@/modules/ui/paypal-configs/channel-config-section";
import { useHasAppAccess } from "@/modules/ui/use-has-app-access";

const ConfigPage: NextPage = () => {
  const { haveAccessToApp } = useHasAppAccess();

  if (!haveAccessToApp) {
    return <Text>You do not have permission to access this page.</Text>;
  }

  return (
    <Box>
      <AppHeader />
      <Layout.AppSection
        marginBottom={14}
        heading="PayPal configurations"
        sideContent={
          <Box display="flex" flexDirection="column" gap={4}>
            <Text>
              Create PayPal configurations using your Client ID and Client Secret from the PayPal
              Developer Dashboard.
            </Text>
            <Text>
              You can set up separate configurations for sandbox (testing) and live (production)
              environments.
            </Text>
          </Box>
        }
      >
        <ChannelConfigSection />
      </Layout.AppSection>
      <Layout.AppSection
        heading="Channel configurations"
        sideContent={
          <Box display="flex" flexDirection="column" gap={4}>
            <Text>Assign PayPal configurations to Saleor channels.</Text>
            <Text>
              Each channel can use a different PayPal configuration (e.g., sandbox for testing
              channel, live for production channel).
            </Text>
          </Box>
        }
      >
        <ChannelConfigMappingSection />
      </Layout.AppSection>
    </Box>
  );
};

export default ConfigPage;
