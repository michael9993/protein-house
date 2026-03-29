import { Box, List } from "@saleor/macaw-ui-next";

import { Shortcusts } from "../shortcuts";
import { useMenuStructure } from "./hooks/useMenuStructure";
import { MenuItem } from "./Item";

interface MenuProps {
  collapsed?: boolean;
}

export const Menu = ({ collapsed }: MenuProps) => {
  const menuStructure = useMenuStructure();

  return (
    <Box
      padding={collapsed ? 1.5 : 3}
      overflowY="auto"
      className="hide-scrollbar"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <List as="ol" display="grid" gap={1} data-test-id="menu-list">
        {menuStructure.map(menuItem => (
          <MenuItem menuItem={menuItem} key={menuItem.id} collapsed={collapsed} />
        ))}
      </List>

      {!collapsed && <Shortcusts />}
    </Box>
  );
};
