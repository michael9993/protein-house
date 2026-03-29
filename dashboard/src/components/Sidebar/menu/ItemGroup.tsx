// @ts-strict-ignore
import { Box, List, sprinkles, Text, Tooltip } from "@saleor/macaw-ui-next";
import { Link } from "react-router";

import { MenuItem } from "./Item";
import { SidebarMenuItem } from "./types";
import { isMenuActive } from "./utils";

interface Props {
  menuItem: SidebarMenuItem;
  collapsed?: boolean;
}

export const ItemGroup = ({ menuItem, collapsed }: Props) => {
  const hasSubmenuActive = menuItem?.children.some(item => isMenuActive(location.pathname, item));
  const isActive = isMenuActive(location.pathname, menuItem) && !hasSubmenuActive;
  const isExpanded = isActive || hasSubmenuActive;

  const handleMenuGroupClick = () => {
    if (menuItem.onClick) {
      menuItem.onClick();
    }
  };

  if (collapsed) {
    const isGroupActive = isActive || hasSubmenuActive;

    const item = (
      <List.Item
        borderRadius={3}
        paddingX={0}
        active={isGroupActive}
        onClick={handleMenuGroupClick}
        data-test-id={`menu-item-label-${menuItem.id}`}
      >
        <Link
          to={menuItem?.url ?? ""}
          replace={isGroupActive}
          className={sprinkles({
            display: "block",
            width: "100%",
          })}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            paddingY={1.5}
          >
            {menuItem.icon}
          </Box>
        </Link>
      </List.Item>
    );

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

  return (
    <List.ItemGroup defaultExpanded={isExpanded} data-test-id={`menu-list-item`}>
      <List.ItemGroup.Trigger
        paddingX={2}
        paddingRight={1}
        borderRadius={3}
        size="small"
        active={isActive}
        justifyContent="space-between"
        data-test-id={`menu-item-label-${menuItem.id}`}
        position="relative"
        onClick={handleMenuGroupClick}
        className="sidebar-item-group-trigger"
      >
        <Link
          replace={isActive}
          to={menuItem?.url ?? ""}
          className={sprinkles({
            width: "100%",
            display: "block",
          })}
        >
          <Box display="flex" alignItems="center" gap={3} paddingY={1.5} borderRadius={3}>
            {menuItem.icon}
            <Text size={3} fontWeight="medium">
              {menuItem.label}
            </Text>
            {menuItem.endAdornment && <Box>{menuItem.endAdornment}</Box>}
          </Box>
        </Link>
      </List.ItemGroup.Trigger>
      <List.ItemGroup.Content>
        <Box
          borderLeftWidth={1}
          borderLeftStyle="solid"
          borderColor="default1"
          paddingLeft={4}
          marginLeft={4}
          display="flex"
          flexDirection="column"
          marginBottom={2}
          marginTop={1}
          gap="px"
        >
          {menuItem.children?.map(child => (
            <MenuItem menuItem={child} key={child.id} />
          ))}
        </Box>
      </List.ItemGroup.Content>
    </List.ItemGroup>
  );
};
