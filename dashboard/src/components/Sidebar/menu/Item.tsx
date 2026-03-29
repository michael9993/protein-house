import { Divider } from "./Divider";
import { ItemGroup } from "./ItemGroup";
import { SingleItem } from "./SingleItem";
import { SidebarMenuItem } from "./types";

interface Props {
  menuItem: SidebarMenuItem;
  collapsed?: boolean;
}

export const MenuItem = (props: Props) => {
  const { menuItem, collapsed } = props;

  switch (menuItem.type) {
    case "item":
      return <SingleItem menuItem={menuItem} collapsed={collapsed} />;
    case "itemGroup":
      return <ItemGroup menuItem={menuItem} collapsed={collapsed} />;
    case "divider":
      return collapsed ? null : <Divider menuItem={menuItem} />;
  }
};
