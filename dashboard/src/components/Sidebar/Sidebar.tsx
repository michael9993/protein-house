import { Box, Drawer } from "@saleor/macaw-ui-next";
import { Menu } from "lucide-react";

import { SidebarContent } from "./Content";
import classes from "./Sidebar.module.css";
import { useSidebarBreakpointContext } from "./SidebarContext";

const SIDEBAR_WIDTH_EXPANDED = "260px";
const SIDEBAR_WIDTH_COLLAPSED = "56px";

export const Sidebar = () => {
  const { breakpoint, collapsed } = useSidebarBreakpointContext();
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  if (breakpoint === "wide") {
    return (
      <>
        <div className={classes.fullSidebarWide}>
          <Box __width={sidebarWidth} height="100%" className={classes.sidebarTransition}>
            <SidebarContent />
          </Box>
        </div>
        <div className={classes.drawerWide}>
          <Drawer>
            <Drawer.Trigger>
              <Box
                as="button"
                borderWidth={0}
                backgroundColor="default1"
                cursor="pointer"
                data-test-id="sidebar-drawer-open"
              >
                <Menu />
              </Box>
            </Drawer.Trigger>
            <Drawer.Content
              backgroundColor="default2"
              data-test-id="sidebar-drawer-content"
              paddingTop={0}
              __width={SIDEBAR_WIDTH_EXPANDED}
            >
              <SidebarContent forceExpanded />
            </Drawer.Content>
          </Drawer>
        </div>
      </>
    );
  }

  return (
    <>
      <Box
        __width={sidebarWidth}
        display={{ mobile: "none", tablet: "none", desktop: "block" }}
        height="100%"
        className={classes.sidebarTransition}
      >
        <SidebarContent />
      </Box>
      <Box display={{ mobile: "block", tablet: "block", desktop: "none" }}>
        <Drawer>
          <Drawer.Trigger>
            <Box
              as="button"
              borderWidth={0}
              backgroundColor="default1"
              cursor="pointer"
              data-test-id="sidebar-drawer-open"
            >
              <Menu />
            </Box>
          </Drawer.Trigger>
          <Drawer.Content
            backgroundColor="default2"
            data-test-id="sidebar-drawer-content"
            paddingTop={0}
            __width={SIDEBAR_WIDTH_EXPANDED}
          >
            <SidebarContent forceExpanded />
          </Drawer.Content>
        </Drawer>
      </Box>
    </>
  );
};
