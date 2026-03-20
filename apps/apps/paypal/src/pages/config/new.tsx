import { Layout, TextLink } from "@saleor/apps-ui";
import { Box, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { NewPayPalConfigForm } from "@/modules/ui/paypal-configs/new-config-form";
import { useHasAppAccess } from "@/modules/ui/use-has-app-access";

const NewConfiguration: NextPage = () => {
  const { haveAccessToApp } = useHasAppAccess();
  const router = useRouter();

  if (!haveAccessToApp) {
    return <Text>You do not have permission to access this page.</Text>;
  }

  return (
    <Box>
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={() => router.push("/config")}
          style={{
            background: "transparent",
            border: "none",
            color: "#0070ba",
            cursor: "pointer",
            fontSize: "14px",
            padding: 0,
          }}
        >
          ← Back to Configuration
        </button>
      </div>

      <Layout.AppSection
        marginBottom={14}
        heading="New PayPal Configuration"
        sideContent={
          <Box display="flex" flexDirection="column" gap={4}>
            <Text>
              Get your API credentials from the{" "}
              <TextLink href="https://developer.paypal.com/dashboard/applications" newTab>
                PayPal Developer Dashboard
              </TextLink>
              .
            </Text>
            <Text>
              For testing, use a Sandbox app. For production, create a Live app.
            </Text>
            <Box>
              <Text as="h3" size={4} fontWeight="bold" marginBottom={2}>
                Steps:
              </Text>
              <Text>
                1. Log in to developer.paypal.com{"\n"}
                2. Go to Apps & Credentials{"\n"}
                3. Create or select an app{"\n"}
                4. Copy the Client ID and Secret
              </Text>
            </Box>
          </Box>
        }
      >
        <NewPayPalConfigForm />
      </Layout.AppSection>
    </Box>
  );
};

export default NewConfiguration;
