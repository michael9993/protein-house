import { PermissionEnum } from "@dashboard/graphql";

export interface MenuItem {
  description: string;
  icon: React.ReactElement;
  permissions?: PermissionEnum[];
  requireAllPermissions?: boolean;
  title: string;
  url?: string;
  testId?: string;
  hidden?: boolean;
}

export interface MenuSection {
  label: string;
  menuItems: MenuItem[];
}
