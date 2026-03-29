import { useUser } from "@dashboard/auth";
import { UserAvatar } from "@dashboard/components/UserAvatar";
import { getUserInitials, getUserName } from "@dashboard/misc";
import { Box, Text, Tooltip } from "@saleor/macaw-ui-next";

import { UserControls } from "./Controls";

interface UserInfoProps {
  collapsed?: boolean;
}

export const UserInfo = ({ collapsed }: UserInfoProps) => {
  const { user } = useUser();

  if (collapsed) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        paddingY={3}
        gap={2}
        borderTopWidth={1}
        borderColor="default1"
        borderTopStyle="solid"
      >
        <Tooltip>
          <Tooltip.Trigger>
            <Box cursor="pointer">
              <UserAvatar initials={getUserInitials(user!)} url={user?.avatar?.url} />
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Content side="right">
            <Tooltip.Arrow />
            {getUserName(user!, true)}
          </Tooltip.Content>
        </Tooltip>
        <UserControls />
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      gap={3}
      paddingX={3}
      paddingY={4}
      alignItems="center"
      borderTopWidth={1}
      borderColor="default1"
      borderTopStyle="solid"
      justifyContent="space-between"
    >
      <Box display="flex" gap={3} alignItems="center">
        <UserAvatar initials={getUserInitials(user!)} url={user?.avatar?.url} />
        <Box __width={128} className="ellipsis">
          <Text size={3} fontWeight="bold">
            {getUserName(user!, true)}
          </Text>
        </Box>
      </Box>
      <UserControls />
    </Box>
  );
};
