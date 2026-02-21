import { useUser } from "@dashboard/auth";
import useAppChannel from "@dashboard/components/AppLayout/AppChannelContext";
import { hasPermissions } from "@dashboard/components/RequirePermissions";
import { PermissionEnum } from "@dashboard/graphql";
import { Box } from "@saleor/macaw-ui-next";

import { KpiGrid } from "./components/KpiGrid";
import { QuickActions } from "./components/QuickActions";
import { RecentOrders } from "./components/RecentOrders";
import { useDashboardData } from "./hooks/useDashboardData";
import { WelcomePageSidebarContextProvider } from "./WelcomePageSidebar/context/WelcomePageSidebarContextProvider";
import { WelcomePageActivities } from "./WelcomePageSidebar/components/WelcomePageActivities/WelcomePageActivities";
import { WelcomePageTitle } from "./WelcomePageTitle";

export const WelcomePage = () => {
  const { channel, setChannel } = useAppChannel(false);
  const { user } = useUser();
  const channels = user?.accessibleChannels ?? [];
  const userPermissions = user?.userPermissions || [];

  const hasPermissionToManageOrders = hasPermissions(userPermissions, [
    PermissionEnum.MANAGE_ORDERS,
  ]);
  const hasPermissionToManageUsers = hasPermissions(userPermissions, [
    PermissionEnum.MANAGE_USERS,
  ]);

  const data = useDashboardData({
    channel,
    hasPermissionToManageOrders,
    hasPermissionToManageUsers,
  });

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={7}
      paddingX={8}
      paddingY={6}
    >
      <WelcomePageTitle />

      <KpiGrid
        data={data}
        hasPermissionToManageOrders={hasPermissionToManageOrders}
        hasPermissionToManageUsers={hasPermissionToManageUsers}
      />

      <QuickActions userPermissions={userPermissions} />

      <Box
        display="grid"
        gap={7}
        gridTemplateColumns={{
          mobile: 1,
          tablet: 1,
          desktop: 2,
        }}
      >
        <RecentOrders
          orders={data.recentOrders}
          loading={data.loading.recentOrders}
          hasPermission={hasPermissionToManageOrders}
        />
        <WelcomePageSidebarContextProvider
          channel={channel}
          setChannel={setChannel}
          channels={channels}
          hasPermissionToManageOrders={hasPermissionToManageOrders}
        >
          <WelcomePageActivities />
        </WelcomePageSidebarContextProvider>
      </Box>
    </Box>
  );
};
