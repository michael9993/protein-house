import { TextLink } from "@saleor/apps-ui";
import { Box, Text } from "@saleor/macaw-ui";

export const AppHeader = () => {
  return (
    <Box marginBottom={20} paddingBottom={6}>
      <Text as="h1" marginBottom={4} size={10} fontWeight="bold">
        Configuration
      </Text>
      <Text>
        Configure the app by connecting to PayPal. Visit the{" "}
        <TextLink href="https://developer.paypal.com/dashboard/" newTab>
          PayPal Developer Dashboard
        </TextLink>{" "}
        to get your API credentials.
      </Text>
    </Box>
  );
};
