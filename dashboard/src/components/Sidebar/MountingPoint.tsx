import sideBarDefaultLogoDarkMode from "@assets/images/logo-sidebar-light.svg";
import sideBarDefaultLogo from "@assets/images/logo-sidebar-dark.svg";
import { useCloud } from "@dashboard/auth/hooks/useCloud";
import { useLegacyThemeHandler } from "@dashboard/components/Sidebar/user/Controls";
import { Box, Text, Tooltip } from "@saleor/macaw-ui-next";
import { CloudIcon } from "lucide-react";
import { useState } from "react";
import { FormattedMessage } from "react-intl";

import { useEnvLink } from "./menu/hooks/useEnvLink";

export const MountingPoint = () => {
  const { theme } = useLegacyThemeHandler();
  const logo = theme === "defaultLight" ? sideBarDefaultLogo : sideBarDefaultLogoDarkMode;
  const { isAuthenticatedViaCloud } = useCloud();
  const envLink = useEnvLink();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      display="flex"
      gap={3}
      paddingX={4}
      paddingY={4}
      alignItems="center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={logo} alt="Aura" width={24} height={22} />
      <Text size={3} fontWeight="bold" __flex="1">
        Aura
      </Text>
      {isAuthenticatedViaCloud && (
        <Tooltip>
          <Tooltip.Trigger>
            <Box
              as="a"
              href={envLink}
              target="_blank"
              rel="noopener noreferrer"
              display="flex"
              alignItems="center"
              color="default2"
              paddingRight={1}
              style={{
                opacity: isHovered ? 1 : 0,
                transition: "opacity 0.15s ease-in-out",
              }}
              data-test-id="cloud-environment-link"
            >
              <CloudIcon size={16} />
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow />
            <Text size={2}>
              <FormattedMessage defaultMessage="Go to Cloud" id="EXqb2l" />
            </Text>
          </Tooltip.Content>
        </Tooltip>
      )}
    </Box>
  );
};
