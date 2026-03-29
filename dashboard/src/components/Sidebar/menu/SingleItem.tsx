import { extensionMountPoints } from "@dashboard/extensions/extensionMountPoints";
import { useExtensions } from "@dashboard/extensions/hooks/useExtensions";
import { Box, List, sprinkles, Text, Tooltip } from "@saleor/macaw-ui-next";
import { Link } from "react-router";

import { SidebarMenuItem } from "./types";
import { getMenuItemExtension, isMenuActive } from "./utils";

interface Props {
  menuItem: SidebarMenuItem;
  collapsed?: boolean;
}

export const SingleItem = ({ menuItem, collapsed }: Props) => {
  const extensions = useExtensions(extensionMountPoints.NAVIGATION_SIDEBAR);
  const active = isMenuActive(location.pathname, menuItem);
  const handleMenuItemClick = () => {
    const extension = getMenuItemExtension(extensions, menuItem.id);

    if (extension) {
      extension.open();
    }

    if (menuItem.onClick) {
      menuItem.onClick();
    }
  };

  const item = (
    <List.Item
      borderRadius={3}
      paddingX={collapsed ? 0 : 2}
      active={active}
      onClick={handleMenuItemClick}
      data-test-id={`menu-item-label-${menuItem.id}`}
      position="relative"
    >
      <Link
        to={menuItem.url || ""}
        replace={active}
        className={sprinkles({
          display: "block",
          width: "100%",
        })}
      >
        <Box
          className={sprinkles({
            paddingY: 1.5,
            gap: collapsed ? 0 : 3,
            display: "flex",
            alignItems: "center",
          })}
          justifyContent={collapsed ? "center" : undefined}
        >
          {menuItem.icon}
          {!collapsed && (
            <Text size={3} fontWeight="medium">
              {menuItem.label}
            </Text>
          )}
        </Box>
      </Link>
      {!collapsed && menuItem.endAdornment && (
        <Box position="absolute" right={2} zIndex={"3"}>
          {menuItem.endAdornment}
        </Box>
      )}
    </List.Item>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <Tooltip.Trigger>{item}</Tooltip.Trigger>
        <Tooltip.Content side="right">
          <Tooltip.Arrow />
          {menuItem.label}
        </Tooltip.Content>
      </Tooltip>
    );
  }

  return item;
};
